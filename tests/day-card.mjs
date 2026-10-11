import assert from "node:assert/strict";
import {launch,openGame,root} from "./game-harness.mjs";

const browser=await launch();
const errors=[];
try{
  for(const [reducedMotion,ui] of [["reduce","gamified"],["no-preference","film"]]){
    const {page,context,game}=await openGame(browser,{city:"dublin",reducedMotion,errors});
    await page.selectOption("#ui-style",ui,{force:true});
    const sandboxIssue=await page.locator("#newspaper-issue").textContent();
    assert.match(sandboxIssue,/^ROLL EDITION \d+ ·/);
    await game("start","commute",6);await game("freeze");
    // Deliver one fare so the postcard has something to certify.
    for(let t=0;t<60;t++){
      const fare=(await game("fares")).find(item=>item.state==="waiting");
      if(fare){await game("tapWorld",fare.walk.x,fare.walk.y);const state=await game("state");if(state.taxis.length){await game("deliver",fare.id);break;}}
      await game("advance",1);
    }
    let state=await game("state");
    state=await game("advance",(54000-state.elapsedCity)/state.clockRate+5.5);
    assert.equal(state.phase,"card");
    const result=state.result;
    assert(result.fares>=1,JSON.stringify(result));
    // The postcard becomes the score card, in the existing postcard markup.
    const poem=page.locator("#city-poem");
    assert.equal(await poem.getAttribute("data-mood"),"score");
    assert.equal(await poem.evaluate(e=>getComputedStyle(e).visibility),"visible");
    const stars="★".repeat(result.stars)+"☆".repeat(3-result.stars);
    const points=result.score.toLocaleString("en-US");
    assert.equal(await poem.locator(".poem-full .poem-line").first().textContent(),
      `${result.fares}/${result.offered} fares · ${result.home} home · ${result.wrecks} wrecks · ${stars}`);
    assert.match(await poem.locator(".poem-full .poem-signature").textContent(),new RegExp(`^— .+, certifying ${points} pts$`));
    assert.equal(await poem.locator(".poem-short .poem-line").first().textContent(),`${stars} · ${points} pts`);
    // The end card: stars, counts and the three actions.
    const card=page.locator("#game-card");
    assert.equal(await card.isVisible(),true);
    assert.equal(await page.locator("#game-card-title").textContent(),`Day ${result.day} · Dublin`);
    assert.equal(await card.locator(".game-stars").getAttribute("aria-label"),`${result.stars} of 3 stars`);
    assert.equal(await card.locator(".journal-counts dd").first().textContent(),points);
    assert.equal(await page.locator("#game-today").isVisible(),true,"Today's row stays for the card");
    // The local paper leads with 1-3 stories about your day and keeps its satire label.
    assert.equal(await page.locator("#newspaper-issue").textContent(),"DAY 1 EDITION · FILED BY A PIGEON · EDITED BY NOBODY");
    const headlines=await page.locator("#newspaper-readable h3").allTextContents();
    const generated=[/without a single dent/,/so fast they forget why they went/,/declared a new neighborhood/,/renames sunset/,/technically a service/,/scenic route/];
    const ours=headlines.filter(text=>generated.some(pattern=>pattern.test(text)));
    assert(ours.length>=1&&ours.length<=3,JSON.stringify(headlines));
    assert(headlines.slice(0,ours.length).every(text=>ours.includes(text)),"Generated stories lead the paper");
    assert.match(await page.locator(".newspaper-reader").textContent(),/ENTIRELY MADE UP · LOCAL SATIRE/);
    await page.locator("#game-card button",{hasText:"Read today's paper"}).click();
    assert.equal(await page.locator(".newspaper-reader").evaluate(e=>e.open),true);
    await page.screenshot({path:root+`test-results/game-day-card-${ui}.png`});
    // The score postcard fits every print size, like the everyday postcard.
    for(const size of ["100","200","300","600","1000","full"]){
      await page.selectOption("#view-size",size,{force:true});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const fit=await page.evaluate(()=>{
        const caption=document.getElementById("city-poem"),verse=[...caption.children].find(e=>getComputedStyle(e).display!=="none");
        return {lines:[...verse.children].map(e=>e.scrollWidth),width:caption.clientWidth,height:verse.offsetHeight,room:caption.clientHeight,
          overflow:document.documentElement.scrollWidth>innerWidth+1};
      });
      assert(fit.lines.every(width=>width<=fit.width+1)&&fit.height<=fit.room+1&&!fit.overflow,JSON.stringify({size,fit}));
    }
    await page.selectOption("#view-size","600",{force:true});
    // Back to Sandbox restores the everyday postcard and paper; Play another day starts day 2.
    await page.locator("#game-sandbox").click();
    assert.equal(await card.isHidden(),true);
    assert.notEqual(await poem.getAttribute("data-mood"),"score");
    assert.match(await page.locator("#newspaper-issue").textContent(),/^ROLL EDITION \d+ ·/);
    assert.equal(await page.locator("#game-today").isHidden(),true);
    assert.equal(await page.locator("figure").getAttribute("data-game"),null);
    state=await game("start","commute",6);
    assert.equal(state.day,2);
    await game("freeze");
    state=await game("advance",366);
    assert.equal(state.phase,"card");
    await page.locator("#game-again").click();
    state=await game("state");
    assert.equal(state.active,true);
    assert.equal(state.day,3);
    assert.equal(await card.isHidden(),true);
    await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:"PASS",scorePostcard:true,endCard:true,paper:true,printSizes:"100-1000 + full",backToSandbox:true,anotherDay:true,errors}));
}finally{await browser.close()}
