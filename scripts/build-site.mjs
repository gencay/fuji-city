import {cpSync,mkdirSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";

const root=fileURLToPath(new URL("../",import.meta.url));
const site=path.join(root,"_site");
const manifest=JSON.parse(readFileSync(path.join(root,"versions/manifest.json"),"utf8"));
rmSync(site,{recursive:true,force:true});
mkdirSync(site);
cpSync(path.join(root,"versions"),path.join(site,"versions"),{recursive:true});
cpSync(path.join(root,"city-flight.html"),path.join(site,"city-flight.html"));
cpSync(path.join(root,"city-flight.html"),path.join(site,"index.html"));
writeFileSync(path.join(site,".nojekyll"),"");

// Preserve previously published flat URLs without cluttering the source root.
for(const version of manifest.versions.filter(v=>!v.file.startsWith("../"))){
  const target="versions/"+version.file;
  writeFileSync(path.join(site,version.file),`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Fuji City archive</title>
<meta http-equiv="refresh" content="0;url=${target}">
<link rel="canonical" href="${target}">
<script>location.replace(${JSON.stringify(target)}+location.search+location.hash);</script>
</head><body><a href="${target}">Open this archived version</a></body></html>
`);
}
writeFileSync(path.join(site,"city-flight-versions.json"),JSON.stringify({
  ...manifest,current:"city-flight.html",
  versions:manifest.versions.map(v=>({...v,file:v.file.startsWith("../")?v.file.slice(3):"versions/"+v.file}))
},null,2)+"\n");
