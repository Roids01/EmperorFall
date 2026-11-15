// ---------- Yuka: goal-driven raider captains ----------
let YK=null; const BRAIN=new WeakMap();
function ykKit(){ if(YK) return YK; const Y=window.YUKA; if(!Y||!Y.Think||!Y.GoalEvaluator) return null;
  class PlanGoal extends Y.Goal{ constructor(o,mode){ super(o); this.mode=mode; } activate(){ setPlan(this.owner.e,this.mode); } execute(){ const p=this.owner.e.plan; this.status=(this.mode==='assault'?!p:p&&p.mode===this.mode)?Y.Goal.STATUS.ACTIVE:Y.Goal.STATUS.COMPLETED; } }
  class Ev extends Y.GoalEvaluator{ constructor(mode,fn,bias){ super(bias||1); this.mode=mode; this.fn=fn; } calculateDesirability(o){ return this.fn(o.e); }
    setGoal(o){ const b=o.brain, cur=b.currentSubgoal(); if(!(cur&&cur.mode===this.mode&&cur.status!==Y.Goal.STATUS.COMPLETED)){ b.clearSubgoals(); b.addSubgoal(new PlanGoal(o,this.mode)); } } }
  return YK={Y,PlanGoal,Ev}; }
const EVALS={assault:()=>.32,retreat:desRetreat,breach:desBreach,flank:desFlank,rally:desRally};
function brainOf(e){ let b=BRAIN.get(e); if(b) return b; const k=ykKit();
  if(k){ const ent=new k.Y.GameEntity(); ent.e=e; ent.brain=new k.Y.Think(ent); for(const m in EVALS) ent.brain.addEvaluator(new k.Ev(m,EVALS[m],e.type==='warlord'&&m==='breach'?1.15:e.type==='captain'&&m==='flank'?1.2:1)); b={ent,t:0}; }
  else b={ent:null,t:0}; BRAIN.set(e,b); return b; }
function thinkCaptain(e,dt){ if(e.age<1.2) return; const b=brainOf(e); b.t-=dt; if(b.t>0) return; b.t=.6;
  if(b.ent){ b.ent.brain.arbitrate(); b.ent.brain.execute(); }
  else { let best='assault',bv=-1; for(const m in EVALS){ const v=EVALS[m](e); if(v>bv){ bv=v; best=m; } } if(!(e.plan&&e.plan.mode===best)) setPlan(e,best); }
  if(e.plan&&e.plan.mode==='retreat') e.hp=Math.min(e.max,e.hp+e.max*.04); }
function capNear(e,r){ let n=0; for(const o of S.enemies) if(o!==e&&!o.gone&&Math.hypot(o.x-e.x,o.y-e.y)<r) n++; return n; }
function desRetreat(e){ const f=e.hp/e.max; if(e.plan&&e.plan.mode==='retreat') return f<.75?.95:0; return f<.33&&!e.retreated?.9:0; }
function desBreach(e){ let best=null,bv=0; for(let y=Math.max(0,e.cy-5);y<=Math.min(N-1,e.cy+5);y++)for(let x=Math.max(0,e.cx-5);x<=Math.min(N-1,e.cx+5);x++){ const b=G(x,y).b; if(!b||b.type==='keep'||b.type==='trap'||b.type==='road'||b.type==='farm') continue;
    const f=b.hp/b.max, d=Math.hypot(x-e.cx,y-e.cy), v=(b.type==='wall'?.3:b.type==='tower'||b.type==='cata'?.25:.1)+(1-f)*.5-d*.03; if(v>bv){ bv=v; best=[x,y]; } }
  e.cand=best; return best?Math.min(.85,.35+bv):0; }
function towerCover(x,y){ let n=0; each((b,bx,by)=>{ const w=weapon(b); if(w&&b.type!=='keep'&&Math.hypot(bx-x,by-y)<=w.range+.5) n++; }); return n; }
function desFlank(e){ if(e.flanked) return 0; const here=towerCover(e.cx,e.cy); if(here<2) return 0; return .62; }
function desRally(e){ if((e.rallyCd||0)>e.age) return 0; return capNear(e,2.2)>=3?.7:0; }
function pathField(tx,ty){ const d=new Array(N*N).fill(Infinity), done=new Array(N*N).fill(false); d[idx(tx,ty)]=0;
  for(;;){ let u=-1,m=Infinity; for(let i=0;i<N*N;i++) if(!done[i]&&d[i]<m){ m=d[i]; u=i; } if(u<0) break; done[u]=true; const ux=u%N, uy=(u/N)|0, tb=S.grid[u].b, en=tb&&u!==idx(tx,ty)?DEF[tb.type].enter:1;
    for(const [a,b] of NB){ const nx=ux+a, ny=uy+b; if(!inb(nx,ny)) continue; const v=idx(nx,ny); if(!S.grid[v].land) continue; if(d[u]+en<d[v]) d[v]=d[u]+en; } }
  return d; }
function setPlan(e,mode){ const say2=t=>floatText(e.x,e.y,t,'#FFB27A');
  if(mode==='assault'){ e.plan=null; return; }
  if(mode==='retreat'){ let sp=null,bd=1e9; for(const [x,y] of S.spawns||[]){ const d=Math.hypot(x-e.cx,y-e.cy); if(d<bd){ bd=d; sp=[x,y]; } } if(!sp){ e.plan=null; return; } e.retreated=true; e.plan={mode,tx:sp[0],ty:sp[1],pd:pathField(sp[0],sp[1])}; say2(T('Fall back!')); return; }
  if(mode==='breach'){ const c=e.cand; if(!c){ e.plan=null; return; } e.plan={mode,tx:c[0],ty:c[1],pd:pathField(c[0],c[1])}; say2(T('Break that wall!')); return; }
  if(mode==='flank'){ let best=null,bv=1e9; for(let a=0;a<12;a++){ const ang=a/12*6.283, x=Math.round(C+Math.cos(ang)*3.5), y=Math.round(C+Math.sin(ang)*3.5); if(!inb(x,y)||!G(x,y).land||G(x,y).b) continue; const v=towerCover(x,y)*3+Math.hypot(x-e.cx,y-e.cy)*.4; if(v<bv){ bv=v; best=[x,y]; } }
    e.flanked=true; if(!best){ e.plan=null; return; } e.plan={mode,tx:best[0],ty:best[1],pd:pathField(best[0],best[1])}; say2(T('Around the side!')); return; }
  if(mode==='rally'){ let n=0; for(const o of S.enemies) if(!o.gone&&o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<2.4){ o.rallyT=6; n++; } e.rallyT=6; e.rallyCd=e.age+12; e.plan={mode:'rally',until:e.age+1.2}; say2(T('With me!')); sfx('horn'); return; } }
function planStep(e){ const p=e.plan; if(p.mode==='rally'){ if(e.age>p.until) e.plan=null; return null; }
  if(p.mode==='breach'&&!G(p.tx,p.ty).b){ e.plan=null; return null; }
  const here=p.pd[idx(e.cx,e.cy)]; if(here<=0||(p.mode!=='breach'&&here<=1&&e.cx===p.tx&&e.cy===p.ty)){ if(p.mode!=='retreat'||e.hp>=e.max*.75) e.plan=null; return null; }
  let bx=-1,by=-1,bd=here; for(const [a,b] of NB){ const nx=e.cx+a,ny=e.cy+b; if(!inb(nx,ny)) continue; const dv=p.pd[idx(nx,ny)]; if(dv<bd){ bd=dv; bx=nx; by=ny; } }
  if(bx<0){ e.plan=null; return null; } return [bx,by]; }
// ---------- PeerJS: two-player co-op ----------
const NET={role:null,peer:null,conn:null,bc:null,code:null,pings:[],nid:0,liveT:0,fullT:0,fullVer:-1,applying:false,gmap:new Map(),host:''};
function loadScript(src){ return new Promise((res,rej)=>{ const sc=document.createElement('script'); sc.src=src; sc.onload=res; sc.onerror=rej; document.head.appendChild(sc); }); }
async function peerReady(){ if(window.Peer) return true; try{ await loadScript('https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'); }catch(e){} return !!window.Peer; }
function netSend(o){ const s=JSON.stringify(o); try{ if(NET.conn&&NET.conn.open) NET.conn.send(s); }catch(e){} try{ if(NET.bc) NET.bc.postMessage(s); }catch(e){} }
function coopStatus(){ const on=!!NET.role, c=$('cCoop'); c.hidden=!on; const ok=(NET.conn&&NET.conn.open)||NET.bcPeer; $('coopT').textContent=!on?'':!ok?T('Waiting · {{c}}',{c:NET.code||'…'}):NET.role==='host'?T('Co-op host'):T('Co-op guest'); renderCoopBar(); }
function renderCoopBar(){ const b=$('coopbar'); if(!NET.role){ b.hidden=true; return; } b.hidden=false; const ok=(NET.conn&&NET.conn.open)||NET.bcPeer;
  b.innerHTML=`<b>${NET.role==='host'?T('You host this kingdom'):T('You are co-ruling a friend’s kingdom')}</b><span style="color:var(--muted)">${ok?(NET.role==='host'?T('Your friend’s taps arrive as build orders and pings.'):T('Your taps send build orders to the host’s hero.')):T('Share code {{c}} with your friend.',{c:NET.code})}</span>
    <span style="flex:1"></span>${['👍','⚠','🛡','🎉'].map(x=>`<button type="button" data-emo="${x}" ${ok?'':'disabled'}>${x}</button>`).join('')}<button type="button" class="pingb" aria-pressed="${!!NET.pingMode}" ${ok?'':'disabled'}>${T('Ping')}</button><button type="button" data-leave>${T('Leave')}</button>`;
  b.querySelectorAll('[data-emo]').forEach(x=>x.addEventListener('click',()=>{ netSend({t:'emo',e:x.dataset.emo}); toast(T('You'),x.dataset.emo,'💬'); }));
  b.querySelector('.pingb').addEventListener('click',()=>{ NET.pingMode=!NET.pingMode; renderCoopBar(); say(NET.pingMode?T('Tap the valley to ping a spot for your friend.'):''); });
  b.querySelector('[data-leave]').addEventListener('click',leaveCoop); }
function addPing(x,y,who){ NET.pings.push({x,y,t:clock,who}); if(NET.pings.length>8) NET.pings.shift(); }
function drawPings(){ for(let i=NET.pings.length-1;i>=0;i--){ const p=NET.pings[i], a=clock-p.t; if(a>3){ NET.pings.splice(i,1); continue; } const [px,py]=scr(W2(p.x),.05,W2(p.y)), col=p.who==='me'?'134,182,255':'199,125,255';
  for(let k=0;k<2;k++){ const q=((a*1.2+k*.5)%1); hctx.strokeStyle=`rgba(${col},${(1-q)*(1-a/3)})`; hctx.lineWidth=2.5; hctx.beginPath(); hctx.ellipse(px,py,10+q*30,(10+q*30)*.55,0,0,6.29); hctx.stroke(); }
  hctx.fillStyle=`rgba(${col},${1-a/3})`; hctx.beginPath(); hctx.moveTo(px,py); hctx.lineTo(px-7,py-18); hctx.lineTo(px+7,py-18); hctx.closePath(); hctx.fill(); } }
function coopDialog(){
  if(!S||S.over){ say(T('Start or continue a kingdom first.')); return; }
  const can=typeof RTCPeerConnection!=='undefined';
  showOver(T('Play together'),T('One player hosts the kingdom and runs the game. A friend joins with a four-letter code and co-rules: their taps send build orders to the hero, they can trade at the market, ping spots on the map and send quick signals.')+(can?'':' '+T('This page cannot open player-to-player connections. Open the web version at smallcrown.netlify.app to play together.')),[
    {label:T('Host this kingdom'),sub:T('Get a code to share'),primary:true,fn:()=>{ hideOver(); startHost(); }},
    {label:T('Join a friend'),sub:T('Enter their code'),fn:()=>{ hideOver(); joinDialog(); }},
    {label:T('Cancel'),fn:()=>hideOver()}]); }
function joinDialog(){ showOver(T('Join a friend'),T('Enter the four-letter code your friend sees.'),[{label:T('Cancel'),fn:()=>hideOver()}]);
  const card=$('over').querySelector('.card'), box=document.createElement('div'); box.className='sharebox';
  box.innerHTML=`<input type="text" maxlength="4" autocapitalize="characters" autocomplete="off" aria-label="${T('Code')}" style="font:600 26px var(--f-num);letter-spacing:.3em;text-align:center;text-transform:uppercase;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px"><div class="sb"><button type="button" class="pri">${T('Join')}</button></div><small class="err" hidden></small>`;
  card.insertBefore(box,card.querySelector('.opts')); const inp=box.querySelector('input'); setTimeout(()=>inp.focus(),50);
  const go=()=>{ const c=inp.value.trim().toUpperCase(); if(!/^[A-Z]{4}$/.test(c)){ const er=box.querySelector('.err'); er.hidden=false; er.textContent=T('Codes are four letters.'); return; } hideOver(); startGuest(c); };
  box.querySelector('.pri').addEventListener('click',go); inp.addEventListener('keydown',e=>{ if(e.key==='Enter') go(); }); }
function bcFor(code){ if(!window.__coopBC||typeof BroadcastChannel==='undefined') return null; const bc=new BroadcastChannel('smallcrown-coop-'+code); bc.onmessage=m=>{ if(!NET.bcPeer){ NET.bcPeer=true; coopStatus(); } onNet(m.data); }; return bc; }
async function startHost(){ leaveCoop(true); NET.role='host'; NET.code=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[(Math.random()*23)|0]).join(''); NET.fullVer=-1; coopStatus();
  NET.bc=bcFor(NET.code);
  if(!NET.bc){ if(!(await peerReady())||typeof RTCPeerConnection==='undefined'){ say(T('Co-op could not start here. Open the web version at smallcrown.netlify.app to play together.')); leaveCoop(true); return; }
    try{ NET.peer=new Peer('smallcrown-'+NET.code.toLowerCase()); NET.peer.on('connection',c=>{ if(NET.conn&&NET.conn.open){ c.close(); return; } NET.conn=c; c.on('open',()=>{ NET.fullVer=-1; coopStatus(); toast(T('Co-op'),T('Your friend joined'),'🤝'); }); c.on('data',d=>onNet(d)); c.on('close',()=>{ NET.conn=null; coopStatus(); toast(T('Co-op'),T('Your friend left'),'👋'); }); });
      NET.peer.on('error',err=>{ say(T('Co-op error: {{e}}',{e:err.type||'network'})); }); }catch(e){ leaveCoop(true); return; } }
  showOver(T('Your kingdom code'),T('Tell your friend to choose Settings, Play together, Join a friend, and enter:'),[{label:T('Done'),primary:true,fn:()=>hideOver()}]);
  $('over').querySelector('.card p').insertAdjacentHTML('afterend',`<div class="coopcode">${NET.code}</div>`); }
async function startGuest(code){ leaveCoop(true); NET.role='guest'; NET.code=code; saveOn=false; coopStatus();
  NET.bc=bcFor(code); if(NET.bc){ netSend({t:'hello'}); return; }
  if(!(await peerReady())||typeof RTCPeerConnection==='undefined'){ say(T('Co-op could not start here. Open the web version at smallcrown.netlify.app to play together.')); leaveCoop(); return; }
  NET.peer=new Peer(); NET.peer.on('open',()=>{ const c=NET.peer.connect('smallcrown-'+code.toLowerCase(),{reliable:true}); NET.conn=c; c.on('open',()=>{ coopStatus(); netSend({t:'hello'}); }); c.on('data',d=>onNet(d)); c.on('close',()=>{ toast(T('Co-op'),T('The host ended the session'),'👋'); leaveCoop(); }); });
  NET.peer.on('error',err=>{ say(T('Could not reach code {{c}}. Check it and try again.',{c:code})); leaveCoop(); }); }
function leaveCoop(quiet){ const was=NET.role; try{ NET.conn&&NET.conn.close(); }catch(e){} try{ NET.peer&&NET.peer.destroy(); }catch(e){} try{ NET.bc&&NET.bc.close(); }catch(e){}
  Object.assign(NET,{role:null,peer:null,conn:null,bc:null,bcPeer:false,pingMode:false}); NET.gmap.clear(); coopStatus();
  if(was==='guest'&&quiet!==true){ saveOn=true; S=null; newGame(); } }
function netEnemies(){ return S.enemies.filter(e=>!e.gone).map(e=>{ if(!e.nid) e.nid=++NET.nid; return {n:e.nid,ty:e.type,x:+e.x.toFixed(2),y:+e.y.toFixed(2),d:+(e.dir||0).toFixed(2),hp:e.hp,mx:e.max,m:e.moving?1:0,s:+(e.swing||0).toFixed(2),pl:e.plan&&e.plan.mode||0,pi:e.pirate?1:0,k:e.king||0}; }); }
function hostTick(raw){ const ok=(NET.conn&&NET.conn.open)||NET.bcPeer; if(!ok) return;
  NET.fullT-=raw; if(NET.fullT<=0&&(S.ver!==NET.fullVer||NET.fullT<-6)){ NET.fullT=1.5; NET.fullVer=S.ver; netSend({t:'full',d:saveJSON(),ver:S.ver}); }
  NET.liveT-=raw; if(NET.liveT>0) return; NET.liveT=.1; const h=S.hero;
  netSend({t:'live',ph:S.phase,day:S.day,cur:S.cur,keep:S.keep,km:S.keepMax,res:S.res,pop:S.pop,mood:S.mood,warName:S.warName||null,fever:S.fever||0,
    h:h&&{x:+h.x.toFixed(2),y:+h.y.toFixed(2),d:+(h.dir||0).toFixed(2),hp:h.hp,mx:h.max,dead:h.dead?1:0,m:h.moving?1:0,sw:+(h.swing||0).toFixed(2),q:h.queue.map(q=>[q.x,q.y,q.tool||0])},
    en:netEnemies(),u:S.units.map(u=>({x:+u.x.toFixed(2),y:+u.y.toFixed(2),d:+(u.dir||0).toFixed(2),hp:u.hp,mx:u.max}))}); }
function onNet(raw){ let m; try{ m=typeof raw==='string'?JSON.parse(raw):raw; }catch(e){ return; } if(!m||!NET.role) return;
  if(m.t==='emo'){ toast(T('Your friend'),m.e,'💬'); sfx('tap'); return; }
  if(m.t==='ping'){ addPing(m.x,m.y,'them'); sfx('tap'); return; }
  if(NET.role==='host'){
    if(m.t==='hello'){ NET.fullVer=-1; NET.fullT=0; coopStatus(); if(NET.bc) toast(T('Co-op'),T('Your friend joined'),'🤝'); }
    else if(m.t==='tap'&&inb(m.x,m.y)){ addPing(m.x,m.y,'them'); if(NET.pingModeRemote) return; NET.applying=true; const t0=S.tool; try{ if(m.tool&&(DEF[m.tool]||m.tool==='clear'||m.tool==='ride')) S.tool=m.tool; place(m.x,m.y); }catch(e){} S.tool=t0; NET.applying=false; ui(); }
    else if(m.t==='trade'){ NET.applying=true; try{ trade(m.r,m.buy); }catch(e){} NET.applying=false; } return; }
  if(m.t==='full'){ const was=S&&S.cur; if(load(m.d)){ Object.assign(S,{perkPending:0,lootPending:0,demand:null,royalMsg:null,petition:null,trader:null}); if(S.aud) S.aud.pend=null; hideOver(); if(was!==S.cur) camFree=null; ui(); } return; }
  if(m.t==='live'&&S){ Object.assign(S,{phase:m.ph,day:m.day,keep:m.keep,keepMax:m.km,res:m.res,pop:m.pop,mood:m.mood,warName:m.warName,fever:m.fever,modal:false});
    const h=S.hero; if(h&&m.h){ h.nx=m.h.x; h.ny=m.h.y; h.dir=m.h.d; h.hp=m.h.hp; h.max=m.h.mx; h.dead=!!m.h.dead; h.moving=!!m.h.m; h.swing=m.h.sw; h.queue=m.h.q.map(([x,y,tool])=>({x,y,tool})); if(h.x==null||Math.hypot(h.x-h.nx,h.y-h.ny)>3){ h.x=h.nx; h.y=h.ny; } }
    const seen=new Set(); for(const o of m.en){ seen.add(o.n); let e=NET.gmap.get(o.n); if(!e){ e={type:o.ty,x:o.x,y:o.y,cx:Math.round(o.x),cy:Math.round(o.y),tx:o.x,ty:o.y,dir:o.d,hp:o.hp,max:o.mx,moving:!!o.m,swing:o.s,age:1,slow:0,hit:0,pirate:!!o.pi,king:o.k||undefined,lane:0,spd:1}; NET.gmap.set(o.n,e); S.enemies.push(e); }
      if(o.hp<e.hp) e.hit=.14; Object.assign(e,{nx:o.x,ny:o.y,dir:o.d,hp:o.hp,max:o.mx,moving:!!o.m,swing:o.s,plan:o.pl?{mode:o.pl}:null}); }
    for(const [n,e] of NET.gmap) if(!seen.has(n)){ e.gone=true; e.died=true; NET.gmap.delete(n); }
    S.enemies=S.enemies.filter(e=>!e.gone);
    S.units.forEach((u,i)=>{ const o=m.u[i]; if(o){ u.nx=o.x; u.ny=o.y; u.dir=o.d; u.hp=o.hp; u.max=o.mx; } }); } }
function guestTick(raw){ const k=Math.min(1,raw*12), mv=o=>{ if(o.nx==null) return; o.x+=(o.nx-o.x)*k; o.y+=(o.ny-o.y)*k; };
  if(S.hero) mv(S.hero); S.enemies.forEach(mv); S.units.forEach(mv); for(const f of S.floats) f.life-=raw; S.floats=S.floats.filter(f=>f.life>0); clock; }
let abilKey='';
function syncAbil(){
  const h=S.hero; if(!h) return;
  const c=h.cdC/CHARGE_CD, r=h.cdR/(RALLY_CD*(S.mods.horn?.5:1)), key=c.toFixed(2)+r.toFixed(2)+h.dead+S.over+heroHere();
  if(key===abilKey) return; abilKey=key;
  $('aCharge').style.setProperty('--cd',c); $('aRally').style.setProperty('--cd',r);
  const away=!heroHere(); $('aCharge').disabled=away||h.dead||S.over||c>0; $('aRally').disabled=away||h.dead||S.over||r>0;
  for(const [id,f,cd,k] of [['aCharge',c,h.cdC,'c'],['aRally',r,h.cdR,'r']]){ const el=$(id), on=!el.disabled; el.querySelector('.cdn').textContent=f>0?Math.ceil(cd):'';
    el.classList.toggle('ready',on); if(on&&!abReady[k]){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } abReady[k]=on; }
}
function render(raw,t){
  FR=raw;
  const target=(S.phase==='night'||S.phase==='over')?1:0;
  nightA+=(target-nightA)*Math.min(1,raw*(reduce?20:.62));
  syncBuildings(); animateBuildings(t); syncEnemies(); syncHero(t,raw); syncShots(); syncPuffs(); syncRoutes(t); syncSpawns(t); syncSelection(); syncGhost(); syncLight(t);
  if(gridLines){ const want=(S.phase==='day'&&!S.over&&!S.modal&&DEF[S.tool])?(nightA>.3?0:.2):0, mt=gridLines.material; mt.opacity+=(want-mt.opacity)*Math.min(1,raw*8); gridLines.visible=mt.opacity>.01; }
  updateCamera(raw);
  syncMirage(raw,t);
  if(camera===orthoCam){
    camera.position.copy(camTarget).add(CAM_DIR);
    if(shake>0&&!reduce){ camera.position.x+=(Math.random()-.5)*shake*.5; camera.position.z+=(Math.random()-.5)*shake*.5; }
    camera.lookAt(camera.position.clone().sub(CAM_DIR)); }
  glowMat.opacity=nightA*.6;
  if(!paused) stepBurn(raw,t);
  syncAmbient(raw,t); syncHud(); if(NET.role==='host') hostTick(raw);
  if(quality==='high'||mirK>.01) initBloom();
  const post=!!(composer&&(quality==='high'||mirK>.01)); $('board').classList.toggle('post',post);
  if(post){ bloom.enabled=nightA>.03||mirK>.05; bloom.strength=Math.max(nightA*.75,mirK*.55);
    if(mirPass){ mirPass.enabled=mirK>.01; const U=mirPass.uniforms; U.uK.value=mirK; U.uTime.value=reduce?0:clock; U.uSpeed.value=reduce?0:mirSpeed; }
    if(renderPassRef) renderPassRef.camera=camera;
    if(finish){ const U=finish.uniforms; U.tilt.value=reduce?0:(viewNear?Math.min(1,.55+.12*(zoomHH-2.2)):.35); U.warm.value=.32*(1-nightA)+goldK*1.15; U.sat.value=1.1-nightA*.18+goldK*.08; U.vig.value=.3+nightA*.12; }
    composer.render(); }
  else renderer.render(scene,camera);
  if(!paused){ stepFx(raw); stepPhys(raw); }
  const go=(Math.pow(nightA,1.6)*.72).toFixed(2); if(gradeEl.style.opacity!==go) gradeEl.style.opacity=go;
  const gc=S.blood&&S.phase!=='day'?'#9A2030':'#3756B8'; if(gradeEl.dataset.c!==gc){ gradeEl.dataset.c=gc; gradeEl.style.background=gc; }
  drawHud(); drawFolkHud(); drawMini(); syncAbil(); syncMusicTempo();
  if(!paused&&!S.modal) syncFleet(raw);
  if(waterMesh&&waterMesh.material.uniforms&&!paused) waterMesh.material.uniforms.time.value+=raw*.45;
}

