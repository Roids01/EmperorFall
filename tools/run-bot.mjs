// Headless balance runner for Small Crown.
//   npm run bot                      30 games per strategy x difficulty, prints a table
//   npm run bot -- --n 10 --diff normal --strat balanced,turtle --json out.json
// It builds dist/bot.html (dist/dev.html with tools/bot.js spliced into the game's scope),
// serves the repo over a local HTTP server, and plays games in headless Chrome.
// If tools/.cdn/node_modules exists (npm run bot:setup), CDN libraries are served from there,
// so the runner also works offline.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import {execSync} from 'node:child_process';
import {chromium} from 'playwright';

const R=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const args=process.argv.slice(2), opt=k=>{ const i=args.indexOf('--'+k); return i>=0?args[i+1]:null; };
const N=+(opt('n')||30), DIFFS=(opt('diff')||'easy,normal,hard').split(','), STRATS=(opt('strat')||'balanced,b_merchant,b_warlord,turtle,economy,random').split(',');
const JSON_OUT=opt('json'), LABEL=opt('label')||'';

if(!args.includes('--no-build')) execSync('node build.mjs',{cwd:R,stdio:'inherit'});
const dev=fs.readFileSync(path.join(R,'dist/dev.html'),'utf8'), bot=fs.readFileSync(path.join(R,'tools/bot.js'),'utf8');
const BOOT='loadPrefs();\napplyQuality();';
if(!dev.includes(BOOT)) throw new Error('Boot marker not found in dist/dev.html; update tools/run-bot.mjs');
// In bot mode: no rendering loop, no audio, no save; expose the runner.
const inject=`\n// ---- balance bot (tools/run-bot.mjs) ----\n${bot}\nwindow.__simGame=(s,d)=>{ try{ return simGame(s,d); }catch(e){ return {error:String(e&&e.stack||e)}; } };\nwindow.__botReady=true;\nif(window.__BOT_MODE){ startGame('normal'); return; }\n`;
fs.writeFileSync(path.join(R,'dist/bot.html'),dev.replace(BOOT,inject+BOOT).replace(/^/,'<script>window.__BOT_MODE=true;</script>'));

const CDN=path.join(R,'tools/.cdn/node_modules'), local=fs.existsSync(CDN);
const MIME={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.css':'text/css','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{ const f=path.join(R,decodeURIComponent(q.url.split('?')[0])); if(!f.startsWith(R)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ r.writeHead(404); r.end(); return; }
  r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
await new Promise(ok=>srv.listen(0,'127.0.0.1',ok)); const port=srv.address().port;

const browser=await chromium.launch({executablePath:process.env.CHROME||(fs.existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
async function page(){
  const ctx=await browser.newContext({viewport:{width:900,height:600}}); const p=await ctx.newPage(); const errors=[];
  p.on('pageerror',e=>errors.push(String(e.message||e))); p.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource|fonts\.g/.test(m.text())) errors.push(m.text()); });
  await p.route('**/*',rt=>{ const u=rt.request().url();
    if(/fonts\.(googleapis|gstatic)/.test(u)) return rt.abort();
    const m=u.match(/^https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/]+\/)?[^@/]+)@[^/]+\/(.*)$/);
    if(m&&local){ const f=path.join(CDN,m[1],m[2]); if(fs.existsSync(f)) return rt.fulfill({path:f,contentType:MIME[path.extname(f)]||'text/javascript'}); }
    return rt.continue(); });
  await p.goto(`http://127.0.0.1:${port}/dist/bot.html`); await p.waitForFunction(()=>window.__botReady,null,{timeout:60000});
  return {p,errors,ctx}; }

const rows=[]; const t0=Date.now();
for(const diff of DIFFS) for(const strat of STRATS){
  const {p,errors,ctx}=await page();
  for(let i=0;i<N;i++){ const r=await p.evaluate(([s,d])=>window.__simGame(s,d),[strat,diff]); r.errors=errors.splice(0); rows.push({...r,strat,diff}); }
  await ctx.close(); process.stderr.write(`  ${diff}/${strat} done (${((Date.now()-t0)/1000).toFixed(0)}s)\n`); }
await browser.close(); srv.close();

// summary
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0, pct=x=>(100*x).toFixed(0)+'%';
const lines=[`| diff | strategy | win | avg day reached | broke (gold<5 at end) | avg end gold | avg pop | gold d5 / d10 / d20 | net gold/dawn d10 / d20 | avg keep dmg/night | worst night dmg | lost by day | lost on warlord nights | errors |`,`|---|---|---|---|---|---|---|---|---|---|---|---|---|`];
for(const diff of DIFFS) for(const strat of STRATS){ const g=rows.filter(r=>r.diff===diff&&r.strat===strat), ok=g.filter(r=>!r.error);
  const kd=ok.flatMap(r=>(r.keepLoss||[]).map(x=>Math.max(0,x)));
  const at=(d,k)=>avg(ok.map(r=>{ const x=(r.days||[]).find(e=>e.d===d); return x?x[k]:null; }).filter(v=>v!=null)); const lost=ok.filter(r=>!r.won); const paths=[...new Set(ok.map(r=>r.path||'-'))].join('/');
  lines.push(`| ${diff} | ${strat} | ${pct(avg(ok.map(r=>r.won?1:0)))} | ${avg(ok.map(r=>r.day)).toFixed(1)} | ${pct(avg(ok.map(r=>r.gold<5?1:0)))} | ${avg(ok.map(r=>r.gold)).toFixed(0)} | ${avg(ok.map(r=>r.pop)).toFixed(1)} | ${at(5,'g').toFixed(0)} / ${at(10,'g').toFixed(0)} / ${at(20,'g').toFixed(0)} | ${at(10,'ng').toFixed(1)} / ${at(20,'ng').toFixed(1)} | ${avg(kd).toFixed(2)} | ${Math.max(0,...kd).toFixed(1)} | ${lost.length?avg(lost.map(r=>r.day)).toFixed(1):'-'} | ${lost.length?pct(lost.filter(r=>{ const n=(r.ni||[]).slice(-1)[0]; return n&&n.boss; }).length/lost.length):'-'} | ${g.filter(r=>r.error).length+g.reduce((s,r)=>s+(r.errors||[]).length,0)} |`); }
const out=`${LABEL?`### ${LABEL}\n\n`:''}${N} games per cell, ${new Date().toISOString().slice(0,10)}\n\n${lines.join('\n')}\n`;
console.log(out);
const errs=[...new Set(rows.flatMap(r=>[r.error,...(r.errors||[])]).filter(Boolean))]; if(errs.length) console.log('Distinct errors:\n'+errs.slice(0,15).map(e=>'- '+e.split('\n')[0]).join('\n'));
if(JSON_OUT) fs.writeFileSync(JSON_OUT,JSON.stringify(rows,null,1));
