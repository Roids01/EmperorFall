// Screenshots of the real game (WebGL via SwiftShader) for checking visual changes.
//   node tools/shot.mjs out-dir [label]
// Saves day/night views at desktop and phone sizes. Needs `npm run build` first.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import {chromium} from 'playwright';
const R=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'), OUT=path.resolve(process.argv[2]||'shots'), LABEL=process.argv[3]||'';
fs.mkdirSync(OUT,{recursive:true});
const dev=fs.readFileSync(path.join(R,'dist/dev.html'),'utf8'), BOOT='loadPrefs();\napplyQuality();';
fs.writeFileSync(path.join(R,'dist/shot.html'),'<meta charset="utf-8">'+dev.replace(BOOT,'window.__ev=s=>eval(s);\n'+BOOT));
const CDN=path.join(R,'tools/.cdn/node_modules'), local=fs.existsSync(CDN);
const MIME={'.js':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.css':'text/css'};
const srv=http.createServer((q,r)=>{ const f=path.join(R,decodeURIComponent(q.url.split('?')[0]).replace(/^\/dist\/(models|icons)\//,'/$1/')); if(!f.startsWith(R)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ r.writeHead(404); r.end(); return; } r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({executablePath:process.env.CHROME||(fs.existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':undefined),args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--mute-audio']});
const warnings=[];
for(const [vw,vh,tag] of [[1280,800,'desktop'],[390,844,'phone']]){
  const ctx=await browser.newContext({viewport:{width:vw,height:vh},deviceScaleFactor:1}); const p=await ctx.newPage();
  p.on('console',m=>{ if((m.type()==='warning'||m.type()==='error')&&!/fonts\.g|Failed to load resource|GPU stall|swiftshader|SwiftShader|WebGL-|ReadPixels/i.test(m.text())) warnings.push(`[${tag}] ${m.type()}: ${m.text().slice(0,200)}`); });
  p.on('pageerror',e=>warnings.push(`[${tag}] pageerror: ${e.message}`));
  await p.route('**/*',rt=>{ const u=rt.request().url(); if(/fonts\.(googleapis|gstatic)/.test(u)) return rt.abort();
    const m=u.match(/^https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/]+\/)?[^@/]+)@[^/]+\/(.*)$/); if(m&&local){ const f=path.join(CDN,m[1],m[2]); if(fs.existsSync(f)) return rt.fulfill({path:f,contentType:MIME[path.extname(f)]||'text/javascript'}); } return rt.continue(); });
  await p.goto(`http://127.0.0.1:${srv.address().port}/dist/shot.html`);
  await p.waitForFunction(()=>window.__ev,null,{timeout:60000});
  await p.waitForFunction(()=>window.__ev('ASSET.ready'),null,{timeout:90000}).catch(()=>warnings.push(`[${tag}] models not ready in time`));
  // a small developed village so there is something to look at
  await p.evaluate(()=>window.__ev(`try{localStorage.setItem('smallcrown-tour','1')}catch(e){}; saveOn=false; Math.random=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647;})(); startGame('normal'); hideOver(); S.modal=false;
    S.res.gold=400;S.res.wood=400;S.res.stone=400;S.day=6;
    const put=(t,x,y)=>{ const g=G(x,y); if(g&&g.land&&!g.b&&!g.water){ g.b={type:t,hp:9,max:9,lvl:1,cd:0}; } };
    [[C-1,C],[C+1,C],[C,C-1]].forEach(([x,y])=>put('house',x,y)); [[C-2,C+1],[C-2,C+2],[C-1,C+2]].forEach(([x,y])=>put('farm',x,y));
    [[C+2,C-1],[C-2,C-2],[C+2,C+2]].forEach(([x,y])=>put('tower',x,y)); put('market',C+1,C+1); put('well',C-1,C-1); put('barr',C,C+2);
    for(let i=-3;i<=3;i++) put('wall',C+i,C-4);
    each((b)=>{ const d=DEF[b.type]; b.hp=b.max=d.hp||5; }); buildWorld(); ui(); 'ok'`));
  await p.waitForTimeout(2500); await p.evaluate(()=>window.__ev('hideOver(); S.modal=false; 1'));
  await p.screenshot({path:path.join(OUT,`${LABEL}${tag}-day.png`)});
  await p.evaluate(()=>window.__ev(`S.day=9; planWave(); startNight(); 'ok'`)); await p.waitForTimeout(12000); await p.evaluate(()=>window.__ev('hideOver(); S.modal=false; 1'));
  await p.screenshot({path:path.join(OUT,`${LABEL}${tag}-night.png`)});
  await p.waitForTimeout(14000); await p.evaluate(()=>window.__ev('hideOver(); S.modal=false; 1'));
  await p.screenshot({path:path.join(OUT,`${LABEL}${tag}-fight.png`)});
  await ctx.close();
}
await browser.close(); srv.close();
console.log(warnings.length?'Console warnings:\n'+[...new Set(warnings)].join('\n'):'No console warnings or errors.');
