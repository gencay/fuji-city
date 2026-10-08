import {chromium} from "playwright";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
const source=readFileSync(process.env.CITY_HTML||fileURLToPath(new URL("../city-flight.html",import.meta.url)),"utf8");
const marker='      if (paused) status.textContent = "Motion is off. Press Play to take flight.";';
const hook=`window.motionQA={
  ready(){return readyWorkers.size===4},
  kind(kind){spawnKinds.push(kind)},
  prepare(s=42,axis=0,lane=0,clear=true){
    seed=s;resetCity(false);paused=true;syncPlayback();soundEnabled=false;
    if(clear){ambientTraffic.clear();spawnedCars.length=0;households.clear()}
    trafficInitialized=true;nextPopulation=Infinity;
    const c=camera(),rules=laneRules(Math.floor((axis?c.x:c.y)/BLOCK),axis,lane);
    const along=Math.floor((axis?c.y:c.x)/BLOCK)*BLOCK+80;
    return {x:axis?rules.across:along,y:axis?along:rules.across};
  },
  spawn(point){
    const p=worldToScreen.transformPoint(point);
    spawnAt(p.x*viewWidth/canvas.width,p.y*viewHeight/canvas.height);
    return this.snapshot();
  },
  snapshot(){
    const v=spawnedCars.at(-1);
    return v?{id:v.id,x:v.x,y:v.y,speed:v.velocity,intent:v.intent,home:!!v.home,
      route:v.route?.length,paused,status:status.textContent,kind:v.kind}:null;
  },
  occupy(point){
    const bx=Math.floor(point.x/BLOCK),by=Math.floor(point.y/BLOCK);
    for(let y=by-2;y<=by+2;y++)for(let x=bx-2;x<=bx+2;x++)
      for(const home of homesForBlock(x,y))households.set(home.id,{...home,owner:"test-resident",arrived:false});
  },
  release(){households.clear();time+=6},
  block(){
    const v=spawnedCars.at(-1),motion=velocity(v,8);
    incidents.push({roadCleared:false,cars:[{...v,id:"test-wreck",x:v.x+motion.x,y:v.y+motion.y,velocity:0}]});
  },
  crossing(){
    const v=spawnedCars.at(-1),instruction=departureRoute(v)[0],node=instruction.node;
    const half=v.kind==="bike"?5.6:4,along=(v.axis?node.y:node.x)*BLOCK+(v.dir>0?0:ROAD)-v.dir*(half+9);
    v[v.axis?"y":"x"]=along;v.route=[instruction];
    crossings.set(nodeKey(node),{bx:node.x,by:node.y,born:time,paths:[]});
    return this.snapshot();
  },
  step(){updateTraffic(1/30);return this.snapshot()},
  pause(){paused=true;syncPlayback()}
};`;
assert.equal(source.split(marker).length,2);
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
  await page.route("http://city.test/**",r=>r.fulfill({contentType:"text/html",body:source.replace(marker,hook+marker)}));
  await page.goto("http://city.test/");
  await page.waitForFunction(()=>motionQA.ready());
  const samples=await page.evaluate(()=>{
    const out=[];
    for(const clear of [true,false])for(let seed=1;seed<=10;seed++)for(let axis=0;axis<2;axis++)for(let lane=0;lane<2;lane++){
      const p=motionQA.prepare(seed,axis,lane,clear),before=motionQA.spawn(p),after=motionQA.step();
      out.push({seed,axis,lane,clear,before,after,moved:Math.hypot(after.x-before.x,after.y-before.y)});
    }
    motionQA.pause();return out;
  });
  for(const sample of samples.filter(s=>s.clear))assert(sample.moved>.1,JSON.stringify(sample));
  const cases=await page.evaluate(()=>{
    const results=[];
    for(const kind of ["car","bike"]){
      const p=motionQA.prepare(42);motionQA.occupy(p);motionQA.kind(kind);
      const before=motionQA.spawn(p),after=motionQA.step();
      motionQA.release();const assigned=motionQA.step();
      results.push({kind,before,after,assigned});
    }
    const p=motionQA.prepare(42);motionQA.spawn(p);motionQA.block();
    const before=motionQA.snapshot(),blocked=motionQA.step();
    const p2=motionQA.prepare(42);motionQA.occupy(p2);motionQA.spawn(p2);
    const atCrossing=motionQA.crossing(),yielded=motionQA.step();
    return {results,before,blocked,atCrossing,yielded};
  });
  for(const c of cases.results){
    assert.equal(c.before.home,false);
    assert(Math.hypot(c.after.x-c.before.x,c.after.y-c.before.y)>.1,"No-home spawns move on the first frame");
    assert.equal(c.assigned.home,true,"Drivers still acquire a home when one becomes available");
  }
  assert.equal(cases.blocked.speed,0,"A stopped wreck cannot be driven through");
  assert.equal(cases.yielded.speed,0,"Searching drivers must yield to a pedestrian crossing");
  assert.equal(cases.yielded.intent,"Yielding to pedestrians");
  assert.equal(cases.before.paused,true,"Click spawning preserves deliberate pause");
  console.log(JSON.stringify({samples:samples.length,clearLaneFirstFrame:"pass",noHomeCarAndBike:"pass",homeAcquisition:"pass",wreckAndCrossingYield:"pass",pausedPlayback:"preserved",congestedStops:samples.filter(s=>s.moved<.001).length},null,2));
} finally { await browser.close(); }
