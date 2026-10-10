import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(root+"city-flight.html","utf8");
const marker='      if (paused) status.textContent = "Motion is off. Press Play to take flight.";';
const hook=`
window.analyticsQA={
  time(seconds,stop=false){paused=stop;trackAnalyticsPlayTime(seconds);paused=true},
  flush:flushAnalyticsPlayTime,
  commands(){return Array.from(window.dataLayer||[],entry=>Array.from(entry))}
};`;
assert.equal(source.split(marker).length,2);
const origin="https://fuji-city.toyling.com",base=origin+"/",key="fuji-city:analytics:v1";
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const errors=[];
mkdirSync(root+"test-results",{recursive:true});
async function open({url=base,saved=null,blocked=false,width=1440,requireConsent=false}={}){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
  const requests=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(({saved,key})=>{
    localStorage.setItem("fuji-city:first-play:v1","done");
    if(saved&&!localStorage.getItem(key))localStorage.setItem(key,saved);
  },{saved,key});
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route(/https:\/\/.*(?:googletagmanager|google-analytics)\.com\//,route=>{
    requests.push(route.request().url());
    if(blocked)return route.abort();
    // Stub the vendor: never send test traffic to the real property.
    return route.fulfill({contentType:"application/javascript",body:"window.analyticsVendorLoaded=true;"});
  });
  const flag="const REQUIRE_ANALYTICS_CONSENT = false;";
  assert.equal(source.split(flag).length,2);
  const body=(requireConsent?source.replace(flag,"const REQUIRE_ANALYTICS_CONSENT = true;"):source).replace(marker,hook+marker);
  await page.route(url.split("?")[0]+"**",r=>r.fulfill({contentType:"text/html",body}));
  await page.goto(url,{referer:"https://example.com/private/path?email=do-not-send@example.com"});
  await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
  return {page,requests};
}
const commands=page=>page.evaluate(()=>analyticsQA.commands());
const events=async page=>(await commands(page)).filter(c=>c[0]==="event");
async function settings(page){
  await page.locator(".city-notes").evaluate(e=>e.open=true);
  await page.locator("#analytics-settings").click();
}
try{
  for(const url of ["http://city.test/","http://localhost:8000/","https://gencay.github.io/fuji-city/",origin+"/other/",base+"versions/city-flight-v14.html"]){
    const {page,requests}=await open({url,saved:"granted"});
    assert.equal(await page.locator("#google-analytics").count(),0);
    assert.equal(await page.locator("#analytics-choice").evaluate(e=>e.hidden),true);
    assert(await page.locator("#analytics-settings").isDisabled());
    assert.deepEqual(requests,[]);
    await page.close();
  }
  const automatic=await open();
  await automatic.page.waitForFunction(()=>document.getElementById("analytics-status").textContent.includes("is on"));
  assert.equal(automatic.requests.length,1,"Production analytics defaults on during preview");
  assert.equal(await automatic.page.locator("#analytics-choice").evaluate(e=>e.hidden),true);
  assert.equal(await automatic.page.evaluate(key=>localStorage.getItem(key),key),null,"Default-on must not record user consent");
  await automatic.page.locator("#city").press("l");await automatic.page.locator("#city").press("Enter");
  assert.equal((await events(automatic.page)).filter(c=>c[1]==="vehicle_spawn").length,1);
  await settings(automatic.page);await automatic.page.locator("#analytics-decline").click();
  const stopped=(await events(automatic.page)).length;
  await automatic.page.evaluate(()=>analyticsQA.time(40));
  assert.equal((await events(automatic.page)).length,stopped);
  await automatic.page.reload();
  assert.equal(automatic.requests.length,1,"Default-on still respects explicit opt-outs");
  assert.equal(await automatic.page.locator("#analytics-choice").evaluate(e=>e.hidden),true);
  await automatic.page.evaluate(key=>window.dispatchEvent(new StorageEvent("storage",{key,newValue:null})),key);
  await automatic.page.waitForFunction(()=>document.getElementById("analytics-status").textContent.includes("is on"));
  assert.equal(await automatic.page.locator("#analytics-choice").evaluate(e=>e.hidden),true,"Cross-tab updates cannot auto-open the prompt in preview mode");
  await automatic.page.close();
  const optedOut=await open({saved:"denied"});
  assert.deepEqual(optedOut.requests,[]);await optedOut.page.close();
  const {page,requests}=await open({url:base+"?private=never-send#secret",requireConsent:true});
  assert.equal(await page.locator("#analytics-choice").evaluate(e=>e.hidden),false);
  assert.deepEqual(requests,[],"No Google connection before consent");
  await page.locator("#city").press("l");await page.locator("#city").press("Enter");
  assert.deepEqual(await events(page),[],"No pre-consent spawn is collected");
  await page.locator("#analytics-decline").click();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),"denied");
  await page.reload();
  assert.deepEqual(requests,[]);
  assert.equal(await page.locator("#analytics-choice").evaluate(e=>e.hidden),true);
  await settings(page);await page.locator("#analytics-accept").click();
  await page.waitForFunction(()=>document.getElementById("analytics-status").textContent.includes("is on"));
  assert.equal(requests.length,1);
  assert.equal(requests[0],"https://www.googletagmanager.com/gtag/js?id=G-XPQERNETR9");
  let calls=await commands(page);
  const defaults=calls.find(c=>c[0]==="consent"&&c[1]==="default");
  assert(Object.values(defaults[2]).every(v=>v==="denied"));
  const config=calls.find(c=>c[0]==="config");
  assert.equal(config[1],"G-XPQERNETR9");
  assert.equal(config[2].page_location,base);
  assert.equal(config[2].page_referrer,"https://example.com");
  assert.equal(config[2].allow_google_signals,false);
  assert.equal(config[2].allow_ad_personalization_signals,false);
  assert.equal(config[2].cookie_path,"/");
  assert.equal(config[2].send_page_view,false);
  assert.equal((await events(page)).filter(c=>c[1]==="page_view").length,1);
  assert(!JSON.stringify(calls).includes("do-not-send"));
  await page.locator("#city").press("l");await page.locator("#city").press("Enter");
  assert.equal((await events(page)).filter(c=>c[1]==="vehicle_spawn").length,1);
  await page.evaluate(()=>analyticsQA.time(12,true));
  await page.evaluate(()=>analyticsQA.flush());
  assert.equal((await events(page)).filter(c=>c[1]==="play_time").length,0,"Paused time is not play time");
  await page.evaluate(()=>analyticsQA.time(12));
  await page.selectOption("#destination","dublin",{force:true});
  let play=(await events(page)).filter(c=>c[1]==="play_time");
  assert.equal(play.at(-1)[2].play_seconds,12);
  assert.equal((await events(page)).filter(c=>c[1]==="city_selected").at(-1)[2].city_id,"dublin");
  await page.evaluate(()=>analyticsQA.time(30));
  play=(await events(page)).filter(c=>c[1]==="play_time");
  assert.equal(play.at(-1)[2].city_id,"dublin");assert.equal(play.at(-1)[2].play_seconds,30);
  await page.evaluate(()=>{document.cookie="fuji_city_ga=test; Path=/; Secure";document.cookie="unrelated=keep; Path=/; Secure"});
  const before=(await events(page)).length;
  await settings(page);await page.locator("#analytics-decline").click();
  assert(await page.evaluate(()=>window["ga-disable-G-XPQERNETR9"]));
  assert.equal(await page.evaluate(()=>document.cookie.includes("fuji_city_ga=")),false);
  assert(await page.evaluate(()=>document.cookie.includes("unrelated=keep")));
  await page.locator("#city").press("l");await page.locator("#city").press("Enter");
  await page.evaluate(()=>analyticsQA.time(40));
  assert.equal((await events(page)).length,before,"Withdrawal stops gameplay events");
  await page.reload();assert.equal(requests.length,1,"Remembered denial does not reload Google");
  await page.close();
  const returning=await open({saved:"granted"});
  await returning.page.waitForFunction(()=>window.analyticsVendorLoaded);
  assert.equal(returning.requests.length,1);await returning.page.close();
  const failed=await open({blocked:true,requireConsent:true});
  await failed.page.locator("#analytics-accept").click();
  await failed.page.waitForFunction(()=>document.getElementById("analytics-status").textContent.includes("could not load"));
  assert.equal(await failed.page.locator("#google-analytics").count(),0);
  assert.deepEqual(await events(failed.page),[]);
  await failed.page.locator("#city").press("l");await failed.page.locator("#city").press("Enter");
  await failed.page.close();
  for(const width of [320,390]){
    const mobile=await open({width,requireConsent:true});
    assert(await mobile.page.locator("#analytics-choice").evaluate(e=>{
      const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;
    }));
    await mobile.page.screenshot({path:root+`test-results/analytics-consent-${width}.png`});
    await mobile.page.locator("#analytics-decline").click();
    assert.deepEqual(mobile.requests,[]);await mobile.page.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",productionOnly:true,previewDefaultOn:true,noAutomaticConsentRecorded:true,restorableOptIn:true,rememberedChoices:true,withdrawal:true,canonicalURLs:true,gameplayEvents:true,blockedTagGraceful:true,mobile:true,realAnalyticsTraffic:false,errors}));
}finally{await browser.close()}
