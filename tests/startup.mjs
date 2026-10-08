import {chromium} from "playwright";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(root+"city-flight.html","utf8");
const marker='      if (paused) status.textContent = "Motion is off. Press Play to take flight.";';
const hook=`window.startupQA=()=>({
  city:cityId,name:currentCity().name,film:filmId,fps:automaticFps,interval:FRAME_TIME,
  defaults:cityDefaults[cityId],landmarks:currentCity().landmarks.map(place=>place.name),
  workers:readyWorkers.size,failures:[...workerFailures]
});`;
assert.equal(source.split(marker).length,2);
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const errors=[];
try{
  const page=await browser.newPage({reducedMotion:"reduce"});
  page.on("pageerror",error=>errors.push(error.message));
  await page.route("https://fonts.googleapis.com/**",route=>route.abort());
  await page.route("http://city.test/**",route=>route.fulfill({contentType:"text/html",body:source.replace(marker,hook+marker)}));
  await page.addInitScript(()=>{
    localStorage.setItem("fuji-city:first-play:v1","done");
    const random=crypto.getRandomValues.bind(crypto);
    let first=true;
    crypto.getRandomValues=values=>{
      if(!first)return random(values);
      first=false;
      const index=Number(new URLSearchParams(location.search).get("sample"));
      const count=document.querySelectorAll("#destination option").length;
      values[0]=index===0?0:index===count-1?4294967295:Math.floor((index+.5)/count*4294967296);
      return values;
    };
  });
  let ids;
  for(let index=0;index<(ids?.length??1);index++){
    await page.goto(`http://city.test/?sample=${index}`);
    await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
    ids??=await page.locator("#destination option").evaluateAll(options=>options.map(option=>option.value));
    const state=await page.evaluate(()=>startupQA());
    assert.equal(state.city,ids[index],"Every destination is reachable on startup, including random boundaries");
    assert.equal(await page.locator("#destination").inputValue(),state.city);
    assert.equal(await page.locator("#city-selector .wheel-readout").textContent(),state.name);
    assert.equal(await page.locator("#journal-city").textContent(),state.name);
    assert.equal(await page.locator("#clock-brand").textContent(),state.name.toUpperCase());
    assert.equal(await page.locator("#city-poem").getAttribute("data-city"),state.city);
    assert.equal(await page.locator("#newspaper-readable").getAttribute("data-city"),state.city);
    const guide=await page.locator("#city-landmarks").textContent();
    assert(state.landmarks.some(name=>guide.startsWith("Starting landmark: "+name+".")));
    assert.equal(state.film,state.defaults.film);
    assert.equal(await page.locator("#film").inputValue(),state.defaults.film);
    assert.equal(state.fps,state.defaults.fps);
    assert.equal(state.interval,1000/state.defaults.fps);
    assert.equal(await page.locator("#fps").inputValue(),"auto");
    assert.equal(await page.locator('#fps option[value="auto"]').textContent(),`Auto ${state.defaults.fps}`);
    assert.equal(state.workers,4);
    assert.deepEqual(state.failures,[]);
    for(const id of ["new","reset-view"]){
      await page.locator("#"+id).evaluate(button=>button.click());
      assert.equal((await page.evaluate(()=>startupQA())).city,state.city,"Roll controls retain the city");
    }
    const manual=ids[(index+1)%ids.length];
    await page.selectOption("#destination",manual,{force:true});
    assert.equal((await page.evaluate(()=>startupQA())).city,manual,"Manual city selection remains available");
  }
  assert.equal(ids.length,19);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",randomStartupCities:ids.length,cityDefaults:true,rollsPreserveCity:true,manualSelection:true,errors}));
}finally{await browser.close()}
