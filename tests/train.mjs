import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(root+"city-flight.html","utf8");
const marker='      if (paused) status.textContent = "Motion is off. Press Play to take flight.";';
const hook=`
const trainSounds=[],trainEvents=[],originalTrainSound=playSound,originalTrainEvent=recordCityEvent;
playSound=kind=>{if(["whistle","chuff","sneeze"].includes(kind))trainSounds.push(kind);return originalTrainSound(kind)};
recordCityEvent=(kind,text,count=1)=>{
  if(["farmhand-woke","compacted","train-arrival","train-collected"].includes(kind))trainEvents.push({kind,text,count});
  originalTrainEvent(kind,text,count);
};
window.trainQA={
  ready(){return readyWorkers.size===4&&soundUrls.whistle&&soundUrls.chuff&&soundUrls.sneeze},
  freeze(){paused=true;cancelAnimationFrame(request);request=null},
  motionSettled(){return !paused&&!reducedMotion.matches},
  reset(){this.freeze();resetCity(false);soundEnabled=false;trainSounds.length=trainEvents.length=0;
    incidents.length=0;recoveredCars.length=0;helicopters.clear();syncJunkyard();drawAirspace()},
  deliver(count=2){
    for(let i=0;i<count;i++)recoveredCars.push({...makeJunkyardCar({
      kind:i%3===1?"bike":"car",long:i%3===2,paint:i%2?"gold":"red"}),deliveredAt:junkyardTime});
    recoveredCount+=count;syncJunkyard();
  },
  snapshot(){return {wait:junkyardReadyTime,stage:junkyardTrain?.stage||null,elapsed:junkyardTrain?.elapsed,
    batch:junkyardTrain?.batch.length||0,cargo:junkyardTrain?.cargo.length||0,
    stock:recoveredCars.length,packed:recoveredCars.filter(v=>v.packed).length,
    phase:junkyardCrusher?.phase,guard:{...junkyardWorker},guardPose:farmhandPose(),
    poses:recoveredCars.map(junkyardCarPose),landings:recoveredCars.map(junkyardPlacement),
    total:recoveredCount,hidden:recovery.hidden,sounds:[...trainSounds],events:[...trainEvents]}},
  advance(dt,seconds=0,stop=false){paused=stop;advanceJunkyard(dt,seconds);this.freeze();return this.snapshot()},
  packAll(){
    for(let i=0;i<20000&&recoveredCars.some(v=>!v.packed);i++)this.advance(.05);
    return this.snapshot();
  },
  phase(phase){for(let i=0;i<2000&&junkyardCrusher?.phase!==phase;i++)this.advance(.05);return this.snapshot()},
  finishPhase(){const t=junkyardTrain;return this.advance((t.stage==="load"?.8:t.departureSeconds)-t.elapsed+.001)},
  incoming(stage,elapsed=.45){
    incidents.length=0;if(stage)incidents.push({cars:[{}],stage,elapsed,heli:null});
    syncJunkyard();return this.advance(.05);
  },
  hidden(){Object.defineProperty(document,"hidden",{configurable:true,value:true});
    try{return this.advance(20,100000)}finally{delete document.hidden}},
  manual(){setCityTime(21*3600);setCityTime(6*3600);setCityTime(12*3600);return this.snapshot()},
  natural(seconds,rate,drag=false){
    cityClockRate=rate;paused=false;clockDrag=drag?{}:null;lastFrame=lastSimulationFrame=0;
    tick(seconds*1000);this.freeze();clockDrag=null;return this.snapshot();
  },
  cycle(){
    this.reset();this.deliver(1);const frames=[];
    for(let i=0;i<300&&!recoveredCars[0].packed;i++){
      this.advance(.025);frames.push({phase:junkyardCrusher?.phase,car:junkyardCarPose(recoveredCars[0]),guard:{...junkyardWorker}});
    }
    return {frames,state:this.snapshot()};
  },
  showBay(){document.querySelector(".city-options").open=true;recovery.scrollIntoView({block:"center"});drawAirspace()},
  render(){uiMotion=true;drawAirspace()},
  renderedContainers(){
    const result=[],original=drawScrapContainer;
    drawScrapContainer=(g,vehicles,...args)=>{result.push({count:vehicles.length,sealed:args[3]});original(g,vehicles,...args)};
    try{this.render();return result}finally{drawScrapContainer=original}
  },
  shortest(depot,box,width=1000,height=1000){return shortestJunkyardSpur(depot,box,width,height)},
  railway(){
    const train=junkyardTrain,route=ensureJunkyardRailway(train),stable=route===ensureJunkyardRailway(train);
    const old={stage:train.stage,elapsed:train.elapsed},head=route.trainLength*4;
    let inside=0,outside=0,crossings=0;
    for(let d=0;d<route.length;d+=3){
      const p=railwayPoint(route,d),m=route.map;
      if(m&&p.x>m.left&&p.x<m.right&&p.y>m.top&&p.y<m.bottom)crossings++;
    }
    const ink=()=>{
      air.clearRect(0,0,innerWidth,innerHeight);drawJunkyardTrain(junkyardBounds());
      const image=air.getImageData(0,0,airspace.width,airspace.height),m=route.map;
      const sx=airspace.width/innerWidth,sy=airspace.height/innerHeight;
      let count=0;
      for(let y=0;y<image.height;y+=2)for(let x=0;x<image.width;x+=2)if(image.data[(y*image.width+x)*4+3]){
        count++;
        if(m&&x/sx>m.left+1&&x/sx<m.right-1&&y/sy>m.top+1&&y/sy<m.bottom-1)inside++;
      }
      return count;
    };
    const heads=[];
    for(const stage of ["load","depart"]){
      train.stage=stage;
      for(let i=0;i<=8;i++){
        train.elapsed=(stage==="load"?.8:train.departureSeconds)*i/8;
        heads.push(railwayHead(train,route,true));outside+=ink();
      }
    }
    train.stage="depart";train.elapsed=train.departureSeconds;
    const finalInk=ink(),exit=railwayHead(train,route,true);
    const tail=railwayPoint(route,exit-route.trainLength);
    const tailOffscreen=tail.x<0||tail.x>innerWidth||tail.y<0||tail.y>innerHeight;
    train.stage="load";train.elapsed=0;const entry=railwayHead(train,route,true);
    const flatcar=railwayPoint(route,entry-140*route.scale);
    let backwards=0;
    for(let d=entry;d<exit;d+=2)for(const offset of [-140,-88,-30]){
      const a=railwayPoint(route,d+offset*route.scale),b=railwayPoint(route,d+offset*route.scale+.1);
      if((b.x-a.x)*Math.cos(a.angle)+(b.y-a.y)*Math.sin(a.angle)<-1e-6)backwards++;
    }
    Object.assign(train,old);drawAirspace();
    return {stable,inside,outside,crossings,finalInk,entry,exit,heads,tailOffscreen,flatcar,backwards,points:route.points,
      seconds:.8+train.departureSeconds,
      fade:[1,2,3].map(n=>railwayOpacity(head-route.trainLength*n,head,route.trainLength,route.scale))};
  },
  soundCheck(kind){
    const view=new DataView(makeSoundWav(kind)),n=(view.byteLength-44)/2;let max=0,sum=0;
    for(let i=0;i<n;i++){const v=view.getInt16(44+i*2,true)/32768;max=Math.max(max,Math.abs(v));sum+=v*v}
    return {rate:view.getUint32(24,true),max,rms:Math.sqrt(sum/n)};
  },
  audioGuards(){soundEnabled=false;paused=false;const muted=originalTrainSound("whistle")===null;
    soundEnabled=true;paused=true;return muted&&originalTrainSound("sneeze")===null}
};`;
assert.equal(source.split(marker).length,2);
const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
mkdirSync(root+"test-results",{recursive:true});
const errors=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
  await page.route("http://city.test/**",r=>r.fulfill({contentType:"text/html",body:source.replace(marker,hook+marker)}));
  await page.goto("http://city.test/");await page.waitForFunction(()=>trainQA.ready());
  const state=()=>page.evaluate(()=>trainQA.snapshot());
  const advance=(dt,seconds=0,stop=false)=>page.evaluate(args=>trainQA.advance(...args),[dt,seconds,stop]);
  const finish=()=>page.evaluate(()=>trainQA.finishPhase());

  await page.evaluate(()=>{trainQA.reset();trainQA.deliver(12)});
  const delivered=await state();
  assert(delivered.landings.every(p=>Math.abs(p.y*148-79)<1e-9&&p.x*240>=25&&p.x*240<=57),"Every helicopter landing is on the intake belt");
  await advance(1.15);assert.equal((await state()).guard.phase,"wake");
  await advance(.95);assert.equal((await state()).guard.phase,"sneeze");
  await advance(.85);
  assert.equal((await page.evaluate(()=>trainQA.incoming("carry"))).guard.phase,"guide");
  const dodging=await page.evaluate(()=>trainQA.incoming("drop"));
  assert.equal(dodging.guard.phase,"dodge");assert.equal(dodging.guardPose.lean,-18);
  await page.evaluate(()=>trainQA.incoming(null));
  await page.evaluate(()=>trainQA.phase("press"));
  const stopped=await state();
  assert.deepEqual(await advance(8,1e6,true),stopped,"Pause freezes guard, belts, press and pickup timer");
  assert.deepEqual(await page.evaluate(()=>trainQA.hidden()),stopped,"Hidden tabs do not progress the yard");

  const cycle=await page.evaluate(()=>trainQA.cycle());
  assert.equal(cycle.state.packed,1);assert.equal(cycle.state.stage,null);assert.equal(cycle.state.wait,0);
  for(const phase of ["intake","press","output","drop"])assert(cycle.frames.some(f=>f.phase===phase));
  for(const frame of cycle.frames){
    assert.equal(frame.guard.x,29);assert.equal(frame.guard.y,134,"The guard never hauls vehicles");
    if(["intake","press","output"].includes(frame.phase))assert.equal(frame.car.y,79,"Both transfers stay supported on belts");
    if(frame.phase==="drop"){assert.equal(frame.car.x,205);assert(frame.car.y>=79&&frame.car.y<=107)}
  }
  cycle.frames.forEach((frame,i)=>{
    if(i)assert(Math.hypot(frame.car.x-cycle.frames[i-1].car.x,frame.car.y-cycle.frames[i-1].car.y)<5,"Belts and the container drop have continuous positions");
  });
  assert.equal(cycle.state.guard.sneezes,1);

  // The threshold is five real running seconds AFTER the last pack lands, not five city seconds.
  for(const rate of [1,1800,7200]){
    await page.evaluate(()=>{trainQA.reset();trainQA.deliver(2);trainQA.packAll()});
    const before=await state();
    assert.equal(before.packed,2);assert.equal(before.wait,0);
    assert.deepEqual(await page.evaluate(()=>trainQA.manual()),before);
    const almost=await page.evaluate(rate=>trainQA.natural(4.99,rate),rate);
    assert.equal(almost.stage,null);assert(Math.abs(almost.wait-4.99)<1e-8,"Slow rendering cannot stretch the real-time countdown");
    assert.deepEqual(await advance(9,9e6,true),almost);
    assert.deepEqual(await page.evaluate(()=>trainQA.hidden()),almost);
    assert.equal((await advance(.01)).stage,"load");
  }
  await page.evaluate(()=>{trainQA.reset();trainQA.deliver(1)});
  assert.equal((await advance(.1,8640000)).stage,null,"Even a hundred city days cannot collect an unpacked car");
  await page.evaluate(()=>trainQA.packAll());await advance(4);
  assert.equal((await page.evaluate(()=>trainQA.incoming("approach"))).wait,0,"A new rescue resets the countdown");
  assert.equal((await advance(8)).stage,null,"Pending helicopter cargo prevents collection");
  await page.evaluate(()=>trainQA.incoming(null));
  await page.evaluate(()=>trainQA.deliver(1));assert.equal((await state()).wait,0);
  await page.evaluate(()=>trainQA.packAll());await advance(4.99);assert.equal((await state()).stage,null);
  assert.equal((await advance(.01)).stage,"load");

  const direct=await page.evaluate(()=>trainQA.shortest({x:850,y:400},null,1000,800));
  assert.equal(direct.edge,1);assert.equal(direct.points.length,2);
  assert.equal(Math.hypot(direct.points[0].x-850,direct.points[0].y-400),150);
  const detour=await page.evaluate(()=>trainQA.shortest({x:800,y:500},{left:850,right:950,top:450,bottom:550}));
  const length=detour.points.reduce((sum,p,i)=>i?sum+Math.hypot(p.x-detour.points[i-1].x,p.y-detour.points[i-1].y):sum,0);
  assert.equal(detour.edge,1);assert(Math.abs(length-(Math.hypot(50,50)+150))<1e-8,"Shortest safe detour wins over a perimeter lap");
  const offscreen=await page.evaluate(()=>trainQA.shortest({x:-65,y:500},{left:-65,right:1065,top:-65,bottom:1065}));
  assert(Number.isInteger(offscreen.edge)&&offscreen.points.length>=2,"An expanded full-window map still has a valid offscreen spur");

  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.waitForFunction(()=>trainQA.motionSettled());await page.evaluate(()=>trainQA.freeze());
  for(const [ui,theme,width,height] of [["film","light",1440,1000],["gamified","dark",1440,1000],["gamified","light",390,844],["film","dark",320,568]]){
    await page.setViewportSize({width,height});
    await page.selectOption("#ui-style",ui,{force:true});await page.selectOption("#ui-theme",theme,{force:true});
    await page.evaluate(()=>{trainQA.reset();trainQA.deliver(3);trainQA.phase("output");trainQA.showBay()});
    await page.screenshot({path:root+`test-results/conveyor-${ui}-${theme}-${width}.png`});
    await page.evaluate(()=>{trainQA.packAll();trainQA.advance(5);trainQA.render()});
    const rail=await page.evaluate(()=>trainQA.railway());
    assert(rail.stable);assert.equal(rail.crossings,0);assert.equal(rail.inside,0);
    assert(rail.outside>100,"Short pickup is visible near the yard");
    assert(rail.exit>rail.entry&&rail.heads.every((head,i)=>i===0||head>=rail.heads[i-1]),"Head position never reverses");
    assert.equal(rail.backwards,0,"Engine, tender and flatcar move only in their forward direction");
    assert.equal(rail.tailOffscreen,true,"The last carriage clears the screen before cleanup");
    assert(Math.hypot(rail.flatcar.x-rail.points[0].x,rail.flatcar.y-rail.points[0].y)<1e-8,"Train starts with its flatcar at the pickup point");
    assert.equal(rail.finalInk,0);assert(rail.points.length<=7,"No extra laps");
    assert(rail.seconds<=2.6+1e-9,"Container lift and forward exit finish within 2.6 seconds");
    rail.fade.forEach((alpha,i)=>assert(Math.abs(alpha-[1,.5,0][i])<1e-9));
    await advance(.4);await page.evaluate(()=>trainQA.render());
    await page.screenshot({path:root+`test-results/container-lift-${ui}-${theme}-${width}.png`});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.selectOption("#view-size","full",{force:true});
  await page.evaluate(()=>{trainQA.reset();trainQA.deliver(12);trainQA.packAll();trainQA.advance(5);trainQA.render()});
  assert.equal((await state()).batch,12,"No delivered vehicle is lost to the visual queue limit");
  assert.equal((await page.evaluate(()=>trainQA.railway())).inside,0);
  await page.locator(".city-options").evaluate(e=>e.open=false);
  assert.equal((await page.evaluate(()=>trainQA.railway())).inside,0,"Collapsed/full-window pickup protects the map");
  await page.evaluate(()=>trainQA.deliver(3));
  assert.deepEqual(await page.evaluate(()=>trainQA.renderedContainers()),[{count:12,sealed:true}],"Loading draws one complete sealed container");
  await finish();
  assert((await page.evaluate(()=>trainQA.renderedContainers())).some(c=>c.count===12&&c.sealed),"The flatcar carries the whole container, not loose cars");
  assert.equal((await state()).cargo,12,"Only the sealed packed container is loaded");
  assert.equal((await state()).stock,3,"New arrivals wait for their own container");
  await finish();assert.equal((await state()).stage,null);assert.equal((await state()).total,15);
  await page.evaluate(()=>{trainQA.packAll();trainQA.advance(5)});
  await finish();await finish();
  const empty=await state();
  assert.equal(empty.stock,0);assert.equal(empty.hidden,true);assert.equal(empty.total,15);
  assert.deepEqual(empty.events.filter(e=>e.kind==="train-collected").map(e=>e.count),[12,3]);
  assert.equal(empty.guard.sneezes,1,"Guard stays awake across containers");
  await page.evaluate(()=>{trainQA.deliver();trainQA.packAll();trainQA.advance(5)});
  await page.selectOption("#destination","dublin",{force:true});
  const reset=await state();assert.equal(reset.stage,null);assert.equal(reset.wait,0);
  assert.equal(reset.stock,0);assert.equal(reset.total,0);assert.equal(reset.guard.sneezes,0);
  for(const kind of ["whistle","chuff","sneeze"]){
    const wav=await page.evaluate(kind=>trainQA.soundCheck(kind),kind);
    assert.equal(wav.rate,22050);assert(wav.max>.05&&wav.max<.95&&wav.rms>.005);
  }
  assert(await page.evaluate(()=>trainQA.audioGuards()));assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",conveyorPacking:true,guardOnly:true,allCargoRetained:true,fiveRealSeconds:true,
    shortestSafeSpur:true,forwardOnly:true,pickupWithin2_6Seconds:true,sealedContainers:true,mapProtected:true,errors}));
}finally{await browser.close()}
