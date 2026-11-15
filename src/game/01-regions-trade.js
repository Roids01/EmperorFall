// ---------- regions: the region on screen lives in S.grid and friends; the others wait in S.R ----------
const REGIONS={home:{name:'The Valley',fort:'Keep',desc:'Your canyon home. If its keep falls, the kingdom falls.'},
  coast:{name:'Saltreach Cove',fort:'Fort',desc:'A sheltered cove to the south where ships can land. If its fort falls, raiders plunder your stores.'},
  mountain:{name:'Ironpeak Pass',fort:'Watch fort',desc:'A high, snowy pass to the north. Mines here dig iron. Avalanches can bury buildings near the cliffs.'}};
const RK=['grid','spawns','seed','units','keep','keepMax','kind','shore'];
function stash(){ const r=S.R[S.cur]||(S.R[S.cur]={}); RK.forEach(k=>r[k]=S[k]); }
function unstash(id){ const r=S.R[id]; RK.forEach(k=>S[k]=r[k]); if(!S.units) S.units=[]; if(!S.spawns) S.spawns=[]; S.cur=id; }
function allGrids(){ const out=[S.grid]; for(const id in S.R) if(id!==S.cur&&S.R[id].grid) out.push(S.R[id].grid); return out; }
function eachAll(fn){ const list=[[S.cur,S.grid]]; for(const id in S.R) if(id!==S.cur&&S.R[id].grid) list.push([id,S.R[id].grid]);
  for(const [id,g] of list){ const here=g===S.grid; g.forEach((t,i)=>{ if(t.b) fn(t.b,i%N,(i/N)|0,t,here,id,g); }); } }
const roadBy=(g,x,y)=>NB.some(([a,c])=>{ const nx=x+a,ny=y+c; if(nx<0||ny<0||nx>=N||ny>=N) return false; const b=g[ny*N+nx].b; return !!b&&b.type==='road'; });
const onRoad=o=>{ const x=Math.round(o.x),y=Math.round(o.y); return inb(x,y)&&!!G(x,y).b&&G(x,y).b.type==='road'; };
function withRegion(id,fn){ if(id===S.cur) return fn(); const prev=S.cur; stash(); unstash(id); try{ return fn(); } finally{ stash(); unstash(prev); } }
const heroHere=()=>!S.heroAt||S.heroAt===S.cur;
const regionName=id=>REGIONS[id]?REGIONS[id].name:id;
const mkNoise=()=>window.SimplexNoise?new SimplexNoise(Math.random):null;
function shoreAt(fx){ const sh=S.shore; if(!sh) return 99; const x=Math.max(0,Math.min(N-1,fx)), i=Math.floor(x), f=x-i; return sh[i]*(1-f)+sh[Math.min(N-1,i+1)]*f; }
function isSea(x,y){ if(S.kind!=='coast') return false; if(inb(x,y)) return !!G(x,y).water; return y>shoreAt(x); }
function waterDir(x,y){ for(const [a,c] of [[0,1],[1,0],[-1,0],[0,-1]]) if(isSea(x+a,y+c)) return [a,c]; return [0,1]; }
function genCoast(){
  const prev=S.cur; stash();
  Object.assign(S,{cur:'coast',kind:'coast',seed:Math.random()*1000,grid:[],units:[],spawns:[],keep:8,keepMax:8});
  const nz=mkNoise();
  S.shore=[]; for(let x=0;x<N;x++) S.shore.push(Math.max(8,Math.min(11,Math.round(9.4+(nz?nz.noise2D(x*.2,4.7)*1.7:Math.sin(x*.7)*1.3)))));
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const a=Math.atan2(y-C,x-C), r=Math.hypot(x-C,y-C), sea=y>S.shore[x];
    const edge=6+(nz?nz.noise2D(Math.cos(a)*1.4+9,Math.sin(a)*1.4)*1.1:0);
    S.grid.push({land:!sea&&(r<=edge||y>=C+1)&&x>=1&&x<=N-2,ore:false,b:null,water:sea});
  }
  const seen=new Set([idx(C,C)]), q=[[C,C]];
  while(q.length){ const [x,y]=q.pop(); for(const [a,b] of NB){ const nx=x+a,ny=y+b; if(inb(nx,ny)&&G(nx,ny).land&&!seen.has(idx(nx,ny))){seen.add(idx(nx,ny));q.push([nx,ny])} } }
  S.grid.forEach((t,i)=>{ if(t.land&&!seen.has(i)) t.land=false; });
  const cand=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const r=Math.hypot(x-C,y-C); if(G(x,y).land&&r>=2.4&&r<=5&&!NB.some(([a,c])=>isSea(x+a,y+c))) cand.push([x,y]); }
  for(let i=0;i<2&&cand.length;i++){ const [x,y]=cand.splice((Math.random()*cand.length)|0,1)[0]; G(x,y).ore=true; }
  G(C,C).b={type:'keep',cd:0};
  addGroves();
  stash(); unstash(prev);
}
function genMountain(){
  const prev=S.cur; stash();
  Object.assign(S,{cur:'mountain',kind:'mountain',seed:Math.random()*1000,grid:[],units:[],spawns:[],keep:8,keepMax:8,shore:null});
  const nz=mkNoise();
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const a=Math.atan2(y-C,x-C), r=Math.hypot((x-C)*1.22,(y-C)*.82);
    const edge=5.3+(nz?nz.noise2D(Math.cos(a)*1.5+3,Math.sin(a)*1.5)*1.0:0);
    S.grid.push({land:r<=edge&&x>=1&&x<=N-2,ore:false,b:null});
  }
  const seen=new Set([idx(C,C)]), q=[[C,C]];
  while(q.length){ const [x,y]=q.pop(); for(const [a,b] of NB){ const nx=x+a,ny=y+b; if(inb(nx,ny)&&G(nx,ny).land&&!seen.has(idx(nx,ny))){seen.add(idx(nx,ny));q.push([nx,ny])} } }
  S.grid.forEach((t,i)=>{ if(t.land&&!seen.has(i)) t.land=false; });
  const cand=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const r=Math.hypot(x-C,y-C); if(G(x,y).land&&r>=2.2&&r<=5.5) cand.push([x,y]); }
  for(let i=0;i<4&&cand.length;i++){ const [x,y]=cand.splice((Math.random()*cand.length)|0,1)[0]; G(x,y).ore=true; }
  G(C,C).b={type:'keep',cd:0};
  addGroves();
  stash(); unstash(prev);
}
function enterRegion(id,heroToo){
  if(!S.R[id]) return;
  if(id!==S.cur){ stash(); unstash(id); }
  if(heroToo){ S.heroAt=id; if(id==='mountain') S.visitedMtn=true; const h=S.hero; h.queue=[]; h.dash=null; h.dead=false; h.x=C; h.y=C+1.2; h.tx=h.x; h.ty=h.y; h.tstop=0; h.pathKey=null; if(id==='coast') S.visitedCoast=true; }
  sel=null; hover=null; walkers.length=0; folkReset();
  S.grid.forEach((t,i)=>{ if(t.b&&(t.b.type==='barr'||t.b.type==='range')) spawnUnits(i); });
  field(); buildWorld(); camFree=null; S.ver++; ui();
}
function travelTo(id){
  if(S.phase!=='day'||S.over||S.modal){ say('Nobody travels by night.'); return; }
  if(!S.R[id]) return;
  closeRealm();
  if(S.cur===id&&S.heroAt===id) return;
  enterRegion(id,true); sfx('ride'); save();
  say(`<b>Your hero rides to ${regionName(id)}.</b> ${S.raid===id?'Tonight’s raid strikes here.':`Tonight’s raid strikes ${regionName(S.raid)}.`}`);
}
// ---------- maritime trade ----------
const PORTS=[
  {id:'salt',name:'The Salt Isles',days:1,good:'stone',amt:8,pay:2.3,desc:'Close by. Buys stone for its sea walls.'},
  {id:'amber',name:'Qasr Amber',days:2,good:'food',amt:10,pay:2.4,bonus:'spice',desc:'A spice port. Pays well for food and sends back spices that lift your villagers’ mood.'},
  {id:'iron',name:'Ironhold',days:3,good:'wood',amt:10,pay:2.6,bonus:'iron',desc:'A mining town short of timber. Sends back iron for your blacksmith.'},
  {id:'vellmar',name:'Vellmar',days:3,good:'cloth',amt:8,pay:3.4,desc:'A rich city of tailors. Pays handsomely for cloth.'},
  {id:'kharum',name:'Kharum',days:2,good:'salt',amt:10,pay:2.4,desc:'A caravan city that buys salt for the desert roads.'},
  {id:'cathay',name:'Far Cathay',days:4,good:'gold',amt:20,pay:2.3,desc:'Far and risky. Silks bought with gold sell for much more at home.'}];
const shipsTotal=()=>count('harbor')*(1+(S.mods.ships||0));
const shipsFree=()=>Math.max(0,shipsTotal()-S.voyages.length);
const portEst=p=>Math.round(p.amt*p.pay*(S.portPrice[p.id]||1)*(dmod('trade')?1.3:1));
const portRisk=p=>Math.min(.45,.05+p.days*.025+(season().name==='Winter'?.08:0)+(S.weather==='rain'?.03:0));
function sendVoyage(id){
  const p=PORTS.find(x=>x.id===id); if(!p||S.over) return;
  if(!shipsFree()){ say('Every ship is already at sea. Build another harbor or wait for one to come home.'); sfx('no'); return; }
  if(S.res[p.good]<p.amt){ say(`A voyage to ${p.name} needs ${p.amt} ${p.good}. You have ${S.res[p.good]}.`); sfx('no'); return; }
  S.res[p.good]-=p.amt; S.voyages.push({port:p.id,back:S.day+p.days,risk:portRisk(p)}); S.voyagesSent=(S.voyagesSent||0)+1;
  departShip(); sfx('splash');
  say(`<b>A ship sails for ${p.name}</b> with ${p.amt} ${p.good}. Expect it home at dawn on day ${S.day+p.days}, carrying about ${portEst(p)} gold.`); save(); ui();
}
function resolveVoyages(notes){
  const due=S.voyages.filter(v=>v.back<=S.day); S.voyages=S.voyages.filter(v=>v.back>S.day); let home=0;
  for(const v of due){ const p=PORTS.find(x=>x.id===v.port); if(!p) continue;
    if(Math.random()<v.risk){ notes.push(`<b>Lost at sea:</b> the ship bound for ${p.name} never came back`); continue; }
    home++; const g=Math.round(portEst(p)*(.85+Math.random()*.3)); S.res.gold+=g; let extra='';
    if(p.bonus==='spice'){ S.mood=Math.min(100,S.mood+8); extra=', and spices lift the mood by 8'; }
    if(p.bonus==='iron'){ S.res.iron+=5; extra=', and 5 iron for your blacksmith'; }
    S.portPrice[p.id]=Math.max(.6,(S.portPrice[p.id]||1)*.85);
    notes.push(`<b>Ship home from ${p.name}:</b> +${g} gold${extra}`); }
  for(const p of PORTS) S.portPrice[p.id]=Math.min(1.25,(S.portPrice[p.id]||1)+.05);
  return home;
}
const WARSHIP={wood:14,gold:10,iron:2};
function forge(kind){
  const lv=kind==='arms'?(S.iron||0):(S.plate||0); if(lv>=3||S.over) return;
  const c={iron:3+lv*2,gold:6}; if(!canPay(c)){ say(`Forging needs ${costStr(c)}.`); sfx('no'); return; }
  spend(c);
  if(kind==='arms'){ S.iron=lv+1; say(`<b>Arms forged.</b> Your hero and soldiers deal ${S.iron} more damage.`); }
  else{ S.plate=lv+1; S.units.forEach(u=>{ u.max=unitMax(); u.hp=Math.min(u.max,u.hp+2); }); S.hero.max=heroMax(); S.hero.hp=Math.min(S.hero.max,S.hero.hp+3); say(`<b>Plate forged.</b> Soldiers have ${S.plate*2} more health and your hero ${S.plate*3}.`); }
  sfx('up'); party('small'); S.ver++; save(); ui();
}
function hireMercs(){
  if(S.mercs||S.phase!=='day'||S.over) return;
  if(S.res.gold<12){ say('Sellswords want 12 gold.'); sfx('no'); return; }
  S.res.gold-=12; S.mercs=3; sfx('order'); say(`<b>Three sellswords hired.</b> They will guard the keep in ${regionName(S.raid)} tonight.`); save(); ui();
}
function spawnMercs(){
  if(S.crowns&&Object.values(S.crowns).some(k=>k.war)&&Object.values(S.crowns).some(k=>k.wed)){ const home=idx(C,C+1); for(let k=0;k<2;k++){ const a=k*2.6+1; S.units.push({merc:true,home,slot:k+9,x:C+Math.cos(a)*.6,y:C+1+Math.sin(a)*.6,hp:unitMax()+4,max:unitMax()+4,atk:0,dir:-Math.PI/2,target:null,age:0,hit:0,swing:0,moving:false,ranged:false}); } }
  if(!S.mercs) return; const home=idx(C,C+1);
  for(let k=0;k<S.mercs;k++){ const a=k*2.1+.6; S.units.push({merc:true,home,slot:k+5,x:C+Math.cos(a)*.5,y:C+1+Math.sin(a)*.5,hp:unitMax()+3,max:unitMax()+3,atk:0,dir:-Math.PI/2,target:null,age:0,hit:0,swing:0,moving:false,ranged:false}); }
}
function buildWarship(){
  if(S.over||(S.warships||0)>=count('harbor')) return;
  if(!canPay(WARSHIP)){ say(`A warship needs ${costStr(WARSHIP)}.`); sfx('no'); return; }
  spend(WARSHIP); S.warships=(S.warships||0)+1; sfx('splash'); party('small');
  say(`<b>A warship is launched.</b> It will sail out to meet pirate boats when raiders come to ${regionName('coast')}.`); if(S.kind==='coast') rebuildFleet(); save(); ui();
}
function seaBattle(){
  const ws=S.warships||0; if(!ws||S.kind!=='coast') return;
  const lh=S.grid.some(t=>t.b&&t.b.type==='lighthouse'), chance=.6+(lh?.2:0)+(S.spy?.15:0);
  const pb=fleet.list.filter(f=>f.kind==='pirate'), war=fleet.list.filter(f=>f.kind==='war');
  for(let i=0;i<ws;i++){ const win=Math.random()<chance, tgt=pb[i];
    if(war[i]&&tgt&&fleet.mgr){ war[i].hunt={tgt,t:2.4,win}; war[i].v.maxSpeed=2.2; }
    else if(win) sinkRaiders(null); }
}
function sinkRaiders(boat){
  let n=0; for(let k=0;k<2;k++){ const j=S.queue.findIndex(t=>t!=='warlord'); if(j>=0){ S.queue.splice(j,1); n++; } }
  if(boat) boat.sink=true;
  S.sunk=(S.sunk||0)+1; S.sunkTonight=(S.sunkTonight||0)+1; sfx('thud'); shake=Math.max(shake,.15);
  if(n) toast(T('Sea battle'),T('A warship sank a pirate boat'),'⚓');
  ui();
}
function plunder(){
  const g=Math.floor(S.res.gold*.3), f=Math.floor(S.res.food*.3);
  S.res.gold-=g; S.res.food-=f; S.queue=[]; for(const e of S.enemies) e.gone=true;
  S.keep=1; shake=.4; sfx('hurt');
  say(`<b>The fort at ${regionName(S.cur)} has fallen.</b> Raiders plunder ${g} gold and ${f} food and sail away.`); ui();
}
var plural=(n,w)=>n===1?`1 ${w}`:`${n} ${w}s`;
function joinList(a){ return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1]; }

