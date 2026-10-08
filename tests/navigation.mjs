import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
import "../scripts/build-site.mjs";

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
  if(!process.env.SITE_URL)await page.route(base+"**",route=>{
    const name=new URL(route.request().url()).pathname.slice(1)||"index.html";
    return route.fulfill({contentType:"text/html",body:readFileSync(root+"_site/"+name,"utf8")});
  });
  const go=async suffix=>page.goto(base+suffix,{waitUntil:"domcontentloaded"});
  const openPicker=async()=>{
    const notes=page.locator(".city-notes");
    if(await notes.count()&&!await notes.evaluate(e=>e.open)){
      await notes.locator(":scope > summary").click();
    }
    await page.locator(".version-picker > summary").click();
  };
  for(const ui of ["film","gamified"]){
    for(const width of [1440,390]){
      await page.setViewportSize({width,height:900});
      await go("");
      await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
      await page.selectOption("#ui-style",ui,{force:true});
      assert.equal(await page.locator(".city-heading .version-picker").count(),0);
      assert.equal(await page.locator(".city-extras .version-picker").count(),1);
      assert.equal(await page.locator(".version-picker > summary").isVisible(),false);
      await openPicker();
      assert.equal(await page.locator(".version-list a").count(),16);
      const panel=await page.locator(".version-panel").boundingBox();
      assert(panel.x>=0&&panel.x+panel.width<=width+1,"Picker fits the viewport");
      await page.keyboard.press("Escape");
      assert.equal(await page.locator(".version-picker").evaluate(e=>e.open),false);
      assert.equal(await page.locator(".city-notes").evaluate(e=>e.open),true);
      assert(await page.locator(".version-picker > summary").evaluate(e=>e===document.activeElement));
      await page.selectOption("#view-size","full",{force:true});
      await page.locator(".version-picker > summary").click();
      const fullPanel=await page.locator(".version-panel").boundingBox();
      const sidebar=await page.locator(".city-journal").boundingBox();
      assert(fullPanel.x>=sidebar.x&&fullPanel.x+fullPanel.width<=sidebar.x+sidebar.width+1,"Full-window picker fits its sidebar");
      await page.screenshot({path:root+`test-results/notebook-versions-${ui}-${width}.png`});
      await page.locator('.version-list a[href="versions/city-flight-v14.html"]').click();
      await page.waitForURL(base+"versions/city-flight-v14.html");
    }
  }
  const checkPager=async version=>{
    assert.equal(await page.locator(".version-position strong").textContent(),`v${version}`);
    assert.equal(await page.locator("html").getAttribute("data-theme"),"dark");
    assert.equal(await page.locator(".version-pager").evaluate(e=>e.parentElement===document.body),true);
    const next=page.locator(".version-pager a[rel=next]");
    const expected=version===14?"city-flight.html":`versions/city-flight-v${version+1}.html`;
    assert.equal(await next.evaluate(e=>e.href),base+expected+"?scoutTheme=dark");
    for(const step of await page.locator(".version-step").all()){
      const box=await step.boundingBox();
      const width=page.viewportSize().width;
      assert(box.width>=64&&box.height>=64&&box.y>=0&&box.y+box.height<=88&&box.x>=0&&box.x+box.width<=width,"Large chevrons stay at viewport corners");
    }
    if(version===0){
      assert.equal(await page.locator(".version-step[aria-disabled=true]").count(),1);
      assert.equal(await page.locator(".version-pager a[rel=prev]").count(),0);
    }else{
      assert.equal(await page.locator(".version-pager a[rel=prev]").evaluate(e=>e.href),base+`versions/city-flight-v${version-1}.html?scoutTheme=dark`);
    }
  };
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    await go("city-flight-v0.html?scoutTheme=dark#archive");
    await page.waitForURL(base+"versions/city-flight-v0.html?scoutTheme=dark#archive");
    for(let version=0;version<15;version++){
      await checkPager(version);
      if([0,7,14].includes(version))await page.screenshot({path:root+`test-results/archive-v${version}-${width}.png`});
      await page.locator(".version-pager a[rel=next]").click();
      await page.waitForURL(base+(version===14?"city-flight.html":`versions/city-flight-v${version+1}.html`)+"?scoutTheme=dark");
    }
    assert.equal(await page.locator(".version-pager").count(),0);
  }
  await page.setViewportSize({width:1440,height:1000});
  await go("versions/city-flight-v14.html?scoutTheme=dark");
  for(let version=14;version>0;version--){
    const previous=page.locator(".version-pager a[rel=prev]");
    await previous.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(base+`versions/city-flight-v${version-1}.html?scoutTheme=dark`);
    await checkPager(version-1);
  }
  for(const version of [11,14]){
    for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:844,height:550}]){
      await page.setViewportSize(viewport);
      await go(`versions/city-flight-v${version}.html?scoutTheme=light`);
      await page.selectOption("#view-size","full",{force:true});
      const main=await page.locator("main").boundingBox();
      assert(main.y>=88&&main.y+main.height<=viewport.height+1,"Archive full-window city leaves space for navigation");
      assert(main.height>viewport.height*.2,"Archive city keeps useful height in stacked layouts");
      const sidebar=await page.locator(".city-journal").boundingBox();
      assert(sidebar.y>=88&&sidebar.y+sidebar.height<=viewport.height+1,"Archive sidebar remains within the available viewport");
      const next=page.locator(".version-pager a[rel=next]");
      assert(await next.evaluate(e=>{
        const r=e.getBoundingClientRect();
        return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
      }),"Full-window chevrons remain clickable");
      await openPicker();
      await page.locator('.version-list a[href$="/city-flight.html?scoutTheme=light"]').click();
      await page.waitForURL(base+"city-flight.html?scoutTheme=light");
    }
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",pickerStyles:2,archives:15,widths:[1440,390],reverseKeyboardSteps:14,fullWindowCases:8,errors}));
}finally{await browser.close()}
