// ================= RIVAL CROWNS =================
const KINGS={
  harun:{name:'King Harun of Qadir',short:'Harun',style:'warlike',color:'#C0392B',desc:'A warlord crowned by his own hand. Respects strength, takes what he can.'},
  ysolde:{name:'Queen Ysolde of Merrow',short:'Ysolde',style:'cunning',color:'#6A8AD8',desc:'A merchant queen. Grows rich on trade and plays every crown against the others.'},
  osric:{name:'King Osric of Hallowmere',short:'Osric',style:'pious',color:'#8FCB7E',desc:'A devout old king. Builds temples, values honor, slow to anger and slow to forgive.'}};
// ================= THE CONTINENT OF ASHKARA =================
const CONT_NAME='Ashkara';
const PNAMES=['Tamra Oasis','Copper Hills','The Salt Road','Date Groves','Old Sun Tower','Highland Pastures','Qasr Duna','Red Mesa','Whispering Dunes','Mirage Flats','Cedar Vale','Stonebridge','Greywater','Ember Steppe','Lionsgate','Thornwood','Saffron Coast','Glass Lake','Wolfrun','Highmoor','Amberfield','Sunken Gate','Brinehold','Vulture Peaks','Jasper Ford','Kestrel Downs','Ashfall','Marrow Fen','Bronze Reach','Silent Wells'];
const RUINS=new Set(['Old Sun Tower','Sunken Gate','Silent Wells']);
const TERR_NAME={sea:'Sea',coast:'Coast',desert:'Desert',steppe:'Steppe',grass:'Grassland',forest:'Forest',hills:'Hills',mountains:'Mountains'};
const CAPNAME={me:'The Valley',harun:'Qadir',ysolde:'Merrow',osric:'Hallowmere'};
let WORLD=null, PROV={};
const seededNoise=seed=>window.SimplexNoise?new SimplexNoise(mulberry32(seed)):{noise2D:(x,y)=>Math.sin(x*3.1+seed)*Math.cos(y*2.7-seed)*.8};
function fbm(n,x,y,o){ let a=0,amp=1,f=1,t=0; for(let i=0;i<o;i++){ a+=n.noise2D(x*f,y*f)*amp; t+=amp; amp*=.5; f*=2.03; } return a/t; }
function worldFns(seed){ const n1=seededNoise(seed), n2=seededNoise(seed+1);
  const H=(x,y,o=5)=>{ const e=(x-.5)/.55, f=(y-.5)/.5, d=Math.sqrt(e*e+f*f); return fbm(n1,x*2.8,y*2.8,o)*.6+(1-d)*1.05-.36+fbm(n2,x*1.3+7,y*1.3,2)*.22-Math.max(0,Math.abs(x-.5)-.4)*5-Math.max(0,Math.abs(y-.5)-.38)*5; };
  const M=(x,y,o=3)=>fbm(n2,x*2.2+31,y*2.2+5,o);
  return {n1,n2,H,M}; }
function terrOf(h,m,y){ if(h<0) return 'sea'; if(h>.5) return 'mountains'; if(h>.36) return 'hills'; if(m>.16) return 'forest'; if(m<-.04&&y>.38) return 'desert'; return m>.04?'grass':'steppe'; }
function genWorld(seed){
  const {n1,H,M}=worldFns(seed), rnd=mulberry32(seed+2), GW=150, GH=100, h=new Float32Array(GW*GH);
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++) h[j*GW+i]=H((i+.5)/GW,(j+.5)/GH,4);
  const sites=[]; let tries=0;
  while(sites.length<30&&tries<8000){ tries++; const i=(rnd()*GW)|0, j=(rnd()*GH)|0; if(h[j*GW+i]<.05) continue; const x=(i+.5)/GW, y=(j+.5)/GH; if(sites.some(s=>Math.hypot((s.x-x)*1.5,s.y-y)<.09)) continue; sites.push({x,y}); }
  const pg=new Int16Array(GW*GH).fill(-1);
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){ if(h[j*GW+i]<0) continue; const x=(i+.5)/GW,y=(j+.5)/GH, w=n1.noise2D(x*11,y*11)*.02; let b=-1,bd=9; sites.forEach((s,k)=>{ const d=Math.hypot((s.x-x)*1.5,s.y-y)+w*((k%3)-1); if(d<bd){bd=d;b=k;} }); pg[j*GW+i]=b; }
  const adj=sites.map(()=>new Set()), st=sites.map(()=>({n:0,h:0,m:0,y:0,coast:0,x:0}));
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){ const k=pg[j*GW+i]; if(k<0) continue; const s=st[k]; s.n++; s.h+=h[j*GW+i]; s.m+=M((i+.5)/GW,(j+.5)/GH,2); s.y+=(j+.5)/GH; s.x+=(i+.5)/GW;
    for(const [a,c] of [[1,0],[0,1],[-1,0],[0,-1]]){ const ii=i+a,jj=j+c; if(ii<0||jj<0||ii>=GW||jj>=GH){ continue; } const k2=pg[jj*GW+ii]; if(k2<0) s.coast++; else if(k2!==k){ adj[k].add(k2); } } }
  const prov={}, ids=[];
  sites.forEach((s,k)=>{ const t=st[k]; if(!t.n) return; const hh=t.h/t.n, mm=t.m/t.n, yy=t.y/t.n; let terr=terrOf(hh,mm,yy); const coastal=t.coast>4;
    const id='p'+k; ids.push(id); prov[id]={k,name:'',x:t.x/t.n,y:t.y/t.n,terr,coastal,adj:[...adj[k]].map(a=>'p'+a),size:t.n}; });
  for(const id of ids) prov[id].adj=prov[id].adj.filter(a=>prov[a]);
  // the four crowns: you in the south-centre, rivals spread far apart
  const dist=(a,b)=>Math.hypot((prov[a].x-prov[b].x)*1.5,prov[a].y-prov[b].y);
  let me=ids.slice().sort((a,b)=>Math.hypot(prov[a].x-.5,prov[a].y-.66)-Math.hypot(prov[b].x-.5,prov[b].y-.66))[0];
  const caps={me}, chosen=[me];
  for(const kid of ['harun','ysolde','osric']){ let best=null,bd=-1; for(const id of ids){ if(chosen.includes(id)) continue; const d=Math.min(...chosen.map(c=>dist(c,id))); if(d>bd){bd=d;best=id;} } caps[kid]=best; chosen.push(best); }
  // names
  const names=PNAMES.slice(); for(let i=names.length-1;i>0;i--){ const j=(rnd()*(i+1))|0; [names[i],names[j]]=[names[j],names[i]]; }
  let ni=0; for(const id of ids){ const cap=Object.keys(caps).find(c=>caps[c]===id); prov[id].cap=cap||null; prov[id].name=cap?CAPNAME[cap]:names[ni++%names.length]; }
  for(const id of ids){ const P=prov[id], y={};
    if(P.terr==='mountains'){ y.iron=2; y.stone=1; } else if(P.terr==='hills'){ y.stone=3; } else if(P.terr==='forest'){ y.wood=4; }
    else if(P.terr==='desert'){ if(P.coastal){ y.salt=2; y.gold=1; } else y.gold=3; } else if(P.terr==='grass'){ y.food=4; } else { y.wool=3; y.food=1; }
    if(P.coastal&&P.terr!=='desert') y.food=(y.food||0)+1; if(RUINS.has(P.name)) y.renown=1; P.yield=y; }
  prov[caps.me].terr='desert';
  return {seed,GW,GH,h,pg,prov,ids,caps};
}
function initWorld(){
  if(!S.worldSeed) S.worldSeed=(Math.random()*1e9)|0;
  WORLD=genWorld(S.worldSeed); PROV=WORLD.prov;
  if(!S.prov||S.prov.oasis||!S.prov[WORLD.caps.me]){
    const old=S.prov&&S.prov.oasis?Object.values(S.prov).filter(p=>p.owner==='me').length:0;
    S.prov={}; for(const id of WORLD.ids){ const P=PROV[id]; S.prov[id]={owner:null,gar:6+(P.terr==='mountains'?4:P.terr==='hills'?2:0)+((P.size/40)|0)}; }
    for(const c in WORLD.caps){ const P=S.prov[WORLD.caps[c]]; P.owner=c; P.gar=c==='me'?12:20; }
    for(const c of ['harun','ysolde','osric']){ let n=0; for(const a of PROV[WORLD.caps[c]].adj){ if(n>=2) break; if(!S.prov[a].owner){ S.prov[a].owner=c; S.prov[a].gar=10; n++; } } }
    for(let i=0;i<old;i++){ const f=frontier('me').find(p=>!S.prov[p].owner); if(f){ S.prov[f].owner='me'; S.prov[f].gar=6; } }
  }
  worldVer++;
}
let worldVer=0;
const myCap=()=>WORLD?WORLD.caps.me:null;
function frontier(o){ const out=new Set(); for(const id of landsOf(o)) for(const a of PROV[id].adj) if(S.prov[a].owner!==o) out.add(a); return [...out]; }
const bordersMe=p=>PROV[p]&&PROV[p].adj.some(a=>S.prov[a].owner==='me');
// ================= RIVAL CROWNS =================
const ordinal=n=>lang==='es'?`${n}.º`:n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:Math.min(n%10,4)%4]||'th');
function crowns(){
  if(!S.crowns) S.crowns={harun:{gold:80,army:30,pop:30,renown:20,rel:-10,war:false,pact:false,wed:false,ws:0,last:0},ysolde:{gold:140,army:18,pop:26,renown:25,rel:10,war:false,pact:false,wed:false,ws:0,last:0},osric:{gold:90,army:20,pop:28,renown:30,rel:20,war:false,pact:false,wed:false,ws:0,last:0}};
  if(!S.worldSeed||!WORLD||WORLD.seed!==S.worldSeed||!S.prov||S.prov.oasis) initWorld();
  if(!S.krel) S.krel={'harun|ysolde':-10,'harun|osric':-25,'osric|ysolde':10};
  if(!S.kwar) S.kwar={};
  return S.crowns;
}
const K=id=>crowns()[id];
const alive=id=>!K(id).dead;
const liveKings=()=>Object.keys(KINGS).filter(alive);
const landsOf=o=>Object.keys(PROV).filter(p=>S.prov&&S.prov[p]&&S.prov[p].owner===o);
const pairKey=(a,b)=>[a,b].sort().join('|');
const krel=(a,b)=>S.krel[pairKey(a,b)]||0;
const kwar=(a,b)=>!!S.kwar[pairKey(a,b)];
function krelShift(a,b,d){ const k=pairKey(a,b); S.krel[k]=Math.max(-100,Math.min(100,(S.krel[k]||0)+d)); }
function allUnits(){ let n=S.units.length; for(const id in S.R) if(id!==S.cur&&S.R[id].units) n+=S.R[id].units.length; return n; }
function armyPower(){ const lv=S.levy&&S.levy.until>=S.day?S.levy.p:0; return Math.round(allUnits()*(unitDmg()+unitMax()/3)+heroDmg()*2+S.hl*2+(S.warships||0)*4+lv); }
function myPrestige(){ let regions=1+(S.coastUnlocked?1:0)+(S.mtnUnlocked?1:0); return Math.round((S.renown||0)+S.res.gold/10+armyPower()/2+S.pop/2+(landsOf('me').length-1)*12+regions*10+(keepLvl()-1)*10); }
function kPrestige(id){ const k=K(id); if(k.dead) return 0; return Math.round(k.renown+k.gold/10+k.army/2+k.pop/2+(landsOf(id).length-1)*12+20); }
function standings(){ crowns(); const rows=[{id:'me',p:myPrestige()}].concat(liveKings().map(id=>({id,p:kPrestige(id)}))); rows.sort((a,b)=>b.p-a.p); return rows; }
const myPlace=()=>standings().findIndex(r=>r.id==='me')+1;
function relWord(r){ return r>=60?'Devoted':r>=30?'Friendly':r>=0?'Cordial':r>=-30?'Cool':r>=-60?'Hostile':'Hateful'; }
function relShift(id,d){ const k=K(id); k.rel=Math.max(-100,Math.min(100,k.rel+d)); }
function news(t){ S.newsLog=S.newsLog||[]; S.newsLog.unshift({d:S.day,t}); if(S.newsLog.length>16) S.newsLog.length=16; }
const kn=id=>T(KINGS[id].short);
// ---------- diplomacy ----------
const napOn=k=>(k.nap||0)>=S.day;
function envoy(id){ const k=K(id), c=15+Math.max(0,Math.round(-k.rel/5)); if(S.phase!=='day'||k.last===S.day||k.dead) return;
  if(S.res.gold<c){ say(`An envoy with gifts costs ${c} gold.`); sfx('no'); return; }
  S.res.gold-=c; k.last=S.day; relShift(id,KINGS[id].style==='cunning'?8:12); sfx('order'); say(`<b>Envoy sent to ${kn(id)}.</b> Relations are now ${T(relWord(k.rel)).toLowerCase()}.`); afterDiplo(); }
function proposePact(id){ const k=K(id); if(k.pact||k.war||k.rel<20) return; k.pact=true; relShift(id,5); toast(T('Trade agreement'),kn(id),'⚖'); say(`<b>Trade agreement with ${kn(id)}.</b> +3 gold each dawn while it lasts.`); afterDiplo(); }
function signNap(id){ const k=K(id); if(k.war||k.rel<10||napOn(k)) return; k.nap=S.day+12; relShift(id,5); toast(T('Non-aggression pact'),kn(id),'☮'); say(`<b>Non-aggression pact with ${kn(id)}</b> for twelve days. Breaking it would shame you before every court.`); afterDiplo(); }
function signAlliance(id){ const k=K(id); if(k.ally||k.war||k.rel<60) return; k.ally=true; relShift(id,8); addRenown(5); toast(T('Military alliance'),kn(id),'⚔'); say(`<b>Military alliance with ${T(KINGS[id].name)}.</b> They join your wars, and they will call on you to join theirs.`); afterDiplo(); }
function breakAlliance(id){ const k=K(id); if(!k.ally) return; k.ally=false; relShift(id,-30); addRenown(-4); say(`<b>You broke your alliance with ${kn(id)}.</b>`); afterDiplo(); }
function proposeMarriage(id){ const k=K(id); if(k.wed||k.war||k.rel<50) return; if(Object.values(crowns()).some(x=>x.wed)){ say('Your house is already allied by marriage.'); return; }
  k.wed=true; k.ally=true; relShift(id,15); addRenown(10); party('win'); toast(T('Royal wedding'),kn(id),'♥'); say(`<b>A royal wedding binds your house to ${T(KINGS[id].name)}.</b> They will never march on you, and they send soldiers when you are at war.`); afterDiplo(); }
function requestAid(id){ const k=K(id); if(!(k.ally||k.wed)||k.aid===seasonIdx()||S.phase!=='day') return; k.aid=seasonIdx();
  const g=Math.min(Math.round(k.gold*.2),40); k.gold-=g; S.res.gold+=g; S.res.food+=10; relShift(id,-5); say(`<b>${kn(id)} sends aid:</b> ${g} gold and 10 food.`); sfx('up'); afterDiplo(); }
function demandTribute(id){ const k=K(id); if(k.war||k.last===S.day||S.phase!=='day') return; k.last=S.day;
  if(armyPower()<k.army*1.2){ relShift(id,-10); say(`<b>${kn(id)} laughs at your demand.</b> Your army is not strong enough to frighten them.`); afterDiplo(); return; }
  if(k.rel>-40&&Math.random()<(KINGS[id].style==='warlike'?.35:.65)){ const g=Math.max(10,Math.round(k.gold*.15)); k.gold-=g; S.res.gold+=g; relShift(id,-18); addRenown(4); say(`<b>${kn(id)} pays ${g} gold</b> rather than face your army.`); sfx('up'); }
  else{ relShift(id,-25); say(`<b>${kn(id)} refuses</b> and sends your envoy home without his boots.`); if(KINGS[id].style==='warlike'&&!napOn(k)&&!k.wed) startWar(id,true); }
  afterDiplo(); }
function embargo(id){ const k=K(id); if((k.emb||0)>=S.day||k.wed) return; k.emb=S.day+8; k.pact=false; relShift(id,-15); say(`<b>Embargo on ${kn(id)}.</b> Their merchants are barred from your roads and ports for eight days, and their treasury suffers.`); afterDiplo(); }
function sabotage(id){ const k=K(id); if(!cm('spymaster')||k.last===S.day||S.phase!=='day') return; k.last=S.day; const ok=Math.random()<.4+.15*skill('spymaster');
  if(ok){ k.army=Math.max(5,Math.round(k.army*.85)); say(`<b>Your spies burned ${kn(id)}'s armory.</b> Their army is weakened.`); sfx('thud'); }
  else{ relShift(id,-30); addRenown(-3); say(`<b>Your spies were caught</b> in ${T(CAPNAME[id])}. ${kn(id)} is furious.`); sfx('hurt'); }
  afterDiplo(); }
const landPrice=p=>{ const o=S.prov[p].owner, y=PROV[p].yield; let v=0; for(const r in y) v+=y[r]*(r==='gold'?6:r==='iron'?5:r==='renown'?12:4); return Math.round((30+v*3+S.prov[p].gar*2)*(1+Math.max(0,-(K(o).rel))/50)); };
function buyLand(p){ const o=S.prov[p].owner; if(!o||o==='me'||PROV[p].cap||K(o).war||K(o).rel<0||!bordersMe(p)||S.phase!=='day') return; const c=landPrice(p);
  if(S.res.gold<c){ say(`${kn(o)} wants ${c} gold for ${T(PROV[p].name)}.`); sfx('no'); return; }
  if(K(o).rel<25&&Math.random()<.5){ relShift(o,-5); say(`<b>${kn(o)} will not sell ${T(PROV[p].name)}</b> at any price, for now.`); afterDiplo(); return; }
  S.res.gold-=c; K(o).gold+=c; S.prov[p].owner='me'; S.prov[p].gar=6; addRenown(5); worldVer++; news(`You bought ${PROV[p].name} from ${KINGS[o].short}`); toast(T('New land'),T(PROV[p].name),'⚑'); say(`<b>${T(PROV[p].name)} is yours</b>, bought for ${c} gold.`); afterDiplo(); }
function cedeLand(p,id){ if(S.prov[p].owner!=='me'||PROV[p].cap||!PROV[p].adj.some(a=>S.prov[a].owner===id)||S.phase!=='day') return;
  S.prov[p].owner=id; relShift(id,35); addRenown(-3); worldVer++; news(`You ceded ${PROV[p].name} to ${KINGS[id].short}`); say(`<b>You cede ${T(PROV[p].name)} to ${kn(id)}.</b> They will remember the gesture.`); afterDiplo(); }
function hostTourney(){ if(S.hosted===seasonIdx()||S.phase!=='day') return; if(S.res.gold<40){ say('Hosting a grand tournament costs 40 gold.'); sfx('no'); return; }
  S.res.gold-=40; S.hosted=seasonIdx(); addRenown(8); for(const id of liveKings()) relShift(id,6);
  const win=heroDmg()*3+heroMax()/2+S.hl*2+Math.random()*12>Math.max(...liveKings().map(id=>K(id).army/3+6+Math.random()*12));
  if(win){ addRenown(10); S.tourneys=(S.tourneys||0)+1; } party('win'); news(`You hosted a grand tournament${win?' and your hero won it':''}`);
  say(`<b>A grand tournament in your lists!</b> Every court sent its champions. ${win?'Your hero won the day. +18 renown.':'A foreign champion won, but your court is the talk of the desert. +8 renown.'}`); afterDiplo(); }
function askJoinWar(id,foe){ const k=K(id); if(!(k.ally||k.wed)||kwar(id,foe)||!K(foe).war) return; if(k.rel<40){ say(`${kn(id)} will not risk a war for you yet.`); return; }
  S.kwar[pairKey(id,foe)]=S.day; relShift(id,-5); krelShift(id,foe,-30); news(`${KINGS[id].short} joined your war against ${KINGS[foe].short}`); toast(T('Allies march'),kn(id),'⚔'); say(`<b>${kn(id)} declares war on ${kn(foe)}</b> at your side.`); afterDiplo(); }
function denounce(id){ const k=K(id); if(k.last===S.day) return; k.last=S.day; relShift(id,-20); addRenown(3); for(const o of liveKings()) if(o!==id&&krel(o,id)<0) relShift(o,4); say(`<b>You denounce ${kn(id)}</b> before every court of ${CONT_NAME}.`); afterDiplo(); }
function startWar(id,theyStarted){ const k=K(id); k.war=true; k.pact=false; k.ws=0; k.warDay=S.day;
  news(theyStarted?`${KINGS[id].short} declared war on you`:`You declared war on ${KINGS[id].short}`); toast(T('War'),kn(id),'⚔');
  for(const o of liveKings()) if(o!==id&&(K(o).ally||K(o).wed)&&!kwar(o,id)&&K(o).rel>=30){ S.kwar[pairKey(o,id)]=S.day; news(`${KINGS[o].short} honored the alliance and marched on ${KINGS[id].short}`); } }
function declareWar(id){ const k=K(id); if(k.war||S.phase!=='day'||k.dead) return; if(k.wed){ say('You cannot march on your own family.'); return; }
  if(napOn(k)){ addRenown(-10); for(const o of liveKings()) relShift(o,-10); say('<b>You broke a non-aggression pact.</b> Every court thinks less of your word.'); k.nap=0; }
  if(k.ally) k.ally=false;
  relShift(id,-40); startWar(id,false); sfx('horn');
  say(`<b>War with ${T(KINGS[id].name)}.</b> Their knights will join the raids on your lands, and you may march on their provinces that border yours.`); afterDiplo(); }
function offerPeace(id){ const k=K(id); if(!k.war) return; const c=k.ws>=3?0:30+Math.max(0,-k.ws)*10;
  if(c&&S.res.gold<c){ say(`${kn(id)} wants ${c} gold for peace.`); sfx('no'); return; }
  S.res.gold-=c; k.war=false; k.nap=S.day+6; relShift(id,10); news(`Peace between you and ${KINGS[id].short}`); toast(T('Peace'),kn(id),'☮'); say(c?`<b>Peace bought</b> from ${kn(id)} for ${c} gold.`:`<b>${kn(id)} accepts peace.</b> Your victories spoke for you.`); afterDiplo(); }
function demandSurrender(id){ const k=K(id); if(!k.war||k.ws<4) return; const cand=landsOf(id).filter(p=>!PROV[p].cap&&bordersMe(p));
  if(!cand.length){ say(`${kn(id)} has no land on your border to give up.`); return; }
  const p=cand[0]; S.prov[p].owner='me'; S.prov[p].gar=6; k.war=false; k.nap=S.day+10; relShift(id,-10); addRenown(12); worldVer++; news(`${KINGS[id].short} surrendered ${PROV[p].name} to you`); party('win');
  say(`<b>${kn(id)} surrenders ${T(PROV[p].name)}</b> and sues for peace.`); afterDiplo(); }
function raiseLevy(){ if(S.phase!=='day'||(S.levy&&S.levy.until>=S.day)) return; if(S.res.gold<20||S.res.food<10){ say('Raising levies takes 20 gold and 10 food.'); sfx('no'); return; } S.res.gold-=20; S.res.food-=10; S.levy={p:12,until:S.day+2}; sfx('horn'); say('<b>Levies raised.</b> Your army is 12 stronger for three days.'); afterDiplo(); }
function afterDiplo(){ save(); ui(); if(!$('realm').hidden) renderRealm(); if(!$('world').hidden) renderWorldPanel(); worldVer++; }
// ---------- lands ----------
function settle(p){ const P=S.prov[p]; if(P.owner||S.phase!=='day') return; const c={gold:20,food:15};
  if(!bordersMe(p)){ say(`${T(PROV[p].name)} does not border your lands. Expand toward it first.`); sfx('no'); return; }
  if(!canPay(c)||S.pop<4){ say('Settling a land takes 20 gold, 15 food and 2 villagers.'); sfx('no'); return; }
  if(armyPower()<P.gar){ say(`Bandits hold ${T(PROV[p].name)} with a strength of ${P.gar}. Your army of ${armyPower()} is not enough. Raise levies or train more soldiers.`); sfx('no'); return; }
  spend(c); S.pop-=2; P.owner='me'; P.gar=6; addRenown(6); party('small'); sfx('up'); toast(T('New land'),T(PROV[p].name),'⚑'); news(`You settled ${PROV[p].name}`);
  say(`<b>${T(PROV[p].name)} is yours.</b> Two families settle there. It yields ${yieldStr(p)} each dawn.`); afterDiplo(); }
const yieldStr=p=>[costStr(PROV[p].yield),PROV[p].yield.renown?`${PROV[p].yield.renown} ${T('renown')}`:''].filter(Boolean).join(', ');
function battleOdds(p){ const P=S.prov[p], o=P.owner, def=(o&&o!=='me'?K(o).army*(PROV[p].cap?.6:.4):0)+P.gar; return {me:armyPower(),def:Math.round(def),pct:Math.round(100/(1+Math.pow(def/Math.max(1,armyPower()),2.2)))}; }
function fallOfCrown(o){ const k=K(o); k.dead=true; k.war=false; for(const p of landsOf(o)) if(S.prov[p].owner===o){ S.prov[p].owner=null; S.prov[p].gar=6; }
  for(const key in S.kwar) if(key.includes(o)) delete S.kwar[key]; addRenown(30); news(`The crown of ${CAPNAME[o]} has fallen`); S.kingslayer=true; }
function march(p){ const P=S.prov[p], o=P.owner; if(!o||o==='me'||!K(o).war||S.phase!=='day'||S.marched===S.day||!bordersMe(p)) return;
  const c={gold:10,food:10}; if(!canPay(c)){ say('A campaign needs 10 gold and 10 food in supplies.'); sfx('no'); return; }
  spend(c); S.marched=S.day; const od=battleOdds(p), win=Math.random()*100<od.pct; const k=K(o), cap=PROV[p].cap;
  if(win){ P.owner='me'; P.gar=6; k.army=Math.max(5,Math.round(k.army*.8)); k.ws+=2; addRenown(12); party('win'); sfx('up'); news(`You took ${PROV[p].name} from ${KINGS[o].short}`); worldVer++;
    if(cap) fallOfCrown(o);
    showOver(T('Victory at {{p}}',{p:T(PROV[p].name)}),cap?T('{{p}} has fallen. The crown of {{k}} is broken, and its lands are free for the taking.',{p:T(PROV[p].name),k:kn(o)}):T('Your army of {{a}} broke a garrison of {{d}}. The land is yours, and {{k}} loses a fifth of the army.',{a:od.me,d:od.def,k:kn(o)}),[{label:T('Onward'),primary:true,fn:()=>{ hideOver(); afterDiplo(); }}]); }
  else{ k.ws-=1; addRenown(-4); S.levy=null; S.mood=Math.max(0,S.mood-5); sfx('hurt'); news(`${KINGS[o].short} threw back your army at ${PROV[p].name}`);
    showOver(T('Defeat at {{p}}',{p:T(PROV[p].name)}),T('The garrison of {{d}} held against your army of {{a}}. The levies scatter home. Mood −5.',{a:od.me,d:od.def}),[{label:T('Fall back'),primary:true,fn:()=>{ hideOver(); afterDiplo(); }}]); } }
function reinforce(p){ const P=S.prov[p]; if(P.owner!=='me'||S.phase!=='day') return; if(S.res.gold<12){ say('Reinforcing a garrison costs 12 gold.'); sfx('no'); return; } S.res.gold-=12; P.gar+=4; sfx('build'); say(`<b>${T(PROV[p].name)}</b> garrison strengthened to ${P.gar}.`); afterDiplo(); }
// ---------- the other crowns act each dawn ----------
function crownsDawn(notes){
  crowns(); const ids=liveKings();
  for(const id of ids){ const k=K(id), st=KINGS[id].style, lands=landsOf(id).length, emb=(k.emb||0)>=S.day?.5:1;
    k.pop=Math.min(90,k.pop+1); k.gold+=Math.round((k.pop*.5+lands*3+(st==='cunning'?5:0))*emb); k.army+=st==='warlike'?3:1.5; k.renown+=1+lands*.6+(st==='pious'?2:0);
    if(st==='warlike'&&k.gold>70){ k.gold-=30; k.army+=6; } if(st==='pious'&&k.gold>120){ k.gold-=60; k.renown+=8; news(`${KINGS[id].short} raised a great temple`); }
    if(st==='cunning'&&k.gold>200){ k.gold-=50; k.renown+=6; news(`${KINGS[id].short} held a grand fair in Merrow`); }
    k.army=Math.round(k.army); k.renown=Math.round(k.renown); k.rel+=k.rel<(st==='pious'?10:st==='cunning'?0:-15)?1:-1; }
  // coalition against a runaway leader
  const stn=standings(); if(stn[0].id==='me'&&stn[1]&&stn[0].p>stn[1].p*1.3&&S.day>=8){ for(const id of ids) relShift(id,-2); if(!S.coalition){ S.coalition=true; news('The crowns whisper of a coalition against you'); notes.push('<b>The other crowns grow wary of your power</b> and whisper of a coalition'); } for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++) krelShift(ids[i],ids[j],2); }
  // kings among themselves: feuds, wars, peace
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){ const a=ids[i], b=ids[j], key=pairKey(a,b);
    krelShift(a,b,(Math.random()-.55)*4);
    if(!S.kwar[key]&&krel(a,b)<-45&&Math.random()<.18){ S.kwar[key]=S.day; news(`${KINGS[a].short} and ${KINGS[b].short} went to war`); notes.push(`<b>${kn(a)} and ${kn(b)}</b> are at war`); }
    else if(S.kwar[key]&&S.day-S.kwar[key]>5&&Math.random()<.2){ delete S.kwar[key]; krelShift(a,b,25); news(`${KINGS[a].short} and ${KINGS[b].short} made peace`); }
    if(S.kwar[key]){ const [w,l]=K(a).army>=K(b).army?[a,b]:[b,a]; const tgt=landsOf(l).filter(p=>PROV[p].adj.some(x=>S.prov[x].owner===w));
      if(tgt.length&&Math.random()<.35){ const p=tgt.find(x=>!PROV[x].cap)||tgt[0]; const att=K(w).army*.5*(.8+Math.random()*.4), def=S.prov[p].gar+K(l).army*(PROV[p].cap?.6:.3);
        if(att>def){ S.prov[p].owner=w; S.prov[p].gar=8; K(l).army=Math.round(K(l).army*.85); news(`${KINGS[w].short} took ${PROV[p].name} from ${KINGS[l].short}`); notes.push(`<b>${kn(w)}</b> took ${T(PROV[p].name)} from ${kn(l)}`); if(PROV[p].cap) fallOfCrown(l); }
        else K(w).army=Math.round(K(w).army*.9); } } }
  // expansion into free land on their borders
  for(const id of liveKings()){ const k=K(id); if(Math.random()>.4) continue; const free=frontier(id).filter(p=>!S.prov[p].owner);
    if(free.length&&k.army>S.prov[free[0]].gar*1.6){ const p=free[(Math.random()*free.length)|0]; S.prov[p].owner=id; S.prov[p].gar=8; k.army-=3; news(`${KINGS[id].short} claimed ${PROV[p].name}`); if(bordersMe(p)) notes.push(`<b>${kn(id)}</b> claimed ${T(PROV[p].name)} on your border`); } }
  // war with you
  for(const id of liveKings()){ const k=K(id);
    if(!k.war&&!k.wed&&!napOn(k)&&k.rel<=-45&&k.army>armyPower()*.9&&S.day>=6&&Math.random()<(KINGS[id].style==='warlike'?.5:.2)){ startWar(id,true); notes.push(`<b>${T(KINGS[id].name)} has declared war on you</b>`); }
    if(k.war){ const mine=landsOf('me').filter(p=>!PROV[p].cap&&PROV[p].adj.some(x=>S.prov[x].owner===id));
      if(mine.length&&Math.random()<.35){ const p=mine[(Math.random()*mine.length)|0], P=S.prov[p], def=P.gar+armyPower()*.3, att=k.army*.5*(.8+Math.random()*.4);
        if(att>def){ P.owner=id; P.gar=8; news(`${KINGS[id].short} took ${PROV[p].name} from you`); notes.push(`<b>${kn(id)} took ${T(PROV[p].name)}</b> from you`); addRenown(-5); }
        else { k.army=Math.max(5,Math.round(k.army*.92)); k.ws--; notes.push(`<b>Your garrison at ${T(PROV[p].name)}</b> threw back ${kn(id)}`); addRenown(3); } }
      S.royalRaid=S.royalRaid||{}; S.royalRaid[id]=Math.min(8,2+Math.floor(k.army/15));
      if(k.ws<=-4&&Math.random()<.4) S.royalMsg={kind:'terms',k:id};
      if(k.ws>=4&&Math.random()<.5) S.royalMsg={kind:'sue',k:id}; }
    else if(S.royalRaid) delete S.royalRaid[id]; }
  // allies call for help
  if(!S.royalMsg) for(const id of liveKings()){ const k=K(id); if(!(k.ally||k.wed)) continue; const foe=liveKings().find(o=>o!==id&&kwar(id,o)&&!K(o).war&&!K(o).wed); if(foe&&Math.random()<.4){ S.royalMsg={kind:'callarms',k:id,foe}; break; } }
  // letters
  if(!S.royalMsg&&S.day>=3&&Math.random()<.32){ const id=ids[(Math.random()*ids.length)|0], k=K(id), st=KINGS[id].style;
    if(!k||k.dead){}
    else if(!k.war&&!k.wed&&k.rel>=45&&!Object.values(crowns()).some(x=>x.wed)) S.royalMsg={kind:'marry',k:id};
    else if(!k.war&&!k.ally&&k.rel>=55&&Math.random()<.5) S.royalMsg={kind:'alliance',k:id};
    else if(st==='warlike'&&!k.war&&k.rel<0) S.royalMsg={kind:'demand',k:id,c:{gold:15+S.day*2}};
    else if(st==='cunning'&&!k.pact&&!k.war&&k.rel>=0) S.royalMsg={kind:'trade',k:id};
    else if(st==='pious'&&!k.war&&!napOn(k)&&k.rel>=5) S.royalMsg={kind:'nap',k:id};
    else if(S.day>=6&&S.day%5===1) S.royalMsg={kind:'tourney',k:id};
    else { const w=liveKings().find(o=>o!==id&&kwar(id,o)); if(w&&!K(w).ally&&!K(w).wed&&!k.war) S.royalMsg={kind:'joinme',k:id,foe:w}; } }
  for(const p of landsOf('me')){ if(PROV[p].yield.renown) addRenown(PROV[p].yield.renown); }
  if(S.levy&&S.levy.until<S.day) S.levy=null;
  worldVer++;
}
function offerRoyal(){
  const m=S.royalMsg, KG=KINGS[m.k], k=K(m.k), done=()=>{ S.royalMsg=null; hideOver(); afterDiplo(); };
  queueMicrotask(()=>letterOpener(m.k));
  if(!KG||k.dead){ S.royalMsg=null; return; }
  if(m.kind==='marry') showOver(T('A proposal from {{k}}',{k:T(KG.name)}),T('{{k}} offers the hand of a royal child to your house. A marriage would bind your crowns: they would never march on you and would send knights when you are at war.',{k:kn(m.k)}),[
    {label:T('Accept the marriage'),sub:T('An alliance, +10 renown'),primary:true,fn:()=>{ S.royalMsg=null; proposeMarriage(m.k); hideOver(); }},{label:T('Decline politely'),sub:T('Relations cool a little'),fn:()=>{ relShift(m.k,-8); done(); }}]);
  else if(m.kind==='alliance') showOver(T('{{k}} proposes an alliance',{k:T(KG.name)}),T('“Our banners side by side. Your wars are my wars, and mine are yours.”'),[
    {label:T('Swear the alliance'),sub:T('They join your wars; you may be called to theirs'),primary:true,fn:()=>{ S.royalMsg=null; signAlliance(m.k); hideOver(); }},{label:T('Not now'),sub:'',fn:()=>done()}]);
  else if(m.kind==='nap') showOver(T('{{k}} offers a pact of peace',{k:T(KG.name)}),T('“Let neither of us raise a sword against the other for twelve days.”'),[
    {label:T('Sign the pact'),sub:T('No war between you for twelve days'),primary:true,fn:()=>{ S.royalMsg=null; signNap(m.k); hideOver(); }},{label:T('Decline'),sub:'',fn:()=>{ relShift(m.k,-4); done(); }}]);
  else if(m.kind==='callarms') showOver(T('{{k}} calls you to arms',{k:T(KG.name)}),T('Your ally is at war with {{f}} and asks you to honor your oath.',{f:T(KINGS[m.foe].name)}),[
    {label:T('Declare war on {{f}}',{f:kn(m.foe)}),sub:T('Honor the alliance'),primary:true,fn:()=>{ S.royalMsg=null; hideOver(); relShift(m.k,15); declareWar(m.foe); }},{label:T('Refuse'),sub:T('The alliance ends, and they will not forget'),fn:()=>{ k.ally=false; relShift(m.k,-30); addRenown(-5); done(); }}]);
  else if(m.kind==='joinme') showOver(T('{{k}} seeks a friend',{k:T(KG.name)}),T('{{k}} is at war with {{f}} and asks you to join, promising gold.',{k:kn(m.k),f:kn(m.foe)}),[
    {label:T('Join the war'),sub:T('+30 gold, relations improve'),fn:()=>{ S.royalMsg=null; hideOver(); S.res.gold+=30; relShift(m.k,20); declareWar(m.foe); }},{label:T('Stay out of it'),sub:'',primary:true,fn:()=>done()}]);
  else if(m.kind==='demand') showOver(T('{{k}} makes a demand',{k:T(KG.name)}),T('“Pay me {{c}}, little crown, and my riders will look elsewhere this season.”',{c:costStr(m.c)}),[
    {label:`${T('Pay')} ${costStr(m.c)}`,sub:T('Relations improve'),fn:()=>{ if(!canPay(m.c)){ say('You cannot pay that.'); return; } spend(m.c); relShift(m.k,20); done(); }},{label:T('Refuse'),sub:T('Relations sour, and war grows likelier'),primary:true,fn:()=>{ relShift(m.k,-20); addRenown(2); done(); }}]);
  else if(m.kind==='trade') showOver(T('{{k}} proposes trade',{k:T(KG.name)}),T('Merrow’s caravans would stop in your markets. Both crowns grow richer.'),[
    {label:T('Sign the agreement'),sub:T('+3 gold each dawn'),primary:true,fn:()=>{ k.rel=Math.max(k.rel,20); S.royalMsg=null; proposePact(m.k); hideOver(); }},{label:T('Not now'),sub:'',fn:()=>done()}]);
  else if(m.kind==='terms') showOver(T('{{k}} offers terms',{k:T(KG.name)}),T('The war goes badly for you. {{k}} will make peace for {{g}} gold.',{k:kn(m.k),g:40}),[
    {label:T('Pay {{g}} gold for peace',{g:40}),sub:'',fn:()=>{ if(S.res.gold<40){ say('Not enough gold.'); return; } S.res.gold-=40; k.war=false; k.nap=S.day+6; relShift(m.k,10); done(); }},{label:T('Fight on'),sub:'',primary:true,fn:()=>done()}]);
  else if(m.kind==='sue') showOver(T('{{k}} sues for peace',{k:T(KG.name)}),T('Your victories have shaken {{k}}, who offers {{g}} gold and peace.',{k:kn(m.k),g:30}),[
    {label:T('Accept peace and gold'),sub:T('+30 gold, +8 renown'),primary:true,fn:()=>{ S.res.gold+=30; k.war=false; k.nap=S.day+8; addRenown(8); news(`${KG.short} sued for peace`); done(); }},{label:T('Fight on'),sub:'',fn:()=>done()}]);
  else if(m.kind==='tourney') showOver(T('A grand tournament in the lands of {{k}}',{k:kn(m.k)}),T('Champions of every crown will ride. Will your hero enter? The entry fee is 10 gold.'),[
    {label:T('Enter the lists'),sub:T('Win renown and gold'),primary:true,fn:()=>{ if(S.res.gold<10){ say('Not enough gold.'); return; } S.res.gold-=10;
      const me=heroDmg()*3+heroMax()/2+S.hl*2+Math.random()*12, best=Math.max(...liveKings().map(id=>K(id).army/3+6+Math.random()*12)); S.royalMsg=null;
      if(me>=best){ S.res.gold+=40; addRenown(14); relShift(m.k,5); S.tourneys=(S.tourneys||0)+1; party('win'); news('Your hero won the grand tournament');
        showOver(T('Your hero wins the tournament!'),T('Unhorsed every champion of the desert. +40 gold, +14 renown.'),[{label:T('Glory'),primary:true,fn:()=>{ hideOver(); afterDiplo(); }}]); }
      else { addRenown(3); showOver(T('Your hero rode well'),T('…but a rival champion took the crown of the lists. +3 renown for a fine showing.'),[{label:T('Next year'),primary:true,fn:()=>{ hideOver(); afterDiplo(); }}]); } }},
    {label:T('Stay home'),sub:'',fn:()=>done()}]);
  else done();
}
const landsTxt=n=>lang==='es'?`${n} tierra${n===1?'':'s'}`:`${n} land${n===1?'':'s'}`;
function treatyTags(id){ const k=K(id); return `${k.war?`<span class="tag war">${T('At war')}</span>`:''}${k.wed?`<span class="tag ally">${T('Allied by marriage')}</span>`:k.ally?`<span class="tag ally">${T('Military alliance')}</span>`:''}${k.pact?`<span class="tag ally">${T('Trade agreement')}</span>`:''}${napOn(k)?`<span class="tag">${T('Pact of peace until day {{d}}',{d:k.nap})}</span>`:''}${(k.emb||0)>=S.day?`<span class="tag war">${T('Embargo')}</span>`:''}${k.dead?`<span class="tag war">${T('Fallen')}</span>`:''}`; }
function crownsHtml(){
  crowns(); const st=standings(), night=S.phase!=='day';
  const rows=st.map((r,i)=>{ const me=r.id==='me';
    if(me) return `<div class="crown me"><span class="pl">${i+1}</span><span class="kn"><span class="sw" style="background:var(--gold)"></span>${T('Your realm')} · ${T(rankName())}</span><span class="ks">${T('Prestige {{p}} · army {{a}} · {{l}}',{p:r.p,a:armyPower(),l:landsTxt(landsOf('me').length)})}</span><span class="tags">${S.levy&&S.levy.until>=S.day?`<span class="tag">${T('Levies raised')}</span>`:''}</span><span class="ka"><button type="button" class="hot" id="levyBtn" ${night||(S.levy&&S.levy.until>=S.day)?'disabled':''}>${T('Raise levies')} <span class="c">20g 10f</span></button><button type="button" id="hostBtn" ${night||S.hosted===seasonIdx()?'disabled':''}>${T('Host a tournament')} <span class="c">40g</span></button></span></div>`;
    const k=K(r.id), KG=KINGS[r.id];
    return `<div class="crown"><span class="pl">${i+1}</span><span class="kn"><span class="sw" style="background:${KG.color}"></span>${T(KG.name)}</span>
      <span class="ks">${T('Prestige {{p}} · army {{a}} · {{l}} · {{r}} toward you',{p:r.p,a:k.army,l:landsTxt(landsOf(r.id).length),r:T(relWord(k.rel)).toLowerCase()})}</span>
      <span class="tags">${treatyTags(r.id)}</span>
      <span class="ka"><button type="button" class="hot" data-court="${r.id}">${T('Court')}</button></span></div>`; }).join('');
  const nw=(S.newsLog||[]).slice(0,6).map(n=>`<div class="pd">${T('Day {{n}}',{n:n.d})}: ${n.t}</div>`).join('');
  return `<h3>${T('Rival crowns')}</h3><div class="bar2">${T('You are the {{n}} crown of {{c}}.',{n:ordinal(myPlace()),c:CONT_NAME})} ${T('Prestige counts renown, gold, army, people and lands.')} <button type="button" class="hot" id="worldBtn2">${T('Open the map of {{c}}',{c:CONT_NAME})}</button></div><div class="crowns">${rows}</div>
    ${nw?`<h3>${T('News from the courts')}</h3><div class="prov">${nw}</div>`:''}`;
}
