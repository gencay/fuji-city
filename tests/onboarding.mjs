import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(root+"city-flight.html","utf8");
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const errors=[],key="fuji-city:first-play:v1";
mkdirSync(root+"test-results",{recursive:true});
async function open({ui="gamified",width=1440,height=1000,motion="reduce",blocked=false,early=false,legacy=null}={}){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:motion});
  page.on("pageerror",error=>errors.push(error.message));
  await page.addInitScript(({blocked,early,legacy,key})=>{
    if(legacy)localStorage.setItem(key,legacy);
    if(blocked==="write")Storage.prototype.setItem=function(){throw new DOMException("Read-only storage","QuotaExceededError");};
    else if(blocked)Object.defineProperty(window,"localStorage",{get(){throw new DOMException("Blocked storage","SecurityError");}});
    window.tutorialSpawns=0;
    document.addEventListener("DOMContentLoaded",()=>{
      const city=document.getElementById("city");
      city.addEventListener("vehicle-added",()=>window.tutorialSpawns++);
      if(early){
        city.dispatchEvent(new KeyboardEvent("keydown",{key:"l",bubbles:true}));
        city.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));
      }
    });
  },{blocked,early,legacy,key});
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("http://city.test/**",r=>r.fulfill({contentType:"text/html",body:source}));
  await page.goto(`http://city.test/?ui=${ui}`);
  await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
  return page;
}
async function hintPoint(page){
  // Mobile starts with the header visible; the hint must not scroll the photo into view itself.
  await page.locator("#city").scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>!document.getElementById("guide-pointer").hidden);
  await page.waitForTimeout(180);
  return page.locator("#guide-pointer").evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y};});
}
async function keyboardSpawn(page){
  await page.locator("#city").press("l");
  await page.locator("#city").press("Enter");
  await page.waitForFunction(()=>document.getElementById("guide-pointer").hidden);
}
try{
  for(const ui of ["film","gamified"]){
    const page=await open({ui});
    assert.equal(await page.locator(".city-options").evaluate(e=>e.open),false);
    assert.equal(await page.locator("#first-play-guide,#guide-next,#guide-highlight,#clock-reset").count(),0);
    assert.equal(await page.evaluate(()=>scrollY),0,"The hint never auto-scrolls");
    const point=await hintPoint(page);
    assert.equal(await page.evaluate(()=>window.tutorialSpawns),0,"The hand never clicks");
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
    assert.equal(await page.locator("#guide-pointer").evaluate(e=>e.getAnimations({subtree:true}).length),0);
    assert(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id==="city",point),"Hint is click-through");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null,"Escape does not complete the lesson");
    await page.mouse.click(point.x,point.y);
    await page.waitForFunction(()=>window.tutorialSpawns===1);
    assert.equal(await page.locator("#guide-pointer").evaluate(e=>e.hidden),true);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),"done");
    assert.equal(await page.locator("#pause").textContent(),"Play","Spawning does not override pause");
    assert.equal(await page.locator(".city-options").evaluate(e=>e.open),false);
    await page.reload();await page.waitForTimeout(800);
    assert.equal(await page.locator("#guide-pointer").evaluate(e=>e.hidden),true);
    await page.locator(".city-notes").evaluate(e=>e.open=true);
    await page.locator("#replay-guide").click();
    await hintPoint(page);
    await keyboardSpawn(page);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),"done");
    await page.close();
  }
  for(const [width,height] of [[390,844],[844,390],[320,568]]){
    const page=await open({width,height});
    assert.equal(await page.evaluate(()=>scrollY),0);
    const point=await hintPoint(page);
    assert(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id==="city",point),`Clickable road at ${width}px`);
    await page.screenshot({path:root+`test-results/first-play-${width}.png`});
    await page.mouse.click(point.x,point.y);
    await page.waitForFunction(()=>window.tutorialSpawns===1);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),"done");
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.close();
  }
  const early=await open({early:true});
  await early.waitForTimeout(900);
  assert.equal(await early.evaluate(()=>window.tutorialSpawns),1);
  assert.equal(await early.locator("#guide-pointer").evaluate(e=>e.hidden),true,"Early spawn cancels delayed hint");
  assert.equal(await early.evaluate(key=>localStorage.getItem(key),key),"done");
  await early.close();
  const animated=await open({motion:"no-preference"});
  await hintPoint(animated);
  assert(await animated.locator(".guide-hand").evaluate(e=>e.getAnimations().some(a=>a.playState==="running")));
  await animated.locator("#city").press("l");
  await animated.locator("#city").press("Enter");
  await animated.close();
  const legacy=await open({legacy:"skipped"});
  await hintPoint(legacy);
  assert.equal(await legacy.evaluate(key=>localStorage.getItem(key),key),"skipped","Legacy skip is not a successful spawn");
  await keyboardSpawn(legacy);await legacy.close();
  for(const blocked of [true,"write"]){
    const page=await open({blocked});
    await hintPoint(page);
    await keyboardSpawn(page);
    assert.match(await page.locator("#ui-toast").textContent(),/storage is unavailable/i);
    assert.equal(await page.locator("#guide-pointer").evaluate(e=>e.hidden),true);
    await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",singleHint:true,actualPointerAndKeyboardSpawn:true,earlySpawn:true,persistence:true,mobile:true,reducedMotion:true,storageFailures:true,errors}));
}finally{await browser.close()}
