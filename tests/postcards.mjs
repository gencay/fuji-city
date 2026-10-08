import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const base=process.env.SITE_URL||"http://city.test/";
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const expected={
  original:["Hello","en"],paris:["Bonjour","fr"],munich:["Hallo","de"],istanbul:["Merhaba","tr"],
  seattle:["Hello","en"],newyork:["Hello","en"],london:["Hello","en"],ibiza:["Hola","ca"],
  tokyo:["こんにちは","ja"],mexicocity:["Hola","es"],singapore:["Hello","en"],barcelona:["Hola","ca"],
  amsterdam:["Hoi","nl"],lisbon:["Olá","pt"],kyoto:["こんにちは","ja"],bruges:["Hallo","nl"],
  dublin:["Dia dhuit","ga"],dubrovnik:["Bok","hr"],antalya:["Merhaba","tr"]
};
const errors=[];
const culturalMarkers={
  original:/paper|town that never was/i,paris:/Seine|zinc/i,munich:/Isar|Frauenkirche/i,
  istanbul:/ferry/i,seattle:/Elliott Bay|ferry/i,newyork:/stoop|subway/i,london:/Thames|trains/i,
  ibiza:/Dalt Vila/i,tokyo:/Sumida|station melodies/i,mexicocity:/Alameda|Bellas Artes/i,
  singapore:/hawker|shophouse/i,barcelona:/tiles|Eixample/i,amsterdam:/bicycle|canal/i,
  lisbon:/Alfama|fado/i,kyoto:/Kamo|machiya/i,bruges:/carillon|Reie/i,
  dublin:/Ha'penny|fiddles/i,dubrovnik:/Stradun|harbor/i,antalya:/Kaleici|Yivli/i
};
mkdirSync(root+"test-results",{recursive:true});
try{
  const page=await browser.newPage({reducedMotion:"reduce",viewport:{width:1440,height:1100}});
  await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
  page.on("pageerror",e=>errors.push(e.message));
  await page.route("https://fonts.googleapis.com/**",route=>route.abort());
  if(!process.env.SITE_URL)await page.route(base+"**",route=>route.fulfill({
    contentType:"text/html",body:readFileSync(process.env.CITY_HTML||root+"city-flight.html","utf8")
  }));
  await page.goto(base);
  await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
  const select=(id,value)=>page.selectOption("#"+id,value,{force:true});
  const click=id=>page.locator("#"+id).evaluate(e=>e.click());
  const text=()=>page.locator("#city-poem").textContent();
  const geometry=async()=>{
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const result=await page.evaluate(()=>{
      const figure=document.querySelector("figure"),caption=document.getElementById("city-poem"),view=document.querySelector(".view-window");
      const verse=[...caption.children].find(e=>getComputedStyle(e).display!=="none");
      const board=document.querySelector(".station-board"),greeting=document.getElementById("city-greeting");
      const figureHeight=figure.offsetHeight;
      caption.style.display="none";
      const uncaptionedHeight=figure.offsetHeight;
      caption.style.removeProperty("display");
      const swatch=document.createElement("canvas").getContext("2d",{willReadFrequently:true});
      const luminance=value=>{
        if(!CSS.supports("color",value))throw Error("Expected a color, got "+value);
        swatch.fillStyle=value;swatch.fillRect(0,0,1,1);
        const rgb=Array.from(swatch.getImageData(0,0,1,1).data).slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
        return rgb.reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
      };
      const ratio=(fg,bg)=>{
        const a=luminance(fg),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      };
      const letter=board.firstElementChild;
      const boardRect=board.getBoundingClientRect(),identityRect=document.querySelector(".city-identity").getBoundingClientRect();
      return {
        figureHeight,uncaptionedHeight,captionTop:caption.offsetTop,imageBottom:view.offsetTop+view.offsetHeight,
        captionBottom:caption.offsetTop+caption.offsetHeight,figureInner:figure.clientHeight,
        verseHeight:verse.offsetHeight,captionHeight:caption.clientHeight,
        lineWidths:[...verse.children].map(e=>e.scrollWidth),captionWidth:caption.clientWidth,
        boardWidth:board.scrollWidth,greetingWidth:greeting.clientWidth,
        boardCenterOffset:Math.abs(boardRect.x+boardRect.width/2-identityRect.x-identityRect.width/2),
        boardBottomOffset:Math.abs(boardRect.bottom-document.getElementById("clock").getBoundingClientRect().bottom),
        boardClearance:boardRect.top-document.querySelector(".city-identity h1").getBoundingClientRect().bottom,
        boardFont:parseFloat(getComputedStyle(board).fontSize),boardHeight:boardRect.height,
        boardColors:[getComputedStyle(greeting).color,getComputedStyle(letter).backgroundColor,getComputedStyle(board).backgroundColor],
        poemContrast:ratio(getComputedStyle(caption).color,getComputedStyle(figure).backgroundColor),
        greetingContrast:ratio(getComputedStyle(greeting).color,getComputedStyle(letter).backgroundColor),
        breweryContrast:document.getElementById("clock").dataset.dial!=="brewery"?null:Math.min(
          ratio(getComputedStyle(document.querySelector("#clock-hour .clock-hand")).stroke,getComputedStyle(document.querySelector(".clock-face")).fill),
          ratio(getComputedStyle(document.querySelector("#clock-numerals text")).fill,getComputedStyle(document.querySelector(".clock-face")).fill)),
        variant:verse.className,overflow:document.documentElement.scrollWidth>innerWidth+1,
        signatureAlignment:getComputedStyle(verse.querySelector(".poem-signature")).textAlign
      };
    });
    assert.equal(result.figureHeight,result.uncaptionedHeight,"Caption must preserve print proportions");
    assert(Math.abs(result.captionTop-result.imageBottom)<=1,JSON.stringify(result));
    assert(result.captionBottom<=result.figureInner+1,JSON.stringify(result));
    assert(result.verseHeight<=result.captionHeight+1,JSON.stringify(result));
    assert(result.lineWidths.every(width=>width<=result.captionWidth+1),JSON.stringify(result));
    assert(result.boardWidth<=result.greetingWidth+1,JSON.stringify(result));
    assert(result.boardCenterOffset<=1&&result.boardBottomOffset<=1&&result.boardClearance>=15,JSON.stringify(result));
    assert(result.boardFont>=9&&result.boardHeight>=32,JSON.stringify(result));
    if(result.greetingWidth>=200)assert(result.boardFont>=16,JSON.stringify(result));
    assert.deepEqual(result.boardColors,["rgb(255, 255, 255)","rgb(36, 36, 36)","rgb(16, 16, 16)"]);
    assert(result.poemContrast>=4.5&&result.greetingContrast>=7,JSON.stringify(result));
    if(result.breweryContrast!==null)assert(result.breweryContrast>=4.5,JSON.stringify(result));
    assert(!result.overflow,JSON.stringify(result));
    assert.equal(result.signatureAlignment,"right");
    assert.equal(await page.locator("#city-newspaper,#newspaper-columns").count(),0,"No wallpaper in any print or full-window layout");
    const background=await page.evaluate(()=>({
      image:getComputedStyle(document.body).backgroundImage,
      size:getComputedStyle(document.body).backgroundSize,
      ui:document.documentElement.dataset.ui
    }));
    if(background.ui==="gamified"){
      assert.match(background.image,/^radial-gradient\(/,"Keep original dotted paper");
      assert.equal(background.size,"13px 13px");
    }else assert.equal(background.image,"none","Keep original plain film background");
    return result;
  };
  for(const ui of ["film","gamified"]){
    await select("ui-style",ui);
    await select("view-size","600");
    for(const [city,[hello,lang]] of Object.entries(expected)){
      await select("destination",city);
      assert.equal(await page.locator("#city-greeting .sr-only").textContent(),hello);
      assert.equal(await page.locator("#city-greeting").getAttribute("lang"),lang);
      assert.equal(await page.locator(".station-new").allTextContents().then(a=>a.join("")),hello);
      assert.equal(await page.locator("#city-poem").getAttribute("data-city"),city);
      assert.equal(await page.locator("#city-poem .poem-full .poem-line").count(),2);
      const poet=await page.locator("#city-poem").getAttribute("data-poet");
      assert(poet?.includes(" "),"Each city has an absurd honorary poet title");
      assert.equal(await page.locator(".poem-full .poem-signature").textContent(),`— ${poet}`);
      assert.match(await page.locator(".poem-short .poem-signature").textContent(),/^— .+/);
      assert.equal(await page.locator("#newspaper-readable").getAttribute("data-city"),city);
      assert.match(await page.locator(".newspaper-reader").textContent(),/ENTIRELY MADE UP/);
      assert.equal(await page.locator("#newspaper-readable article").count(),6);
      assert.equal(await page.locator("#city-newspaper,#newspaper-columns").count(),0,"No newspaper wallpaper");
      const headlines=await page.locator("#newspaper-readable h3").allTextContents();
      assert(headlines.every(line=>line.length>20));
      await select("view-size","300");
      await geometry();
      await select("view-size","600");
      await geometry();
      const before=await text();
      await click("new");
      assert.notEqual(await text(),before,"New roll chooses another verse");
      const rolled=await text();
      await click("reset-view");
      assert.equal(await text(),rolled,"Revisit keeps the postcard");
      await page.locator("#clock").press("Home");await page.locator("#clock").press("PageUp");await click("new");
      const dayLine=await page.locator(".poem-full .poem-line").nth(1).textContent();
      assert.match(dayLine,culturalMarkers[city]);
      await page.locator("#clock").press("End");await click("new");
      const nightLine=await page.locator(".poem-full .poem-line").nth(1).textContent();
      assert.match(nightLine,culturalMarkers[city]);
      assert.notEqual(dayLine,nightLine,"Local imagery follows the roll's light");
      assert.equal(await page.locator("#city-poem").getAttribute("data-poet"),poet);
    }
    await select("destination","dublin");
    for(const theme of ["light","dark"]){
      await select("ui-theme",theme);
      for(let size=100;size<=1000;size+=100){
        await select("view-size",String(size));
        const measured=await geometry();
        assert.equal(measured.variant.includes("poem-short"),measured.captionWidth<=260);
        if(size===100||size===600)await page.screenshot({path:root+`test-results/postcard-${ui}-${theme}-${size}.png`});
      }
      for(const width of [320,390,850]){
        await page.setViewportSize({width,height:844});
        await select("view-size","300");
        await geometry();
      }
      for(const [width,height] of [[1440,900],[390,844],[844,390]]){
        await page.setViewportSize({width,height});
        await select("view-size","full");
        await geometry();
        await page.keyboard.press("Escape");
      }
      await page.setViewportSize({width:1440,height:1100});
    }
  }
  await select("view-size","100");
  const beforeShort=await page.locator(".poem-short").textContent();
  await click("new");
  assert.notEqual(await page.locator(".poem-short").textContent(),beforeShort);
  await page.locator("#clock").press("Home");await page.locator("#clock").press("PageUp");await click("new");
  assert.equal(await page.locator("#city-poem").getAttribute("data-mood"),"day");
  await page.locator("#clock").press("End");await click("new");
  assert.equal(await page.locator("#city-poem").getAttribute("data-mood"),"night");
  const stable=await text();
  await select("view-size","600");await select("ui-style","film");await select("ui-theme","light");
  assert.equal(await text(),stable,"Style and print size keep the postcard");
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.waitForFunction(()=>!document.getElementById("ui-motion").disabled);
  if(await page.locator("#ui-motion").getAttribute("aria-pressed")!=="true")await click("ui-motion");
  await page.waitForFunction(()=>document.documentElement.dataset.motion==="on");
  for(const city of ["seattle","newyork","tokyo","paris"]){
    await select("destination",city);
    assert(await page.locator(".station-board").evaluate(e=>e.classList.contains("is-changing")));
    assert(await page.locator("#city-poem").evaluate(e=>e.getAnimations({subtree:true}).length>0));
  }
  await page.waitForTimeout(2200);
  assert.equal(await page.locator("#city-greeting .sr-only").textContent(),"Bonjour");
  assert.equal(await page.locator(".station-board").evaluate(e=>e.classList.contains("is-changing")),false);
  assert.equal(await page.locator("#city-poem").evaluate(e=>e.classList.contains("is-writing")),false);
  assert.equal(await page.locator("#city-poem").evaluate(e=>e.getAnimations({subtree:true}).some(a=>a.playState==="running")),false);
  await select("destination","tokyo");await click("ui-motion");
  assert.equal(await page.locator(".is-changing,.is-writing").count(),0);
  await select("destination","lisbon");
  assert.equal(await page.locator(".is-changing,.is-writing").count(),0);
  await click("ui-motion");await select("destination","kyoto");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.waitForFunction(()=>document.documentElement.dataset.motion==="off");
  assert.equal(await page.locator(".is-changing,.is-writing").count(),0);
  assert.equal(await page.locator("#city-greeting .sr-only").textContent(),"こんにちは");
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",cities:19,styles:2,themes:2,printSizes:"100-1000",mobileAndFullWindow:true,offlineFonts:true,motionAndReducedMotion:true,errors}));
}finally{await browser.close()}
