import {readFileSync,readdirSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import path from "node:path";
import assert from "node:assert/strict";
import "../scripts/build-site.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
const catalog=JSON.parse(readFileSync(path.join(root,"versions/manifest.json"),"utf8"));
const hash=s=>createHash("sha256").update(s).digest("hex");
const strip=s=>s.replace(/<!-- CITY VERSION (STYLE|NAV|SCRIPT) START -->[\s\S]*?<!-- CITY VERSION \1 END -->\n/g,"").replace("<figure>\n\n","<figure>\n");
assert(!readdirSync(root).some(name=>/^city-flight-v\d+\.html$/.test(name)));
assert(!existsSync(path.join(root,"city-flight-versions.json")));
assert.equal(catalog.current,"../city-flight.html");
for(const version of catalog.versions){
  const file=path.resolve(root,"versions",version.file);
  const source=readFileSync(file,"utf8");
  assert.equal(hash(strip(source)),version.sourceSha256,version.file+" simulation hash");
  if(version.archiveSha256)assert.equal(hash(source),version.archiveSha256);
  const nav=[...source.matchAll(/<!-- CITY VERSION NAV START -->[\s\S]*?<!-- CITY VERSION NAV END -->/g)].map(match=>match[0]).join("\n");
  const links=[...nav.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(links.length,catalog.versions.length+(version.archiveSha256?(version.version===0?1:2):0));
  if(version.archiveSha256){
    assert(nav.includes('class="version-pager"'));
    assert(nav.includes(`rel="next" href="${catalog.versions.find(v=>v.version===version.version+1).file}"`));
    if(version.version===0)assert(nav.includes('aria-disabled="true"'));
    else assert(nav.includes(`rel="prev" href="${catalog.versions.find(v=>v.version===version.version-1).file}"`));
  }else{
    assert(!nav.includes('class="version-pager"'));
    assert(source.indexOf('class="city-extras"')<source.indexOf('class="version-picker"'));
  }
  for(const link of links)assert(existsSync(path.resolve(path.dirname(file),link)),`${version.file} -> ${link}`);
  const deployed=path.resolve(root,"_site/versions",version.file);
  assert.equal(readFileSync(deployed,"utf8"),source);
  if(version.archiveSha256){
    const redirect=readFileSync(path.join(root,"_site",version.file),"utf8");
    assert(redirect.includes("versions/"+version.file));
    assert(redirect.includes("location.search+location.hash"));
  }
}
assert.equal(readFileSync(path.join(root,"_site/index.html"),"utf8"),readFileSync(path.join(root,"city-flight.html"),"utf8"));
const legacy=JSON.parse(readFileSync(path.join(root,"_site/city-flight-versions.json"),"utf8"));
for(const version of legacy.versions)assert(existsSync(path.join(root,"_site",version.file)));
console.log(`PASS: ${catalog.versions.length} version sources, navigation, deployment paths and legacy URLs.`);
