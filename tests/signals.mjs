import assert from "node:assert/strict";
import {launch,openGame,root} from "./game-harness.mjs";

const browser=await launch();
const errors=[];
try{
  const {page,context,game}=await openGame(browser,{errors,flat:true});
  await game("start","commute",10);await game("freeze");await game("noFares");
  await game("advance",3);
  // One tap: amber 1 s → all-red 0.5 s → green for the hold → 1 s amber → back to the global cycle.
  let junction=null;
  for(let t=0;t<30&&!junction;t+=.5){
    junction=(await game("junctions")).find(j=>!j.roundabout&&!j.crossing&&j.screen.y>150&&j.screen.y<450);
    if(!junction)await game("advance",.5);
  }
  assert(junction,"A signal junction is in view");
  const {x,y}=junction.node;
  const at=await game("tapWorld",x*152+15,y*152+15);
  const override=at.overrides.find(o=>o.key===junction.key);
  assert(override&&!override.pending,JSON.stringify(at.overrides));
  const target=override.greenAxis,other=1-target;
  assert.match(await page.locator("#status").textContent(),/gets green/);
  const samples=[];
  for(let t=0;t<16;t+=.1){
    const state=await game("advance",.1);
    samples.push({t:state.time-override.from,target:await game("signal",x,y,target),other:await game("signal",x,y,other),
      active:state.overrides.some(o=>o.key===junction.key)});
  }
  const hold=override.until-override.from-1.5;
  assert.equal(hold,10,"Commute holds for 10 s");
  for(const sample of samples){
    if(sample.t<1)assert(sample.target!=="green"&&(override.prevAxis===other?["amber","red"].includes(sample.other):sample.other==="red"),JSON.stringify(sample));
    else if(sample.t<1.5)assert(sample.target==="red"&&sample.other==="red",JSON.stringify(sample));
    else if(sample.t<1.5+hold)assert(sample.other==="red"&&["green","red"].includes(sample.target),JSON.stringify(sample));
    else if(sample.t<2.5+hold-.05)assert(sample.other==="red"&&["amber","red"].includes(sample.target),JSON.stringify(sample));
  }
  assert(samples.some(sample=>sample.t>=1.5&&sample.t<1.5+hold&&sample.target==="green"),"The tapped side gets green");
  assert.equal(samples.at(-1).active,false,"The override hands back to the global cycle");
  // A tap during a pedestrian crossing waits for the walkers.
  let crossing=null;
  for(let t=0;t<30&&!crossing;t+=.25){
    crossing=(await game("junctions")).find(j=>j.crossing&&!j.roundabout);
    if(!crossing)await game("advance",.25);
  }
  assert(crossing,"A crossing starts within a cycle");
  let state=await game("tapWorld",crossing.node.x*152+15,crossing.node.y*152+15);
  assert.equal(state.overrides.find(o=>o.key===crossing.key)?.pending,true,"The flip is queued behind the crossing");
  assert.match(await page.locator("#status").textContent(),/Pedestrians first/);
  for(let t=0;t<10;t+=.5)state=await game("advance",.5);
  assert.equal(state.overrides.find(o=>o.key===crossing.key)?.pending??false,false,"The queued flip applies after the crossing");
  // Roundabouts run themselves.
  const roundabout=(await game("roundabouts"))[0];
  if(roundabout){
    const key=`${roundabout.x},${roundabout.y}`;
    state=await game("tapWorld",roundabout.x*152+15,roundabout.y*152+15);
    assert(!state.overrides.some(o=>o.key===key));
    assert.match(await page.locator("#status").textContent(),/self-running/);
  }
  // J finds a junction and Enter flips it, like a pointer tap.
  await game("advance",16);
  await page.locator("#city").focus();
  await page.keyboard.press("j");
  assert.match(await page.locator("#aim-status").textContent(),/^Junction, \d+ waiting north-south, \d+ waiting east-west/);
  const before=(await game("state")).overrides.length;
  await page.keyboard.press("Enter");
  assert.equal((await game("state")).overrides.length,before+1,"Enter flips the focused junction");
  // A real pointer tap on a junction flips it too.
  await game("advance",14);
  const pointer=(await game("junctions")).find(j=>!j.roundabout&&!j.crossing&&j.screen.x>40&&j.screen.x<560&&j.screen.y>40&&j.screen.y<560);
  const count=(await game("state")).overrides.length;
  await page.locator("#city").click({position:{x:pointer.screen.x,y:pointer.screen.y}});
  assert.equal((await game("state")).overrides.length,count+1,"A pointer tap flips the junction under it");
  await page.locator("figure").screenshot({path:root+"test-results/game-signal.png"});
  // 1,000 random junction taps with no spawns never cause a crash.
  state=await game("state");
  const incidents=state.incidents,wrecks=state.stats.wrecks,taxis=state.taxis.length;
  for(let i=0;i<1000;i++){
    if(i%10===0)await game("advance",.3);
    const nodes=await page.evaluate(()=>window.__fujiGame.junctions().map(j=>j.node));
    const node=nodes[Math.floor(Math.random()*nodes.length)];
    if(node)await game("tapWorld",node.x*152+15+Math.random()*10-5,node.y*152+15+Math.random()*10-5);
  }
  state=await game("advance",5);
  assert.equal(state.incidents,incidents,"Signal taps never cause crashes");
  assert.equal(state.stats.wrecks,wrecks);
  assert.equal(state.taxis.length,taxis,"Junction taps never spawn");
  await context.close();
  // Taxi priority: a tap at a junction where your taxi waits gives green to the taxi's side and pays +5 when it crosses.
  let prioritized=false;
  for(const city of ["original","paris","london","tokyo"]){
    if(prioritized)break;
    const {context,game}=await openGame(browser,{city,errors});
    await game("start","sunday",10);await game("freeze");
    for(let t=0;t<240&&!prioritized;t++){
      state=await game("advance",1);
      const fare=state.fares.find(item=>item.state==="waiting");
      if(fare&&state.tokens>0){
        const [details]=(await game("fares")).filter(item=>item.id===fare.id);
        if((await game("preview",details.walk.x,details.walk.y))?.kind==="fare")await game("tapWorld",details.walk.x,details.walk.y);
      }
      const queue=state.queues.find(q=>q.taxiAxis!=null&&!state.overrides.some(o=>o.key===q.key));
      if(!queue)continue;
      const [nx,ny]=queue.key.split(",").map(Number);
      const waved=state.stats.waved;
      const after=await game("tapWorld",nx*152+15,ny*152+15);
      const flip=after.overrides.find(o=>o.key===queue.key);
      if(!flip||flip.pending)continue;
      assert.equal(flip.greenAxis,queue.taxiAxis,"The tap gives green to the taxi's side");
      for(let s=0;s<14;s++){
        const next=await game("advance",1);
        if(next.stats.waved>waved){prioritized=true;break;}
      }
    }
    await context.close();
  }
  assert(prioritized,"A waiting taxi was waved through for +5");
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",sequence:true,pending:true,roundabouts:true,keyboard:true,pointer:true,safeTaps:1000,taxiPriority:true,errors}));
}finally{await browser.close()}
