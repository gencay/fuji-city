import {chromium} from "playwright";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const errors=[];
const marker='      if (paused) status.textContent = "Motion is off. Press Play to take flight.";';
const source=readFileSync(process.env.CITY_HTML||root+"city-flight.html","utf8");
assert.equal(source.split(marker).length,2);
try{
  const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:"no-preference"});
  await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
  page.on("pageerror",e=>errors.push(e.message));
  await page.route("http://city.test/**",route=>route.fulfill({
    contentType:"text/html",body:source.replace(marker,'window.wheelQA={refreshLight:()=>advanceClock(60,true)};\n'+marker)
  }));
  await page.goto("http://city.test/");
  await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
  await page.locator(".city-options").evaluate(e=>e.open=true);
  await page.locator("#pause").click();
  for(const ui of ["film","gamified"]){
    await page.selectOption("#ui-style",ui,{force:true});
    const ids=await page.locator(".wheel").evaluateAll(buttons=>buttons.map(e=>e.dataset.wheelFor));
    for(const id of ids){
      const result=await page.evaluate(async id=>{
        const source=document.getElementById(id),button=document.querySelector(`[data-wheel-for="${id}"]`);
        const start=source.selectedIndex,changes=[];
        const listener=()=>changes.push(source.value);
        source.addEventListener("change",listener);
        const committedDuring=[];
        for(let i=0;i<4;i++){
          button.dispatchEvent(new WheelEvent("wheel",{deltaY:12,cancelable:true}));
          await new Promise(resolve=>setTimeout(resolve,280));
          committedDuring.push(source.selectedIndex);
        }
        await new Promise(resolve=>setTimeout(resolve,600));
        source.removeEventListener("change",listener);
        const expected=id==="view-size"?Math.min(source.options.length-1,start+1):(start+1)%source.options.length;
        return {id,start,expected,actual:source.selectedIndex,changes,committedDuring,
          opacity:[...button.querySelector(".wheel-reel").children].map(e=>Number(getComputedStyle(e).opacity))};
      },id);
      assert(result.committedDuring.every(i=>i===result.start),JSON.stringify(result));
      assert.equal(result.actual,result.expected,JSON.stringify(result));
      assert.equal(result.changes.length,result.expected===result.start?0:1,JSON.stringify(result));
      assert.deepEqual(result.opacity,[0,1,0]);
    }
    await page.selectOption("#film","chrome",{force:true});
    const interrupted=await page.evaluate(async()=>{
      const source=document.getElementById("film"),button=document.querySelector('[data-wheel-for="film"]');
      const reel=button.querySelector(".wheel-reel"),row=parseFloat(getComputedStyle(button).getPropertyValue("--reel-row"));
      button.dispatchEvent(new WheelEvent("wheel",{deltaY:25,cancelable:true}));
      await new Promise(resolve=>setTimeout(resolve,390));
      const animations=reel.getAnimations();
      for(const node of [reel,...reel.children])for(const animation of node.getAnimations()){
        animation.pause();animation.currentTime=80;
      }
      const before=source.selectedIndex-new DOMMatrix(getComputedStyle(reel).transform).m42/row;
      button.dispatchEvent(new WheelEvent("wheel",{deltaY:4,cancelable:true}));
      const after=Number(button.getAttribute("aria-valuenow"))-new DOMMatrix(getComputedStyle(reel).transform).m42/row;
      return {animations:animations.length,before,after};
    });
    assert(interrupted.animations>0,JSON.stringify(interrupted));
    assert(Math.abs(interrupted.after-interrupted.before-4/36)<.002,JSON.stringify(interrupted));
    await page.locator('[data-wheel-for="film"]').press("Escape");
    await page.waitForTimeout(600);
    await page.selectOption("#film","chrome",{force:true});
    const crossover=await page.evaluate(()=>{
      const source=document.getElementById("film"),button=document.querySelector('[data-wheel-for="film"]');
      const label=source.options[source.selectedIndex+1].textContent;
      const sample=()=>{
        const node=[...button.querySelector(".wheel-reel").children].find(e=>e.textContent===label);
        const range=document.createRange();range.selectNodeContents(node);
        return {top:range.getBoundingClientRect().top,height:range.getBoundingClientRect().height,opacity:Number(getComputedStyle(node).opacity)};
      };
      button.dispatchEvent(new WheelEvent("wheel",{deltaY:17.8,cancelable:true}));const before=sample();
      button.dispatchEvent(new WheelEvent("wheel",{deltaY:.4,cancelable:true}));return {before,after:sample()};
    });
    assert(Math.abs(crossover.after.top-crossover.before.top+.4/36*26)<.1,JSON.stringify(crossover));
    assert(Math.abs(crossover.after.height-crossover.before.height)<.01,JSON.stringify(crossover));
    assert(crossover.after.opacity>crossover.before.opacity);
    await page.locator('[data-wheel-for="film"]').press("Escape");await page.waitForTimeout(600);
    for(const direction of [-1,1]){
      await page.selectOption("#film","chrome",{force:true});
      const refreshed=await page.evaluate(direction=>{
        const button=document.querySelector('[data-wheel-for="film"]'),reel=button.querySelector(".wheel-reel");
        button.dispatchEvent(new WheelEvent("wheel",{deltaY:direction*19,cancelable:true}));
        const sample=()=>({rows:[...reel.children].map(e=>e.textContent),transform:getComputedStyle(reel).transform,
          preview:button.getAttribute("aria-valuetext"),selected:document.getElementById("film").value});
        const before=sample();
        wheelQA.refreshLight();
        return {before,after:sample()};
      },direction);
      assert.deepEqual(refreshed.after,refreshed.before,"Clock lighting refresh must not replace the film preview at the midpoint");
      await page.locator('[data-wheel-for="film"]').press("Escape");await page.waitForTimeout(600);
    }
    await page.selectOption("#film","chrome",{force:true});
    await page.locator("#pause").click();
    const playing=await page.evaluate(async()=>{
      const button=document.querySelector('[data-wheel-for="film"]'),source=document.getElementById("film");
      const expected=source.options[source.selectedIndex+1].textContent,wrong=[];
      let samples=0,frame;
      const sample=()=>{
        const text=button.querySelector(".wheel-readout").textContent;
        if(text!==expected)wrong.push(text);
        samples++;frame=requestAnimationFrame(sample);
      };
      button.dispatchEvent(new WheelEvent("wheel",{deltaY:19,cancelable:true}));
      frame=requestAnimationFrame(sample);
      for(let i=0;i<8;i++){
        await new Promise(resolve=>setTimeout(resolve,90));
        button.dispatchEvent(new WheelEvent("wheel",{deltaY:.2,cancelable:true}));
      }
      cancelAnimationFrame(frame);
      return {samples,wrong,selected:source.value};
    });
    assert(playing.samples>0);
    assert.deepEqual(playing.wrong,[],"The preview remains stable between wheel events while the city is playing");
    assert.equal(playing.selected,"chrome","Preview must not apply the film before release");
    await page.locator("#pause").click();await page.waitForTimeout(600);
    for(const viewport of [{width:1440,height:900},{width:844,height:390}]){
      await page.setViewportSize(viewport);
      await page.selectOption("#view-size","full",{force:true});
      const rows=await page.locator(".wheel").evaluateAll(buttons=>buttons.map(button=>[...button.querySelector(".wheel-reel").children].map(e=>{
        const s=getComputedStyle(e);return [s.height,s.fontSize,s.paddingLeft,s.paddingRight,s.whiteSpace].join("/");
      })));
      assert(rows.every(styles=>new Set(styles).size===1),JSON.stringify(rows));
      await page.keyboard.press("Escape");
    }
    await page.setViewportSize({width:1440,height:1100});
  }
  const wheel=page.locator('[data-wheel-for="film"]');
  await wheel.press("End");await wheel.press("ArrowUp");
  assert.equal(await page.locator("#film").evaluate(e=>e.selectedIndex),0,"Keyboard still wraps");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.waitForFunction(()=>document.documentElement.dataset.motion==="off");
  await wheel.dispatchEvent("wheel",{deltaY:36});
  await page.waitForTimeout(400);
  assert.equal(await page.locator("#film").evaluate(e=>e.selectedIndex),1);
  assert.equal(await wheel.evaluate(e=>e.querySelector(".wheel-reel").getAnimations({subtree:true}).length),0);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",styles:2,slowGestures:true,interruptedSnap:true,continuousCrossover:true,lightingRefreshPreview:true,playingPreview:true,fullWindowRows:true,reducedMotion:true,errors}));
}finally{await browser.close()}
