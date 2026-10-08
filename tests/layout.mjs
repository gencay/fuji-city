import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const base=process.env.SITE_URL||"http://city.test/";
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const errors=[];
mkdirSync(root+"test-results",{recursive:true});
try{
  const page=await browser.newPage({reducedMotion:"reduce",viewport:{width:1440,height:1100}});
  await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
  page.on("pageerror",e=>errors.push(e.message));
  if(!process.env.SITE_URL){
    const source=readFileSync(process.env.CITY_HTML||root+"city-flight.html","utf8");
    await page.route(base+"**",route=>route.fulfill({contentType:"text/html",body:source}));
  }
  await page.goto(base);
  await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
  const scroll=async y=>{
    await page.evaluate(y=>window.scrollTo(0,y),y);
    await page.waitForTimeout(80);
    return page.evaluate(()=>{
      const rect=selector=>{
        const r=document.querySelector(selector).getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,height:r.height};
      };
      return {y:scrollY,main:rect("main"),sidebar:rect(".city-journal"),layout:rect(".city-layout")};
    });
  };
  const stableLayout=()=>page.evaluate(async()=>{
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const main=document.querySelector("main"),figure=document.querySelector("figure"),sidebar=document.querySelector(".city-journal");
    const box=main.getBoundingClientRect(),side=sidebar.getBoundingClientRect();
    return [box.x,box.y,box.width,box.height,side.x,side.y,figure.offsetWidth,figure.offsetHeight];
  });
  const checkCityTooltip=async()=>{
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.locator("#city-selector").evaluate(e=>e.blur());
    await page.locator("#city-selector").evaluate(e=>e.focus({preventScroll:true}));
    await page.waitForFunction(()=>document.getElementById("control-tooltip").getAttribute("aria-hidden")==="false");
    const bounds=await page.evaluate(()=>{
      const tip=document.getElementById("control-tooltip").getBoundingClientRect(),board=document.querySelector(".station-board").getBoundingClientRect();
      return {visible:tip.left>=0&&tip.top>=0&&tip.right<=innerWidth&&tip.bottom<=innerHeight,
        clear:tip.right<=board.left||tip.left>=board.right||tip.bottom<=board.top||tip.top>=board.bottom};
    });
    assert(bounds.visible&&bounds.clear,JSON.stringify(bounds));
    await page.keyboard.press("Escape");
  };
  for(const ui of ["film","gamified"]){
    await page.locator("#ui-style").selectOption(ui,{force:true});
    await page.evaluate(()=>{
      document.querySelector(".city-notes").open=true;
      document.querySelector(".about-city").open=true;
    });
    for(const height of [1100,700]){
      await page.setViewportSize({width:1440,height});
      for(const size of ["300","600","1000"]){
        await page.selectOption("#view-size",size,{force:true});
        const initial=await scroll(0);
        if(height===1100&&size==="600")await page.screenshot({path:root+`test-results/heading-${ui}.png`});
        const a=await scroll(160),b=await scroll(440);
        assert.equal(await page.locator("main").evaluate(e=>getComputedStyle(e).position),"sticky");
        assert(Math.abs(a.main.top-20)<1&&Math.abs(b.main.top-20)<1,`${ui}/${height}/${size}: photo stays pinned`);
        assert(Math.abs((a.sidebar.top-b.sidebar.top)-(b.y-a.y))<1,"Sidebar keeps scrolling normally");
        assert(initial.main.top>=20);
        const end=await scroll(1e7);
        assert(end.main.bottom<=end.layout.bottom+1,"Photo stops at the shared layout boundary");
        assert(end.main.bottom<=height+1,"Bottom of tall prints remains reachable");
        await scroll(200);
        const fonts=await page.evaluate(()=>({
          label:parseFloat(getComputedStyle(document.querySelector(".city-identity h1 > span")).fontSize),
          city:parseFloat(getComputedStyle(document.querySelector("#city-selector .wheel-readout")).fontSize)
        }));
        assert(fonts.city>=fonts.label*1.15,JSON.stringify(fonts));
      }
    }
    await page.setViewportSize({width:1440,height:1100});
    await page.selectOption("#view-size","600",{force:true});
    await scroll(350);
    await page.screenshot({path:root+`test-results/sticky-${ui}.png`});
    await page.locator("#city").press("l");await page.locator("#city").press("Enter");
    assert.match(await page.locator("#status").textContent(),/added (?:at (?:cruising|a forecast-safe) speed|to a crowded gap)/);
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:900});
      await scroll(0);
      const baseline=await stableLayout();
      const cities=await page.locator("#destination option").evaluateAll(options=>options.map(e=>e.value));
      for(const city of cities){
        await page.selectOption("#destination",city,{force:true});
        const current=await stableLayout();
        assert(current.every((value,i)=>Math.abs(value-baseline[i])<=1),`${ui}/${width}/${city}: city change shifted layout ${JSON.stringify({baseline,current})}`);
      }
      await page.locator("#new").evaluate(e=>e.click());
      const rolled=await stableLayout();
      assert(rolled.every((value,i)=>Math.abs(value-baseline[i])<=1),"New roll must not shift the photo or sidebar");
      for(const angle of [-2,2]){
        const contained=await page.evaluate(angle=>{
          document.documentElement.style.setProperty("--city-paper-angle",angle+"deg");
          const photo=document.querySelector("figure").getBoundingClientRect(),main=document.querySelector("main").getBoundingClientRect();
          return photo.left>=main.left&&photo.right<=main.right&&photo.top>=main.top&&photo.bottom<=main.bottom;
        },angle);
        assert(contained,`${ui}/${width}: maximum tilt stays inside reserved space`);
      }
      await checkCityTooltip();
      const targetTop=await page.locator("#city-selector").evaluate(e=>e.getBoundingClientRect().top+scrollY);
      await scroll(targetTop-12);
      await checkCityTooltip();
    }
    for(const width of [390,850]){
      await page.setViewportSize({width,height:844});
      const a=await scroll(0),b=await scroll(200);
      assert.equal(await page.locator("main").evaluate(e=>getComputedStyle(e).position),"static");
      assert(Math.abs(a.main.top-b.main.top-(b.y-a.y))<1,"Single-column photo scrolls out of the way");
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    await page.setViewportSize({width:1440,height:900});
    await page.selectOption("#view-size","full",{force:true});
    const a=await page.locator("figure").boundingBox();
    await page.locator(".city-journal").evaluate(e=>e.scrollTop=600);
    await page.waitForTimeout(80);
    const b=await page.locator("figure").boundingBox();
    assert.deepEqual(b,a,"Full-window sidebar scroll cannot move the photo");
    assert(await page.locator(".city-journal").evaluate(e=>e.scrollTop>0));
    await page.locator(".city-journal").evaluate(e=>e.scrollTop=0);
    await checkCityTooltip();
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",styles:2,desktopScrollCases:12,mobileWidths:[320,390,850],stableCityChanges:114,maxTiltBounds:true,cityTooltipClear:true,fullWindow:"preserved",cityHeading:"dominant",errors}));
}finally{await browser.close()}
