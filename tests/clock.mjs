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
  const page=await browser.newPage({reducedMotion:"reduce",viewport:{width:1440,height:1000}});
  await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
  page.on("pageerror",e=>errors.push(e.message));
  if(!process.env.SITE_URL)await page.route(base+"**",route=>route.fulfill({
    contentType:"text/html",body:readFileSync(process.env.CITY_HTML||root+"city-flight.html","utf8")
  }));
  for(const ui of ["film","gamified"]){
    await page.goto(base);
    await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
    await page.selectOption("#ui-style",ui,{force:true});
    assert.equal(await page.locator("#clock").evaluate(e=>e.getBoundingClientRect().width),132,"Clock is 75% of its previous 176 px desktop width");
    assert.equal(await page.locator("#clock-readout").count(),0);
    const badge=page.locator("#clock-rate");
    assert.equal(await badge.textContent(),"x1800");
    await page.locator("#clock").press("Home");
    assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"06:00:00");
    await page.locator("#clock").press("End");
    assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"21:00:00");
    for(const label of ["x900","x450","x225","x112.5","x56.25","x28.13"]){
      await page.locator("#clock-slower").click();
      assert.equal(await badge.textContent(),label);
    }
    for(let step=0;step<10&&await page.locator("#clock-slower").isEnabled();step++){
      await page.locator("#clock-slower").click();
    }
    assert.equal(await badge.textContent(),"x1");
    assert.equal(await page.locator("#clock-slower").isDisabled(),true);
    for(const label of ["x2","x4","x8","x16"]){
      await page.locator("#clock-faster").click();
      assert.equal(await badge.textContent(),label);
      assert.equal(await badge.evaluate(e=>getComputedStyle(e).opacity),"1");
      assert.equal(await page.locator(".clock-rate").getAttribute("aria-label"),`City clock speed: ${label.slice(1)} city seconds per real second`);
      assert.equal(await page.locator("#clock-rate-status").textContent(),`${label.slice(1)} city seconds per real second`);
    }
    await page.screenshot({path:root+`test-results/analog-clock-${ui}.png`});
    const before=Number(await page.locator("#clock").getAttribute("aria-valuenow"));
    await page.locator("#pause").click();
    await page.waitForTimeout(650);
    await page.locator("#pause").click();
    const after=Number(await page.locator("#clock").getAttribute("aria-valuenow"));
    assert(after>before,"Analog time keeps advancing without a digital output");
    for(let step=0;step<12&&await page.locator("#clock-faster").isEnabled();step++){
      await page.locator("#clock-faster").click();
    }
    assert.equal(await badge.textContent(),"x7200");
    assert.equal(await page.locator("#clock-faster").isDisabled(),true);
    await page.waitForTimeout(2500);
    assert.equal(await badge.evaluate(e=>e.classList.contains("is-visible")),false);
    const identity=await page.locator("#newspaper-issue").textContent();
    await page.locator("#clock-daylight").click();
    assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"12:00:00");
    assert.equal(await badge.textContent(),"x7200","Daylight preserves the selected rate");
    assert.match(await page.locator("#status").textContent(),/Daylight/);
    await page.locator("#clock-reset").focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"09:00:00");
    assert.equal(await badge.textContent(),"x1800");
    assert(await page.locator("#clock-faster").isEnabled());
    assert(await page.locator("#clock-slower").isEnabled());
    assert.equal(await page.locator("#pause").textContent(),"Play","Shortcuts preserve pause");
    assert.equal(await page.locator("#newspaper-issue").textContent(),identity,"Shortcuts preserve the city roll");
    await page.locator("#clock").press("End");
    await page.locator("#clock-daylight").focus();
    await page.keyboard.press("Space");
    assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"12:00:00");
    for(const theme of ["light","dark"]){
      await page.selectOption("#ui-theme",theme,{force:true});
      for(const [width,height] of [[1440,1000],[390,844],[320,568],[844,390]]){
        await page.setViewportSize({width,height});
        for(const size of ["300","full"]){
          await page.selectOption("#view-size",size,{force:true});
          await page.locator("#journal").evaluate(e=>e.open=true);
          await page.mouse.move(0,0);
          const layout=await page.evaluate(()=>{
            const box=id=>{const r=document.getElementById(id).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
            return {clock:box("clock"),buttons:["clock-reset","clock-daylight","clock-faster","clock-slower"].map(box)};
          });
          layout.buttons.forEach((button,index)=>{
            assert(button.width>=24&&button.height>=24,JSON.stringify({ui,width,size,layout}));
            assert(button.left>=layout.clock.right-1&&button.top>=layout.clock.top-1&&button.bottom<=layout.clock.bottom+1,JSON.stringify({ui,width,size,layout}));
            if(index)assert(button.top>=layout.buttons[index-1].bottom+1,JSON.stringify(layout));
          });
        }
      }
    }
    await page.setViewportSize({width:1440,height:1000});
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",styles:2,digitalOutput:"removed",speedRange:"x1 to x7200",fractionalRates:"at most two decimals",analogControls:"preserved",errors}));
}finally{await browser.close()}
