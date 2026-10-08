import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(root+"city-flight.html","utf8");
const marker='      if (paused) status.textContent = "Motion is off. Press Play to take flight.";';
const hook=`
const waterCamera=camera;
window.waterQA={
  ready(){return readyWorkers.size===4},
  reset(city="seattle"){
    camera=waterCamera;cityId=city;seed=42;resetCity(false);paused=true;syncPlayback();soundEnabled=false;uiMotion=true;
    camera=()=>({x:waterBounds(100).left+65,y:100,angle:-.18});
  },
  state(){return {time:marineTime,next:nextSurfacing,index:surfacingIndex,animal:surfacing?{...surfacing}:null,boats:marineBoats()}},
  advance(dt,stop=false){paused=stop;advanceWaterLife(dt);paused=true;return this.state()},
  hidden(){Object.defineProperty(document,"hidden",{configurable:true,value:true});
    try{return this.advance(20)}finally{delete document.hidden}},
  noMotion(){uiMotion=false;try{return this.advance(20)}finally{uiMotion=true}},
  geometry(){
    const failures=[],counts={};
    for(const id of Object.keys(cities)){
      cityId=id;counts[id]=0;
      for(const y of [-10000,-400,0,400,10000]){
        const view={x:waterBounds(y).left+currentCity().width/2,y};
        const boats=marineBoats(view,{x:600,y:600},10000);
        counts[id]+=boats.length;
        for(const boat of boats){
          if(!Number.isFinite(boat.x+boat.y+boat.angle)||!isWater(boat.x,boat.y))failures.push({id,boat});
          const later=marineBoats(view,{x:600,y:600},10000.01).find(b=>b.id===boat.id);
          if(later){
            const heading=Math.atan2(later.y-boat.y,later.x-boat.x);
            if(Math.abs(Math.atan2(Math.sin(heading-boat.angle),Math.cos(heading-boat.angle)))>.01)failures.push({id,heading:boat.angle});
          }
        }
      }
      if(marineBoats({x:0,y:0},{x:1e6,y:1e6},10000).length>64)failures.push({id,bounded:false});
    }
    return {failures,counts};
  },
  rarity(seconds=3600){
    const seen=[],species=new Set();let visible=0,previous=-1;
    for(let t=0;t<seconds;t++){
      this.advance(1);
      if(surfacing){
        visible++;species.add(surfacing.kind);
        if(surfacing.born!==previous){seen.push(surfacing.born);previous=surfacing.born}
      }
    }
    return {seen,species:[...species],visible};
  },
  poses(kind){
    const animal={y:100,offset:100,dir:-1,born:0,kind};
    return [0,2,3.5,6,9.5,12,14].map(t=>surfacingPose(animal,t));
  },
  render(kind="whale",age=3.5){
    marineTime=age;surfacing={y:100,offset:100,dir:-1,born:0,kind};draw();
  },
  waterPixels(city){
    this.reset(city);marineTime=3.5;
    if(currentCity().coast)surfacing={y:100,offset:100,dir:-1,born:0,kind:"beluga"};
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    const view=camera(),scale=2;
    ctx.translate(canvas.width/2,canvas.height/2);ctx.scale(scale,scale);ctx.translate(-view.x,-view.y);
    drawWaterLife();
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let painted=0,land=0,bridge=0;
    for(let y=1;y<canvas.height;y+=2)for(let x=1;x<canvas.width;x+=2){
      const index=(y*canvas.width+x)*4;
      if(Math.max(pixels[index],pixels[index+1],pixels[index+2])<32)continue;
      painted++;
      const wx=view.x+(x+.5-canvas.width/2)/scale,wy=view.y+(y+.5-canvas.height/2)/scale;
      if(!isWater(wx,wy))land++;
      // Ignore the one-pixel antialiased edge when checking bridge interiors.
      if(isBridge(wx,wy)&&[[wx-.6,wy],[wx+.6,wy],[wx,wy-.6],[wx,wy+.6]].every(([x,y])=>isBridge(x,y)))bridge++;
    }
    return {painted,land,bridge};
  }
};`;
assert.equal(source.split(marker).length,2);
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
mkdirSync(root+"test-results",{recursive:true});
const errors=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"no-preference"});
  page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
  await page.route("http://city.test/**",r=>r.fulfill({contentType:"text/html",body:source.replace(marker,hook+marker)}));
  await page.goto("http://city.test/");
  await page.waitForFunction(()=>waterQA.ready());
  await page.evaluate(()=>waterQA.reset());
  const before=await page.evaluate(()=>waterQA.state());
  assert(before.boats.length>0);
  const after=await page.evaluate(()=>waterQA.advance(3));
  const moving=after.boats.filter(b=>before.boats.some(a=>a.id===b.id&&Math.hypot(a.x-b.x,a.y-b.y)>10));
  assert(moving.length>0,"Boats travel in world coordinates, independently of the camera");
  assert.deepEqual(await page.evaluate(()=>waterQA.state()),after,"Repainting does not rerandomize vessel routes");
  assert.deepEqual(await page.evaluate(()=>waterQA.advance(20,true)),after);
  assert.deepEqual(await page.evaluate(()=>waterQA.hidden()),after);
  assert.deepEqual(await page.evaluate(()=>waterQA.noMotion()),after);
  await page.emulateMedia({reducedMotion:"reduce"});
  assert.deepEqual(await page.evaluate(()=>waterQA.advance(20)),after,"System reduced motion freezes boats and wildlife");
  await page.emulateMedia({reducedMotion:"no-preference"});
  const geometry=await page.evaluate(()=>waterQA.geometry());
  assert.deepEqual(geometry.failures,[]);
  assert.equal(geometry.counts.original,0);assert.equal(geometry.counts.mexicocity,0);
  for(const [city,count] of Object.entries(geometry.counts)){
    if(!["original","mexicocity"].includes(city))assert(count>0,city+" gets procedural boats");
  }
  for(const city of ["seattle","istanbul","amsterdam"]){
    const pixels=await page.evaluate(city=>waterQA.waterPixels(city),city);
    assert(pixels.painted>20,city+" renders vessels");
    assert.equal(pixels.land,0,city+" has no hulls or wakes on land");
    assert.equal(pixels.bridge,0,city+" masks vessels beneath bridges");
  }
  await page.evaluate(()=>waterQA.reset());
  const rarity=await page.evaluate(()=>waterQA.rarity());
  assert(rarity.seen.length>=5&&rarity.seen.length<=30,JSON.stringify(rarity));
  assert(rarity.seen[0]>=75,"No immediate or frequent first-load whale show");
  assert(rarity.seen.every((t,i)=>!i||t-rarity.seen[i-1]>=120));
  assert(rarity.visible/3600<.1,"Wildlife is visible for less than 10% of running coastal time");
  assert.deepEqual(rarity.species.sort(),["beluga","whale"]);
  await page.evaluate(()=>waterQA.reset("amsterdam"));
  assert.equal((await page.evaluate(()=>waterQA.rarity(600))).seen.length,0,"No whales in narrow inland canals");
  for(const kind of ["whale","beluga"]){
    const poses=await page.evaluate(kind=>waterQA.poses(kind),kind);
    assert.equal(poses[0].body,0);assert.equal(poses[2].body,1);assert.equal(poses[2].breath,1);
    assert(poses[4].fluke>.9&&poses[4].body<1);assert.equal(poses.at(-1).shadow,0);
  }
  await page.evaluate(()=>waterQA.reset());
  for(const ui of ["film","gamified"]){
    await page.selectOption("#ui-style",ui,{force:true});
    for(const [kind,age] of [["whale",3.5],["whale",9.5],["beluga",3.5]]){
      await page.evaluate(args=>waterQA.render(...args),[kind,age]);
      await page.locator("#city").screenshot({path:root+`test-results/water-${ui}-${kind}-${age}.png`});
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.selectOption("#view-size","200",{force:true});
  await page.evaluate(()=>waterQA.render("beluga",3.5));
  await page.locator("#city").screenshot({path:root+"test-results/water-beluga-200.png"});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.evaluate(()=>waterQA.reset());
  const reset=await page.evaluate(()=>waterQA.state());
  assert.equal(reset.time,0);assert.equal(reset.animal,null);assert.equal(reset.index,0);
  assert(reset.next>=75&&reset.next<135);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",worldSpaceBoats:true,waterClipping:true,boundedGeneration:true,
    rareSightings:rarity.seen.length,visibleFraction:rarity.visible/3600,bothSpecies:true,pauseAndMotion:true,errors}));
}finally{await browser.close()}
