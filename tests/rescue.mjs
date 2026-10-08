import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(root+"city-flight.html","utf8");
const marker='      if (paused) status.textContent = "Motion is off. Press Play to take flight.";';
const hook=`
const rescueEvents=[];
const recordRescueEvent=recordCityEvent;
recordCityEvent=(kind,text,count=1)=>{rescueEvents.push({kind,count});recordRescueEvent(kind,text,count)};
window.rescueQA={
  ready(){return readyWorkers.size===4},
  reset(crews=2){
    cityId="original";seed=42;resetCity(false);paused=true;syncPlayback();soundEnabled=false;
    ambientTraffic.clear();spawnedCars.length=0;households.clear();helicopters.clear();
    trafficInitialized=true;nextPopulation=Infinity;rescueEvents.length=0;
    for(let i=0;i<crews;i++)helicopters.set("crew:"+i,{id:"crew:"+i,block:"0,0",
      x:70,y:laneRules(i,0,0).across,angle:0,speed:i===0?320:30,state:"parked"});
  },
  add(road,count=2){
    const rules=laneRules(road,0,0);
    for(let i=0;i<count;i++)spawnedCars.push({...rules,id:"spawn:"+nextCarId++,kind:"car",long:false,
      paint:colors.red,x:80+i*.2,y:rules.across,angle:0,velocity:0,speed:0,personality:.5});
  },
  detect(){detectCollision([...spawnedCars]);return this.snapshot()},
  tick(dt=.05){time+=dt;advanceRescue(dt);return this.snapshot()},
  snapshot(){
    return {jobs:incidents.map(r=>({cars:r.cars.map(v=>v.id),heli:r.heli?.id||null,stage:r.stage,
      cleared:r.roadCleared,x:r.heli?.x,y:r.heli?.y})),vehicles:spawnedCars.length,
      recovered:recoveredCount,gallery:recoveredCars.length,receiving:recovery.classList.contains("is-receiving"),
      events:rescueEvents.filter(e=>["flights","collided","recovered"].includes(e.kind))};
  },
  blocked(){return incidents.filter(r=>!r.roadCleared).map(r=>{
    const v=r.cars[0];return edgeBlocked({x:v.dir>0?0:1,y:v.road},v.dir>0?0:2);
  })},
  handoffGeometry(){
    const expected={x:-500,y:800},heli={screen:pagePoint(expected.x,expected.y)};
    releaseHelicopter(heli);
    return Math.hypot(heli.x-expected.x,heli.y-expected.y);
  },
  render(){
    let flying=0;
    const original=helicopter;
    helicopter=(g,x,y,angle,active)=>{if(active)flying++;return original(g,x,y,angle,active)};
    try{draw()}finally{helicopter=original}
    return flying;
  },
  finish(){
    let steps=0;
    while(incidents.length&&steps++<12000){
      time+=.05;advanceRescue(.05);
      const assigned=incidents.filter(r=>r.heli).map(r=>r.heli.id);
      if(new Set(assigned).size!==assigned.length)throw Error("Helicopter double-booked");
    }
    drawAirspace();return this.snapshot();
  },
  cancelledQueue(){
    const waiting=incidents.find(r=>r.stage==="waiting");
    waiting.cars.length=0;
    advanceRescue(.05);return this.snapshot();
  }
};`;
assert.equal(source.split(marker).length,2);
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const errors=[];
mkdirSync(root+"test-results",{recursive:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
  await page.route("http://city.test/**",r=>r.fulfill({contentType:"text/html",body:source.replace(marker,hook+marker)}));
  await page.goto("http://city.test/");
  await page.waitForFunction(()=>rescueQA.ready());
  for(const ui of ["film","gamified"]){
    await page.selectOption("#ui-style",ui,{force:true});
    assert(await page.evaluate(()=>rescueQA.handoffGeometry())<.001,"Page-to-city handoff does not teleport the helicopter");
    await page.evaluate(()=>{rescueQA.reset();rescueQA.add(0);rescueQA.add(1)});
    let state=await page.evaluate(()=>rescueQA.detect());
    assert.equal(state.jobs.length,2,"Independent crashes are both detected in one pass");
    assert.deepEqual(state.jobs.map(j=>j.heli),["crew:0","crew:1"],"Each crash gets its nearest available helicopter");
    assert.equal(await page.evaluate(()=>rescueQA.render()),2,"Both helicopters are rendered");
    await page.screenshot({path:root+`test-results/concurrent-rescue-${ui}.png`});
    state=await page.evaluate(()=>{rescueQA.add(2);return rescueQA.detect()});
    assert.equal(state.jobs.length,3,"New collision is detected while other crews are busy");
    assert.equal(state.jobs[2].stage,"waiting");
    assert.equal(state.jobs[2].heli,null);
    assert.deepEqual(await page.evaluate(()=>rescueQA.blocked()),[true,true,true],"Every uncleared crash blocks its road");
    const frozen=await page.evaluate(()=>rescueQA.snapshot());
    assert.deepEqual(await page.evaluate(()=>rescueQA.tick(0)),frozen,"No recovery motion at zero elapsed time");
    const queuedIds=state.jobs[2].cars;
    const reassigned=await page.evaluate(ids=>{
      for(let i=0;i<1000;i++){
        const state=rescueQA.tick(),job=state.jobs.find(r=>r.cars[0]===ids[0]);
        if(job?.heli)return {state,job};
      }
      throw Error("Waiting crash did not get an available crew");
    },queuedIds);
    assert.equal(reassigned.job.heli,"crew:0","A delivered crew immediately takes the queued job");
    assert(reassigned.state.jobs.some(j=>j.heli==="crew:1"&&j.stage!=="exit"),"Other crews do not need to finish first");
    assert.equal(reassigned.state.recovered,2);
    assert(reassigned.state.receiving,"The Junkyard remains receiving while other rescues are active");
    assert.equal(await page.evaluate(()=>rescueQA.render()),2);
    state=await page.evaluate(()=>rescueQA.finish());
    assert.equal(state.jobs.length,0);
    assert.equal(state.recovered,6);
    assert.equal(state.gallery,6);
    assert.equal(state.receiving,false);
    assert.equal(state.events.filter(e=>e.kind==="flights").length,3,"One flight event per mission");
    assert.equal(state.events.filter(e=>e.kind==="recovered").reduce((n,e)=>n+e.count,0),6);
  }
  await page.evaluate(()=>{rescueQA.reset(0);rescueQA.add(0);rescueQA.add(1)});
  let state=await page.evaluate(()=>rescueQA.detect());
  assert.deepEqual(state.jobs.map(j=>j.heli),["dispatch",null],"Empty rooftop fleet uses one backup, not unlimited replacement helicopters");
  state=await page.evaluate(()=>rescueQA.finish());
  assert.equal(state.jobs.length,0);
  assert.equal(state.recovered,4);
  await page.evaluate(()=>{rescueQA.reset(1);rescueQA.add(0,3)});
  state=await page.evaluate(()=>rescueQA.detect());
  assert.equal(state.jobs.length,1);
  assert.equal(state.vehicles,1,"A vehicle cannot belong to two simultaneous crashes");
  await page.evaluate(()=>{rescueQA.add(1);rescueQA.detect()});
  state=await page.evaluate(()=>rescueQA.cancelledQueue());
  assert.equal(state.jobs.length,1,"A queued incident without surviving cargo is removed");
  state=await page.evaluate(()=>rescueQA.finish());
  assert.equal(state.recovered,2);
  await page.evaluate(()=>{rescueQA.reset(2);for(let i=0;i<6;i++)rescueQA.add(i);rescueQA.detect()});
  await page.locator("#collisions").evaluate(e=>e.click());
  state=await page.evaluate(()=>rescueQA.finish());
  assert.equal(state.jobs.length,0,"Turning off new crashes does not strand queued rescues");
  assert.equal(state.recovered,12);
  assert.equal(state.gallery,8,"Gallery remains bounded, while total recoveries remain exact");
  await page.evaluate(()=>{rescueQA.reset();rescueQA.add(0);rescueQA.detect()});
  await page.selectOption("#destination","dublin",{force:true});
  state=await page.evaluate(()=>rescueQA.snapshot());
  assert.equal(state.jobs.length,0,"City changes cancel all old-roll rescue state");
  assert.equal(state.recovered,0);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",concurrentDispatch:true,nearestAvailable:true,queuedReuse:true,allRoadsBlocked:true,multiRescueRendering:true,exactDeliveryCounts:true,fallbackFleet:true,reset:true,errors}));
}finally{await browser.close()}
