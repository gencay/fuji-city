import assert from "node:assert/strict";
import {launch,openGame,root} from "./game-harness.mjs";

const browser=await launch();
const errors=[];
try{
  const {page,context,game}=await openGame(browser,{errors});
  // 06:00 at x90 (10 min) and x150 (6 min).
  for(const [minutes,rate] of [[10,90],[6,150]]){
    const state=await game("start","commute",minutes);
    assert.equal(state.clockRate,rate);
    assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"06:00:00");
    assert.equal(await page.locator("#clock-rate").textContent(),`x${rate}`);
    page.once("dialog",dialog=>dialog.accept());
    await page.locator("#game-mode").evaluate(e=>e.click());
  }
  // Every clock and view entry point is locked during a run.
  await game("start","commute",10);
  await game("freeze");
  const time=()=>page.locator("#clock").getAttribute("aria-valuetext");
  await page.locator("#clock-daylight").click();
  assert.equal(await time(),"06:00:00");
  assert.match(await page.locator("#ui-toast").textContent(),/Locked for today/);
  for(const id of ["clock-faster","clock-slower"])await page.locator("#"+id).evaluate(e=>e.click());
  assert.equal((await game("state")).clockRate,90);
  for(const key of ["Home","End","PageUp","ArrowUp"])await page.locator("#clock").press(key);
  assert.equal(await time(),"06:00:00");
  await page.locator("#clock").dispatchEvent("wheel",{deltaY:100});
  assert.equal(await time(),"06:00:00");
  for(const [id,value,locked] of [["view-size","300","600"],["fps","12","auto"],["camera-view","space","close"],["print-format","instax","polaroid"]]){
    await page.selectOption("#"+id,value,{force:true});
    assert.equal(await page.locator("#"+id).inputValue(),locked,id+" is locked");
  }
  assert.equal(await page.locator("#city").evaluate(e=>e.clientWidth),600);
  // Changing city asks first; declining keeps the day and the city.
  const city=await page.locator("#destination").inputValue();
  page.once("dialog",dialog=>{assert.equal(dialog.message(),"Abandon today?");dialog.dismiss();});
  await page.selectOption("#destination","tokyo",{force:true});
  assert.equal(await page.locator("#destination").inputValue(),city);
  assert.equal((await game("state")).active,true);
  for(const id of ["new","reset-view"]){
    page.once("dialog",dialog=>dialog.dismiss());
    await page.locator("#"+id).evaluate(e=>e.click());
    assert.equal((await game("state")).active,true,id+" asks before abandoning");
  }
  // Pace presets scale the camera; Sandbox is exactly 1.
  for(const [preset,pace] of [["sunday",.8],["commute",1],["rush",1.15]]){
    page.once("dialog",dialog=>dialog.accept());
    await page.locator("#game-mode").evaluate(e=>e.click());
    const start=await game("start",preset,10);
    await game("freeze");
    const basePace=Math.max(.6,Math.min(1.2,600/1.44/420));
    const end=await game("advance",10);
    const expected=10*basePace*pace;
    assert(Math.abs(end.cameraTime-start.cameraTime-expected)/expected<.02,JSON.stringify({preset,start:start.cameraTime,end:end.cameraTime,expected}));
  }
  // No hard game over: 20 forced crashes floor the score at 0 and the day still reaches 21:00.
  for(let i=0;i<20;i++){
    const state=await game("forceCrash",true);
    if(state)assert(state.stats.score>=0);
    await game("advance",.5);
  }
  let state=await game("state");
  assert(state.stats.wrecks>=10,"Forced crashes were scored: "+state.stats.wrecks);
  assert.equal(state.stats.score>=0,true);
  assert.equal(state.active,true,"Wrecks never end the day early");
  state=await game("advance",(54000-state.elapsedCity)/state.clockRate+.1);
  assert.equal(state.phase,"dusk");
  assert.match(await time(),/^21:00:/);
  const tapped=await game("tapScreen",300,300);
  assert.equal(tapped.taxis.length,state.taxis.length,"Dusk ignores taps");
  state=await game("advance",5.5);
  assert.equal(state.phase,"card");
  assert.equal(state.active,false);
  assert.equal(state.clockRate,1800);
  assert.equal(state.card,true);
  assert(state.result.score>=0);
  await context.close();
  // Score and HUD: a spawned car reaching home in view adds +15; the HUD fits every print size.
  {
    const {page,context,game}=await openGame(browser,{errors});
    await game("start","commute",10);await game("freeze");
    await game("advance",2);
    const id=await game("spawnLane");
    assert(id,"A lane spawn succeeded");
    const before=(await game("state")).stats;
    const after=(await game("awardHome",id)).stats;
    assert.equal(after.score-before.score,15);
    assert.equal(after.home-before.home,1);
    page.once("dialog",dialog=>dialog.accept());
    await page.locator("#game-mode").evaluate(e=>e.click());
    for(const size of ["100","300","600","1000","full"]){
      await page.selectOption("#view-size",size,{force:true});
      await game("start","commute",10);await game("freeze");
      await game("advance",1);
      const fit=await page.evaluate(()=>{
        const hud=document.getElementById("game-hud"),figure=document.querySelector("figure"),view=document.querySelector(".view-window");
        const box=hud.getBoundingClientRect(),children=[...hud.querySelectorAll("*")].filter(e=>e.getClientRects().length);
        return {overflow:hud.scrollWidth>hud.clientWidth+1||hud.scrollHeight>hud.clientHeight+1,
          inside:children.every(e=>{const r=e.getBoundingClientRect();return r.right<=box.right+1&&r.left>=box.left-1}),
          belowImage:hud.offsetTop>=view.offsetTop+view.offsetHeight-1,figureHeight:figure.offsetHeight,
          score:getComputedStyle(document.querySelector(".game-score")).display};
      });
      assert(!fit.overflow&&fit.inside&&fit.belowImage,JSON.stringify({size,fit}));
      if(size==="600")await page.locator("figure").screenshot({path:root+"test-results/game-hud-600.png"});
      page.once("dialog",dialog=>dialog.accept());
      await page.locator("#game-mode").evaluate(e=>e.click());
    }
    await context.close();
  }
  // Reduced motion starts paused, but Start day plays the city.
  {
    const {page,context,game}=await openGame(browser,{reducedMotion:"reduce",errors});
    assert.equal((await game("state")).paused,true);
    await page.locator(".city-options > summary").click();
    await page.locator("#game-mode").click();
    await page.locator("#game-start").click();
    assert.equal((await game("state")).paused,false);
    await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",dayRates:[90,150],locks:true,presets:3,crashStormFloor:true,dusk:true,hudSizes:5,reducedMotionPlays:true,errors}));
}finally{await browser.close()}
