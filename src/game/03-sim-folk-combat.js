// =============== TOWNSFOLK ===============
const FOLK_NAMES=['Amira','Bilal','Cora','Dario','Esme','Farid','Greta','Hamid','Ines','Jory','Kasim','Lena','Malik','Nadia','Omar','Petra','Quill','Rana','Samir','Tessa','Umar','Vera','Wren','Yusuf','Zara','Bram','Elif','Hugo','Leila','Milo','Noor','Otto','Pia','Rhys','Sana','Tomas','Yara','Idris','Mina','Arlo'];
const SKINS=[0xF0C8A0,0xE2B488,0xC48A5E,0x9A6844,0x6E4A32], HAIRS=[0x2A1E16,0x4A3020,0x7A5030,0xC8A060,0x1A1A1A,0x8A3A20];
const CLOTH=[0xA9553E,0x9A6A9A,0x6A8A5A,0xB0884A,0x5A7A9A,0xC9A86A,0x8A4A5A,0x4A6A6A,0xD8C8A8,0x7A8A3A];
const ROLE={pasture:'shepherd',weaver:'weaver',brewery:'brewer',saltpan:'salter',workshop:'artisan',farm:'farmer',lumber:'woodcutter',mine:'miner',market:'merchant',harbor:'fisher',smith:'smith',tavern:'tavernkeeper'};
const ROLE_NAME={shepherd:'Shepherd',weaver:'Weaver',brewer:'Brewer',salter:'Salt worker',artisan:'Toolmaker',trader:'Trader',farmer:'Farmer',woodcutter:'Woodcutter',miner:'Miner',merchant:'Merchant',fisher:'Fisher',smith:'Smith',tavernkeeper:'Tavern keeper',child:'Child',elder:'Elder',water:'Water carrier',townsfolk:'Townsperson'};
const ROLE_TOOL={shepherd:'cane',salter:'hoe',artisan:'hammer',farmer:'hoe',woodcutter:'axe',miner:'pick',fisher:'rod',smith:'hammer',merchant:'basket',tavernkeeper:'mug',elder:'cane'};
const ACT={shepherd:'rest',weaver:'sweep',brewer:'sweep',salter:'hoe',artisan:'hammer',farmer:'hoe',woodcutter:'chop',miner:'chop',fisher:'fish',smith:'hammer',merchant:'sell',tavernkeeper:'sweep'};
const CARGO={shepherd:'wool',weaver:'cloth',brewer:'ale',salter:'salt',artisan:'tools',farmer:'crop',woodcutter:'wood',miner:'ore',fisher:'fish'};
const folk=[], animals=[]; let folkSeq=0, folkSpawnT=0, smokeT=0, selFolk=null;
function folkReset(){ folk.length=0; animals.length=0; selFolk=null; }
function folkWant(){ let b=0; each(x=>{ if(x.type!=='keep'&&x.type!=='road'&&x.type!=='wall'&&x.type!=='trap') b++; });
  const base=S.cur==='home'?2+Math.round(S.pop*.9)+Math.floor(b/4):1+Math.floor(b*.8);
  return Math.min(S.cur==='home'?26:12,Math.max(0,Math.round(base*(S.mood<35?.65:1)))); }
function nearPass(x,y){ for(const [a,c] of [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) if(passHero(x+a,y+c)) return [x+a*.56,y+c*.56]; return null; }
function folkDoor(){
  const h=[]; each((b,x,y)=>{ if(b.type==='house'||b.type==='tavern') h.push([x,y]); });
  if(h.length&&Math.random()<.8){ const [x,y]=h[(Math.random()*h.length)|0], p=nearPass(x,y); if(p) return p; }
  const d=keepDoors(), q=d[(Math.random()*d.length)|0]; return [q[0]+(Math.random()-.5)*.3,q[1]+(Math.random()-.5)*.3];
}
function nearestHome(f){ let best=null,bd=1e9; each((b,x,y)=>{ if(b.type!=='house'&&b.type!=='keep'&&b.type!=='tavern') return; const d=Math.hypot(x-f.x,y-f.y); if(d<bd){bd=d;best=[x,y];} }); return best||[C,C]; }
function spawnFolk(jobs){
  const taken=new Set(folk.filter(f=>f.job!=null).map(f=>f.job));
  const open=jobs.filter(j=>!taken.has(j.i));
  let role, job=null;
  if(open.length&&Math.random()<.85){ const j=open[0]; role=j.role; job=j.i; }
  else{ const hasWell=S.grid.some(t=>t.b&&t.b.type==='well'), kids=S.grid.some(t=>t.b&&t.b.type==='house');
    const pool=['townsfolk','townsfolk','elder']; if(kids) pool.push('child','child'); if(hasWell) pool.push('water'); role=pool[(Math.random()*pool.length)|0]; }
  const id=folkSeq++, h=hash(id,7,S.seed||1), [x,y]=folkDoor();
  const f={id,name:FOLK_NAMES[Math.floor(hash(id,3,(S.seed||1)+S.cur.length)*FOLK_NAMES.length)],role,job,x,y,dir:Math.random()*6.28,age:Math.random()*5,moving:false,goal:null,t:Math.random()*.6,state:'wait',carry:null,emote:null,
    child:role==='child',elder:role==='elder',spd:role==='child'?1.25:role==='elder'?.5:.8,skirt:h<.48,
    skin:SKINS[Math.floor(hash(id,5,9)*SKINS.length)],hair:role==='elder'?0xC8C4BC:HAIRS[Math.floor(hash(id,11,2)*HAIRS.length)],cloth:CLOTH[Math.floor(hash(id,13,4)*CLOTH.length)],cloth2:CLOTH[Math.floor(hash(id,17,6)*CLOTH.length)]};
  folk.push(f); if(Math.random()<.35) emote(f,['☀','♪','♥'][(Math.random()*3)|0],1.6);
}
function emote(f,ch,t=2){ f.emote={ch,t,max:t}; }
function goTo(f,x,y,stop,then){ f.goal=[x,y,stop,then]; f.state='go'; }
function randomSpot(cx,cy,r){ for(let k=0;k<8;k++){ const x=cx+(Math.random()-.5)*2*r, y=cy+(Math.random()-.5)*2*r; if(passHero(Math.round(x),Math.round(y))) return [x,y]; } return null; }
function bldOf(type){ const out=[]; each((b,x,y)=>{ if(b.type===type) out.push([x,y]); }); return out.length?out[(Math.random()*out.length)|0]:null; }
function nextTask(f){
  const jb=f.job!=null?S.grid[f.job].b:null;
  if(f.job!=null&&(!jb||ROLE[jb.type]!==f.role)){ f.job=null; f.role='townsfolk'; }
  if(f.job!=null){ const jx=f.job%N, jy=(f.job/N)|0;
    if(f.carry){ const mk=f.role!=='merchant'&&Math.random()<.5?bldOf('market'):null, dst=mk||[C,C];
      goTo(f,dst[0],dst[1],.62,()=>{ f.carry=null; f.state='wait'; f.t=.8+Math.random()*1.5; if(Math.random()<.3) emote(f,'✓',1.2); }); return; }
    const onTile=jb.type==='farm';
    const tx=onTile?jx+(Math.random()-.5)*.6:jx, ty=onTile?jy+(Math.random()-.5)*.6:jy;
    goTo(f,tx,ty,onTile?.05:.62,()=>{ f.state='act'; f.act=ACT[f.role]||'sell'; f.t=4+Math.random()*4; f.dir=Math.atan2(jy-f.y,jx-f.x)+(onTile?Math.random()*6:0);
      f.after=()=>{ if(CARGO[f.role]&&Math.random()<.75){ f.carry=f.role==='miner'&&S.kind==='mountain'?'iron':CARGO[f.role]; } else { f.state='wait'; f.t=.5+Math.random(); } }; });
    return; }
  switch(f.role){
    case 'child':{ const p=randomSpot(f.x,f.y,1.6)||randomSpot(C,C+1,2); if(p){ goTo(f,p[0],p[1],.05,()=>{ f.state='wait'; f.t=.2+Math.random()*.7; if(Math.random()<.25) emote(f,Math.random()<.5?'♪':'!',1); }); f.state='play'; } else f.t=1; return; }
    case 'water':{ if(f.carry){ const h=bldOf('house')||[C,C]; goTo(f,h[0],h[1],.62,()=>{ f.carry=null; f.state='wait'; f.t=1; }); return; }
      const w=bldOf('well'); if(!w){ f.role='townsfolk'; f.t=.5; return; }
      goTo(f,w[0],w[1],.6,()=>{ f.state='act'; f.act='fill'; f.t=2.2; f.after=()=>{ f.carry='water'; }; }); return; }
  }
  // townsfolk and elders pick something to do
  const r=Math.random();
  if((S.mood>=75&&r<.18)||(S.feastDay===S.day&&r<.5)){ const p=randomSpot(C,C+1.6,1); if(p){ goTo(f,p[0],p[1],.05,()=>{ f.state='act'; f.act='dance'; f.t=5+Math.random()*3; emote(f,'♪',2.5); f.after=null; }); return; } }
  if(r<.42){ const mate=folk.find(o=>o!==f&&o.state==='wait'&&o.job==null&&!o.child&&o.t>0&&Math.hypot(o.x-f.x,o.y-f.y)<3.5&&!o.partner);
    if(mate){ mate.partner=f; mate.t=99; goTo(f,mate.x+Math.cos(mate.dir)*.32,mate.y+Math.sin(mate.dir)*.32,.02,()=>{ const T=4+Math.random()*3; f.state=mate.state='act'; f.act=mate.act='chat'; f.t=mate.t=T; f.dir=Math.atan2(mate.y-f.y,mate.x-f.x); mate.dir=f.dir+Math.PI; emote(f,'…',1.4); setTimeout(()=>{ if(mate.state==='act') emote(mate,['…','♥','?','!'][(Math.random()*4)|0],1.4); },1200); f.after=null; mate.after=()=>{ mate.partner=null; }; }); return; } }
  const opts=[];
  if(bldOf('shrine')) opts.push(['shrine','pray','✦']); if(bldOf('tavern')) opts.push(['tavern','drink','♪']); if(bldOf('market')) opts.push(['market','browse','◎']); if(bldOf('well')) opts.push(['well','rest','~']);
  if(f.elder&&bldOf('shrine')) opts.push(['shrine','pray','✦']);
  if(opts.length&&r<.75){ const [type,act,ch]=opts[(Math.random()*opts.length)|0], b=bldOf(type);
    goTo(f,b[0],b[1],.6+Math.random()*.15,()=>{ f.state='act'; f.act=act; f.t=4+Math.random()*4; f.dir=Math.atan2(b[1]-f.y,b[0]-f.x); if(Math.random()<.6) emote(f,ch,2); f.after=null; }); return; }
  const rd=[]; each((b,x,y)=>{ if(b.type==='road') rd.push([x,y]); });
  const p=rd.length&&Math.random()<.5?rd[(Math.random()*rd.length)|0]:randomSpot(C,C,4);
  if(p){ goTo(f,p[0]+(Math.random()-.5)*.4,p[1]+(Math.random()-.5)*.4,.05,()=>{ f.state='wait'; f.t=1+Math.random()*2.5; }); } else f.t=1;
}
function stepFolk(dt){
  if(S.phase!=='day'){
    animals.length=0;
    for(const f of folk){ if(f.state!=='flee'){ f.state='flee'; f.partner=null; f.carry=null; const h=nearestHome(f); f.goal=[h[0],h[1],.55,null]; f.t=5; emote(f,'!',1.5); } }
    for(const f of folk){ f.age+=dt; if(f.emote){ f.emote.t-=dt; if(f.emote.t<=0) f.emote=null; } const d=navTo(f,f.goal[0],f.goal[1],f.goal[2],2.3,dt); f.t-=dt; if(d<=f.goal[2]+.05||f.stuck||f.t<=0) f.gone=true; }
    for(let i=folk.length-1;i>=0;i--) if(folk[i].gone){ if(selFolk===folk[i]) selFolk=null; folk.splice(i,1); }
    return;
  }
  const want=folkWant();
  folkSpawnT-=dt;
  if(folk.length<want&&folkSpawnT<=0){ folkSpawnT=.45; const jobs=[]; each((b,x,y)=>{ const r=ROLE[b.type]; if(r&&(b.worked||b.type==='smith'||b.type==='tavern')) jobs.push({i:idx(x,y),role:r}); }); spawnFolk(jobs); }
  if(folk.length>want+1){ const f=folk.find(o=>o.job==null&&o!==selFolk&&o.role!=='trader'&&!(S.req&&o.name===S.req.name)); if(f) folk.splice(folk.indexOf(f),1); }
  if(S.req&&S.cur==='home'&&!folk.some(f=>f.name===S.req.name)){ const f=folk.find(o=>!o.child&&o.role!=='trader'); if(f) f.name=S.req.name; }
  const trHere=S.trader&&S.trader.day===S.day&&S.cur==='home'&&S.trader.items.length;
  if(trHere&&!folk.some(f=>f.role==='trader')){ const d=keepDoors(), p=d[d.length>2?2:0]; folk.push({id:folkSeq++,name:'Idris',role:'trader',job:null,x:p[0]+.15,y:p[1]+.2,dir:Math.PI/2,age:0,moving:false,goal:null,t:0,state:'act',act:'sell',carry:null,emote:null,spd:.6,skin:0xC48A5E,hair:0x1A1A1A,cloth:0x6A3A7A,cloth2:0xF0BE4E,trader:true}); }
  if(!trHere) for(let i=folk.length-1;i>=0;i--) if(folk[i].role==='trader') folk.splice(i,1);
  for(const f of folk){
    f.age+=dt; if(f.emote){ f.emote.t-=dt; if(f.emote.t<=0) f.emote=null; }
    if(f.role==='trader'){ f.state='act'; f.act='sell'; f.t=1; if(!f.emote&&Math.random()<dt*.25) emote(f,'⚖',2); continue; }
    if(S.req&&f.name===S.req.name&&!f.emote&&Math.random()<dt*.6) emote(f,'★',1.6);
    if(f.goal){ const sp=f.state==='play'?1.5:f.spd*(onRoad(f)?1.35:1); const d=navTo(f,f.goal[0],f.goal[1],f.goal[2],sp,dt);
      if(f.stuck){ f.goal=null; f.state='wait'; f.t=.8+Math.random(); f.carry=null; continue; }
      if(d<=f.goal[2]+.04){ const g=f.goal; f.goal=null; f.moving=false; if(g[3]) g[3](); }
      continue; }
    f.moving=false;
    if(f.t>0){ f.t-=dt; if(f.t<=0&&f.state==='act'){ const a=f.after; f.after=null; f.state='wait'; f.t=.3; if(a) a(); } continue; }
    if(f.partner&&f.state==='wait') continue;
    nextTask(f);
  }
  stepAnimals(dt);
}
// ---------- animals ----------
function animalWant(){
  const L=[]; let farms=0,houses=0; each(b=>{ if(b.type==='farm') farms++; if(b.type==='house') houses++; });
  const ch=Math.min(8,farms*2+Math.min(2,houses)); for(let i=0;i<ch;i++) L.push('chicken');
  const dg=Math.min(3,Math.floor((houses+1)/2)); for(let i=0;i<dg;i++) L.push('dog');
  if(S.kind==='mountain') for(let i=0;i<4;i++) L.push('goat');
  { let ps=0; each(b=>{ if(b.type==='pasture') ps++; }); for(let i=0;i<Math.min(6,ps*2);i++) L.push('goat'); }
  if(S.kind==='coast') for(let i=0;i<4;i++) L.push('crab');
  return L;
}
function animalAnchor(kind){
  if(kind==='chicken'){ const b=bldOf('farm')||bldOf('house'); if(b){ const p=nearPass(b[0],b[1]); if(p) return p; } }
  if(kind==='crab'){ const c=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(G(x,y).land&&!G(x,y).b&&NB.some(([a,d])=>isSea(x+a,y+d))) c.push([x,y+.25]); if(c.length) return c[(Math.random()*c.length)|0]; }
  if(kind==='goat'){ const b=bldOf('pasture'); if(b&&Math.random()<.8){ const p=nearPass(b[0],b[1]); if(p) return p; } const p=randomSpot(C,C,4.5); if(p) return p; }
  return folkDoor();
}
function stepAnimals(dt){
  const want=animalWant(), have={}; animals.forEach(a=>have[a.kind]=(have[a.kind]||0)+1);
  const need={}; want.forEach(k=>need[k]=(need[k]||0)+1);
  for(const k in need) if((have[k]||0)<need[k]&&Math.random()<dt*2){ const [x,y]=animalAnchor(k); animals.push({kind:k,x,y,ax:x,ay:y,dir:Math.random()*6.28,t:Math.random(),moving:false,age:Math.random()*9,goal:null,owner:null}); }
  for(let i=animals.length-1;i>=0;i--){ const a=animals[i]; if((have[a.kind]||0)>(need[a.kind]||0)){ animals.splice(i,1); have[a.kind]--; } }
  for(const a of animals){
    a.age+=dt;
    if(a.kind==='dog'){ if(!a.owner||!folk.includes(a.owner)){ a.owner=folk.length?folk[(Math.random()*folk.length)|0]:null; }
      if(a.owner&&Math.random()<.995){ const o=a.owner, d=Math.hypot(o.x-a.x,o.y-a.y); if(d>.55){ navTo(a,o.x-Math.cos(o.dir)*.3,o.y-Math.sin(o.dir)*.3,.35,o.moving?Math.max(.9,o.spd*1.25):.9,dt); } else a.moving=false; continue; } }
    if(a.goal){ const sp=a.kind==='crab'?.35:a.kind==='goat'?.4:a.kind==='dog'?1:.55; const d=moveTo(a,a.goal[0],a.goal[1],sp,.02,dt); if(d<=.05){ a.goal=null; a.t=.6+Math.random()*2.2; a.peck=a.kind==='chicken'&&Math.random()<.7; } continue; }
    a.moving=false; a.t-=dt; if(a.t>0) continue; a.peck=false;
    const r=a.kind==='goat'?1.4:a.kind==='crab'?.6:.7, x=a.ax+(Math.random()-.5)*2*r, y=a.ay+(Math.random()-.5)*2*r;
    if(passHero(Math.round(x),Math.round(y))&&(a.kind!=='crab'||!isSea(Math.round(x),Math.round(y)))) a.goal=[x,y]; else a.t=.4;
  }
}
const heroMax=()=>12+gearHp()+S.mods.hero*6+((S&&S.hl)||1)*2-2+((S&&S.plate)||0)*3, heroDmg=()=>(S&&S.fever>0?2:1)*(2+((S&&S.banner)||0)+(Object.values((S&&S.council)||{}).some(m=>m.trait==='brave')?1:0)+gearDmg()+S.mods.hero*2+Math.floor((((S&&S.hl)||1)-1)/2)), unitMax=()=>4+skill('marshal')+S.mods.drill*2+((S&&S.plate)||0)*2, unitDmg=()=>1+S.mods.drill+((S&&S.iron)||0)+(hasEdict('militia')?1:0);
function mkHero(){ return {x:C,y:C+1,tx:C,ty:C+1,hp:12+((S&&S.mods.hero)||0)*6,max:12+((S&&S.mods.hero)||0)*6,dead:false,respawn:0,atk:0,dir:-Math.PI/2,queue:[],moving:false,age:0,hit:0,swing:0}; }
function spawnUnits(i){
  const b=S.grid[i].b; if(!b||(b.type!=='barr'&&b.type!=='range')||b.unpaid) return;
  const want=b.lvl+1+S.mods.muster+(hasEdict('conscription')?1:0), have=S.units.filter(u=>u.home===i);
  for(let k=0;k<want;k++){ if(have.some(u=>u.slot===k)) continue;
    const x=i%N,y=(i/N)|0, a=k*2.1+.6;
    S.units.push({home:i,slot:k,x:x+Math.cos(a)*.48,y:y+Math.sin(a)*.48,hp:unitMax(),max:unitMax(),atk:0,dir:Math.atan2(C-y,C-x),target:null,age:0,hit:0,swing:0,moving:false,ranged:b.type==='range'}); }
}
function removeBuilding(x,y){
  const i=idx(x,y); G(x,y).b=null; S.units=S.units.filter(u=>u.home!==i);
  if(sel&&sel[0]===x&&sel[1]===y) sel=null;
}
function moveTo(o,tx,ty,spd,stop,dt){
  const dx=tx-o.x,dy=ty-o.y,d=Math.hypot(dx,dy);
  if(d>stop+.005){ const st=Math.min(spd*dt,d-stop); o.x+=dx/d*st; o.y+=dy/d*st; o.dir=Math.atan2(dy,dx); o.moving=true; }
  else o.moving=false;
  return d;
}
// ---------- pathfinding: Dijkstra on the tile grid, then string-pulled into straight runs ----------
const passHero=(x,y)=>{ if(!inb(x,y)) return false; const t=G(x,y); if(!t.land) return false; const b=t.b; return !b||b.type==='farm'||b.type==='trap'||b.type==='road'; };
function findPath(sx,sy,gx,gy,pass=passHero){
  const n=N*N, dist=new Float32Array(n).fill(1e9), prev=new Int32Array(n).fill(-1), done=new Uint8Array(n), s0=idx(sx,sy);
  if(!inb(sx,sy)||!inb(gx,gy)) return null;
  dist[s0]=0; const goalOK=pass(gx,gy);
  for(let it=0;it<n;it++){
    let u=-1,m=1e9; for(let i=0;i<n;i++) if(!done[i]&&dist[i]<m){m=dist[i];u=i}
    if(u<0) return null; done[u]=1;
    const ux=u%N,uy=(u/N)|0;
    if(goalOK?(ux===gx&&uy===gy):Math.max(Math.abs(ux-gx),Math.abs(uy-gy))===1){ const out=[]; for(let v=u;v!==s0;v=prev[v]) out.push([v%N,(v/N)|0]); return out.reverse(); }
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){ if(!dx&&!dy) continue;
      const nx=ux+dx,ny=uy+dy; if(!pass(nx,ny)) continue;
      if(dx&&dy&&(!pass(ux+dx,uy)||!pass(ux,uy+dy))) continue;
      const v=idx(nx,ny), c=dist[u]+(dx&&dy?1.414:1); if(c<dist[v]){dist[v]=c;prev[v]=u} }
  }
  return null;
}
const PROBE=[[0,0],[.2,.2],[-.2,.2],[.2,-.2],[-.2,-.2]];
function clearLine(ax,ay,bx,by,pass=passHero){
  const sx=Math.round(ax),sy=Math.round(ay),ex=Math.round(bx),ey=Math.round(by);
  const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/.15));
  for(let i=1;i<=n;i++){ const t=i/n, x=ax+(bx-ax)*t, y=ay+(by-ay)*t;
    for(const [ox,oy] of PROBE){ const tx=Math.round(x+ox), ty=Math.round(y+oy);
      if((tx===sx&&ty===sy)||(tx===ex&&ty===ey)) continue; if(!pass(tx,ty)) return false; } }
  return true;
}
function smoothPath(sx,sy,P,pass){
  const out=[]; let cx=sx,cy=sy,i=0;
  while(i<P.length){ let j=P.length-1; while(j>i&&!clearLine(cx,cy,P[j][0],P[j][1],pass)) j--; out.push(P[j]); cx=P[j][0]; cy=P[j][1]; i=j+1; }
  return out;
}
// Moves o toward (tx,ty), walking around obstacles. Returns the remaining distance, or Infinity if unreachable.
function navTo(o,tx,ty,stop,spd,dt,pass=passHero){
  o.stuck=false;
  const dG=Math.hypot(tx-o.x,ty-o.y);
  if(dG<=stop+.01){ o.moving=false; o.pathKey=null; return dG; }
  if(clearLine(o.x,o.y,tx,ty,pass)){ o.pathKey=null; moveTo(o,tx,ty,spd,stop,dt); return Math.hypot(tx-o.x,ty-o.y); }
  const key=Math.round(tx)+','+Math.round(ty)+','+S.ver;
  if(o.pathKey!==key){ o.pathKey=key; const P=findPath(Math.round(o.x),Math.round(o.y),Math.round(tx),Math.round(ty),pass); o.noPath=!P; o.path=P?smoothPath(o.x,o.y,P,pass):[]; }
  if(o.noPath){ o.stuck=true; o.moving=false; return Infinity; }
  if(!o.path.length){ moveTo(o,tx,ty,spd,stop,dt); return Math.hypot(tx-o.x,ty-o.y); }
  const w=o.path[0]; moveTo(o,w[0],w[1],spd,0,dt); if(Math.hypot(w[0]-o.x,w[1]-o.y)<.05) o.path.shift();
  return Math.hypot(tx-o.x,ty-o.y);
}
const KD={};   // keys held
const JOY={x:0,y:0};   // touch joystick, -1..1 on each axis
function tryStep(o,dx,dy){
  const cx=Math.round(o.x),cy=Math.round(o.y);
  const ok=(x,y)=>PROBE.every(([ox,oy])=>{ const tx=Math.round(x+ox*.9),ty=Math.round(y+oy*.9); return (tx===cx&&ty===cy)||passHero(tx,ty); });
  if(ok(o.x+dx,o.y)) o.x+=dx;
  if(ok(o.x,o.y+dy)) o.y+=dy;
}
function jobSpot(job,h){
  if(job.spot&&passHero(job.spot[0],job.spot[1])) return job.spot;
  let best=null,bd=1e9;
  for(const [a,c] of NB){ const x=job.x+a,y=job.y+c; if(!passHero(x,y)) continue; const d=Math.hypot(x-h.x,y-h.y); if(d<bd){bd=d;best=[x,y]} }
  job.spot=best; return best;
}
function damageAlly(a,d){
  if(a===S.hero&&hasPerk('shield')) d=Math.max(0,d-1);
  a.hp-=d; a.hit=.14;
  if(a===S.hero){
    if(a.hp<=0&&!a.dead){ a.dead=true; a.respawn=6; a.queue=[]; puff(a.x,a.y,COL.plank,14); sfx('hurt'); say('<b>Your hero is down.</b> He will ride out from the keep again in 6 seconds.'); }
  }else if(a.hp<=0){ puff(a.x,a.y,0x2F5D9E,8); }
}
function rideTo(x,y){
  const h=S.hero; if(h.dead){ say('Your hero is recovering at the keep.'); return; }
  if(h.queue.length&&S.phase==='day'){ h.queue=[]; say('Build orders cleared.'); }
  h.tx=x; h.ty=y; h.tstop=passHero(x,y)?0:.62; h.pathKey=null; rideMark={x,y,life:.9}; camFree=null; sfx('ride');
}
const CHARGE_CD=10, RALLY_CD=24;
function useCharge(){
  const h=S.hero; if(!h||h.dead||S.over||S.modal||(h.cdC||0)>0) return;
  if(!heroHere()){ say(`Your hero is in ${regionName(S.heroAt)}.`); return; }
  let tx=Math.cos(h.dir), ty=Math.sin(h.dir), best=3.2;
  for(const e of S.enemies){ if(e.gone) continue; const d=Math.hypot(e.x-h.x,e.y-h.y); if(d<best){ best=d; tx=(e.x-h.x)/d; ty=(e.y-h.y)/d; } }
  h.dash={t:hasPerk('lance')?.5:.38,dx:tx,dy:ty,hit:new Set()}; h.dir=Math.atan2(ty,tx); h.cdC=CHARGE_CD*(hasPerk('lance')?.6:1)*(gearOn('stormlance')?.65:1); if(!(h.queue.length&&S.phase==='day')){ h.tx=h.x; h.ty=h.y; }
  S.abilUsed=(S.abilUsed||0)+(S.phase==='night'?1:0); sfx('charge'); camFree=null; ui();
}
function useRally(){
  const h=S.hero; if(!h||h.dead||S.over||S.modal||(h.cdR||0)>0) return;
  if(!heroHere()){ say(`Your hero is in ${regionName(S.heroAt)}.`); return; }
  h.cdR=RALLY_CD*(S.mods.horn?.5:1); h.rallyFx=1;
  for(const u of S.units){ u.rally=(hasPerk('inspire')?12:8)+(gearOn('horncharm')?4:0); if(hasPerk('inspire')) u.hp=u.max; else if(gearOn('horncharm')) u.hp=Math.min(u.max,u.hp+3); u.target=null; u.pathKey=null; }
  S.abilUsed=(S.abilUsed||0)+(S.phase==='night'?1:0); sfx('horn');
  say(S.units.length?`<b>Rally!</b> ${plural(S.units.length,'soldier')} rush to your hero.`:'<b>Rally!</b> No soldiers answered. Build a barracks to field some.'); ui();
}
function stepHero(dt){
  const h=S.hero; h.age+=dt; h.hit=Math.max(0,h.hit-dt); h.swing=Math.max(0,h.swing-dt);
  h.cdC=Math.max(0,(h.cdC||0)-dt); h.cdR=Math.max(0,(h.cdR||0)-dt); if(h.rallyFx) h.rallyFx=Math.max(0,h.rallyFx-dt*1.4);
  if(!heroHere()){ h.moving=false; return; }
  if(h.dash&&!h.dead){
    const v=7*dt; tryStep(h,h.dash.dx*v,h.dash.dy*v); h.moving=true; h.dash.t-=dt;
    if(!reduce) dust(h.x,h.y,.9);
    const dmg=3+S.mods.hero*2+(S.mods.horn?2:0);
    for(const e of S.enemies){ if(e.gone||h.dash.hit.has(e)) continue; if(Math.hypot(e.x-h.x,e.y-h.y)<.5){ h.dash.hit.add(e); hurt(e,dmg,'hero'); embers(e.x,e.y,6); e.slow=Math.max(e.slow,.8); h.swing=.25; sfx('slash'); } }
    if(h.dash.t<=0){ h.dash=null; h.tx=h.x; h.ty=h.y; h.pathKey=null;
      if(hasPerk('whirlwind')){ for(const e of S.enemies) if(!e.gone&&Math.hypot(e.x-h.x,e.y-h.y)<1.05) hurt(e,dmg,'hero'); embers(h.x,h.y,22); h.swing=.25; shake=Math.max(shake,.1); } }
    return;
  }
  if(h.dead){ h.moving=false; h.respawn-=dt;
    if(h.respawn<=0){ h.dead=false; h.hp=h.max=heroMax(); h.x=C; h.y=C+.8; h.tx=C; h.ty=C+1.1; h.pathKey=null; floatText(C,C,'Hero returns',CSS.ink); } return; }
  let foe=null,fd=9;
  for(const e of S.enemies){ if(e.gone) continue; const d=Math.hypot(e.x-h.x,e.y-h.y); if(d<fd){fd=d;foe=e} }
  const SPD=3*(hasPerk('swift')?1.3:1)*(gearOn('seacoat')?1.15:1)*(wxNight('snow')?.85:1)*(onRoad(h)?1.4:1)*(S.fever>0?1.45:1);
  let mx=(KD.d?1:0)-(KD.a?1:0)+JOY.x, my=(KD.s?1:0)-(KD.w?1:0)+JOY.y; const ml=Math.hypot(mx,my);
  if(heroCam&&ml>.12){ const f=[Math.cos(chYaw),Math.sin(chYaw)], rt=[-Math.sin(chYaw),Math.cos(chYaw)], a=mx, b=-my; mx=rt[0]*a+f[0]*b; my=rt[1]*a+f[1]*b; }
  if(ml>.12){
    const k=Math.min(1,ml); tryStep(h,mx/ml*SPD*k*dt,my/ml*SPD*k*dt); h.dir=Math.atan2(my,mx); h.moving=true;
    h.tx=h.x; h.ty=h.y; h.tstop=0; h.pathKey=null; camFree=null;
  }else{
    const job=S.phase==='day'?h.queue[0]:null;
    if(job){
      const spot=jobSpot(job,h);
      const d=spot?navTo(h,spot[0],spot[1],.08,SPD,dt):navTo(h,job.x,job.y,.6,SPD,dt);
      if(h.stuck){ h.queue.shift(); say("Your hero can't reach that spot, so the order was dropped."); sfx('no'); ui(); }
      else if(d<=(spot?.14:.64)){
        h.queue.shift();
        const err=buildError(job.tool,job.x,job.y,false);
        if(err){ say(`Couldn't build there: ${err}`); sfx('no'); }
        else { doBuild(job.tool,job.x,job.y); h.swing=.25; }
        h.dir=Math.atan2(job.y-h.y,job.x-h.x); h.tx=h.x; h.ty=h.y; h.tstop=0;
        if(!passHero(Math.round(h.x),Math.round(h.y))){ const sp=jobSpot({x:job.x,y:job.y},h); if(sp){ h.tx=sp[0]; h.ty=sp[1]; } }
      }
    }else if(foe&&fd<1.7&&Math.hypot(h.tx-h.x,h.ty-h.y)<.06){ navTo(h,foe.x,foe.y,.45,SPD,dt); h.tx=h.x; h.ty=h.y; }
    else{ const st=h.tstop||0, d=navTo(h,h.tx,h.ty,st,SPD,dt); if(h.stuck||d<=st+.03){ h.tx=h.x; h.ty=h.y; h.tstop=0; if(h.stuck) say("Your hero can't find a way there."); } }
  }
  if(h.moving&&!reduce){ h.dustT=(h.dustT||0)-dt; if(h.dustT<=0){ h.dustT=.06; dust(h.x-Math.cos(h.dir)*.25,h.y-Math.sin(h.dir)*.25,.7); } }
  h.atk-=dt;
  if(foe&&fd<=.72&&h.atk<=0){ h.atk=.55; h.dir=Math.atan2(foe.y-h.y,foe.x-h.x); h.swing=.25; hurt(foe,heroDmg(),'hero'); sfx('slash');
    if(gearOn('wolfbane')){ const o=S.enemies.find(x=>x!==foe&&!x.gone&&Math.hypot(x.x-foe.x,x.y-foe.y)<.8); if(o) hurt(o,heroDmg(),'hero'); } }
  if(gearOn('amulet')&&h.hp<h.max&&!h.dead){ h.amT=(h.amT??2)-dt; if(h.amT<=0){ h.amT=2; h.hp++; } }
  if(hasPerk('secondwind')&&h.hp<h.max){ h.regT=(h.regT??3)-dt; if(h.regT<=0){ h.regT=3; h.hp++; } }
}
function stepUnits(dt){
  for(const u of S.units){
    u.age+=dt; u.hit=Math.max(0,u.hit-dt); u.swing=Math.max(0,u.swing-dt);
    if(u.hp<=0) continue;
    if(u.rally>0) u.rally-=dt;
    const rl=u.rally>0&&!S.hero.dead&&heroHere(), hx=rl?S.hero.x:u.home%N, hy=rl?S.hero.y:(u.home/N)|0, sp=rl?2.6:1.9;
    if(u.ranged){
      let t=null,bd=2.7-wxRange(); for(const e of S.enemies){ if(e.gone) continue; const d=Math.hypot(e.x-u.x,e.y-u.y); if(d<bd){bd=d;t=e} }
      u.atk-=dt; u.aiming=!!t;
      if(t){ u.moving=false; u.dir=Math.atan2(t.y-u.y,t.x-u.x); if(u.atk<=0){ u.atk=rl?.9:1.2; u.swing=.25; S.shots.push({kind:'arrow',src:'soldier',x:u.x,y:u.y,e:t,dmg:unitDmg()+(rl?1:0),h0:.4,h:.4,d0:Math.max(.5,bd),dir:u.dir}); sfx('shot'); } }
      else{ const a=u.slot*2.1+.6+(u.home%5), r=rl?.75:.5; navTo(u,hx+Math.cos(a)*r,hy+Math.sin(a)*r,0,rl?2.6:1.6,dt); if(!u.moving&&!rl) u.dir=Math.atan2(C-hy,C-hx); }
      continue;
    }
    if(u.target&&(u.target.gone||Math.hypot(u.target.x-hx,u.target.y-hy)>2.6)) u.target=null;
    if(!u.target){ let bd=rl?2.2:1.8; for(const e of S.enemies){ if(e.gone) continue; const d=Math.hypot(e.x-hx,e.y-hy); if(d<bd){bd=d;u.target=e} } }
    if(u.target){
      const d=navTo(u,u.target.x,u.target.y,.42,sp,dt);
      u.atk-=dt; if(d<=.56&&u.atk<=0){ u.atk=rl?.6:.8; u.swing=.25; u.dir=Math.atan2(u.target.y-u.y,u.target.x-u.x); hurt(u.target,unitDmg()+(rl?1:0),'soldier'); }
    }else{ const a=u.slot*2.1+.6+(u.home%5), r=rl?.55:.48; navTo(u,hx+Math.cos(a)*r,hy+Math.sin(a)*r,0,rl?2.6:1.6,dt); if(!u.moving&&!rl) u.dir=Math.atan2(C-hy,C-hx); }
  }
  S.units=S.units.filter(u=>u.hp>0);
  for(let i=0;i<S.units.length;i++)for(let j=i+1;j<S.units.length;j++){   // keep soldiers from stacking
    const a=S.units[i],b=S.units[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d>1e-4&&d<.3){ const k=(.3-d)/2/d; a.x-=dx*k;a.y-=dy*k;b.x+=dx*k;b.y+=dy*k; } }
}
function weapon(b){
  const m=S.mods;
  const wr=wxRange();
  const oil=S.oilNights>0?1:0;
  const wf=hasEdict('watch')?.75:1, col=hasWonder('w_colossus')?1:0;
  const kl=S.cur==='home'?(S.keepLvl||1)-1:0;
  if(b.type==='keep') return {range:1.8+m.range*.5-wr+kl*.3,rate:1.3*wf,dmg:1+m.dmg+oil+kl+col*2,min:0,h:1.3};
  if(b.type==='tower'){ const sp=b.spec, rate=Math.max(.36,.75-(b.lvl-1)*.15)*wf*(sp==='ballista'?1.5:1); return {range:2.4+(b.lvl-1)*.35+m.range-wr+(sp==='ballista'?.7:0)+col*.4,rate,dmg:b.lvl+m.dmg+oil+(sp==='ballista'?3:0)+col*2,min:0,h:1.15+.18*b.lvl,burn:sp==='fire'}; }
  if(b.type==='cata') return {range:3.6+(b.lvl-1)*.4+m.range-wr,rate:(2.4-(b.lvl-1)*.5)*(m.cataRate||1),dmg:3+(b.lvl-1)*2,min:1,splash:.95,h:.6};
  return null;
}
const trapMax=()=>TRAP_CHARGES+S.mods.trap*3;
function enemyStats(type){
  const h=2+Math.floor(S.day*.75), s=Math.min(1.7,.95+S.day*.04);
  switch(type){
    case 'runner': return {hp:Math.max(1,Math.ceil(h*.55*DIFF[S.diff].hp)),spd:s*1.55,dmg:1,pay:1};
    case 'brute': return {hp:Math.ceil(h*2.6*DIFF[S.diff].hp),spd:s*.68,dmg:2,pay:2};
    case 'warlord': return {hp:Math.ceil(h*6*DIFF[S.diff].hp),spd:.62,dmg:3,pay:8};
    case 'archer': return {hp:Math.max(1,Math.ceil(h*.75*DIFF[S.diff].hp)),spd:s*.9,dmg:1,pay:2,range:1.9};
    case 'ram': return {hp:Math.ceil(h*4.5*DIFF[S.diff].hp),spd:s*.42,dmg:3,bdmg:7,pay:5};
    case 'shaman': return {hp:Math.ceil(h*.9*DIFF[S.diff].hp),spd:s*.78,dmg:1,pay:3,heal:2};
    case 'knight': return {hp:Math.ceil(h*2.2*DIFF[S.diff].hp),spd:s*.8,dmg:2,bdmg:3,pay:4};
    case 'wolf': return {hp:Math.max(1,Math.ceil(h*.5*DIFF[S.diff].hp)),spd:s*1.75,dmg:1,bdmg:1,pay:1};
    case 'sapper': return {hp:Math.ceil(h*.8*DIFF[S.diff].hp),spd:s*.85,dmg:1,pay:3,boom:9};
    case 'captain': return {hp:Math.ceil(h*5*DIFF[S.diff].hp),spd:.72,dmg:3,pay:12};
    default: return {hp:Math.ceil(h*DIFF[S.diff].hp),spd:s,dmg:1,pay:1};
  }
}
function startNight(){ S.fever=0; S.feverM=0; S.streak=0;
  if(S.phase!=='day'||S.over||S.modal) return;
  closeRealm(); closeWorld();
  if(S.raid!==S.cur) enterRegion(S.raid,false);
  S.phase='night'; S.spawnT=S.kind==='coast'?3:.5; S.nightKills=0; S.keepAtDusk=S.keep; S.lostTonight=0; S.nr={}; S.nightGold=0; S.nightTotal=S.queue.length;
  if(S.hero.queue.length){ S.hero.queue=[]; }
  spawnMercs();
  sfx('bell'); if(S.kind==='coast'){ launchPirates(); seaBattle(); }
  S.warName=S.queue.includes('warlord')?trace('warlord'):null;
  showHudBanner(T('Night {{n}}',{n:S.day})+(S.blood?' · '+T('Blood moon'):''),(S.warName?T('Warlord {{n}}',{n:S.warName})+' · ':'')+T('{{n}} raiders',{n:S.queue.length})+' · '+T(regionName(S.cur)),S.blood?'#FF8A7A':'#B9CCF0');
  say(`<b>Night ${S.day}.</b> ${waveText().replace(/^./,c=>c.toUpperCase())}.${heroHere()?'':` Your hero is in ${regionName(S.heroAt)}, so ${regionName(S.cur)} stands on its own tonight.`}`);
  ui();
}
function spawnNext(){
  let type=S.queue.shift(), king=null; if(type&&type.startsWith('knight:')){ king=type.slice(7); type='knight'; }
  const [x,y]=S.spawns[(Math.random()*S.spawns.length)|0];
  const st={...enemyStats(type)}; if(dmod('swift')) st.spd*=1.2;
  if(S.kind==='coast'&&S.grid.some(t=>t.b&&t.b.type==='lighthouse')) st.hp=Math.max(1,Math.round(st.hp*.75));
  const horiz=Math.abs(x-C)>=Math.abs(y-C);
  const ox=x+(horiz?Math.sign(x-C)*.9:0), oy=y+(horiz?0:Math.sign(y-C)*.9);   // walk in from the rocks
  S.enemies.push({king,pirate:S.kind==='coast'&&type!=='knight',type,x:ox,y:oy,cx:x,cy:y,tx:x,ty:y,moving:true,atk:.6,dir:Math.atan2(C-y,C-x),age:0,slow:0,hit:0,swing:0,lane:(Math.random()-.5)*.38,max:st.hp,...st});
}
function dawn(){
  const REP={day:S.day,region:S.cur,kills:S.nightKills||0,total:Math.max(S.nightTotal||0,S.nightKills||0),keep:Math.max(0,(S.keepAtDusk??S.keep)-S.keep),lost:S.lostTonight||0,gold:S.nightGold||0,by:{...(S.nr||{})},sunk:S.sunkTonight||0}; S.sunkTonight=0;
  if(S.heroAt&&S.cur!==S.heroAt) enterRegion(S.heroAt,false);
  const E=econ();
  eachAll((b,x,y,t,here,rid)=>{
    if(b.type==='keep') return;
    if(b.worked&&here){
      if(b.type==='farm') floatText(x,y,`+${farmOut()} food`,RCOL.food);
      if(b.type==='lumber') floatText(x,y,`+${4+S.mods.wood} wood`,RCOL.wood);
      if(b.type==='mine') floatText(x,y,rid==='mountain'?`+${2+S.mods.stone} iron`:`+${3+S.mods.stone} stone`,rid==='mountain'?RCOL.iron:RCOL.stone);
      if(b.type==='market') floatText(x,y,`+${3+(season().name==='Harvest'?2:0)} gold`,RCOL.gold);
    }
    if(b.type==='trap') b.charges=trapMax();
    else b.hp=Math.min(b.max,b.hp+(b.type==='wall'?2:1));
  });
  if(S.pop) floatText(C,C,`+${S.pop} taxes`,RCOL.gold);
  ALLR.forEach(r=>S.res[r]=Math.max(0,(S.res[r]||0)+E.net[r]));
  const notes=[];
  S.hungry=S.res.food<0; S.cold=season().name==='Winter'&&S.res.wood<0;
  if(S.res.food<0) S.res.food=0;
  if(S.res.wood<0){ S.res.wood=0; notes.push('<b>Cold houses:</b> not enough wood to heat every home'); }
  const MI=moodInfo(), m0=S.mood; S.mood=Math.max(0,Math.min(100,Math.round(S.mood+(MI.target-S.mood)*.5)));
  if(S.mood<35&&m0>=35) notes.push('<b>Unrest:</b> your villagers are unhappy');
  gainXP(5);
  S.pop=Math.max(0,S.pop+E.popD);
  if(E.popD<0) notes.push(`<b>Famine:</b> ${plural(-E.popD,'villager')} left for lack of food`);
  else if(E.popD>0) notes.push(`${E.popD===1?'A new villager':E.popD+' new villagers'} moved in`);
  eachAll(b=>{b.unpaid=false});
  if(S.res.gold<0){ let short=-S.res.gold; S.res.gold=0;
    eachAll(b=>{ if(short>0&&DEF[b.type].upkeep){ b.unpaid=true; short--; } });
    notes.push('<b>Upkeep unpaid:</b> some catapults or barracks sit out tonight'); }
  updatePrices();
  const ev=rollEvent(); if(ev) notes.push(ev);
  clampPrices();
  S.units=S.units.filter(u=>{ const b=S.grid[u.home].b; return !u.merc&&b&&!b.unpaid; });
  for(const id in S.R) if(S.R[id].units) S.R[id].units=S.R[id].units.filter(u=>!u.merc);
  S.mercs=0;
  S.units.forEach(u=>{u.hp=u.max=unitMax(); u.target=null});
  S.grid.forEach((t,i)=>{ if(t.b&&(t.b.type==='barr'||t.b.type==='range')) spawnUnits(i); });
  if(S.hero.dead){S.hero.dead=false;S.hero.x=C;S.hero.y=C+1;S.hero.tx=C;S.hero.ty=C+1}
  S.hero.hp=S.hero.max=heroMax();
  S.keep=Math.min(S.keepMax,S.keep+1);
  for(const id in S.R) if(id!==S.cur&&S.R[id].keep!=null) S.R[id].keep=Math.min(S.R[id].keepMax,S.R[id].keep+1);
  const lost=REP.keep, felled=REP.kills, wasBoss=S.day%5===0;
  S.day++; S.phase='day'; S.shots=[]; ageRubble();
  if(S.day-1>best){best=S.day-1;try{localStorage.setItem(BEST,best)}catch(e){}}
  const seaBefore=SEASONS[Math.floor((S.day-2)/5)%4];
  if(S.blood) S.survivedBlood=true;
  S.weather=rollWeather(); S.blood=S.day>=6&&S.day%5!==0&&Math.random()<(dmod('blood')?.36:.18);
  if(season()!==seaBefore) notes.push(`<b>${season().name} begins</b>`);
  if(S.weather!=='clear') notes.push(`<b>${WX[S.weather].name}:</b> ${WX[S.weather].desc}`);
  if(S.blood) notes.push('<b>Blood moon tonight:</b> half again as many raiders, and every kill pays double');
  if(!S.coastUnlocked&&S.day>=3){ S.coastUnlocked=true; S.daily?seeded(S.daily.key+3,genCoast):genCoast(); notes.push(`<b>Scouts found ${regionName('coast')}</b> to the south. Open the realm map to ride there and build a harbor`); toast(T('New region'),T('Saltreach Cove'),'⚓'); }
  if(!S.mtnUnlocked&&S.day>=7){ S.mtnUnlocked=true; S.daily?seeded(S.daily.key+7,genMountain):genMountain(); notes.push(`<b>Scouts crossed the northern mountains</b> and found ${regionName('mountain')}, with iron in the rock. Ride there from the realm map`); toast(T('New region'),T('Ironpeak Pass'),'⛰'); }
  if(S.mtnUnlocked&&(season().name==='Winter'||S.weather==='snow')&&Math.random()<.35) withRegion('mountain',()=>{
    const c=[]; each((b,x,y)=>{ if(b.type!=='keep'&&b.type!=='road'&&b.type!=='trap'&&NB.some(([a,d])=>!inb(x+a,y+d)||!G(x+a,y+d).land)) c.push([b,x,y]); });
    if(c.length){ const [b]=c[(Math.random()*c.length)|0]; b.hp=Math.max(1,b.hp-Math.ceil(b.max*.6)); notes.push(`<b>Avalanche!</b> Snow buried part of the ${DEF[b.type].name.toLowerCase()} in ${regionName('mountain')}. Repair it before the next raid`); } });
  const shipsHome=resolveVoyages(notes);
  const ropts=[]; if(S.coastUnlocked&&S.day>=5) ropts.push('coast'); if(S.mtnUnlocked&&S.day>=9) ropts.push('mountain');
  { const w=[['home',S.day%5===0?999:Math.max(8,host('nomads').h)]]; for(const r of ropts){ const h=host(facOf(r)).h; if(h>=15&&S.day%5!==0) w.push([r,h*.8]); }
    let t=w.reduce((a,x)=>a+x[1],0)*Math.random(); S.raid='home'; for(const [r,v] of w){ t-=v; if(t<=0){ S.raid=r; break; } } }
  for(const id in S.R) if(id!==S.raid){ if(id===S.cur) S.spawns=[]; else S.R[id].spawns=[]; }
  withRegion(S.raid,()=>pickSpawns()); field(); planWave(); sfx('dawn');
  if(S.coastUnlocked||S.mtnUnlocked) notes.push(`<b>Tonight’s raid will strike ${regionName(S.raid)}</b>${S.heroAt!==S.raid?`, and your hero is in ${regionName(S.heroAt)}`:''}`);
  if(S.kind==='coast') rebuildFleet(shipsHome);
  const justWon=!S.won&&S.day-1>=WIN_NIGHTS; if(justWon) S.won=true;
  const gains=RES.filter(r=>E.net[r]).map(r=>`${E.net[r]>0?'+':''}${E.net[r]} ${r}`).join(', ');
  say(`<b>Dawn, day ${S.day}.</b> Felled ${plural(felled,'raider')}${lost>0?`, keep took ${lost} damage`:''}. ${gains?`Ledger: ${gains}. `:''}${notes.length?notes.join('. ')+'. ':''}Tonight: ${waveText()}.`);
  save(); ui(); RES.forEach(r=>{ if(E.net[r]) bump('r-'+r,E.net[r]>0?'bump':'hurt'); });
  if(E.popD) bump('r-people',E.popD>0?'bump':'hurt');
  const ch=CHAPTERS.find(c=>c.day===S.day); if(ch) setTimeout(()=>showChapter(ch),600);
  factionDawn(REP); routesDawn(E.shipped||[]);
  { const kn=[]; if(REP.total&&Math.random()<.3) kn.push('<i>'+trace('ballad')+'</i>'); kingdomDawn(kn,REP); crownsDawn(kn); guildDawn(kn); wonderDawn(kn); if(kn.length) $('msg').innerHTML+=' '+kn.join('. ')+'.'; }
  recordHist(); planAudience(); recordDaily(); checkAch(); if(REP.total) setTimeout(()=>showReport(REP),300);
  dawnExtras();
  if(justWon) offerVictory(wasBoss); else if(wasBoss) offerBoons();
}
function offerVictory(thenBoon){
  const sc=recordScore(); party('win');
  const pl=myPlace(), top=standings()[0]; if(pl===1) S.highKing=true;
  showOver(pl===1?'High King of the desert':'The crown holds',`You held the keep through ${WIN_NIGHTS} nights on ${DIFF[S.diff].label}. ${pl===1?'No crown in the desert outshines yours.':`You stand ${ordinal(pl)} among the crowns; ${KINGS[top.id]?KINGS[top.id].name:'another'} still outshines you.`} Score ${sc.toLocaleString()}${sc>=bestScore?', your best yet':''}.`,[
    {label:'Keep ruling',sub:'Endless mode: the raids keep growing',primary:true,fn:()=>{ hideOver(); if(thenBoon) offerBoons(); ui(); }},
    {label:'Found a new kingdom',sub:'Start a fresh valley',fn:newGame}]);
}
function lose(){
  S.over=true; S.phase='over'; sel=null; cineTo(C,C,{zoom:2.3,hold:6,dur:2.2}); debris(C,C,[COL.stone,COL.stoneDark,COL.roof,COL.plank],26,4);
  const held=S.day-1;
  if(held>best){best=held;try{localStorage.setItem(BEST,best)}catch(e){}}
  dropSlot(slot); recordDaily();
  const sc=recordScore();
  showOver('The keep has fallen',`It fell on night ${S.day}. You held ${plural(held,'night')} and felled ${plural(S.kills,'raider')}. Score ${sc.toLocaleString()}${sc>=bestScore&&sc>0?', your best yet':''}.`,
    [{label:'Found a new kingdom',sub:'A fresh valley',primary:true,fn:newGame}]);
  ui();
}
function offerBoons(){
  party('big'); if(S.bossAt) cineTo(S.bossAt[0],S.bossAt[1],{zoom:2.4,hold:1.4});
  const pool=[...BOONS], pick=[];
  while(pick.length<3&&pool.length) pick.push(pool.splice((Math.random()*pool.length)|0,1)[0]);
  showOver('The warlord is dead','Your people offer a boon. Choose one.',
    pick.map(b=>({label:b.name,sub:b.desc,fn:()=>{b.apply();S.ver++;hideOver();sfx('build');save();ui()}})));
}
function showOver(title,text,opts){
  S.modal=true;
  const o=$('over'); o.innerHTML=`<div class="card"><div class="orn"><svg viewBox="0 0 22 14" aria-hidden="true"><path d="M3 11V5l3 3 5-6 5 6 3-3v6z" fill="currentColor"/></svg></div><h2></h2><p></p><div class="opts"></div></div>`;
  o.querySelector('h2').textContent=title; o.querySelector('p').textContent=text;
  if(window.gsap&&!reduce) requestAnimationFrame(()=>{ const c=o.querySelector('.card'); if(c){ gsap.fromTo(c.querySelectorAll('.opts>*'),{opacity:0,y:8},{opacity:1,y:0,duration:.3,stagger:.06,delay:.12,clearProps:'transform,opacity'}); } });
  const box=o.querySelector('.opts');
  opts.forEach(op=>{
    const b=document.createElement('button'); b.type='button'; b.className='opt'+(op.primary?' primary':'');
    b.innerHTML='<b></b><span></span>'; b.querySelector('b').textContent=op.label; b.querySelector('span').textContent=op.sub||'';
    b.addEventListener('click',op.fn); box.appendChild(b);
  });
  o.hidden=false; setTimeout(()=>box.querySelector('button')?.focus(),30);
}
function hideOver(){ if(S) S.modal=false; $('over').hidden=true; }
function spentOf(b){ return typeof b.spent==='number'?{gold:b.spent}:(b.spent||{}); }
function refundOf(b){
  const total=addC(DEF[b.type].cost,spentOf(b)), full=b.day===S.day&&S.phase==='day', out={};
  RES.forEach(r=>{ if(total[r]) out[r]=full?total[r]:Math.floor(total[r]/2); });
  return out;
}
function place(x,y){
  if(NET.role==='guest'&&!NET.applying){ netSend({t:'tap',x,y,tool:S.tool}); addPing(x,y,'me'); sfx('tap'); return; }
  if(S.over||S.modal) return;
  selFolk=null;
  const t=G(x,y);
  if(!t.land){ sel=null; renderInsp(); return; }
  if(t.b&&S.tool!=='clear'){ sel=[x,y]; renderInsp(); return; }
  if(S.phase!=='day'||S.tool==='ride'){
    sel=null; renderInsp(); rideTo(x,y);
    if(!t.b&&t.ore&&S.phase==='day') say('Blue-grey ore. Build a mine here for 5 gold every dawn.');
    return;
  }
  if(S.tool==='clear'){
    if(!t.b){ say('Nothing to clear here.'); return; }
    if(t.b.type==='keep'){ say('That is your keep. Protect it.'); return; }
    clearAt(x,y); return;
  }
  const h=S.hero, qi=h.queue.findIndex(q=>q.x===x&&q.y===y);
  if(qi>=0){ h.queue.splice(qi,1); say('Order cancelled.'); ui(); return; }
  queueOrder(x,y,false);
}
const MAXQ=12;
function queueOrder(x,y,quiet){
  const h=S.hero;
  if(!heroHere()){ if(!quiet){ say(`Your hero is in ${regionName(S.heroAt)}. Open the realm map to ride here, then give build orders.`); sfx('no'); } return false; }
  if(h.queue.some(q=>q.x===x&&q.y===y)) return false;
  const err=buildError(S.tool,x,y,true);
  if(err){ if(!quiet){ say(cap1(err)); sfx('no'); } return false; }
  if(h.queue.length>=MAXQ){ say(`Your hero can hold ${MAXQ} orders at a time.`); return false; }
  h.queue.push({tool:S.tool,x,y}); camFree=null; sfx('order');
  say(h.dead?'Order noted. Your hero will build once he is back on his feet.':`${DEF[S.tool].name} ordered${h.queue.length>1?`, ${h.queue.length} in the queue`:''}. Your hero is riding out.`);
  ui(); return true;
}
function buildError(tool,x,y,planning){
  const t=G(x,y), d=DEF[tool];
  if(t.b) return 'something already stands there.';
  if(isSpawn(x,y)) return 'raiders enter there tonight. Build further in.';
  if(d.need==='ore'&&!t.ore) return 'mines need ore. Look for the blue-grey stones.';
  if(d.need==='grove'&&!t.grove) return 'lumber camps go in a palm grove.';
  if(d.need==='shore'&&S.kind!=='coast') return `there is no sea here. Build ${tool==='lighthouse'?'lighthouses':tool==='saltpan'?'salt pans':'harbors'} at Saltreach Cove.`;
  if(d.need==='shore'&&tool==='lighthouse'&&count('lighthouse')>=1) return 'one lighthouse lights the whole cove.';
  if(tool==='smith'&&count('smith')>=1) return 'one blacksmith is enough for the whole realm.';
  if(d.wonder&&count(tool)>=1) return 'every wonder can be built only once.';
  if(d.wonder&&S.cur!=='home') return 'wonders rise only in The Valley.';
  if(d.wonder&&rankIdx()<d.rank) return `the ${d.name} needs your realm to be a ${RANKS[d.rank].name.toLowerCase()}.`;
  if(d.need==='shore'&&!NB.some(([a,c])=>isSea(x+a,y+c))) return `${tool==='lighthouse'?'lighthouses':tool==='saltpan'?'salt pans':'harbors'} go on the shore, right next to the water.`;
  if(t.grove&&d.need!=='grove') return 'that palm grove is for a lumber camp.';
  if(t.ore&&d.need!=='ore') return 'that ore is for a mine.';
  if(d.unlock&&S.day<d.unlock) return `the ${d.name.toLowerCase()} unlocks on day ${d.unlock}.`;
  const reserved=planning?S.hero.queue.reduce((a,q)=>addC(a,DEF[q.tool].cost),{}):{};
  const short=RES.filter(r=>(d.cost[r]||0)>S.res[r]-(reserved[r]||0)).map(r=>`${(d.cost[r]||0)-(S.res[r]-(reserved[r]||0))} more ${r}`);
  if(short.length) return `a ${d.name.toLowerCase()} costs ${costStr(d.cost)}. You need ${joinList(short)}${Object.keys(reserved).length?' on top of your queued orders':''}.`;
  return null;
}
function doBuild(tool,x,y){
  const d=DEF[tool];
  spend(d.cost);
  const max=Math.round((d.hp+(tool==='wall'?S.mods.wall*5:0))*(hasPerk('mason')?1.5:1));
  G(x,y).b={type:tool,hp:max,max,lvl:1,cd:0,day:S.day,spent:0,born:S.t};
  if(d.wonder){ G(x,y).b.prog=0; G(x,y).b.done=false; say(`<b>The ${d.name} is begun.</b> It needs ${d.days} dawns of work, a villager on site and ${costStr(d.daily)} each dawn.`); }
  if(tool==='trap') G(x,y).b.charges=trapMax();
  if(tool==='barr'||tool==='range') spawnUnits(idx(x,y));
  puff(x,y,COL.sand,10); dustRing(x,y);
  field(); sfx('build'); save(); ui();
  if(tool==='mine'||tool==='farm') say(`${d.name} built. It produces at dawn once a villager works it.`);
  else if(tool==='barr') say('Barracks built. Its soldiers hold the ground around it. Upkeep: 1 gold a dawn.');
  else if(tool==='house') say(`House built. Room for ${housing()} villagers now.`);
  else if(tool==='lumber') say('Lumber camp built. It cuts wood at dawn.');
  else if(tool==='market') say('Market built. Tap it to trade goods for gold.');
  else if(tool==='well') say('Well built. Villagers are happier, and fire keeps away from the buildings around it.');
  else if(tool==='shrine') say('Shrine built. Your villagers\u2019 mood rises.');
  else if(tool==='pasture') say('Goat pasture built. A shepherd raises goats for wool, which weavers turn into cloth.');
  else if(tool==='storehouse') say(`Storehouse built. Every good can now be stored up to ${storeCap()}.`);
  else if(tool==='brewery') say('Brewery built. It turns 3 food into 2 ale each dawn. Villagers want ale.');
  else if(tool==='weaver') say('Weaver built. It turns 2 wool into 2 cloth each dawn. Villagers need clothes, and Vellmar pays well for cloth.');
  else if(tool==='saltpan') say('Salt pans built. Salt keeps food from spoiling, villagers want it, and Kharum buys it.');
  else if(tool==='workshop') say('Workshop built. It turns iron and wood into tools. With enough tools, every producer yields 1 more.');
  else if(tool==='lighthouse') say('Lighthouse built. Pirates land weakened, and your warships find their boats more easily.');
  else if(tool==='smith') say('Blacksmith built. Tap it to forge arms and plate from iron.');
  else if(tool==='tavern') say('Tavern built. It cheers your villagers and earns gold. Tap it to hire sellswords for the night.');
  else if(tool==='road') say('Road laid. Your hero rides faster on roads, and producers next to one yield 1 more.');
  else if(tool==='harbor'){ say('Harbor built. It fishes for food and berths a ship. Tap it to send trade voyages.'); rebuildFleet(); }
  else if(tool==='range') say('Archery range built. Its archers shoot raiders from range. Upkeep: 1 gold a dawn.');
}
function clearAt(x,y){
  const t=G(x,y), back=refundOf(t.b);
  RES.forEach(r=>S.res[r]+=back[r]||0); removeBuilding(x,y);
  puff(x,y,COL.woodLight,8); floatText(x,y,'refund',CSS.gold);
  field(); sfx('build'); save(); ui(); say(`Cleared. Got back ${costStr(back)||'nothing'}.`);
}
function upgradeSel(){
  if(!sel||S.over||S.modal) return;
  const b=G(...sel).b; if(!b) return;
  const up=DEF[b.type].upg; if(!up||b.lvl>up.length) return;
  const c=up[b.lvl-1];
  if(!canPay(c)){ say(`Upgrading needs ${costStr(c)}.`); sfx('no'); return; }
  spend(c); b.lvl++; b.spent=addC(spentOf(b),c); b.max+=b.type==='wall'?10:2; b.hp=b.max; b.born=S.t;
  if(b.type==='barr'||b.type==='range') spawnUnits(idx(...sel));
  puff(sel[0],sel[1],COL.gold,10); sfx('up'); S.ver++;
  say(`${DEF[b.type].name} raised to level ${b.lvl}.`); save(); ui();
}
function step(dt){
  stepFever(dt);
  S.t+=dt;
  stepHero(dt);
  stepWalkers(dt);
  if(S.phase==='night'){
    stepUnits(dt);
    if(S.queue.length){ S.spawnT-=dt; if(S.spawnT<=0){ spawnNext(); S.spawnT=Math.max(.35,1.1-S.day*.04); } }
    for(const e of S.enemies) moveEnemy(e,dt);
    fire(dt);
    for(const s of S.shots){
      if(s.kind==='earrow'){
        const dx=s.tx-s.x,dy=s.ty-s.y,d=Math.hypot(dx,dy),v=9*dt;
        if(d<=v){ s.done=true; const t=s.t;
          if(t.kind==='ally'){ if(!(t.o.hp<=0||t.o.dead)&&Math.hypot(t.o.x-s.tx,t.o.y-s.ty)<.6) damageAlly(t.o,s.dmg); }
          else damageBuilding(t.x,t.y,s.dmg); }
        else{ s.x+=dx/d*v; s.y+=dy/d*v; s.h=.25+Math.sin(Math.min(1,d/2)*Math.PI)*.25; }
        continue;
      }
      if(s.kind==='arrow'){
        const e=s.e; if(e.gone){s.done=true;continue}
        const dx=e.x-s.x,dy=e.y-s.y,d=Math.hypot(dx,dy),v=11*dt;
        s.dir=Math.atan2(dy,dx); s.h=.3+(s.h0-.3)*Math.min(1,d/s.d0);
        if(d<=v){ s.done=true; hurt(e,s.dmg,s.src||'tower'); if(s.burn&&!e.gone) e.burn=3; } else { s.x+=dx/d*v; s.y+=dy/d*v; }
      }else{
        s.p+=dt/s.dur;
        if(s.p>=1){ s.done=true; puff(s.tx,s.ty,COL.sand,12); scorch(s.tx,s.ty); embers(s.tx,s.ty,26); sfx('thud'); shake=Math.max(shake,.08);
          for(const e of S.enemies) if(Math.hypot(e.x-s.tx,e.y-s.ty)<=s.splash) hurt(e,s.dmg,'cata'); }
      }
    }
    S.shots=S.shots.filter(s=>!s.done);
    S.enemies=S.enemies.filter(e=>!e.gone);
    if(S.keep<=0){ if(S.cur==='home') return lose(); plunder(); }
    if(!S.queue.length&&!S.enemies.length) dawn();
  }
  for(const p of S.puffs){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.93;p.vy*=.93;p.h+=p.vh*dt;p.vh-=7*dt;if(p.h<.03){p.h=.03;p.vh=0}p.life-=dt}
  S.puffs=S.puffs.filter(p=>p.life>0);
  for(const f of S.floats) f.life-=dt;
  S.floats=S.floats.filter(f=>f.life>0);
}
function hurt(e,d,src){
  if(e.gone) return;
  e.hp-=d; e.hit=.14;
  if(e.hp<=0){
    e.gone=true; e.died=true; if(e.type==='warlord'||e.type==='captain') S.bossAt=[e.x,e.y]; const pay=(e.pay+S.mods.tax+(src==='hero'&&hasPerk('bounty')?2:0))*(S.blood&&S.phase==='night'?2:1);
    if(src==='hero') gainXP(e.pay*3);
    S.res.gold+=pay; S.kills++; S.nightKills++; feverKill(); S.nightGold=(S.nightGold||0)+pay; const nr=S.nr||(S.nr={}); nr[src||'other']=(nr[src||'other']||0)+1;
    if(e.type==='warlord'&&S.warName) toast(T('Warlord slain'),S.warName,'⚔');
    if(e.type==='warlord'||e.type==='captain'){ addRenown(10); S.lootPending=(S.lootPending||0)+1; shiftHost(facOf(S.cur),-15,true); }
    if(src==='hero'&&gearOn('coin')){ S.res.gold+=2; }
    if(e.type==='knight'&&e.king&&S.crowns&&S.crowns[e.king]){ const k=S.crowns[e.king]; k.army=Math.max(5,k.army-1); k.ws=(k.ws||0)+.25; }
    if(e.type==='captain'){ S.res.gold+=25; S.nightGold+=25; toast(T('Pirate captain defeated'),T('+25 gold from his sea chest'),'☠'); }
    puff(e.x,e.y,COL.foeLight,e.type==='warlord'?18:8); embers(e.x,e.y,e.type==='warlord'?30:7); floatText(e.x,e.y,'+'+pay,CSS.gold);
    sfx('kill'); ui();
  }
}
function boom(e,x,y,hit){
  e.gone=true; if(hit) damageBuilding(x,y,e.boom||9);
  for(const [a,c] of NB){ const nx=x+a,ny=y+c; if(inb(nx,ny)&&G(nx,ny).b&&G(nx,ny).b.type!=='keep'&&G(nx,ny).b.type!=='road') damageBuilding(nx,ny,3); }
  for(const u of S.units) if(Math.hypot(u.x-x,u.y-y)<1.1) damageAlly(u,2);
  puff(x,y,0x3A3634,22); embers(x,y,40); scorch(x,y); shake=Math.max(shake,.32); flash=Math.max(flash,.2); sfx('thud'); sfx('hurt');
  if(!S.sapperWarned){ S.sapperWarned=true; say('<b>A sapper blew up!</b> Kill sappers before they reach your walls.'); }
}
function keepHit(d,fromX,fromY){
  S.keep-=d;
  puff((fromX+C)/2,(fromY+C)/2,COL.stone,12); embers((fromX+C)/2,(fromY+C)/2,16); floatText(C,C,'−'+d,CSS.foe);
  shake=.35; flash=.35; sfx('hurt'); bump('cHp','hurt'); S.keepHitT=S.t; debris(C,C,[COL.stone,COL.stoneDark,COL.plank],Math.min(6,2+d),2.4);
  try{navigator.vibrate&&navigator.vibrate(60)}catch(err){}
  ui();
}
function damageBuilding(x,y,d){
  const b=G(x,y).b; if(!b) return;
  if(b.type==='keep'){ keepHit(d,x,y); return; }
  b.hp-=d; b.hitT=S.t; puff(x,y,b.type==='wall'?COL.wood:COL.stone,4); sfx('chip');
  if(b.hp<=0){ S.lostTonight++; collapse(x,y,b.type); puff(x,y,COL.woodLight,16); embers(x,y,14); addRubble(x,y,b.type); removeBuilding(x,y); field(); renderInsp(); }
}
function archerTarget(e){
  const R=e.range; let best=null,bd=R;
  const h=S.hero; if(!h.dead&&heroHere()){ const d=Math.hypot(h.x-e.x,h.y-e.y); if(d<bd){bd=d;best={kind:'ally',o:h,x:h.x,y:h.y};} }
  for(const u of S.units){ if(u.hp<=0) continue; const d=Math.hypot(u.x-e.x,u.y-e.y); if(d<bd){bd=d;best={kind:'ally',o:u,x:u.x,y:u.y};} }
  if(best) return best;
  for(let y=Math.max(0,Math.floor(e.y-R));y<=Math.min(N-1,Math.ceil(e.y+R));y++)for(let x=Math.max(0,Math.floor(e.x-R));x<=Math.min(N-1,Math.ceil(e.x+R));x++){
    const b=G(x,y).b; if(!b||b.type==='trap'||b.type==='farm'||b.type==='road') continue; const d=Math.hypot(x-e.x,y-e.y); if(d<bd){bd=d;best={kind:'bld',x,y};} }
  return best;
}
function moveEnemy(e,dt){
  e.age+=dt; if(e.rallyT>0) e.rallyT-=dt; if((e.type==='warlord'||e.type==='captain')&&!e.gone) thinkCaptain(e,dt);
  if(e.burn>0){ e.burn-=dt; e.burnT=(e.burnT??1)-dt; if(!reduce&&Math.random()<dt*8) emit(FLM,e.x,e.y,.25,.4,.18); if(e.burnT<=0){ e.burnT=1; hurt(e,1,'tower'); if(e.gone) return; } } e.hit=Math.max(0,e.hit-dt); e.slow=Math.max(0,e.slow-dt);
  let foe=e.foe;
  if(foe&&(foe.hp<=0||foe.dead||Math.hypot(foe.x-e.x,foe.y-e.y)>.8)) foe=e.foe=null;
  if(!foe&&e.age>.3&&e.type!=='ram'){
    if(e.type!=='runner') for(const u of S.units) if(u.hp>0&&Math.hypot(u.x-e.x,u.y-e.y)<.5){ foe=u; break; }
    if(!foe&&!S.hero.dead&&heroHere()&&Math.hypot(S.hero.x-e.x,S.hero.y-e.y)<.5) foe=S.hero;
    e.foe=foe;
  }
  if(foe){ e.dir=Math.atan2(foe.y-e.y,foe.x-e.x); e.atk-=dt; e.swing=Math.max(0,1-e.atk);
    if(e.atk<=0){ e.atk=1; damageAlly(foe,e.dmg+(e.rallyT>0?1:0)); sfx('chip'); if(foe===S.hero&&gearOn('thornmail')) hurt(e,1,'hero'); } return; }
  if(e.heal){ e.swing=Math.max(0,(e.swing||0)-dt*1.5); e.healT=(e.healT??1)-dt; if(e.healT<=0){ e.healT=1.6; let n=0; for(const o of S.enemies){ if(o===e||o.gone||o.hp>=o.max||Math.hypot(o.x-e.x,o.y-e.y)>1.4) continue; o.hp=Math.min(o.max,o.hp+e.heal); n++; puff(o.x,o.y,0x7CFF9A,3); } if(n){ e.swing=1; floatText(e.x,e.y,'heal',CSS.good||'#8FCB7E'); } } }
  if(e.type==='archer'&&!e.moving&&e.age>.6){
    const t=archerTarget(e);
    if(t){ e.dir=Math.atan2(t.y-e.y,t.x-e.x); e.shotT=(e.shotT??.5)-dt; e.swing=Math.min(1,Math.max(0,1-e.shotT/1.5));
      if(e.shotT<=0){ e.shotT=1.6; e.swing=0; S.shots.push({kind:'earrow',x:e.x,y:e.y,tx:t.x,ty:t.y,t,dmg:e.dmg,h:.4,dir:e.dir}); sfx('shot'); }
      return; }
  }
  if(e.moving){
    const dx=e.tx-e.x,dy=e.ty-e.y,d=Math.hypot(dx,dy),v=e.spd*(e.slow>0?.5:1)*(e.rallyT>0?1.25:1)*wxSlow()*dt;
    if(d>1e-4) e.dir=Math.atan2(dy,dx);
    if(d<=v){
      e.x=e.tx;e.y=e.ty;e.cx=e.tx;e.cy=e.ty;e.moving=false;
      const b=G(e.cx,e.cy).b;
      if(b&&b.type==='trap'&&b.charges>0&&e.type!=='ram'){ b.charges--; S.ver++; e.slow=1.3; puff(e.cx,e.cy,COL.steel,5); hurt(e,1+S.mods.trap,'trap'); }
    }else{e.x+=dx/d*v;e.y+=dy/d*v; if(!reduce&&Math.random()<dt*(e.type==='ram'?6:2.2)) dust(e.x,e.y,e.type==='ram'?.8:.45);}
    return;
  }
  const n=(e.plan&&e.plan.pd?planStep(e):null)||nextStep(e.cx,e.cy); if(!n) return;
  e.dir=Math.atan2(n[1]-e.cy,n[0]-e.cx);
  const b=G(n[0],n[1]).b;
  if(b&&b.type==='keep'){ e.gone=true; keepHit(e.type==='sapper'?4:e.dmg,e.cx,e.cy); if(e.type==='sapper') boom(e,n[0],n[1],false); return; }
  if(b&&b.type!=='trap'&&b.type!=='road'&&e.type==='sapper'){ boom(e,n[0],n[1],true); return; }
  if(b&&b.type!=='trap'&&b.type!=='road'){
    e.atk-=dt; e.swing=Math.max(0,1-e.atk);
    if(e.atk<=0){ e.atk=e.type==='ram'?1.4:1; if(e.type==='ram'){ shake=Math.max(shake,.12); embers(n[0],n[1],5); } damageBuilding(n[0],n[1],(e.bdmg||e.dmg)+(e.rallyT>0?1:0)); }
    return;
  }
  e.swing=0; e.tx=n[0];e.ty=n[1];e.moving=true;
}
function fire(dt){
  each((b,x,y)=>{
    const w=weapon(b); if(!w||b.unpaid) return;
    b.cd=(b.cd||0)-dt; if(b.cd>0) return;
    let tgt=null,tp=Infinity;
    for(const e of S.enemies){
      if(e.gone) continue;
      const d=Math.hypot(e.x-x,e.y-y); if(d>w.range||d<w.min) continue;
      const pr=S.dist[idx(e.cx,e.cy)]+d*.01;
      if(pr<tp){tp=pr;tgt=e}
    }
    if(!tgt) return;
    b.cd=w.rate; b.aim=Math.atan2(tgt.y-y,tgt.x-x);
    if(b.type==='cata'){
      const dur=.8, lead=tgt.moving?tgt.spd*(tgt.slow>0?.5:1)*dur*.8:0;
      S.shots.push({kind:'stone',sx:x,sy:y,tx:tgt.x+Math.cos(tgt.dir)*lead,ty:tgt.y+Math.sin(tgt.dir)*lead,p:0,dur,dmg:w.dmg,splash:w.splash});
    }else{
      S.shots.push({kind:'arrow',burn:w.burn,x,y,e:tgt,dmg:w.dmg,h0:w.h,h:w.h,d0:Math.max(.5,Math.hypot(tgt.x-x,tgt.y-y)),dir:b.aim});
      sfx('shot');
    }
  });
}
const FX=[];
function embers(x,y,n){ if(reduce) n=Math.ceil(n/3); for(let i=0;i<n;i++){ const a=Math.random()*6.28,s=.3+Math.random()*1.6; FX.push({x,y,h:.25,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vh:1+Math.random()*2.6,life:.45+Math.random()*.6,hue:18+Math.random()*28}); } }
function dust(x,y,s){ S.puffs.push({x:x+(Math.random()-.5)*.12,y:y+(Math.random()-.5)*.12,h:.04,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,vh:.5+Math.random()*.6,life:.35+Math.random()*.25,col:nightA>.5?0x6A6F9A:COL.pebble,rot:Math.random()*3,s}); }
function dustRing(x,y){ const n=reduce?6:16; for(let i=0;i<n;i++){ const a=i/n*6.283; S.puffs.push({x:x+Math.cos(a)*.42,y:y+Math.sin(a)*.42,h:.05,vx:Math.cos(a)*.9,vy:Math.sin(a)*.9,vh:.6+Math.random()*.8,life:.5+Math.random()*.3,col:COL.pebble,rot:a,s:1.1}); } }
function puff(x,y,col,n){ if(reduce) n=Math.ceil(n/3); for(let i=0;i<n;i++){const a=Math.random()*6.28,s=.4+Math.random()*1.4;S.puffs.push({x,y,h:.15,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vh:1.5+Math.random()*2,life:.45+Math.random()*.4,col,rot:Math.random()*3})} }
function floatText(x,y,text,col){ S.floats.push({x,y,text,col,life:1.2}); }

