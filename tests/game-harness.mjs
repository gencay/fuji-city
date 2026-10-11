// Shared Playwright setup for the "Play a day" regressions. The ?game-test=1 hook is test-only.
import {chromium} from "playwright";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";

export const root=fileURLToPath(new URL("../",import.meta.url));
export const base=process.env.SITE_URL||"http://city.test/";
mkdirSync(root+"test-results",{recursive:true});

export async function launch() {
  const chrome=process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  return chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
}

export async function openGame(browser,{city="paris",query="?game-test=1",reducedMotion="no-preference",
  viewport={width:1440,height:1000},errors=[],flat=false}={}) {
  const context=await browser.newContext({reducedMotion,viewport});
  const page=await context.newPage();
  page.on("pageerror",error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem("fuji-city:first-play:v1","done"));
  await page.route("https://fonts.googleapis.com/**",route=>route.abort());
  if(!process.env.SITE_URL)await page.route(base+"**",route=>route.fulfill({
    contentType:"text/html",body:readFileSync(process.env.CITY_HTML||root+"city-flight.html","utf8")
  }));
  await page.goto(base+query);
  await page.waitForFunction(()=>document.getElementById("worker-status").hidden);
  if(city)await page.selectOption("#destination",city,{force:true});
  // An unrotated print lets real pointer taps use the hook's CSS-pixel coordinates directly.
  if(flat)await page.addStyleTag({content:"figure{transform:none!important}"});
  return {page,context,game:(method,...args)=>page.evaluate(([method,args])=>window.__fujiGame[method](...args),[method,args])};
}
