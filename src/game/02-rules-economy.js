// =============== GAME RULES ===============
function blank(){
  return {res:{gold:10,food:10,wood:14,stone:2,iron:0,wool:0,cloth:0,ale:0,salt:0,tools:0},ph:{},pop:3,idle:0,price:{...BASEP},day:1,phase:'day',keep:10,keepMax:10,grid:[],enemies:[],shots:[],puffs:[],floats:[],spawns:[],queue:[],
    spawnT:0,kills:0,nightKills:0,dist:[],tool:'farm',over:false,t:0,modal:false,ver:0,
    mods:{dmg:0,range:0,harvest:0,wall:0,trap:0,tax:0,hero:0,drill:0,wood:0,stone:0,housing:0,taxes:0,cataRate:1,muster:0,horn:0,ships:0},hero:null,units:[],
    upg:[],quest:0,diff:'normal',won:false,abilUsed:0,cur:'home',heroAt:'home',raid:'home',R:{},coastUnlocked:false,mtnUnlocked:false,visitedMtn:false,warships:0,plate:0,mercs:0,sunk:0,kind:'canyon',shore:null,voyages:[],iron:0,portPrice:{},voyagesSent:0,visitedCoast:false,mood:60,weather:'clear',blood:false,hx:0,hl:1,perks:[],perkPending:0,lostTonight:0,hungry:false,cold:false};
}
function newGame(){
  showOver(T('Found a new kingdom'),T('Choose how hard the raids will be. Hold the keep through 20 nights to win.'),
    Object.entries(DIFF).map(([k,d])=>({label:T(d.label),sub:T(d.sub),primary:k==='normal',fn:()=>{ saveOn=true; startGame(k); maybeTour(); }})));
}
function startGame(diff){
  S=blank(); S.diff=diff||'normal'; S.weather=rollWeather();
  RES.forEach(r=>S.res[r]=Math.round(S.res[r]*DIFF[S.diff].res));
  const off=Math.random()*6.28, nz=mkNoise();
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const dx=x-C,dy=y-C,a=Math.atan2(dy,dx),r=Math.hypot(dx,dy);
    const edge=nz?6.1+nz.noise2D(Math.cos(a)*1.3,Math.sin(a)*1.3)*1.15+nz.noise2D(Math.cos(a)*3+5,Math.sin(a)*3)*.35:(4.55+0.55*Math.sin(a*3+off)+0.35*Math.sin(a*5-off*2)+0.3*Math.sin(a*7+off*3))*1.36;
    S.grid.push({land:r<=edge,ore:false,b:null});
  }
  const seen=new Set([idx(C,C)]), q=[[C,C]];
  while(q.length){ const [x,y]=q.pop(); for(const [a,b] of NB){ const nx=x+a,ny=y+b; if(inb(nx,ny)&&G(nx,ny).land&&!seen.has(idx(nx,ny))){seen.add(idx(nx,ny));q.push([nx,ny])} } }
  S.grid.forEach((t,i)=>{ if(!seen.has(i)) t.land=false; });
  const cand=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const r=Math.hypot(x-C,y-C); if(G(x,y).land&&r>=2.4&&r<=5) cand.push([x,y]); }
  for(let i=0;i<4&&cand.length;i++){ const [x,y]=cand.splice((Math.random()*cand.length)|0,1)[0]; G(x,y).ore=true; }
  G(C,C).b={type:'keep',cd:0};
  addGroves();
  S.seed=Math.random()*1000; S.hero=mkHero();
  Object.assign(S,{kind:'canyon',shore:null,cur:'home',heroAt:'home',raid:'home'}); stash();
  crowns(); sel=null; pickSpawns(); field(); planWave(); hideOver(); buildWorld(); save(); ui(); forecast(true);
  if(saveOn) setTimeout(()=>showChapter(CHAPTERS[0]),400);
}
function edgeTiles(){
  const out=[];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    if(!G(x,y).land) continue;
    if(NB.some(([a,b])=>!inb(x+a,y+b)||!G(x+a,y+b).land)) out.push([x,y]);
  }
  return out;
}
function pickSpawns(){
  const k=Math.min(4,1+Math.floor((S.day-1)/3));
  let edge=edgeTiles(); if(S.kind==='mountain'){ const no=edge.filter(([x,y])=>y<C-1); if(no.length) edge=no; }
  if(S.kind==='coast'){ const sh=edge.filter(([x,y])=>NB.some(([a,c])=>isSea(x+a,y+c))); if(sh.length) edge=sh; }
  const base=Math.random()*6.28, picks=[];
  for(let i=0;i<k;i++){
    const ang=base+i*(6.28/k)+(Math.random()-.5)*.6;
    let bt=null,bd=9;
    for(const [x,y] of edge){
      if(G(x,y).b) continue;
      let d=Math.abs(Math.atan2(y-C,x-C)-ang)%6.283; d=Math.min(d,6.283-d);
      if(d<bd&&!picks.some(p=>p[0]===x&&p[1]===y)){bd=d;bt=[x,y]}
    }
    if(bt) picks.push(bt);
  }
  if(!picks.length) picks.push(edge[0]);
  S.spawns=picks; S.ver++;
}
const isSpawn=(x,y)=>S.spawns.some(p=>p[0]===x&&p[1]===y);
function planWave(){
  const d=S.day, n=Math.max(2,Math.round((d<=10?3+2*(d-1):21+1.7*(d-10))*DIFF[S.diff].wave*(S.blood?1.5:1)*raidMult(S.raid||'home')));
  const run=d>=3?Math.floor(n*.25):0, bru=d>=6?Math.floor(n*.15)+(d>=10?1:0):0, arc=d>=4?Math.max(1,Math.floor(n*.18)):0;
  const q=[]; for(let i=0;i<Math.max(1,n-run-bru-arc);i++)q.push('raider'); for(let i=0;i<run;i++)q.push('runner'); for(let i=0;i<bru;i++)q.push('brute'); for(let i=0;i<arc;i++)q.push('archer');
  if(d>=8) for(let i=0;i<1+Math.floor((d-8)/4);i++) q.push('ram');
  for(let i=q.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[q[i],q[j]]=[q[j],q[i]]}
  if(d>=7) for(let i=0;i<1+Math.floor((d-7)/5);i++) q.splice(Math.floor(q.length*.6),0,'shaman');
  if(S.raid==='mountain'&&d>=9){ let w=Math.floor(q.length*.3); for(let i=0;i<q.length&&w>0;i++) if(q[i]==='raider'){ q[i]='wolf'; w--; } for(let i=0;i<2;i++) q.unshift('wolf'); }
  if(d>=10) for(let i=0;i<1+Math.floor((d-10)/5);i++) q.splice(Math.floor(q.length*(.3+.4*Math.random())),0,'sapper');
  if(S.raid==='coast'&&d>=8&&(d%3===2||Math.random()<.3)) q.push('captain');
  if(S.royalRaid) for(const id in S.royalRaid){ if(!S.crowns||!S.crowns[id]||!S.crowns[id].war) continue; for(let i=0;i<S.royalRaid[id];i++) q.splice(Math.floor(q.length*Math.random()),0,'knight:'+id); }
  if(d%5===0) q.push('warlord');
  S.queue=q;
}
function dirName(x,y){
  const dx=x-C,dy=y-C;
  if(Math.abs(dx)>Math.abs(dy)*1.6) return dx>0?'east':'west';
  if(Math.abs(dy)>Math.abs(dx)*1.6) return dy>0?'south':'north';
  return (dy>0?'south':'north')+(dx>0?'east':'west');
}
function waveText(){
  const c={}; S.queue.forEach(t=>{ t=t.startsWith('knight:')?'knight':t; c[t]=(c[t]||0)+1; });
  const parts=[]; if(c.raider)parts.push(plural(c.raider,'raider')); if(c.runner)parts.push(plural(c.runner,'runner')); if(c.archer)parts.push(plural(c.archer,'archer')); if(c.brute)parts.push(plural(c.brute,'brute')); if(c.ram)parts.push(plural(c.ram,'battering ram')); if(c.shaman)parts.push(plural(c.shaman,'shaman')); if(c.wolf)parts.push(c.wolf===1?'1 wolf':`${c.wolf} wolves`); if(c.sapper)parts.push(plural(c.sapper,'sapper')); if(c.captain)parts.push('a pirate captain'); if(c.knight)parts.push(plural(c.knight,'royal knight')); if(c.warlord)parts.push('a warlord');
  const sp=S.raid===S.cur?S.spawns:((S.R[S.raid]||{}).spawns||[]), dirs=[...new Set(sp.map(([x,y])=>dirName(x,y)))];
  if(S.raid==='coast') return `${joinList(parts)} landing on the ${joinList(dirs)} shore of ${regionName('coast')}`;
  if(S.raid==='mountain') return `${joinList(parts)} coming down from the ${joinList(dirs)} heights of ${regionName('mountain')}`;
  return `${joinList(parts)} coming through the ${joinList(dirs)} pass${dirs.length>1?'es':''}${S.coastUnlocked||S.mtnUnlocked?' into The Valley':''}`;
}
function forecast(first){
  say(`<b>Day ${S.day}.</b> Scouts report ${waveText()}.${first?' Tap tiles to send your hero out to build. Farms feed your villagers, houses bring more of them, and every villager pays taxes. Then ring the bell.':''}`);
}
function field(){
  const d=new Array(N*N).fill(Infinity), done=new Array(N*N).fill(false);
  d[idx(C,C)]=0;
  for(;;){
    let u=-1,m=Infinity;
    for(let i=0;i<N*N;i++) if(!done[i]&&d[i]<m){m=d[i];u=i}
    if(u<0) break; done[u]=true;
    const ux=u%N,uy=(u/N)|0, tb=S.grid[u].b;
    const enter=tb?DEF[tb.type].enter:1;
    for(const [a,b] of NB){
      const nx=ux+a,ny=uy+b; if(!inb(nx,ny)) continue;
      const v=idx(nx,ny); if(!S.grid[v].land) continue;
      if(d[u]+enter<d[v]) d[v]=d[u]+enter;
    }
  }
  S.dist=d; S.ver++;
}
function nextStep(x,y){
  let bx=-1,by=-1,bd=S.dist[idx(x,y)];
  for(const [a,b] of NB){ const nx=x+a,ny=y+b; if(!inb(nx,ny)) continue; const dv=S.dist[idx(nx,ny)]; if(dv<bd){bd=dv;bx=nx;by=ny} }
  return bx<0?null:[bx,by];
}
function addGroves(){
  const c=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const r=Math.hypot(x-C,y-C), t=G(x,y); if(t.land&&!t.ore&&!t.b&&!t.grove&&r>=2.2&&r<=5.8) c.push([x,y]); }
  for(let i=0;i<4&&c.length;i++){ const [x,y]=c.splice((Math.random()*c.length)|0,1)[0]; G(x,y).grove=true; }
}
function assignWorkers(){
  let free=S.pop; const order={w_granary:-1,w_bazaar:-1,w_academy:-1,w_cathedral:-1,w_colossus:-1,farm:0,harbor:1,mine:2,lumber:3,market:4,pasture:5,saltpan:6,workshop:7,weaver:8,brewery:9}, prods=[];
  eachAll(b=>{ if(DEF[b.type].work) prods.push(b); else b.worked=false; });
  prods.sort((a,b)=>order[a.type]-order[b.type]||(a.day||0)-(b.day||0));
  for(const b of prods){ b.worked=!b.off&&free>0; if(b.worked) free--; }
  S.idle=free;
}
// One source of truth for what dawn will do: the ledger previews it and dawn applies it.
function econ(){
  assignWorkers();
  ensureEco(); const L=Object.fromEntries(ALLR.map(r=>[r,[]]));
  let farms=0,lum=0,mines=0,mk=0,cata=0,barr=0,ranges=0,soldiers=0,houses=0,idleP=0,hb=0,imines=0,rF=0,rL=0,rS=0,rI=0,tav=0,pas=0,pasM=0,wea=0,bre=0,spn=0,wsh=0;
  eachAll((b,x,y,t,here,rid,g)=>{
    if(DEF[b.type].work&&!b.worked&&!b.off) idleP++;
    if(b.type==='tavern') tav++;
    if(b.worked){ const rd=roadBy(g,x,y); if(b.type==='harbor')hb++; if(b.type==='farm'){farms++; if(rd)rF++;} if(b.type==='lumber'){lum++; if(rd)rL++;}
      if(b.type==='mine'){ if(rid==='mountain'){imines++; if(rd)rI++;} else {mines++; if(rd)rS++;} } if(b.type==='market')mk++;
      if(b.type==='pasture'){ pas++; if(rid==='mountain') pasM++; } if(b.type==='weaver')wea++; if(b.type==='brewery')bre++; if(b.type==='saltpan')spn++; if(b.type==='workshop')wsh++; }
    if(b.type==='cata')cata++; if(b.type==='barr'){barr++;soldiers+=b.lvl+1+S.mods.muster;} if(b.type==='range'){ranges++;soldiers+=b.lvl+1+S.mods.muster;} if(b.type==='house')houses++;
  });
  const sea=season(), fo=farmOut(), wo=4+S.mods.wood+(hasEdict('shifts')?1:0), fnote=[sea.farm?`${sea.name} ${sea.farm>0?'+':'−'}${Math.abs(sea.farm)}`:'',S.weather==='rain'?'rain +1':''].filter(Boolean).join(', ');
  if(farms) L.food.push([`${plural(farms,'farm')} × ${fo}${fnote?` (${fnote})`:''}`,farms*fo]);
  if(S.pop) L.food.push([`${plural(S.pop,'villager')} eat${hasEdict('rationing')?' (rationed)':''}`,-(hasEdict('rationing')?Math.ceil(S.pop/2):S.pop)]);
  if(soldiers) L.food.push([`${plural(soldiers,'soldier')} eat`,-soldiers]);
  if(hb) L.food.push([`${plural(hb,'harbor')} fishing`,hb*3]);
  if(lum) L.wood.push([`${plural(lum,'lumber camp')} × ${wo}`,lum*wo]);
  const so=3+S.mods.stone+(hasEdict('shifts')?1:0);
  if(mines) L.stone.push([`${plural(mines,'mine')} × ${so}`,mines*so]);
  if(imines){ const io=2+S.mods.stone+(hasEdict('shifts')?1:0); L.iron.push([`${plural(imines,'iron mine')} × ${io}`,imines*io]); }
  if(rF) L.food.push([`Roads to ${plural(rF,'farm')}`,rF]); if(rL) L.wood.push([`Roads to ${plural(rL,'lumber camp')}`,rL]);
  if(rS) L.stone.push([`Roads to ${plural(rS,'mine')}`,rS]); if(rI) L.iron.push([`Roads to ${plural(rI,'iron mine')}`,rI]);
  if(tav&&!hasEdict('watch')) L.gold.push([`Tavern takings`,tav*2]);
  if(hasEdict('tithe')){ const sh=count('shrine'); if(sh) L.gold.push([`Shrine tithe`,sh*3]); }
  if(hasEdict('markets')&&mk){ L.gold.push([`Free markets`,mk*3]); L.food.push([`Feeding market travelers`,-mk]); }
  if(hasEdict('militia')&&S.pop>=3) L.gold.push([`Militia drills`,-Math.floor(S.pop/3)]);
  for(const f in (S.fac||{})){ const o=S.fac[f]; if(o.pact&&o.h<40){ if(f==='nomads') L.gold.push([`Pact with the Sand Wolves`,4]); if(f==='brotherhood') L.food.push([`Pact with the Red Brotherhood`,4]); if(f==='clans') L.iron.push([`Pact with the Iron Clans`,2]); } }
  if(S.warships) L.gold.push([`Warship crews`,-S.warships]);
  if(S.prov){ crowns(); } if(S.prov) for(const pid of Object.keys(PROV)){ if(!S.prov[pid]||S.prov[pid].owner!=='me'||PROV[pid].cap) continue; const y=PROV[pid].yield; for(const r in y) if(r!=='renown') L[r].push([PROV[pid].name,y[r]]); L.gold.push([`Garrison at ${PROV[pid].name}`,-1]); }
  if(S.crowns) for(const id in S.crowns) if(S.crowns[id].pact&&!S.crowns[id].war) L.gold.push([`Trade with ${KINGS[id].short}`,3]);
  const idleN=Math.min(S.idle||0,S.pop), stdT=S.stdTier||0;
  if(S.pop) L.gold.push([`Taxes: ${plural(S.pop-idleN,'worker')}${idleN?` and ${idleN} idle at half`:''} (${TAXES[taxLvl()].name.toLowerCase()}${stdT?`, ${STD[stdT].name.toLowerCase()} ×${STD[stdT].tax}`:''})`,Math.round((S.pop-idleN+idleN*.5)*TAXES[taxLvl()].mult*STD[stdT].tax)]);
  if(skill('treasurer')) L.gold.push([`Treasurer ${cm('treasurer').name}`,skill('treasurer')*2]);
  if(skill('steward')) L.food.push([`Steward ${cm('steward').name}`,skill('steward')*2]);
  for(const k in (S.council||{})) if(S.council[k].trait==='greedy') L.gold.push([`${S.council[k].name} skims`,-2]);
  if(S.mods.taxes&&S.pop>=3) L.gold.push([`Tax collectors`,Math.floor(S.pop/3)*S.mods.taxes]);
  if(mk) L.gold.push([`Market trade${sea.name==='Harvest'?' (harvest +2)':''}`,mk*(3+(sea.name==='Harvest'?2:0))]);
  if(S.pop&&S.mood>=70) L.gold.push(['Content villagers',Math.floor(S.pop/2)]);
  if(S.pop&&S.mood<35) L.gold.push(['Grumbling villagers',-Math.ceil(S.pop/2)]);
  if(sea.name==='Winter'&&houses) L.wood.push([`Heating ${plural(houses,'house')}`,-houses]);
  if(ranges) L.gold.push([`Archery range upkeep`,-ranges]);
  if(cata) L.gold.push([`Catapult upkeep`,-cata]);
  if(barr) L.gold.push([`Barracks upkeep`,-barr]);
  // ---- crafts, needs, tools, spoilage and storage ----
  { const agg={}; let moodAdj=0; eachAll((b,x,y,t,here,rid,g)=>{ if(b.type!=='house'&&!b.worked&&b.type!=='tavern') return; for(const [txt,r,v] of adjBonus(b.type,g,x,y)){ if(r==='mood'){ moodAdj+=v; continue; } const k2=txt+'|'+r; agg[k2]=(agg[k2]||0)+v; } });
    for(const k2 in agg){ const [txt,r]=k2.split('|'); if(L[r]&&agg[k2]) L[r].push([`Placement: ${txt.toLowerCase()}`,agg[k2]]); } S.adjMood=Math.max(-6,Math.min(8,moodAdj)); }
  const sum=r=>L[r].reduce((a,l)=>a+l[1],0), avail=r=>Math.max(0,(S.res[r]||0)+sum(r));
  const toolNeed=Math.ceil((farms+lum+mines+imines+pas)/4), toolsOk=toolNeed>0&&S.res.tools>=toolNeed;
  if(toolsOk){ L.tools.push([`Tools worn out by ${plural(farms+lum+mines+imines+pas,'producer')}`,-toolNeed]);
    if(farms) L.food.push([`Good tools on ${plural(farms,'farm')}`,farms]); if(lum) L.wood.push([`Good tools in ${plural(lum,'lumber camp')}`,lum]);
    if(mines) L.stone.push([`Good tools in ${plural(mines,'mine')}`,mines]); if(imines) L.iron.push([`Good tools in ${plural(imines,'iron mine')}`,imines]); if(pas) L.wool.push([`Good shears`,pas]); }
  if(pas) L.wool.push([`${plural(pas,'goat pasture')} × 2${pasM?` (+${pasM} mountain goats)`:''}`,pas*2+pasM]);
  if(spn) L.salt.push([`${plural(spn,'salt pan')} × 3`,spn*3]);
  if(wsh){ const n=Math.min(wsh,avail('iron'),avail('wood')); if(n>0){ L.iron.push([`Workshops forge tools`,-n]); L.wood.push([`Tool handles`,-n]); L.tools.push([`${plural(n,'workshop')} × 2`,n*2]); } if(n<wsh) L.tools.push([`${wsh-n} workshop${wsh-n>1?'s':''} idle: no iron or wood`,0]); }
  if(wea){ const n=Math.min(wea*2,avail('wool')); if(n>0){ L.wool.push([`Weavers spin wool`,-n]); L.cloth.push([`${plural(wea,'weaver')}`,n]); } if(n<wea*2) L.cloth.push([`Weavers short of wool`,0]); }
  if(bre){ const k=Math.min(bre,Math.floor(avail('food')/3)); if(k>0){ L.food.push([`Brewing grain`,-3*k]); L.ale.push([`${k} ${k===1?'brewery':'breweries'}`,2*k]); } }
  const needs={cloth:S.pop?Math.ceil(S.pop/6):0,ale:S.pop?Math.ceil(S.pop/5):0,salt:S.pop?Math.ceil(S.pop/8):0}, met={};
  for(const r in needs){ const c=Math.min(needs[r],avail(r)); met[r]=needs[r]?c/needs[r]:0; if(c) L[r].push([r==='cloth'?'Villagers wear out clothes':r==='ale'?'Villagers drink':'Villagers salt their food',-c]); }
  const avgMet=(met.cloth+met.ale+met.salt)/3, tier=S.pop<3?0:avgMet>=.99?3:avgMet>=.6?2:avgMet>=.3?1:0;
  S.stdTier=tier;
  const sea2=season().name, sr=hasWonder('w_granary')?0:(sea2==='Summer'?.05:sea2==='Winter'?.01:.03)*(met.salt>=1?.5:1), spoil=Math.floor(avail('food')*sr);
  if(hasWonder('w_bazaar')) L.gold.push(['Grand Bazaar',6]);
  if(spoil>0) L.food.push([`Food spoils${met.salt>=1?' (salted, halved)':''}`,-spoil]);
  const shipped=routesEcon(L,avail);
  { let cg=0; eachAll((b,x,y,t,here,rid,g)=>{ if(b.type==='counting') cg+=5+Math.min(3,nearCount(g,x,y,['market','house'],1)); }); if(cg) L.gold.push(['Counting houses',cg]);
    if(hasTier('holy',2)){ let n=0; eachAll(b=>{ if(b.type==='shrine'||b.type==='temple') n++; }); if(n) L.gold.push(['Pilgrims',n*2]); }
    if(hasTier('merchant',4)){ const pc=liveKings().filter(k=>K(k).pact).length; if(pc) L.gold.push(['Trade league',pc*4]); }
    armyUpkeep(L); }
  const capS=storeCap(); for(const r of ALLR){ if(r==='gold') continue; const after=avail(r); if(after>capS) L[r].push([`No room in the stores (${capS})`,capS-after]); }
  const net={}; ALLR.forEach(r=>net[r]=L[r].reduce((a,l)=>a+l[1],0));
  const cap=housing(), foodAfter=S.res.food+net.food;
  let popD=0;
  if(foodAfter<0) popD=-Math.min(S.pop,Math.ceil(-foodAfter/3));
  else if(S.pop<cap&&S.mood>=35) popD=Math.min(cap-S.pop,Math.max(1,Math.floor(houses/2)));
  if(S.mood<20&&S.pop>0) popD=Math.min(popD,-1);
  return {L,net,popD,cap,idleP,foodAfter,goldAfter:S.res.gold+net.gold,needs,met,tier,capS,shipped};
}
function clampPrices(){ for(const r in S.price) S.price[r]=Math.min(16,Math.max(.6,S.price[r])); }
function ensureEco(){ for(const r of ALLR) if(S.res[r]==null) S.res[r]=0; S.price=S.price||{}; for(const r of TRADE) if(!S.price[r]) S.price[r]=BASEP[r]; S.ph=S.ph||{}; }
const storeCap=()=>80+60*count('storehouse')+20*((S.keepLvl||1)-1)+(hasWonder('w_granary')?40:0);
const WONDERS=['w_granary','w_bazaar','w_academy','w_cathedral','w_colossus'];
function hasWonder(id){ let ok=false; if(!S) return false; eachAll(b=>{ if(b.type===id&&b.done) ok=true; }); return ok; }
const STD=[{name:'Poor',mood:0,tax:1},{name:'Modest',mood:4,tax:1.1},{name:'Comfortable',mood:8,tax:1.25},{name:'Prosperous',mood:12,tax:1.4}];
const SEASONF={food:{Winter:1.3,Harvest:.75,Summer:1.1},wood:{Winter:1.2},wool:{Spring:.8,Winter:1.25},ale:{Harvest:1.3,Winter:1.1},salt:{Summer:1.15},cloth:{Winter:1.2},tools:{}};
const REF={food:40,wood:40,stone:30,iron:20,wool:20,cloth:15,ale:15,salt:15,tools:15};
function updatePrices(){ ensureEco(); const sn=season().name;
  for(const r of TRADE){ const sf=(SEASONF[r]||{})[sn]||1, st=Math.max(.7,Math.min(1.3,1.25-(S.res[r]||0)/REF[r]*.3)), tg=BASEP[r]*sf*st;
    S.price[r]+=(tg-S.price[r])*.3; S.price[r]*=.93+Math.random()*.14; }
  clampPrices(); for(const r of TRADE){ const h=S.ph[r]||(S.ph[r]=[]); h.push(buyCost(r)); if(h.length>14) h.shift(); } }
const buyCost=r=>Math.max(1,Math.round(S.price[r]*LOT*(hasWonder('w_bazaar')?.85:1)*(hasTier('merchant',2)?.85:1)));
const sellGain=r=>Math.max(1,Math.floor(S.price[r]*LOT*.6*(hasWonder('w_bazaar')?1.15:1)*(hasTier('merchant',2)?1.15:1)));
const marketOpen=()=>S.grid.some(t=>t.b&&t.b.type==='market'&&t.b.worked);
function trade(r,buy){
  if(NET.role==='guest'&&!NET.applying){ netSend({t:'trade',r,buy}); say(T('Trade request sent to your co-ruler.')); return; }
  if(!marketOpen()){ say('A market with a villager working it is needed to trade.'); sfx('no'); return; }
  if(buy){ const c=buyCost(r); if(S.res.gold<c){ say(`Buying ${LOT} ${r} costs ${c} gold. You have ${S.res.gold}.`); sfx('no'); return; }
    S.res.gold-=c; S.res[r]+=LOT; S.price[r]*=1.12; say(`Bought ${LOT} ${r} for ${c} gold.`); }
  else{ if(S.res[r]<LOT){ say(`You need ${LOT} ${r} to sell.`); sfx('no'); return; }
    const g=sellGain(r); S.res[r]-=LOT; S.res.gold+=g; S.tradeGold=(S.tradeGold||0)+g; S.price[r]*=.9; say(`Sold ${LOT} ${r} for ${g} gold.`); }
  clampPrices(); sfx('order'); save(); ui();
}
function rollEvent(){
  if(S.day<2||Math.random()>.4) return '';
  const evs=[
    ()=>{S.price.stone*=.6; return '<b>Caravan:</b> traders from the east bring cheap stone';},
    ()=>{S.price.food*=1.5; return '<b>Drought:</b> food prices climb';},
    ()=>{S.price.wood*=1.5; return '<b>Timber shortage:</b> wood prices climb';},
    ()=>{const g=Math.max(2,S.pop); S.res.gold+=g; return `<b>Festival:</b> villagers spend freely, +${g} gold`;},
    ()=>{const room=housing()-S.pop; if(room<=0) return '<b>Migrants</b> came looking for work but found no room in your houses'; const n=Math.min(2,room); S.pop+=n; return `<b>Migrants:</b> ${n===1?'a family settles':'two families settle'} in your valley`;},
    ()=>{S.price.food*=.65; return '<b>Bumper harvest</b> in the lowlands: food is cheap at market';}
  ];
  return evs[(Math.random()*evs.length)|0]();
}
const walkers=[];
function keepDoors(){ const out=[]; for(const [a,c] of [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) if(passHero(C+a,C+c)) out.push([C+a,C+c]); return out.length?out:[[C,C+1]]; }
function stepWalkers(dt){ stepFolk(dt); }
