import assert from "node:assert/strict";
import {launch,openGame,root} from "./game-harness.mjs";

const browser=await launch();
const errors=[];
async function waitForFare(game,seconds=60){
  for(let t=0;t<seconds;t+=1){
    const fare=(await game("fares")).find(item=>item.state==="waiting");
    if(fare)return fare;
    await game("advance",1);
  }
  return null;
}
try{
  // Steady, valid fares in five cities, including left-hand London and Tokyo.
  for(const city of ["original","paris","london","lisbon","tokyo"]){
    const {context,game}=await openGame(browser,{city,errors});
    await game("start","commute",10);await game("freeze");
    const seen=new Map();
    for(let t=0;t<120;t+=2){
      await game("advance",2);
      for(const fare of await game("fares"))if(!seen.has(fare.id)){
        assert.equal(fare.water,false,`${city} fare ${fare.id} is on dry land`);
        assert.equal(fare.routable,true,`${city} fare ${fare.id} is routable`);
        assert(fare.screen.y<=600*.6,`${city} fare ${fare.id} appears near the top`);
        seen.set(fare.id,fare);
      }
    }
    const state=await game("state");
    assert(state.stats.offered>=3,`${city} offered ${state.stats.offered} fares in two minutes`);
    assert.equal(state.stats.offered,seen.size);
    await context.close();
  }
  const {page,context,game}=await openGame(browser,{errors,flat:true});
  await game("start","commute",10);await game("freeze");
  // A real pointer tap near the passenger sends a gold taxi and spends a token.
  let fare=await waitForFare(game);
  assert(fare,"A passenger waves within a minute");
  const preview=await game("preview",fare.walk.x,fare.walk.y);
  assert(["fare","fare-crowded"].includes(preview.kind),"The cursor ring marks a passenger and whether their curb is clear");
  let before=await game("state");
  await page.locator("#city").click({position:{x:fare.screen.x,y:fare.screen.y+4}});
  let state=await game("state");
  assert.equal(state.taxis.length,before.taxis.length+1,"A tap near the flag sends a taxi");
  assert.equal(state.tokens,before.tokens-1);
  assert.equal(state.fares.find(item=>item.id===fare.id).state,"riding");
  assert.match(await page.locator("#status").textContent(),/heading for/);
  await page.locator("figure").screenshot({path:root+"test-results/game-taxi.png"});
  // Delivery pays at least 40 points and 5 coins.
  before=state;
  state=await game("deliver",fare.id);
  assert(state.stats.score-before.stats.score>=40,JSON.stringify(state.stats));
  assert.equal(state.stats.fares,1);
  assert.equal(state.stats.coins,5);
  assert.equal(state.streak,1);
  // A taxi that cannot arrive fails for −10 once its landmark scrolls away.
  fare=await waitForFare(game);
  await game("tapWorld",fare.walk.x,fare.walk.y);
  assert(await game("stallTaxi",fare.id));
  let failed=null,last=await game("state");
  for(let t=0;t<120&&!failed;t+=.5){
    const next=await game("advance",.5);
    const item=next.fares.find(entry=>entry.id===fare.id);
    if(!item||item.state==="failed"){failed={before:last,after:next};break;}
    last=next;
  }
  assert(failed,"The stalled taxi failed its fare");
  assert.equal(failed.after.stats.failed,failed.before.stats.failed+1);
  assert(failed.after.stats.score<=failed.before.stats.score-9,JSON.stringify(failed));
  assert.equal(failed.after.streak,0);
  // Missed passengers cost nothing but the streak.
  fare=await waitForFare(game);
  last=await game("state");
  for(let t=0;t<120;t+=.5){
    const next=await game("advance",.5);
    const item=next.fares.find(entry=>entry.id===fare.id);
    if(!item||item.state==="missed"){
      assert.equal(next.stats.missed,last.stats.missed+1);
      assert(next.stats.score>=last.stats.score-3,"Missing a passenger is not penalized");
      break;
    }
    last=next;
  }
  // Tokens: three in the bank, spawns cost one, regen per preset, capped at three.
  await game("advance",30);
  assert.equal((await game("state")).tokens,3);
  await game("noFares");
  for(let i=0;i<3;i++)assert(await game("spawnLane"),"Spawn "+i);
  assert.equal((await game("state")).tokens,0);
  assert.equal(await game("spawnLane"),null,"No spawns without tokens");
  assert.match(await page.locator("#status").textContent(),/No taxis free/);
  state=await game("advance",6.1);
  assert.equal(state.tokens,1,"Commute regenerates one token every 6 s");
  state=await game("advance",30);
  assert.equal(state.tokens,3);
  // Crash-cause flash: both vehicles outlined, the cause in #status, then it clears.
  state=await game("forceCrash",true);
  assert.equal(state.flash.cars.length,2);
  assert.match(state.flash.cause,/crowded gap/);
  assert.match(await page.locator("#status").textContent(),/^Crash: (car|motorcycle) dropped into a crowded gap/);
  await page.locator("figure").screenshot({path:root+"test-results/game-crash-flash.png"});
  assert.notEqual((await game("advance",.5)).flash,null);
  assert.equal((await game("advance",.2)).flash,null,"The flash lasts 0.6 s");
  state=await game("forceCrash",false);
  assert.match(state.flash.cause,/met cross traffic \d+ s after you added it/);
  await context.close();
  // Reduced motion: a static flash for 1.5 s; keyboard F and T play the taxi loop.
  {
    const {page,context,game}=await openGame(browser,{reducedMotion:"reduce",errors});
    await game("start","commute",10);await game("freeze");
    let state=await game("forceCrash",true);
    assert(Math.abs(state.flash.until-state.time-1.5)<1e-6);
    assert.notEqual((await game("advance",1.2)).flash,null);
    assert.equal((await game("advance",.5)).flash,null);
    const fare=await waitForFare(game);
    await page.locator("#city").focus();
    await page.keyboard.press("f");
    assert.match(await page.locator("#aim-status").textContent(),new RegExp(`Passenger for ${fare.landmark.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}, \\d+ s left`));
    const before=await game("state");
    await page.keyboard.press("t");
    state=await game("state");
    assert.equal(state.taxis.length,before.taxis.length+1,"T sends a taxi");
    await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",cities:5,pointerTaxi:true,delivery:true,deadlineFail:true,missedFree:true,tokens:true,crashFlash:true,keyboard:true,errors}));
}finally{await browser.close()}
