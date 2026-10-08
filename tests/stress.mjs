import {chromium} from "playwright";
import {readFileSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(process.env.CITY_HTML||root+"city-flight.html","utf8");
const rounds=Number(process.argv.find(a=>a.startsWith("--rounds="))?.split("=")[1]||1);
assert(Number.isInteger(rounds)&&rounds>=1&&rounds<=100);
const output=root+"test-results";
mkdirSync(output,{recursive:true});
const marker='      if (paused) status.textContent = "Motion is off. Press Play to take flight.";';
const hook=`window.qa={
  get state(){return {city:cityId,seed,time,paused,workers:readyWorkers.size,failures:[...workerFailures],
    cars:spawnedCars.length,ambient:ambientTraffic.size,stage:incidents[0]?.stage,recovered:recoveredCars.length,
    finite:[...ambientTraffic.values(),...spawnedCars].every(v=>Number.isFinite(v.x+v.y+(v.velocity||0))),
    faults:governorFaults,tiles:tiles.size}},
  cities(){return Object.keys(cities)},
  reset(s){seed=s;resetCity(false);paused=true;syncPlayback()},
  pause(){paused=true;syncPlayback()},
  point(){
    aim.x=viewWidth/2;aim.y=viewHeight/2;aimAtLane();
    const p=aimWorld();return pagePoint(p.x,p.y);
  },
  jam(count){for(let i=0;i<count;i++)spawnAt(aim.x,aim.y)},
  departure(kind){
    ambientTraffic.clear();spawnedCars.length=0;households.clear();trafficInitialized=true;nextPopulation=Infinity;
    const c=camera(),rules=laneRules(Math.floor(c.y/BLOCK),0,0);
    const p={x:Math.floor(c.x/BLOCK)*BLOCK+80,y:rules.across},bx=Math.floor(p.x/BLOCK),by=Math.floor(p.y/BLOCK);
    const pixel=worldToScreen.transformPoint(p);aim.x=pixel.x*viewWidth/canvas.width;aim.y=pixel.y*viewHeight/canvas.height;
    for(let y=by-2;y<=by+2;y++)for(let x=bx-2;x<=bx+2;x++)
      for(const home of homesForBlock(x,y))households.set(home.id,{...home,owner:"test-resident",arrived:false});
    spawnKinds.push(kind);spawnAt(aim.x,aim.y);const v=spawnedCars.at(-1),x=v.x,y=v.y;
    updateTraffic(1/30);
    return {kind:v.kind,home:!!v.home,moved:Math.hypot(v.x-x,v.y-y),velocity:v.velocity};
  },
  recover(){let steps=0;while(incidents.length&&steps++<12000){time+=.05;advanceRescue(.05)}drawAirspace();return !incidents.length},
  landmarks(){
    const entries=currentCity().landmarks,seen=new Set(),positions=[];
    const startingSeed=seed,starts=new Set();
    for(let s=0;s<256;s++){seed=s;const first=landmarkAt(0,0);if(!first)throw Error("Missing starting landmark");starts.add(first.name);}
    seed=startingSeed;
    for(let y=-32;y<=32;y++)for(let x=-32;x<=32;x++){
      const a=landmarkAt(x,y),b=landmarkAt(x,y);
      if(a){
        if(a!==b||!canPlace(x*BLOCK+35,y*BLOCK+35,110,110))throw Error("Unstable or wet landmark");
        seen.add(a.name);positions.push(x+","+y+":"+a.name);
      }
    }
    const old=seed;seed++;const changed=[];
    for(let y=-32;y<=32;y++)for(let x=-32;x<=32;x++){const a=landmarkAt(x,y);if(a)changed.push(x+","+y+":"+a.name)}
    seed=old;
    const atlas=document.createElement("canvas");atlas.width=entries.length*182;atlas.height=182;
    const g=atlas.getContext("2d"),counts=[];
    for(const [i,entry] of entries.entries()){
      g.save();g.translate(i*182,0);landmark(g,entry);g.restore();
      counts.push(g.getImageData(i*182,0,182,182).data.filter((v,j)=>j%4===3&&v>0).length);
    }
    return {entries,seen:[...seen],starts:[...starts],stable:positions.length>0,random:positions.join()!==changed.join(),counts,
      atlas:atlas.toDataURL(),size:currentCity().size,traffic:trafficDemand(),font:cityFonts[cityId],defaults:cityDefaults[cityId]};
  },
  invariant(){auditTrafficGovernor();return this.state}
};`;
assert.equal(source.split(marker).length,2,"Unique test hook");
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const results=[];
try{
  for(let round=1;round<=rounds;round++){
    const errors=[],page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:"reduce"});
    await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("http://city.test/**",r=>r.fulfill({contentType:"text/html",body:source.replace(marker,hook+marker)}));
    await page.goto("http://city.test/");
    await page.waitForFunction(()=>qa.state.workers===4);
    const cities=await page.evaluate(()=>qa.cities());
    assert.equal(cities.length,19);
    const report={round,cities:[],errors,started:new Date().toISOString()};
    for(const [i,city] of cities.entries()){
      await page.selectOption("#destination",city,{force:true});
      await page.evaluate(s=>qa.reset(s),1000*round+i);
      await page.waitForFunction(()=>qa.state.tiles>0);
      const landmarks=await page.evaluate(()=>qa.landmarks());
      assert(landmarks.entries.length>=5,city+" requires five landmarks");
      assert.equal(new Set(landmarks.entries.map(l=>l.name)).size,landmarks.entries.length);
      assert.equal(landmarks.seen.length,landmarks.entries.length,city+" all landmarks are reachable");
      assert.deepEqual([...landmarks.starts].sort(),landmarks.entries.map(e=>e.name).sort(),city+" every landmark can open a roll");
      assert(landmarks.stable&&landmarks.random,city+" reproducible randomized placement");
      assert(landmarks.counts.every(n=>n>1000),city+" all motifs draw");
      assert(landmarks.font&&landmarks.defaults);
      if(round===1)writeFileSync(output+"/"+city+"-landmarks.png",Buffer.from(landmarks.atlas.split(",")[1],"base64"));
      if(city==="istanbul"||city==="antalya")
        assert.deepEqual(await page.locator("#clock-numerals text").allTextContents(),["12","3","6","9"]);
      if(city==="antalya")for(const name of ["Yivli Minare","Saat Kulesi"])assert(landmarks.seen.includes(name));
      if(city==="dublin"){
        assert(landmarks.seen.includes("Guinness Storehouse"));
        assert.equal(await page.locator("#clock").getAttribute("data-dial"),"brewery");
        assert.equal(await page.locator("#clock-signature").textContent(),"ST JAMES'S GATE");
        assert(landmarks.font.family.includes("IM Fell English"));
      }
      // Real mouse input through the rotated paper's inverse transform.
      await page.locator("#city").scrollIntoViewIfNeeded();
      const point=await page.evaluate(()=>qa.point());
      const before=await page.evaluate(()=>qa.state.cars);
      await page.mouse.click(point.x,point.y);
      assert.equal(await page.evaluate(()=>qa.state.cars),before+1,city+" mouse spawn");
      await page.locator("#city").press("l");await page.locator("#city").press("Enter");
      assert.equal(await page.evaluate(()=>qa.state.cars),before+2,city+" keyboard spawn");
      await page.evaluate(()=>qa.jam(12));
      assert.equal(await page.evaluate(()=>qa.state.cars),before+14);
      await page.locator("#pause").click();
      await page.waitForTimeout(700);
      await page.evaluate(()=>qa.pause());
      const state=await page.evaluate(()=>qa.invariant());
      assert(state.time>0&&state.finite,JSON.stringify(state));
      assert.equal(state.failures.length,0,JSON.stringify(state));
      assert.equal(state.faults,0,city+" legal lane and road support");
      if(state.stage)assert(await page.evaluate(()=>qa.recover()),city+" rescue must finish");
      report.cities.push({city,landmarks:landmarks.entries.length,traffic:landmarks.traffic,...state});
      assert.deepEqual(errors,[]);
    }
    // Exercise wheels, clock rate, themes, size, fullscreen and narrow layouts.
    await page.locator(".ux-tools > summary").click();
    for(const ui of ["film","gamified"]){
      await page.locator("#ui-style").selectOption(ui);
      for(const theme of ["light","dark"]){
        await page.locator("#ui-theme").selectOption(theme);
        const lines=await page.locator(".wheel").evaluateAll(es=>es.map(e=>{
          const a=getComputedStyle(e,"::before"),b=getComputedStyle(e,"::after");
          return {top:a.backgroundColor,bottom:b.backgroundColor,height:parseFloat(a.height),pointer:a.pointerEvents,clip:a.clipPath};
        }));
        assert(lines.every(l=>l.top!==l.bottom&&l.height>=3&&l.pointer==="none"&&l.clip!=="none"));
      }
      for(const vp of [{width:390,height:844},{width:844,height:390},{width:1440,height:1100}]){
        await page.setViewportSize(vp);
        for(const size of ["300","1000","full"]){
          await page.selectOption("#view-size",size,{force:true});await page.waitForTimeout(80);
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"No page-level overflow");
          const controls=await page.evaluate(()=>{
            const a=document.getElementById("clock-faster").getBoundingClientRect(),b=document.getElementById("clock-slower").getBoundingClientRect();
            return {dx:Math.abs(a.x-b.x),gap:b.y-a.bottom};
          });
          assert(controls.dx<1&&controls.gap>=1,JSON.stringify(controls));
          if(size==="full"){await page.keyboard.press("Escape");assert.equal(await page.locator("body").evaluate(e=>e.classList.contains("full-view")),false);}
        }
      }
    }
    await page.emulateMedia({forcedColors:"active"});
    const forced=await page.locator(".wheel").first().evaluate(e=>({
      line:getComputedStyle(e,"::before").backgroundColor,
      background:getComputedStyle(e).backgroundColor,
      adjust:getComputedStyle(e,"::before").forcedColorAdjust
    }));
    assert(forced.line!==forced.background&&forced.adjust==="none","Wheel strokes remain visible in high contrast");
    await page.emulateMedia({forcedColors:"none"});
    await page.setViewportSize({width:1440,height:1100});
    await page.selectOption("#view-size","600",{force:true});
    const wheel=page.locator('[data-wheel-for="film"]');
    const previous=await page.inputValue("#film");
    await wheel.press("ArrowUp");assert.notEqual(await page.inputValue("#film"),previous);
    await wheel.hover();await page.mouse.wheel(0,90);await page.waitForTimeout(450);
    await page.locator("#clock").press("Home");
    assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"06:00:00");
    await page.locator("#clock-faster").click();await page.locator("#clock-slower").click();
    await page.locator("#clock").press("End");
    assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"21:00:00");
    await page.selectOption("#destination","original",{force:true});
    for(const kind of ["car","bike"]){
      await page.evaluate(()=>qa.reset(42));await page.evaluate(()=>qa.point());
      const departure=await page.evaluate(kind=>qa.departure(kind),kind);
      assert.equal(departure.home,false);
      assert.equal(departure.kind,kind);
      assert(departure.moved>.1&&departure.velocity>0,JSON.stringify(departure));
    }
    await page.evaluate(s=>qa.reset(s),round*2027);
    await page.selectOption("#view-size","full",{force:true});
    await page.selectOption("#camera-view","space",{force:true});
    await page.evaluate(()=>{qa.point();qa.jam(120)});
    const sound=page.locator("#sound"),soundBefore=await sound.getAttribute("aria-pressed");
    await sound.click();assert.notEqual(await sound.getAttribute("aria-pressed"),soundBefore);
    await sound.click();assert.equal(await sound.getAttribute("aria-pressed"),soundBefore);
    await page.selectOption("#fps","60",{force:true});
    await page.locator("#pause").click();await page.waitForTimeout(600);
    report.browserFrameIntervalsMs=await page.evaluate(()=>new Promise(resolve=>{
      const samples=[];let previous;
      const tick=t=>{
        if(previous!==undefined)samples.push(t-previous);
        previous=t;
        if(samples.length<120)requestAnimationFrame(tick);
        else{samples.sort((a,b)=>a-b);resolve({median:samples[60],p95:samples[114],max:samples[119]})}
      };requestAnimationFrame(tick);
    }));
    await page.evaluate(()=>qa.pause());
    const dense=await page.evaluate(()=>qa.invariant());
    assert(dense.finite&&dense.faults===0&&dense.failures.length===0,JSON.stringify(dense));
    if(dense.stage)assert(await page.evaluate(()=>qa.recover()));
    report.dense=dense;
    assert.deepEqual(errors,[]);
    await page.screenshot({path:output+`/round-${round}.png`,fullPage:true});
    report.finished=new Date().toISOString();results.push(report);
    writeFileSync(output+"/stress-results.json",JSON.stringify(results,null,2)+"\n");
    console.log(JSON.stringify({round,result:"PASS",cities:report.cities.length,landmarks:report.cities.reduce((n,c)=>n+c.landmarks,0)}));
    await page.close();
  }
}catch(error){
  writeFileSync(output+"/stress-failure.txt",String(error.stack||error));
  throw error;
}finally{await browser.close()}
