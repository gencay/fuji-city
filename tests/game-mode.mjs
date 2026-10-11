import assert from "node:assert/strict";
import {launch,openGame,root} from "./game-harness.mjs";

const browser=await launch();
const errors=[];
try{
  // Production visitors: no test hook, Sandbox first, the switch is visible in City options.
  {
    const {page,context}=await openGame(browser,{query:"",errors});
    assert.equal(await page.evaluate(()=>typeof window.__fujiGame),"undefined","The test hook needs ?game-test=1");
    assert.equal(await page.locator("#game-hud").isHidden(),true);
    assert.equal(await page.locator("#game-card").isHidden(),true);
    assert.equal(await page.locator("#game-today").isHidden(),true);
    assert.equal(await page.locator("figure").getAttribute("data-game"),null);
    assert.equal(await page.locator(".primary-options button").first().getAttribute("id"),"game-mode","Play a day sits beside Pause");
    await page.locator(".city-options > summary").click();
    const button=page.locator("#game-mode");
    assert.equal(await button.textContent(),"Play a day");
    assert.equal(await button.getAttribute("aria-pressed"),"false");
    const box=await button.boundingBox();
    assert(box.height>=44,"Play a day is a full-size target");
    assert.equal(await page.evaluate(()=>localStorage.getItem("fuji-city:game-settings:v1")),null,"Sandbox loads never touch game storage");
    await context.close();
  }
  const {page,context,game}=await openGame(browser,{errors});
  // Sandbox stays v15: the camera factor is exactly 1 and signals follow the global cycle.
  let before=await game("freeze");
  assert.equal(before.cameraFactor,1);
  let after=await game("advance",10);
  assert(Math.abs(after.cameraTime-before.cameraTime-10)<1e-6,"Sandbox flight pace is unchanged");
  for(let t=0;t<48;t+=.5){
    const state=await game("advance",.5);
    assert.equal(state.overrides.length,0);
    const phase=state.time%24;
    for(const junction of (await game("junctions")).filter(j=>!j.roundabout)){
      const expected=[phase<6?"green":phase<7?"amber":"red",phase>=8&&phase<14?"green":phase>=14&&phase<15?"amber":"red"];
      junction.states.forEach((value,axis)=>assert(value===expected[axis]||value==="red",JSON.stringify({phase,junction,expected})));
    }
  }
  // The start card stores its choices and starts a run.
  await page.locator(".city-options > summary").click();
  await page.locator("#game-mode").click();
  assert.equal(await page.locator("#game-card").isVisible(),true);
  assert(await page.locator("#game-card-title").evaluate(e=>e===document.activeElement),"The card takes focus");
  assert.equal(await page.locator(".game-presets button").count(),3);
  await page.locator('.game-presets [data-preset="rush"]').click();
  await page.locator('.game-length [data-minutes="6"]').click();
  assert.equal(await page.locator('.game-presets [data-preset="rush"]').getAttribute("aria-pressed"),"true");
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem("fuji-city:game-settings:v1"))),{v:1,preset:"rush",runMinutes:6});
  await page.screenshot({path:root+"test-results/game-start-card.png"});
  await page.locator('.game-length [data-minutes="10"]').focus();
  await page.keyboard.press("Tab");
  assert(await page.locator("#game-start").evaluate(e=>e===document.activeElement));
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(()=>document.activeElement.id),"city","A keyboard start moves focus to the city");
  let state=await game("state");
  assert.equal(state.active,true);
  assert.equal(state.preset,"rush");
  assert.equal(state.clockRate,150);
  assert.equal(await page.locator("#clock").getAttribute("aria-valuetext"),"06:00:00");
  assert.equal(await page.locator("figure").getAttribute("data-game"),"running");
  assert.equal(await page.locator("#game-hud").isVisible(),true);
  assert.equal(await page.locator("#city-poem").evaluate(e=>getComputedStyle(e).visibility),"hidden");
  assert.equal(await page.locator("#game-today").isVisible(),true);
  assert.equal(await page.locator("#game-mode").textContent(),"Back to Sandbox");
  assert.equal(await page.locator("#pause").textContent(),"Pause","Start day plays the city");
  // Leaving asks first; declining keeps the run.
  page.once("dialog",dialog=>{assert.equal(dialog.message(),"Abandon today?");dialog.dismiss();});
  await page.locator("#game-mode").click();
  assert.equal((await game("state")).active,true);
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#game-mode").click();
  state=await game("state");
  assert.equal(state.active,false);
  assert.equal(state.clockRate,1800,"Sandbox clock rate is restored");
  assert.equal(await page.locator("#game-hud").isHidden(),true);
  assert.equal(await page.locator("figure").getAttribute("data-game"),null);
  assert.equal(await page.locator("#city-poem").evaluate(e=>getComputedStyle(e).visibility),"visible");
  // A reload resumes nothing.
  await page.reload();
  await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
  assert.equal((await game("state")).active,false);
  await context.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",hookGated:true,sandboxUnchanged:true,startCard:true,abandonConfirm:true,errors}));
}finally{await browser.close()}
