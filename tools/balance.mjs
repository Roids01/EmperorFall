// Balance runner: plays many bot games of Small Crown in headless Chrome and summarizes the results.
// Usage: npm run balance -- [--games 20] [--workers 2] [--strats balanced,turtle,economy,random] [--diffs easy,normal,hard] [--out report.json]
// Loads dist/dev.html (built by build.mjs), injects tools/bot.js into the game's scope, and calls simGame().
import fs from 'node:fs'; import path from 'node:path'; import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium; try{ ({chromium}=require('playwright')); }catch{ ({chromium}=require('/opt/npm-tools/node_modules/playwright')); }

const R=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const arg=(k,d)=>{ const i=process.argv.indexOf('--'+k); return i>0?process.argv[i+1]:d; };
const GAMES=+arg('games',20), STRATS=arg('strats','balanced,turtle,economy,random').split(','), OUT=arg('out','');
const dev=path.join(R,'dist/dev.html'); if(!fs.existsSync(dev)){ console.error('dist/dev.html missing: run `npm run build` first'); process.exit(1); }
const bot=fs.readFileSync(path.join(R,'tools/bot.js'),'utf8');

const browser=await chromium.launch({executablePath:fs.existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
const WORKERS=+arg('workers',2); const errors=[];
async function setupPage(){ const page=await browser.newPage();
// The bot drives the sim with step(); stop the render loop so frames don't compete for CPU.
await page.addInitScript(()=>{ window.requestAnimationFrame=()=>0; });
// Offline CDN: serve cdn.jsdelivr.net/npm/<pkg>@<ver>/<file> from the same version fetched through npm (cached in ~/.cache/sc-cdn).
// Lets the runner work where the CDN is unreachable (sandboxes, CI, the Pi on a bad connection). Google Fonts are skipped.
const {execFileSync}=require('node:child_process'), os=require('node:os');
const CACHE=path.join(os.homedir(),'.cache/sc-cdn'); fs.mkdirSync(CACHE,{recursive:true});
function cdnFile(spec,file){ const dir=path.join(CACHE,spec);
  if(!fs.existsSync(dir)){ const tgz=execFileSync('npm',['pack',spec,'--silent','--pack-destination',CACHE],{encoding:'utf8'}).trim().split('\n').pop();
    fs.mkdirSync(dir,{recursive:true}); execFileSync('tar',['-xzf',path.join(CACHE,tgz),'-C',dir,'--strip-components=1']); fs.rmSync(path.join(CACHE,tgz)); }
  return path.join(dir,file); }
await page.route('**/*',async route=>{ const u=new URL(route.request().url());
  if(u.hostname==='cdn.jsdelivr.net'){ const m=u.pathname.match(/^\/npm\/((?:@[^/]+\/)?[^/@]+@[^/]+)\/(.+)$/);
    if(m){ try{ const f=cdnFile(m[1],m[2]); return route.fulfill({status:200,contentType:f.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync(f)}); }catch(e){ errors.push('cdn '+m[1]+'/'+m[2]+': '+String(e.message).slice(0,80)); } }
    return route.fulfill({status:404,body:''}); }
  if(u.protocol==='file:') return route.continue();
  return route.abort(); });
page.on('pageerror',e=>errors.push(String(e.message).slice(0,200)));
page.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource/.test(m.text())) errors.push('console: '+m.text().slice(0,200)); });
// The game lives inside the __main() closure, so the bot is spliced in just before the boot's render loop starts,
// in a test-only copy (dist/balance.html; dist/ is gitignored). The shipped files are never touched.
const html=fs.readFileSync(dev,'utf8'), hook='requestAnimationFrame(loop);\n};', at=html.lastIndexOf(hook);
if(at<0){ console.error('boot hook not found in dist/dev.html (99-boot.js changed?)'); process.exit(1); }
const harness=path.join(R,'dist/balance.html');
fs.writeFileSync(harness,html.slice(0,at)+bot+'\nwindow.__SC={simGame,BOT_STRATS,DIFF:Object.keys(DIFF)};\n'+html.slice(at));
await page.goto('file://'+harness);
try{ await page.waitForFunction(()=>window.__SC,null,{timeout:60000}); }catch(e){ console.error('game did not load:',errors.slice(0,10)); await browser.close(); process.exit(1); }
return page; }
const pages=[]; for(let i=0;i<WORKERS;i++) pages.push(await setupPage()); errors.length=0;
const DIFFS=arg('diffs',null)?.split(',')||await pages[0].evaluate(()=>window.__SC.DIFF);
const jobs=[]; for(const diff of DIFFS) for(const strat of STRATS) for(let g=0;g<GAMES;g++) jobs.push([strat,diff]);
const rows=[], t0=Date.now();
await Promise.all(pages.map(async page=>{ while(jobs.length){ const [strat,diff]=jobs.shift();
  const r=await page.evaluate(([s,d])=>{ try{ return window.__SC.simGame(s,d); }catch(e){ return {error:String(e&&e.message||e).slice(0,200),strat:s,diff:d}; } },[strat,diff]);
  rows.push(r); process.stdout.write(r.error?'x':r.won?'W':'.'); } }));
await browser.close(); console.log(`\n${rows.length} games in ${((Date.now()-t0)/1000).toFixed(0)}s\n`);

const q=(a,p)=>{ if(!a.length) return null; const s=[...a].sort((x,y)=>x-y); return s[Math.min(s.length-1,Math.floor(p*s.length))]; };
const summary=[];
for(const diff of DIFFS) for(const strat of STRATS){
  const g=rows.filter(r=>r.diff===diff&&r.strat===strat&&!r.error), n=g.length;
  const lost=g.filter(r=>!r.won), deathDays=lost.map(r=>r.day);
  const built={}; g.forEach(r=>Object.entries(r.built||{}).forEach(([k,v])=>built[k]=(built[k]||0)+v/n));
  summary.push({diff,strat,games:n,errors:rows.filter(r=>r.diff===diff&&r.strat===strat&&r.error).length,
    winRate:n?+(g.filter(r=>r.won).length/n).toFixed(2):null,
    lossDayMedian:q(deathDays,.5),lossDayP10:q(deathDays,.1),
    goldEndMedian:q(g.map(r=>r.gold),.5),popEndMedian:q(g.map(r=>r.pop),.5),killsMedian:q(g.map(r=>r.kills),.5),
    scoreMedian:q(g.map(r=>r.score),.5),msPerGame:q(g.map(r=>r.ms),.5),
    lossDays:Object.fromEntries(Object.entries(deathDays.reduce((m,d)=>(m[d]=(m[d]||0)+1,m),{})).sort((x,y)=>x[0]-y[0])),
    // Keep damage on the night each lost game ended, summed by attacker type (who actually kills the keep).
    lossKeepBy:Object.fromEntries(Object.entries(lost.reduce((m,r)=>{ const k=(r.keepBy||[]).at(-1)||{}; for(const t in k) m[t]=(m[t]||0)+k[t]; return m; },{})).sort((x,y)=>y[1]-x[1])),
    avgBuilt:Object.fromEntries(Object.entries(built).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,+v.toFixed(1)]))});
}
console.table(summary.map(({avgBuilt,lossDays,lossKeepBy,...s})=>s));
for(const s of summary) if(Object.keys(s.lossKeepBy).length) console.log(s.diff,s.strat,'loss nights',JSON.stringify(s.lossDays),'keep dmg by',JSON.stringify(s.lossKeepBy));
const uniqErr=[...new Set([...rows.filter(r=>r.error).map(r=>r.error),...errors])];
if(uniqErr.length) console.log('errors:',uniqErr.slice(0,8));
if(OUT){ fs.writeFileSync(OUT,JSON.stringify({ran:new Date().toISOString(),games:GAMES,summary,errors:uniqErr,rows},null,1)); console.log('wrote',OUT); }
