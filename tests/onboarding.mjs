import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const base=process.env.SITE_URL||"http://city.test/";
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const errors=[],key="fuji-city:first-play:v1";
mkdirSync(root+"test-results",{recursive:true});
async function open({ui="gamified",theme="light",width=1440,height=1000,motion="reduce",blocked=false}={}){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:motion});
  page.on("pageerror",error=>errors.push(error.message));
  if(blocked==="write")await page.addInitScript(()=>{
    Storage.prototype.setItem=function(){throw new DOMException("Storage is read-only","QuotaExceededError");};
  });
  else if(blocked)await page.addInitScript(()=>{
    Object.defineProperty(window,"localStorage",{get(){throw new DOMException("Storage blocked","SecurityError");}});
  });
  await page.addInitScript(()=>{
    window.tutorialSpawns=0;
    document.addEventListener("DOMContentLoaded",()=>document.getElementById("city").addEventListener("vehicle-added",()=>window.tutorialSpawns++));
  });
  await page.route("https://fonts.googleapis.com/**",route=>route.abort());
  if(!process.env.SITE_URL)await page.route(base+"**",route=>route.fulfill({contentType:"text/html",body:readFileSync(root+"city-flight.html","utf8")}));
  await page.goto(`${base}?ui=${ui}&scoutTheme=${theme}`);
  await page.waitForFunction(()=>!document.getElementById("first-play-guide").hidden);
  return page;
}
async function visibleCoach(page){
  await page.waitForTimeout(180);
  assert(await page.locator("#first-play-guide").evaluate(e=>{
    const r=e.getBoundingClientRect();
    return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;
  }),"Coach fits the viewport");
  assert(await page.locator("#guide-next").isVisible());
}
try{
  for(const ui of ["film","gamified"]){
    const page=await open({ui,theme:ui==="film"?"light":"dark"});
    await visibleCoach(page);
    assert.equal(await page.evaluate(()=>window.tutorialSpawns),0,"The hand never spawns a vehicle itself");
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null,"Viewing does not mark completion");
    assert.equal(await page.locator("#guide-pointer").evaluate(e=>e.getAnimations({subtree:true}).length),0,"Reduced motion is static");
    const point=await page.locator("#guide-pointer").evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y};});
    assert(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id==="city",point),"The hand never intercepts the road click");
    await page.mouse.click(point.x,point.y);
    await page.waitForFunction(()=>window.tutorialSpawns===1);
    assert.match(await page.locator("#guide-feedback").textContent(),/Vehicle added/);
    assert.equal(await page.locator("#pause").textContent(),"Play","Tutorial preserves reduced-motion playback");
    await page.locator("#guide-next").click();
    await page.locator("#guide-back").click();
    assert.equal(await page.locator("#first-play-guide").getAttribute("data-step"),"0");
    await page.locator("#guide-next").click();
    await page.locator("#guide-focus").click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),"city-selector");
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(()=>document.getElementById("guide-feedback").textContent.startsWith("Changed"));
    await page.locator("#guide-next").click();
    await page.locator("#guide-focus").click();
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(()=>document.getElementById("guide-feedback").textContent.startsWith("Changed"));
    await page.locator("#guide-next").click();
    await page.selectOption("#view-size","full",{force:true});
    await visibleCoach(page);
    await page.locator("#guide-next").click();
    assert.equal(await page.locator("#first-play-guide").getAttribute("data-step"),"4");
    await page.locator("#guide-focus").click();
    await page.keyboard.press("Home");
    assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"06:00:00");
    await page.locator("#guide-next").click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),"clock","Finish returns focus to the control");
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),"done");
    assert(await page.locator("#first-play-guide").isHidden());
    await page.reload();
    await page.waitForTimeout(900);
    assert(await page.locator("#first-play-guide").isHidden(),"Returning visitor is not interrupted");
    await page.locator(".city-notes").evaluate(e=>e.open=true);
    await page.locator("#replay-guide").click();
    assert(await page.locator("#first-play-guide").isVisible());
    await page.locator("#guide-focus").click();
    await page.keyboard.press("Enter");
    assert.match(await page.locator("#guide-feedback").textContent(),/Vehicle added/,"Keyboard can complete the spawn lesson");
    await page.keyboard.press("Escape");
    assert(await page.locator("#first-play-guide").isHidden());
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),"skipped");
    await page.locator("#replay-guide").click();
    await page.locator("#guide-skip").click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),"replay-guide","Replay returns focus to its launcher");
    await page.close();
  }
  for(const [width,height] of [[390,844],[844,390],[320,568]]){
    const page=await open({width,height});
    for(let step=0;step<5;step++){
      await visibleCoach(page);
      if(step===0){
        await page.screenshot({path:root+`test-results/first-play-${width}.png`});
        const point=await page.locator("#guide-pointer").evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y};});
        assert(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id==="city",point),`Road hint remains clickable at ${width}px`);
        await page.mouse.click(point.x,point.y);
        await page.waitForFunction(()=>window.tutorialSpawns===1);
      }
      await page.locator("#guide-next").click();
    }
    assert(await page.locator("#first-play-guide").isHidden());
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.close();
  }
  const animated=await open({motion:"no-preference"});
  assert(await animated.locator(".guide-hand").evaluate(e=>e.getAnimations().some(a=>a.playState==="running")));
  await animated.locator("#guide-skip").click();
  await animated.reload();await animated.waitForTimeout(900);
  assert(await animated.locator("#first-play-guide").isHidden(),"Skip is remembered");
  await animated.close();
  const blocked=await open({blocked:true});
  assert(await blocked.locator("#guide-storage").isVisible());
  await blocked.locator("#guide-skip").click();
  assert.match(await blocked.locator("#ui-toast").textContent(),/storage is unavailable/);
  await blocked.close();
  const readOnly=await open({blocked:"write"});
  assert(await readOnly.locator("#guide-storage").isHidden());
  await readOnly.locator("#guide-skip").click();
  assert.match(await readOnly.locator("#ui-toast").textContent(),/storage is unavailable/);
  await readOnly.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",firstVisit:true,realPointerAndKeyboardSpawn:true,settings:true,persistence:true,replay:true,mobile:true,motion:true,blockedStorage:true,errors}));
}finally{await browser.close()}
