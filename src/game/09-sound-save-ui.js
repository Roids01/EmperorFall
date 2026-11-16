// =============== SOUND ===============
// ZzFXMicro v1.3.0, Zuper Zmall Zound Zynth by Frank Force. MIT License. https://github.com/KilledByAPixel/ZzFX
const zzfxV=.3;
const zzfx=(p=1,k=.05,b=220,e=0,r=0,t=.1,q=0,D=1,u=0,y=0,v=0,z=0,l=0,E=0,A=0,F=0,c=0,w=1,m=0,B=0
,N=0)=>{let M=Math,d=2*M.PI,R=44100,G=u*=500*d/R/R,C=b*=(1-k+2*k*M.random(k=[]))*d/R,
g=0,H=0,a=0,n=1,I=0,J=0,f=0,h=N<0?-1:1,x=d*h*N*2/R,L=M.cos(x),Z=M.sin,K=Z(x)/4,O=1+K,
X=-2*L/O,Y=(1-K)/O,P=(1+h*L)/2/O,Q=-(h+L)/O,S=P,T=0,U=0,V=0,W=0;e=R*e+9;m*=R;r*=R;t*=
R;c*=R;y*=500*d/R**3;A*=d/R;v*=d/R;z*=R;l=R*l|0;p*=zzfxV;for(h=e+m+r+t+c|0;a<h;k[a++]
=f*p)++J%(100*F|0)||(f=q?1<q?2<q?3<q?Z(g*g):M.max(M.min(M.tan(g),1),-1):1-(2*g/d%2+2)
%2:1-4*M.abs(M.round(g/d)-g/d):Z(g),f=(l?1-B+B*Z(d*a/l):1)*(f<0?-1:1)*M.abs(f)**D*(a<
e?a/e:a<e+m?1-(a-e)/m*(1-w):a<e+m+r?w:a<h-c?(h-a-c)/t*w:0),f=c?f/2+(c>a?0:(a<h-c?1:(h
-a)/c)*k[a-c|0]/2/p):f,N?f=W=S*T+Q*(T=U)+P*(U=f)-Y*V-X*(V=W):0),x=(b+=u+=y)*M.cos(A*
H++),g+=x+x*E*Z(a**5),n&&++n>z&&(b+=v,C+=v,n=0),!l||++I%l||(b=C,u=G,n=n||1);p=actx.
createBuffer(1,h,R);p.getChannelData(0).set(k);b=actx.createBufferSource();
b.buffer=p;b.connect(actx.destination);b.start()};
const ZZ={
  shot:[.35,.05,1500,0,.01,.04,2,1.6,-30],
  kill:[.7,.05,520,.01,.03,.14,1,1.8,-9],
  thud:[1.1,.05,110,0,.04,.22,0,1,-3,0,0,0,0,.7],
  chip:[.35,.05,300,0,.01,.05,4,1,0,0,0,0,0,.3],
  hurt:[1,.05,150,.01,.1,.32,3,2,-4,0,0,0,0,.8,0,.2],
  build:[.6,.05,330,.01,.04,.1,1,1,4],
  up:[.7,0,440,.01,.08,.16,1,1,0,0,220,.06],
  no:[.45,0,200,0,.05,.08,4,1,-5],
  splash:[.9,.1,170,.03,.15,.5,4,1,-2,0,0,0,0,2],
  horn:[.7,0,196,.06,.3,.3,2,1,0,0,98,.2,0,0,0,0,0,.7],
  charge:[.8,.05,180,.02,.1,.22,2,1,15],
  slash:[.45,.05,900,0,.02,.06,3,1,-20,0,0,0,0,.4],
  ride:[.35,.05,520,0,.02,.05,1,1,6],
  order:[.35,0,600,0,.02,.04,1,1,8]};
function tone(f,dur,type,vol,f2,delay=0){
  const t=actx.currentTime+delay, o=actx.createOscillator(), g=actx.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t+dur+.02);
}
function sfx(k){
  if(!sound||!actx) return;
  try{
    if(k==='shot'){ const n=performance.now(); if(n-lastShot<70) return; lastShot=n; }
    if(ZZ[k]){ zzfx(...ZZ[k]); return; }
    switch(k){
    case 'kill': tone(520,.12,'triangle',.07,240); break;
    case 'thud': tone(140,.18,'sine',.12,60); break;
    case 'chip': tone(300,.05,'square',.02,200); break;
    case 'hurt': tone(120,.3,'sawtooth',.08,60); break;
    case 'build': tone(330,.08,'triangle',.06,440); break;
    case 'up': tone(440,.1,'triangle',.06); tone(660,.14,'triangle',.06,null,.08); break;
    case 'no': tone(200,.12,'square',.03,150); break;
    case 'splash': tone(220,.4,'sine',.06,90); break;
    case 'horn': tone(196,.5,'sawtooth',.05,220); tone(294,.6,'sawtooth',.04,294,.15); break;
    case 'charge': tone(180,.25,'sawtooth',.05,520); break;
    case 'slash': tone(900,.07,'sawtooth',.025,300); break;
    case 'ride': tone(520,.06,'triangle',.04,660); break;
    case 'order': tone(600,.05,'triangle',.04,800); break;
    case 'bell': tone(660,1.4,'sine',.1); tone(990,1.1,'sine',.05); tone(1320,.6,'sine',.03); break;
    case 'dawn': [523,659,784].forEach((f,i)=>tone(f,.4,'sine',.06,null,i*.12)); break;
  } }catch(e){}
}

// =============== SAVE ===============
let slot=1, saveOn=false;
const LF=window.localforage?localforage.createInstance({name:'smallcrown',storeName:'saves'}):null;
const slotKey=n=>'slot-'+n, lsKey=n=>KEY+'-slot'+n;
async function readSlot(n){
  try{ if(LF){ const v=await LF.getItem(slotKey(n)); if(v) return JSON.parse(v); } }catch(e){}
  try{ const v=localStorage.getItem(lsKey(n)); if(v) return JSON.parse(v); }catch(e){}
  return null;
}
function writeSlot(n,json){
  const ls=()=>{ try{ localStorage.setItem(lsKey(n),json); }catch(e){} };
  if(LF) LF.setItem(slotKey(n),json).catch(ls); else ls();
}
function dropSlot(n){ if(LF) LF.removeItem(slotKey(n)).catch(()=>{}); try{ localStorage.removeItem(lsKey(n)); }catch(e){} }
async function migrateSave(){
  try{ const old=localStorage.getItem(KEY); if(!old) return;
    if(!(await readSlot(1))){ if(LF) await LF.setItem(slotKey(1),old); else localStorage.setItem(lsKey(1),old); }
    localStorage.removeItem(KEY); }catch(e){}
}
async function slotMenu(boot){
  await migrateSave();
  const info=[]; for(let n=1;n<=3;n++) info.push(await readSlot(n));
  const opts=info.map((d,i)=>{ const n=i+1;
    if(!d) return {label:T('Slot {{n}} · empty',{n}),sub:T('Found a new kingdom here'),fn:()=>{ slot=n; savePrefs(); newGame(); }};
    if(d.daily) return {label:T('Slot {{n}} · empty',{n}),sub:T('Found a new kingdom here'),fn:()=>{ slot=n; savePrefs(); newGame(); }};
    return {label:T('Slot {{n}} · day {{d}} on {{x}}',{n,d:d.day,x:T((DIFF[d.diff]||DIFF.normal).label)}),primary:n===slot,
      sub:T('{{g}} gold, {{f}} food, {{p}} villagers',{g:d.res?d.res.gold:0,f:d.res?d.res.food:0,p:d.pop||0})+(d.coastUnlocked?' · '+T('Saltreach Cove'):''),fn:()=>slotPick(n,d,boot)}; });
  { const di=dailyInfo(), saved=await readSlot(4), cont=saved&&saved.daily&&saved.daily.key===di.key, best=dailyBest(di.key);
    opts.push({label:T('Daily challenge · {{d}}',{d:di.date}),sub:`${T(di.mod.name)}: ${T(di.mod.desc)}`+(cont?' · '+T('day {{n}}',{n:saved.day}):'')+(best?' · '+T('best {{n}}',{n:best.toLocaleString()}):''),
      fn:()=>{ if(cont){ slot=4; if(load(saved)){ saveOn=true; hideOver(); ui(); forecast(); return; } } startDaily(); }}); }
  if(!boot) opts.push({label:T('Keep playing'),sub:T('Back to slot {{n}}',{n:slot}),fn:()=>{ hideOver(); ui(); }});
  showOver(T('Choose a kingdom'),T('Three save slots, kept on this device. Each one is a separate kingdom.'),opts);
}
function slotPick(n,d,boot){
  showOver(T('Slot {{n}}',{n}),T('Day {{d}} on {{x}}. {{g}} gold, {{f}} food and {{p}} villagers, keep at {{k}}/{{m}}.',{d:d.day,x:T((DIFF[d.diff]||DIFF.normal).label),g:d.res?d.res.gold:0,f:d.res?d.res.food:0,p:d.pop||0,k:(d.R&&d.R.home?d.R.home.keep:d.keep),m:(d.R&&d.R.home?d.R.home.keepMax:d.keepMax)}),[
    {label:T('Continue'),sub:T('Pick up at day {{n}}',{n:d.day}),primary:true,fn:()=>{ slot=n; savePrefs(); if(load(d)){ saveOn=true; hideOver(); ui(); forecast(); } else newGame(); }},
    {label:T('Found a new kingdom here'),sub:T('This saved kingdom will be lost'),fn:()=>{ slot=n; savePrefs(); newGame(); }},
    {label:T('Back'),sub:'',fn:()=>slotMenu(boot)}]);
}
function encRegion(r){ return {grid:r.grid.map(t=>[t.land?1:0,t.ore?1:0,t.b?{...t.b,aim:undefined,born:undefined,hitT:undefined,worked:undefined,sm_:undefined,fl_:undefined}:null,t.grove?1:0,t.water?1:0]),spawns:r.spawns,seed:r.seed,keep:r.keep,keepMax:r.keepMax,kind:r.kind,shore:r.shore}; }
function save(){
  if(!S||S.over||!saveOn||NET.role==='guest') return;
  try{ writeSlot(slot,saveJSON()); }catch(e){}
}
function saveJSON(){
  stash();
  return JSON.stringify({hist:S.hist||null,aud:S.aud||null,path:S.path||null,pathR:S.pathR||0,pathSeen:S.pathSeen||0,vics:S.vics||[],tradeGold:S.tradeGold||0,diploDays:S.diploDays||0,order:S.order||'guard',armies:S.armies||[],scout:S.scout||{},known:S.known||{},siegeRaid:S.siegeRaid||null,R:Object.fromEntries(Object.entries(S.R).map(([id,r])=>[id,encRegion(r)])),cur:S.cur,heroAt:S.heroAt,raid:S.raid,coastUnlocked:S.coastUnlocked,mtnUnlocked:S.mtnUnlocked,visitedMtn:S.visitedMtn,daily:S.daily||null,survivedBlood:!!S.survivedBlood,routes:S.routes||{},sat:S.sat||{},loan:S.loan||null,inv:S.inv||null,guildBan:S.guildBan||0,worldSeed:S.worldSeed||0,krel:S.krel||null,kwar:S.kwar||null,coalition:!!S.coalition,hosted:S.hosted??null,kingslayer:!!S.kingslayer,crowns:S.crowns||null,prov:S.prov||null,levy:S.levy||null,royalMsg:S.royalMsg||null,royalRaid:S.royalRaid||null,newsLog:S.newsLog||[],marched:S.marched||0,tourneys:S.tourneys||0,highKing:!!S.highKing,ph:S.ph||{},renown:S.renown||0,tax:taxLvl(),council:S.council||{},petition:S.petition||null,lastPet:S.lastPet||null,debt:S.debt||null,keepLvl:S.keepLvl||1,edicts:S.edicts||[],fac:S.fac||{},gear:S.gear||{},lootPending:S.lootPending||0,demand:S.demand||null,req:S.req||null,lastReq:S.lastReq||null,trader:S.trader||null,seedDays:S.seedDays||0,oilNights:S.oilNights||0,banner:S.banner||0,spy:!!S.spy,feastSeason:S.feastSeason??null,feastDay:S.feastDay||0,sapperWarned:!!S.sapperWarned,warships:S.warships,plate:S.plate,mercs:S.mercs,sunk:S.sunk,voyages:S.voyages,iron:S.iron,portPrice:S.portPrice,voyagesSent:S.voyagesSent,visitedCoast:S.visitedCoast,mood:S.mood,weather:S.weather,blood:S.blood,hx:S.hx,hl:S.hl,perks:S.perks,perkPending:S.perkPending,hungry:S.hungry,cold:S.cold,diff:S.diff,quest:S.quest,upg:S.upg,won:S.won,abilUsed:S.abilUsed,res:S.res,pop:S.pop,price:S.price,day:S.day,keep:S.keep,keepMax:S.keepMax,mods:S.mods,kills:S.kills,seed:S.seed,
    grid:S.grid.map(t=>[t.land?1:0,t.ore?1:0,t.b?{...t.b,aim:undefined,born:undefined,hitT:undefined,worked:undefined}:null,t.grove?1:0]),spawns:S.spawns,queue:S.queue});
}
function load(d){
  try{
    if(typeof d==='string') d=JSON.parse(d); if(!d||!d.grid) return false;
    S=blank();
    Object.assign(S,{res:d.res||{gold:d.gold??10,food:10,wood:12,stone:2},pop:d.pop??3,price:d.price||{...BASEP},day:d.day,keep:d.keep,keepMax:d.keepMax,
      mods:{...S.mods,...d.mods},kills:d.kills||0,spawns:d.spawns,queue:d.queue,seed:d.seed||Math.random()*1000});
    if(d.R){ S.R={}; for(const id in d.R){ const r=d.R[id]; S.R[id]={grid:r.grid.map(([l,o,b,gr,w])=>({land:!!l,ore:!!o,grove:!!gr,water:!!w,b})),spawns:r.spawns||[],seed:r.seed,keep:r.keep,keepMax:r.keepMax,kind:r.kind||'canyon',shore:r.shore||null,units:[]}; } unstash(d.cur&&S.R[d.cur]?d.cur:'home'); }
    else{ S.grid=d.grid.map(([l,o,b,gr])=>({land:!!l,ore:!!o,grove:!!gr,b})); Object.assign(S,{kind:'canyon',shore:null,units:[],cur:'home'}); stash(); }
    S.ph=d.ph||{}; ensureEco(); S.hist=d.hist||null; S.aud=d.aud||null; Object.assign(S,{path:d.path||null,pathR:d.pathR||0,pathSeen:d.pathSeen||0,vics:d.vics||[],tradeGold:d.tradeGold||0,diploDays:d.diploDays||0,order:d.order||'guard',armies:d.armies||[],scout:d.scout||{},known:d.known||{},siegeRaid:d.siegeRaid||null});
    Object.assign(S,{routes:d.routes||{},sat:d.sat||{},loan:d.loan||null,inv:d.inv||null,guildBan:d.guildBan||0});
    Object.assign(S,{worldSeed:d.worldSeed||0,krel:d.krel||null,kwar:d.kwar||null,coalition:!!d.coalition,hosted:d.hosted??null,kingslayer:!!d.kingslayer});
    Object.assign(S,{crowns:d.crowns||null,prov:d.prov||null,levy:d.levy||null,royalMsg:d.royalMsg||null,royalRaid:d.royalRaid||null,newsLog:d.newsLog||[],marched:d.marched||0,tourneys:d.tourneys||0,highKing:!!d.highKing});
    Object.assign(S,{renown:d.renown||0,tax:d.tax??1,council:d.council||{},petition:d.petition||null,lastPet:d.lastPet||null,debt:d.debt||null,keepLvl:d.keepLvl||1});
    Object.assign(S,{edicts:d.edicts||[],fac:d.fac||{},gear:d.gear||{},lootPending:d.lootPending||0,demand:d.demand||null});
    Object.assign(S,{req:d.req||null,lastReq:d.lastReq||null,trader:d.trader||null,seedDays:d.seedDays||0,oilNights:d.oilNights||0,banner:d.banner||0,spy:!!d.spy,feastSeason:d.feastSeason??null,feastDay:d.feastDay||0,sapperWarned:!!d.sapperWarned});
    Object.assign(S,{daily:d.daily||null,survivedBlood:!!d.survivedBlood,mtnUnlocked:!!d.mtnUnlocked,visitedMtn:!!d.visitedMtn,warships:d.warships||0,plate:d.plate||0,mercs:d.mercs||0,sunk:d.sunk||0});
    if(S.res.iron==null) S.res.iron=0;
    Object.assign(S,{heroAt:d.heroAt||S.cur,raid:d.raid||'home',coastUnlocked:!!d.coastUnlocked,voyages:d.voyages||[],iron:d.iron||0,portPrice:d.portPrice||{},voyagesSent:d.voyagesSent||0,visitedCoast:!!d.visitedCoast});
    Object.assign(S,{mood:d.mood??60,weather:d.weather||'clear',blood:!!d.blood,hx:d.hx||0,hl:d.hl||1,perks:d.perks||[],perkPending:d.perkPending||0,hungry:!!d.hungry,cold:!!d.cold});
    S.diff=DIFF[d.diff]?d.diff:'normal'; S.quest=d.quest||0; S.upg=d.upg||[]; S.won=!!d.won; S.abilUsed=d.abilUsed||0;
    if(!S.grid.some(t=>t.grove)) addGroves();
    S.hero=mkHero(); S.hero.hp=S.hero.max=heroMax();
    S.grid.forEach((t,i)=>{ if(t.b&&(t.b.type==='barr'||t.b.type==='range')) spawnUnits(i); });
    field(); buildWorld(); return true;
  }catch(e){ return false; }
}

// =============== UI ===============
const CHRON=[];
function say(h){ $('msg').innerHTML=h;
  if(S&&saveOn&&(!CHRON.length||CHRON[0].h!==h)){ CHRON.unshift({h,d:S.day,n:S.phase==='night'}); if(CHRON.length>80) CHRON.length=80; if($('chronD').open) renderChron(); } }
function renderChron(){ $('chron').innerHTML=CHRON.map(c=>`<p><span>${c.n?T('Night {{n}}',{n:c.d}):T('Day {{n}}',{n:c.d})}</span>${c.h}</p>`).join('')||`<p>${T('Nothing yet')}</p>`; }
const CHAPTERS=[
  {day:1,n:'I',name:'A Crown in the Dust',text:'Your banner flies over a dry canyon keep, and bandits know every pass. Build, feed your people and hold the walls.'},
  {day:5,n:'II',name:'Salt and Sails',text:'Ships crowd the water off Saltreach Cove, and where trade goes, pirates follow. Build a harbor and guard the shore.'},
  {day:9,n:'III',name:'Iron in the Snow',text:'The northern pass is full of iron. Whoever holds the forge holds the realm, and the raiders know it.'},
  {day:13,n:'IV',name:'Sea Wolves',text:'The pirate captains have joined their fleets. Raids grow bolder on every shore. Launch warships and light the coast.'},
  {day:17,n:'V',name:'The Last Warlord',text:'Every warlord left in the desert is marching on your keep. Hold four more nights and the crown is yours.'}];
const chapterOf=d=>CHAPTERS.reduce((a,c)=>d>=c.day?c:a,CHAPTERS[0]);
function showChapter(c){
  if(!c) return; const box=$('board'); box.querySelectorAll('.chapter').forEach(e=>e.remove());
  const el=document.createElement('div'); el.className='chapter'; el.setAttribute('aria-live','polite');
  el.innerHTML='<span class="ck"></span><span class="cn"></span><span class="rule"></span><span class="cd"></span>';
  el.querySelector('.ck').textContent=T('Chapter {{n}}',{n:c.n}); el.querySelector('.cn').textContent=T(c.name); el.querySelector('.cd').textContent=T(c.text);
  box.appendChild(el); setTimeout(()=>el.remove(),reduce?3000:4900);
}
const ACH=[
  {id:'night1',icon:'☾',name:'First light',desc:'Survive your first night',test:()=>S.day>=2},
  {id:'night10',icon:'✦',name:'Ten nights',desc:'Survive 10 nights',test:()=>S.day>=11},
  {id:'crowned',icon:'♛',name:'The crown holds',desc:'Win a game',test:()=>S.won},
  {id:'hardwin',icon:'⚔',name:'Iron will',desc:'Win on Hard',test:()=>S.won&&S.diff==='hard'},
  {id:'builder',icon:'⌂',name:'Master builder',desc:'Own 15 buildings',test:()=>{ let b=0; eachAll(x=>{ if(x.type!=='keep'&&x.type!=='road') b++; }); return b>=15; }},
  {id:'village',icon:'☺',name:'Bustling village',desc:'Grow to 20 villagers',test:()=>S.pop>=20},
  {id:'happy',icon:'♥',name:'Beloved ruler',desc:'Reach a mood of 90',test:()=>S.mood>=90},
  {id:'rich',icon:'◎',name:'Full treasury',desc:'Hold 200 gold',test:()=>S.res.gold>=200},
  {id:'realms',icon:'⛰',name:'Three realms',desc:'Visit the valley, the cove and the pass',test:()=>S.visitedCoast&&S.visitedMtn},
  {id:'sailor',icon:'⚓',name:'Merchant prince',desc:'Send 5 trade voyages',test:()=>(S.voyagesSent||0)>=5},
  {id:'sinker',icon:'✸',name:'Scourge of pirates',desc:'Sink 3 pirate boats',test:()=>(S.sunk||0)>=3},
  {id:'ironclad',icon:'⛨',name:'Ironclad',desc:'Forge arms and plate to the top',test:()=>(S.iron||0)>=3&&(S.plate||0)>=3},
  {id:'roads',icon:'≡',name:'All roads',desc:'Lay 10 roads',test:()=>count('road')>=10},
  {id:'hero5',icon:'★',name:'Legend',desc:'Raise your hero to level 5',test:()=>S.hl>=5},
  {id:'blood',icon:'●',name:'Red night',desc:'Survive a blood moon',test:()=>!!S.survivedBlood},
  {id:'prosper',icon:'⚱',name:'Land of plenty',desc:'Reach a prosperous living standard',test:()=>(S.stdTier||0)>=3},
  {id:'highking',icon:'♚',name:'High King',desc:'Finish 20 nights as the foremost crown',test:()=>!!S.highKing},
  {id:'conqueror',icon:'⚑',name:'Conqueror',desc:'Hold six lands of Ashkara',test:()=>S.prov&&landsOf('me').length>=6},
  {id:'kingslayer',icon:'☠',name:'Crownbreaker',desc:'Take a rival’s capital',test:()=>!!S.kingslayer},
  {id:'champion',icon:'⚔',name:'Champion of the lists',desc:'Win a grand tournament',test:()=>(S.tourneys||0)>=1},
  {id:'wonder',icon:'✦',name:'Wonder of the world',desc:'Complete a grand project',test:()=>WONDERS.some(hasWonder)},
  {id:'caravans',icon:'🐪',name:'Caravan master',desc:'Run caravans to two crowns at once',test:()=>Object.keys(S.routes||{}).filter(routeOk).length>=2},
  {id:'capital',icon:'♛',name:'Capital of the desert',desc:'Raise your realm to a capital',test:()=>rankIdx()>=4},
  {id:'council',icon:'⚖',name:'Full council',desc:'Fill every council seat',test:()=>SEATS.every(st=>cm(st.id))},
  {id:'daily',icon:'☀',name:'Daily devotion',desc:'Survive 5 nights of a daily challenge',test:()=>!!S.daily&&S.day>=6}];
let achGot={}; try{ achGot=JSON.parse(localStorage.getItem('smallcrown-ach')||'{}')||{}; }catch(e){}
let achKey='';
function checkAch(){
  if(!S||S.over&&!S.won) return; let any=false;
  for(const a of ACH){ if(achGot[a.id]) continue; let ok=false; try{ ok=a.test(); }catch(e){} if(ok){ achGot[a.id]=Date.now(); any=true; toast(T('Achievement'),T(a.name),a.icon); sfx('up'); } }
  if(any){ try{ localStorage.setItem('smallcrown-ach',JSON.stringify(achGot)); }catch(e){} }
  renderAch();
}
function renderAch(){
  const n=ACH.filter(a=>achGot[a.id]).length, key=n+lang; if(key===achKey) return; achKey=key;
  $('achsum').textContent=`${n}/${ACH.length}`;
  $('ach').innerHTML=ACH.map(a=>`<div class="ab2${achGot[a.id]?' got':''}"><span class="ai">${a.icon}</span><span><span class="an">${T(a.name)}</span><br><span class="ad2">${T(a.desc)}</span></span></div>`).join('');
}
// daily challenge: same map and twist for everyone on the same date
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function seeded(seed,fn){ const r=Math.random; Math.random=mulberry32(seed); try{ return fn(); } finally{ Math.random=r; } }
const DAILY_MODS=[
  {id:'rich',name:'Rich veins',desc:'Every mine yields 2 more.'},
  {id:'lean',name:'Lean start',desc:'Half the starting goods, but your score counts 30% more.'},
  {id:'blood',name:'Blood sky',desc:'Blood moons rise twice as often.'},
  {id:'swift',name:'Swift raiders',desc:'Raiders move 20% faster.'},
  {id:'trade',name:'Trade winds',desc:'Trade voyages pay 30% more.'}];
function dailyInfo(){ const d=new Date(), key=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); return {key,mod:DAILY_MODS[(key*7)%DAILY_MODS.length],date:d.toLocaleDateString(lang==='es'?'es':'en-US',{month:'short',day:'numeric'})}; }
const dmod=id=>!!(S&&S.daily&&S.daily.mod===id);
function dailyBest(key){ try{ const d=JSON.parse(localStorage.getItem('smallcrown-daily')||'{}'); return d.key===key?d.best:0; }catch(e){ return 0; } }
function recordDaily(){ if(!S||!S.daily) return; const sc=score(), b=dailyBest(S.daily.key); if(sc>b) try{ localStorage.setItem('smallcrown-daily',JSON.stringify({key:S.daily.key,best:sc})); }catch(e){} }
function startDaily(){
  const di=dailyInfo(); slot=4; saveOn=true;
  seeded(di.key,()=>startGame('normal'));
  S.daily={key:di.key,mod:di.mod.id};
  if(dmod('rich')) S.mods.stone+=2;
  if(dmod('lean')) RES.forEach(r=>S.res[r]=Math.floor(S.res[r]/2));
  save(); ui(); showChapter(CHAPTERS[0]);
  toast(T('Daily challenge'),T(di.mod.name),'☀');
  say(`<b>Daily challenge, ${di.date}:</b> ${T(di.mod.desc)} Everyone playing today has the same valley.`);
}
// ---------- edicts: laws with trade-offs ----------
const EDICTS=[
  {id:'conscription',name:'Conscription',good:'Barracks and archery ranges field 1 more soldier',bad:'Mood −6',mood:-6},
  {id:'tithe',name:'Shrine tithe',good:'+3 gold per shrine each dawn',bad:'Mood −4',mood:-4},
  {id:'rationing',name:'Rationing',good:'Villagers eat half as much',bad:'Mood −8',mood:-8},
  {id:'shifts',name:'Long shifts',good:'Farms, lumber camps and mines yield 1 more',bad:'Mood −7',mood:-7},
  {id:'markets',name:'Free markets',good:'Markets earn 3 more gold; traders visit twice as often',bad:'−1 food per market',mood:0},
  {id:'watch',name:'Night watch',good:'Towers and the keep shoot 25% faster',bad:'Mood −5; taverns earn nothing',mood:-5},
  {id:'holy',name:'Holy days',good:'Mood +10',bad:'Farms grow 1 less food',mood:10},
  {id:'militia',name:'Militia drills',good:'Soldiers deal 1 more damage',bad:'−1 gold for every 3 villagers',mood:0}];
const hasEdict=id=>!!(S&&S.edicts&&S.edicts.includes(id));
const edictSlots=()=>S.day>=10||rankIdx()>=3?3:2;
function toggleEdict(id){
  if(S.phase!=='day'||S.over) return; S.edicts=S.edicts||[];
  if(hasEdict(id)){ S.edicts=S.edicts.filter(x=>x!==id); say(`<b>${T(EDICTS.find(e=>e.id===id).name)}</b> repealed.`); }
  else{ if(S.edicts.length>=edictSlots()){ say(`Only ${edictSlots()} edicts can be in force at once. Repeal one first.`); sfx('no'); return; }
    if(S.res.gold<5){ say('Proclaiming an edict costs 5 gold.'); sfx('no'); return; }
    S.res.gold-=5; S.edicts.push(id); const e=EDICTS.find(x=>x.id===id); say(`<b>${T(e.name)}</b> proclaimed. ${T(e.good)}. ${T(e.bad)}.`); sfx('bell'); }
  if(id==='conscription') S.grid.forEach((t,i)=>{ if(t.b&&(t.b.type==='barr'||t.b.type==='range')) spawnUnits(i); });
  S.ver++; save(); ui();
}
let edictKey='';
function renderEdicts(){
  const key=(S.edicts||[]).join()+S.day+lang+S.phase; if(key===edictKey) return; edictKey=key;
  $('edictsum').textContent=`${(S.edicts||[]).length}/${edictSlots()}`;
  $('edicts').innerHTML=EDICTS.map(e=>{ const on=hasEdict(e.id); return `<div class="uc${on?' on':''}"><div class="un">${T(e.name)}<small>${on?T('In force'):''}</small></div><div class="tr"><span class="pos">${T(e.good)}</span><br><span class="neg">${T(e.bad)}</span></div><button type="button" data-ed="${e.id}" ${S.phase!=='day'?'disabled':''}>${on?T('Repeal'):`${T('Proclaim')} <span class="c">5g</span>`}</button></div>`; }).join('');
  $('edicts').querySelectorAll('[data-ed]').forEach(b=>b.addEventListener('click',()=>toggleEdict(b.dataset.ed)));
}
// ---------- factions: who raids where, and how angry they are ----------
const FACTIONS={
  nomads:{name:'The Sand Wolves',region:'home',desc:'Desert raiders who ride on The Valley.',pact:'+4 gold each dawn',color:'#D99A60'},
  brotherhood:{name:'The Red Brotherhood',region:'coast',desc:'Pirates who prey on Saltreach Cove.',pact:'+4 food each dawn',color:'#E8604F'},
  clans:{name:'The Iron Clans',region:'mountain',desc:'Mountain tribes who claim Ironpeak Pass.',pact:'+2 iron each dawn',color:'#9FB8D0'}};
const facOf=r=>r==='coast'?'brotherhood':r==='mountain'?'clans':'nomads';
const facKnown=f=>f==='nomads'||(f==='brotherhood'&&S.coastUnlocked)||(f==='clans'&&S.mtnUnlocked);
function host(f){ S.fac=S.fac||{}; if(!S.fac[f]) S.fac[f]={h:f==='nomads'?50:40,gifts:0,pact:false,gift:0}; return S.fac[f]; }
const hostWord=h=>h<15?'At peace':h<35?'Calm':h<60?'Wary':h<80?'Hostile':'Furious';
const raidMult=r=>{ const h=host(facOf(r)).h; return (h<15?.6:.75+h/200); };
function shiftHost(f,d,why){ if(!facKnown(f)) return; const o=host(f), was=o.h; o.h=Math.max(0,Math.min(100,o.h+d));
  if(o.pact&&o.h>=40){ o.pact=false; toast(T('Pact broken'),T(FACTIONS[f].name),'✖'); }
  if(why&&Math.abs(d)>=8) toast(T(FACTIONS[f].name),T(hostWord(o.h)),d<0?'☮':'⚔'); }
const giftCost=f=>15+host(f).gifts*5;
function sendGift(f){
  const o=host(f), c=giftCost(f); if(S.phase!=='day'||o.gift===S.day) return;
  if(S.res.gold<c){ say(`Gifts for ${T(FACTIONS[f].name)} cost ${c} gold.`); sfx('no'); return; }
  S.res.gold-=c; o.gifts++; o.gift=S.day; shiftHost(f,-14); sfx('order'); say(`<b>Gifts sent to ${T(FACTIONS[f].name)}.</b> They are now ${T(hostWord(o.h)).toLowerCase()}.`); save(); ui(); if(!$('realm').hidden) renderRealm();
}
function makePact(f){ const o=host(f); if(o.h>=30||o.pact) return; o.pact=true; sfx('up'); toast(T('Trade pact'),T(FACTIONS[f].name),'☮'); say(`<b>Trade pact with ${T(FACTIONS[f].name)}.</b> ${T(FACTIONS[f].pact)}, as long as they stay calm.`); save(); ui(); if(!$('realm').hidden) renderRealm(); }
function factionsHtml(){
  const ids=Object.keys(FACTIONS).filter(facKnown); if(!ids.length) return '';
  return `<h3>${T('Neighbors')}</h3><div class="facs">${ids.map(f=>{ const F=FACTIONS[f], o=host(f), night=S.phase!=='day';
    const col=o.h<15?'#8FCB7E':o.h<35?'#C9E07A':o.h<60?'#F0BE4E':o.h<80?'#E0904A':'#E8604F';
    return `<div class="fac"><span class="fn">${T(F.name)} · <span style="color:${col}">${T(hostWord(o.h))}</span></span>
      <span class="fd">${T(F.desc)} ${T('Raids are {{p}}% of normal size.',{p:Math.round(raidMult(F.region)*100)})}${o.pact?' · '+T('Pact')+': '+T(F.pact):''}</span>
      <span class="hb"><i style="width:${o.h}%;background:${col}"></i></span>
      <span class="fa"><button type="button" data-gift="${f}" ${night||o.gift===S.day||S.res.gold<giftCost(f)?'disabled':''}>${o.gift===S.day?T('Gifts sent'):`${T('Send gifts')} <span class="c">${giftCost(f)}g</span>`}</button>
      ${o.pact?'':`<button type="button" class="alt" data-pact="${f}" ${o.h>=30?'disabled':''}>${T('Trade pact')}</button>`}</span></div>`; }).join('')}</div>`;
}
function factionDawn(rep){
  for(const f of Object.keys(FACTIONS)){ if(!facKnown(f)) continue; const o=host(f); o.h=Math.max(0,Math.min(100,o.h+3-skill('spymaster')));
    if(o.pact){ if(f==='nomads') S.res.gold+=4; if(f==='brotherhood') S.res.food+=4; if(f==='clans') S.res.iron+=2; } }
  const rf=facOf(rep.region);
  if(rep.total&&rep.keep===0&&!rep.lost) shiftHost(rf,-8,true); else if(rep.keep>=4) shiftHost(rf,6,true);
  const angry=Object.keys(FACTIONS).filter(f=>facKnown(f)&&host(f).h>=60&&!host(f).pact);
  if(angry.length&&Math.random()<.25&&!S.demand){ const f=angry[(Math.random()*angry.length)|0]; S.demand={f,c:f==='clans'&&S.res.iron>=10?{iron:10}:{gold:20+Math.floor(S.day*1.5)}}; }
}
function offerDemand(){
  const d=S.demand, F=FACTIONS[d.f];
  showOver(T('{{f}} demand tribute',{f:T(F.name)}),T('Their envoy waits at the gate. Pay, and they will calm down. Refuse, and they will remember it.'),[
    {label:`${T('Pay')} ${costStr(d.c)}`,sub:T('Hostility drops sharply'),primary:true,fn:()=>{ if(!canPay(d.c)){ say('You cannot afford the tribute.'); sfx('no'); return; } spend(d.c); shiftHost(d.f,-25,true); S.demand=null; hideOver(); save(); ui(); }},
    {label:T('Refuse'),sub:T('Hostility rises, and the next raid from them grows'),fn:()=>{ shiftHost(d.f,15,true); S.demand=null; hideOver(); save(); ui(); }}]);
}
// ---------- hero gear from boss loot ----------
const GEAR={
  sunsteel:{slot:'weapon',name:'Sunsteel sword',desc:'+3 damage'},
  wolfbane:{slot:'weapon',name:'Wolfbane axe',desc:'+2 damage; every blow also strikes a second raider nearby'},
  stormlance:{slot:'weapon',name:'Storm lance',desc:'+1 damage; Charge recharges 35% faster'},
  lamellar:{slot:'armor',name:'Lamellar coat',desc:'+8 health'},
  seacoat:{slot:'armor',name:'Captain’s coat',desc:'+5 health; rides 15% faster'},
  thornmail:{slot:'armor',name:'Thornmail',desc:'+4 health; raiders who strike your hero take 1 damage'},
  amulet:{slot:'charm',name:'Healer’s amulet',desc:'Heals 1 health every 2 seconds'},
  coin:{slot:'charm',name:'Lucky coin',desc:'Raiders your hero fells pay 2 more gold'},
  horncharm:{slot:'charm',name:'Horn of the hills',desc:'Rally lasts 4 seconds longer and heals soldiers by 3'}};
const gearOn=id=>!!(S&&S.gear&&Object.values(S.gear).includes(id));
const gearDmg=()=>gearOn('sunsteel')?3:gearOn('wolfbane')?2:gearOn('stormlance')?1:0;
const gearHp=()=>gearOn('lamellar')?8:gearOn('seacoat')?5:gearOn('thornmail')?4:0;
function offerLoot(){
  S.gear=S.gear||{}; const pool=Object.keys(GEAR).filter(id=>!gearOn(id)), pick=[];
  while(pick.length<3&&pool.length) pick.push(pool.splice((Math.random()*pool.length)|0,1)[0]);
  if(!pick.length){ S.lootPending=0; return; }
  showOver(T('Spoils of battle'),T('The fallen champion left something behind. Choose one for your hero; it replaces whatever fills that slot.'),pick.map(id=>{ const g=GEAR[id], cur=S.gear[g.slot];
    return {label:`${T(g.name)} · ${T(g.slot==='weapon'?'Weapon':g.slot==='armor'?'Armor':'Charm')}`,sub:T(g.desc)+(cur?' · '+T('replaces {{n}}',{n:T(GEAR[cur].name)}):''),fn:()=>{ S.gear[g.slot]=id; S.lootPending--; if(S.hero){ S.hero.max=heroMax(); S.hero.hp=S.hero.max; } hideOver(); sfx('up'); party('small'); say(`<b>${T(g.name)}</b> equipped. ${T(g.desc)}.`); save(); ui(); }}; }));
}
let heroKey='';
function renderHeroPanel(){
  const key=JSON.stringify(S.gear||{})+(S.perks||[]).join()+S.hl+lang; if(key===heroKey) return; heroKey=key;
  $('herosum').textContent=T('Lv {{n}}',{n:S.hl});
  const slot=(sl,label)=>{ const id=S.gear&&S.gear[sl], g=id&&GEAR[id];
    return `<div class="gs${g?'':' empty'}"><span class="gl">${T(label)}</span><span class="gn">${g?T(g.name):T('Empty')}</span><span class="gd">${g?T(g.desc):T('Defeat a warlord or pirate captain to win gear.')}</span></div>`; };
  const pk=(S.perks||[]).map(id=>PERKS.find(p=>p.id===id)).filter(Boolean);
  $('gear').innerHTML=`<div class="gs"><span class="gl">${T('Stats')}</span><span class="gn">${T('{{h}} health · {{d}} damage',{h:heroMax(),d:heroDmg()})}</span><span class="gd">${T('Level {{n}}',{n:S.hl})} · ${S.hx}/${xpNeed(S.hl)} XP</span></div>`
    +slot('weapon','Weapon')+slot('armor','Armor')+slot('charm','Charm')
    +(pk.length?`<div class="gs"><span class="gl">${T('Perks')}</span>${pk.map(p=>`<span class="gn">${T(p.name)}</span><span class="gd">${T(p.desc)}</span>`).join('')}</div>`:'');
}
