
const __main=()=>{
const N=15, C=7, KEY='smallcrown-save-v3', BEST='smallcrown-best';
const DEF={
  farm:{name:'Farm',cost:{wood:3},hp:3,enter:6,work:true},
  house:{name:'House',cost:{wood:4},hp:3,enter:6,upg:[{wood:6,stone:4,gold:4}]},
  lumber:{name:'Lumber camp',cost:{gold:3},hp:3,enter:6,work:true,need:'grove'},
  mine:{name:'Mine',cost:{wood:4,gold:2},hp:4,enter:7,work:true,need:'ore'},
  wall:{name:'Palisade',cost:{wood:2},hp:9,enter:14,upg:[{stone:3,gold:1}]},
  trap:{name:'Spike trap',cost:{wood:2,stone:1},hp:1,enter:1},
  tower:{name:'Watchtower',cost:{wood:4,gold:3},hp:5,enter:9,upg:[{stone:4,gold:5},{stone:6,gold:8}]},
  cata:{name:'Catapult',cost:{wood:6,stone:4,gold:4},hp:6,enter:10,upg:[{stone:8,gold:8}],unlock:4,upkeep:1},
  barr:{name:'Barracks',cost:{wood:6,gold:4},hp:7,enter:10,upg:[{stone:4,gold:8}],unlock:2,upkeep:1},
  market:{name:'Market',cost:{wood:6,stone:4},hp:4,enter:8,work:true,unlock:3},
  well:{name:'Well',cost:{wood:3,stone:2},hp:4,enter:6},
  shrine:{name:'Shrine',cost:{stone:6,gold:6},hp:5,enter:8,unlock:5},
  harbor:{name:'Harbor',cost:{wood:10,stone:4},hp:8,enter:10,work:true,need:'shore',unlock:3},
  range:{name:'Archery range',cost:{wood:6,gold:5},hp:6,enter:10,unlock:3,upkeep:1,upg:[{wood:6,gold:8}]},
  lighthouse:{name:'Lighthouse',cost:{stone:10,wood:4},hp:7,enter:10,need:'shore',unlock:5},
  smith:{name:'Blacksmith',cost:{wood:6,stone:6},hp:6,enter:9,unlock:6},
  tavern:{name:'Tavern',cost:{wood:8,gold:4},hp:5,enter:8,unlock:4},
  road:{name:'Road',cost:{stone:1},hp:3,enter:1},
  w_granary:{name:'Great Granary',cost:{wood:20,stone:10},hp:20,enter:20,work:true,wonder:true,days:3,daily:{wood:10,stone:6},unlock:6,rank:0,desc:'Food never spoils, and every store holds 40 more.'},
  w_bazaar:{name:'Grand Bazaar',cost:{wood:20,stone:10,gold:20},hp:20,enter:20,work:true,wonder:true,days:4,daily:{wood:8,cloth:4,gold:10},unlock:6,rank:1,desc:'Market prices 15% better, caravans earn 15% more, and +6 gold each dawn.'},
  w_academy:{name:'Royal Academy',cost:{stone:20,gold:30},hp:20,enter:20,work:true,wonder:true,days:4,daily:{stone:8,cloth:3,gold:12},unlock:8,rank:2,desc:'Your hero gains half again as much experience, and kingdom upgrades cost a quarter less.'},
  w_cathedral:{name:'Cathedral of the Sun',cost:{stone:30,gold:30},hp:24,enter:20,work:true,wonder:true,days:5,daily:{stone:12,gold:8,tools:2},unlock:8,rank:2,desc:'Mood +12 and +2 renown each dawn.'},
  w_colossus:{name:'The Sun Colossus',cost:{stone:30,iron:10,gold:30},hp:30,enter:20,work:true,wonder:true,days:5,daily:{stone:14,iron:3,gold:6},unlock:10,rank:3,desc:'The keep and towers hit 2 harder and see further. +30 renown when finished.'},
  pasture:{name:'Goat pasture',cost:{wood:5},hp:3,enter:5,work:true,unlock:2},
  storehouse:{name:'Storehouse',cost:{wood:8,stone:4},hp:6,enter:9,unlock:3},
  brewery:{name:'Brewery',cost:{wood:6,stone:3},hp:4,enter:7,work:true,unlock:4},
  weaver:{name:'Weaver',cost:{wood:6,gold:4},hp:4,enter:7,work:true,unlock:4},
  saltpan:{name:'Salt pans',cost:{stone:4,wood:2},hp:3,enter:4,work:true,need:'shore',unlock:5},
  workshop:{name:'Workshop',cost:{wood:6,stone:4},hp:5,enter:8,work:true,unlock:6},
  keep:{name:'Keep',cost:{},hp:0,enter:1}
};
const TOOLS=['farm','house','lumber','mine','wall','trap','tower','cata','barr','market','well','shrine','range','harbor','lighthouse','smith','tavern','road','pasture','storehouse','brewery','weaver','saltpan','workshop','clear','ride'];
const KEYS={farm:'1',house:'2',lumber:'3',mine:'4',wall:'5',trap:'6',tower:'7',cata:'8',barr:'9',market:'0',well:'Z',shrine:'C',range:'B',harbor:'N',lighthouse:'L',smith:'G',tavern:'T',road:'Y',pasture:'J',storehouse:'K',brewery:'I',weaver:'O',saltpan:',',workshop:'.',clear:'X',ride:'R'};
const TNAME={farm:'Farm',house:'House',lumber:'Lumber',mine:'Mine',wall:'Palisade',trap:'Trap',tower:'Tower',cata:'Catapult',barr:'Barracks',market:'Market',well:'Well',shrine:'Shrine',range:'Archers',harbor:'Harbor',lighthouse:'Light',smith:'Smithy',tavern:'Tavern',road:'Road',pasture:'Pasture',storehouse:'Stores',brewery:'Brewery',weaver:'Weaver',saltpan:'Salt',workshop:'Workshop',clear:'Clear',ride:'Ride'};
const ICON={
  pasture:'<path d="M2 18V9M20 18V9M2 11h18M2 15h18" stroke="currentColor" stroke-width="1.6"/><ellipse cx="11" cy="7" rx="4" ry="2.5" fill="currentColor"/><path d="M15 6l2-2" stroke="currentColor" stroke-width="1.4"/>',
  storehouse:'<path d="M2 10l9-6 9 6v9H2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 19v-6h6v6M8 13l6 6M14 13l-6 6" stroke="currentColor" stroke-width="1.3"/>',
  brewery:'<rect x="4" y="6" width="10" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4 10h10M4 15h10" stroke="currentColor" stroke-width="1.3"/><path d="M14 9h3v6h-3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  weaver:'<path d="M4 3v16M18 3v16M4 5h14M4 17h14" stroke="currentColor" stroke-width="1.6"/><path d="M7 5v12M10 5v12M13 5v12M16 5v12" stroke="currentColor" stroke-width="1" opacity=".7"/><path d="M4 11h14" stroke="currentColor" stroke-width="2.2"/>',
  saltpan:'<rect x="2" y="8" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="12" y="8" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 20l3-5 3 5z" fill="currentColor"/><path d="M2 5c3-2 5 2 9 0s6 2 9 0" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  workshop:'<path d="M3 20V9l8-5 8 5v11" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 18l6-6M12 11l3 3 2-2-3-3z" stroke="currentColor" stroke-width="1.5" fill="currentColor"/>',
  lighthouse:'<path d="M9 7h4l1.4 12H7.6z" fill="currentColor"/><rect x="8.5" y="3.5" width="5" height="3" rx=".6" fill="currentColor"/><path d="M15 5l5-2M15 5.5l5 2M7 5L2 3M7 5.5l-5 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
  smith:'<path d="M3 9h12c0 2-1.6 3-4 3v2h3v3H6v-3h3v-2c-3 0-6-1-6-3z" fill="currentColor"/><path d="M15 9h4l-4 2z" fill="currentColor"/>',
  tavern:'<path d="M5 6h9v12H5z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M14 9h2.5a2 2 0 0 1 0 6H14" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M6 6c0-2 2-3 3.5-2 1-1.5 4-1 4 1.5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  road:'<path d="M8 2L4 20M14 2l4 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M11 4v3M11 10v3M11 16v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  harbor:'<circle cx="11" cy="5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 7v12M7 10h8M4 13c1 4 4 6 7 6s6-2 7-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  well:'<ellipse cx="11" cy="16" rx="7" ry="3" fill="currentColor"/><rect x="4" y="11" width="14" height="5" fill="currentColor"/><path d="M5 11V6M17 11V6M3 6l8-3 8 3z" stroke="currentColor" stroke-width="1.6" fill="currentColor"/>',
  shrine:'<path d="M11 2l2 5h-4z" fill="currentColor"/><rect x="9" y="7" width="4" height="9" fill="currentColor"/><rect x="5" y="16" width="12" height="3" fill="currentColor"/>',
  range:'<circle cx="13" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="13" cy="10" r="2.5" fill="currentColor"/><path d="M2 18l9-7" stroke="currentColor" stroke-width="1.6"/>',
  farm:'<rect x="3" y="3" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 8h10M6 11h10M6 14h10" stroke="currentColor" stroke-width="1.6"/>',
  house:'<path d="M3 11l8-7 8 7v8H3z" fill="currentColor"/><rect x="9.5" y="13" width="3" height="6" fill="#28201C"/>',
  lumber:'<path d="M11 2l5 7h-3l4 6H5l4-6H6z" fill="currentColor"/><rect x="10" y="15" width="2" height="5" fill="currentColor"/>',
  mine:'<path d="M3 18a8 8 0 0 1 16 0z" fill="currentColor"/><path d="M9 18v-3.5a2 2 0 0 1 4 0V18" fill="#28201C"/>',
  wall:'<path d="M4 19V8l1.5-2L7 8v11M9.5 19V8L11 6l1.5 2v11M15 19V8l1.5-2L18 8v11" fill="currentColor"/>',
  trap:'<path d="M4 17l2-6 2 6M10 17l2-6 2 6M16 17l2-6 2 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 18h17" stroke="currentColor" stroke-width="1.6"/>',
  tower:'<path d="M5 9l6-5 6 5z" fill="currentColor"/><rect x="6.5" y="9" width="9" height="4" fill="currentColor"/><path d="M7.5 13l-1 6M14.5 13l1 6M8 16h6" stroke="currentColor" stroke-width="1.5"/>',
  cata:'<rect x="3" y="14" width="16" height="4" rx="1" fill="currentColor"/><path d="M8 14L16 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16.5" cy="4.5" r="2" fill="currentColor"/>',
  barr:'<path d="M11 3l7 2.5V11c0 4-3 6.5-7 8-4-1.5-7-4-7-8V5.5z" fill="currentColor"/><path d="M11 7v8M7.5 10.5h7" stroke="#28201C" stroke-width="1.6"/>',
  market:'<path d="M3 9l2-5h12l2 5z" fill="currentColor"/><path d="M5 9v10h12V9" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="8" y="12" width="6" height="4" fill="currentColor"/>',
  clear:'<path d="M5 5l12 12M17 5L5 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  ride:'<path d="M6 18.5V10a5 5 0 0 1 10 0v8.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="7.6" cy="9" r=".9" fill="#28201C"/><circle cx="14.4" cy="9" r=".9" fill="#28201C"/>'
};
const RES=['gold','food','wood','stone','iron'], GOODS=['wool','cloth','ale','salt','tools'], ALLR=RES.concat(GOODS), TRADE=['food','wood','stone','iron','wool','cloth','ale','salt','tools'];
const BASEP={food:2,wood:2,stone:3,iron:5,wool:2,cloth:6,ale:4,salt:4,tools:7}, LOT=5;
const RCOL={gold:'#F0BE4E',food:'#C9E07A',wood:'#E0A86A',stone:'#C9CFD8',iron:'#9FB8D0',wool:'#EDE3CE',cloth:'#C98AB8',ale:'#D8A848',salt:'#F4F1EA',tools:'#8FA0B0',people:'#86B6FF',mood:'#E89AC0'};
const cap1=w=>w.charAt(0).toUpperCase()+w.slice(1);
// ---------- language (i18next): English keys, Spanish translations ----------
const ES=window.SC_ES||{};

let lang='en';
if(window.i18next) i18next.init({lng:'en',fallbackLng:'en',keySeparator:false,nsSeparator:false,initImmediate:false,returnEmptyString:false,interpolation:{escapeValue:false},resources:{en:{translation:{}},es:{translation:ES}}});
const T=(k,o)=>{ if(window.i18next&&i18next.isInitialized) return i18next.t(k,o||{}); let r=lang==='es'&&ES[k]?ES[k]:(o&&o.defaultValue)||k; return o?r.replace(/\{\{(\w+)\}\}/g,(m,x)=>o[x]??m):r; };
const ESW={building:'edificio',day:'día',ship:'barco',villager:'aldeano'};
const TP=(n,w)=>lang==='es'&&ESW[w]?`${n} ${ESW[w]}${n===1?'':'s'}`:plural(n,w);
const TR=r=>T(r);
function costStr(c){ return ALLR.filter(r=>c[r]).map(r=>lang==='es'?`${c[r]} de ${T(r)}`:`${c[r]} ${r}`).join(', '); }
function costShort(c){ const p=ALLR.filter(r=>c[r]).map(r=>GOODS.includes(r)?`<span style="color:${RCOL[r]}">${c[r]} ${r}</span>`:`<span class="c${r[0]}">${c[r]}${r[0]}</span>`); return p.length?p.join(' '):'free'; }
function canPay(c){ return RES.every(r=>S.res[r]>=(c[r]||0)); }
function spend(c){ RES.forEach(r=>S.res[r]-=(c[r]||0)); }
function addC(a,b){ const o={...a}; RES.forEach(r=>{ if(b&&b[r]) o[r]=(o[r]||0)+b[r]; }); return o; }
const count=t=>allGrids().reduce((a,g)=>a+g.filter(x=>x.b&&x.b.type===t).length,0);
const housing=()=>4+4*((S.keepLvl||1)-1)+(3+S.mods.housing)*count('house')+2*countLvl('house',2);
const WIN_NIGHTS=20;
const SEASONS=[
  {name:'Spring',farm:1,col:'#8FCB7E',wx:[['rain',.5]]},
  {name:'Summer',farm:-1,col:'#F0BE4E',wx:[['sandstorm',.4]]},
  {name:'Harvest',farm:2,col:'#E0904A',wx:[['rain',.2]]},
  {name:'Winter',farm:-2,col:'#B9CCF0',wx:[['snow',.6]]}];
const season=()=>SEASONS[Math.floor((S.day-1)/5)%4];
const WX={clear:{name:'Clear',desc:''},rain:{name:'Rain',desc:'rain stops fires and adds 1 food per farm'},sandstorm:{name:'Sandstorm',desc:'a sandstorm slows raiders but cuts your towers’ sight'},snow:{name:'Snow',desc:'snow slows everyone in the open'}};
function rollWeather(){ let r=Math.random(); for(const [w,p] of season().wx){ if(r<p) return w; r-=p; } return 'clear'; }
const wxNight=w=>S.weather===w&&S.phase==='night';
const wxSlow=()=>wxNight('sandstorm')?.75:wxNight('snow')?.85:1;
const wxRange=()=>wxNight('sandstorm')?.6:0;
function farmOut(){ const sea=season(); return Math.max(1,4+S.mods.harvest+sea.farm+(S.weather==='rain'?1:0)+(S.seedDays>0?2:0)+(hasEdict('shifts')?1:0)-(hasEdict('holy')?1:0)); }
function moodInfo(){
  const parts=[]; let t=45;
  const add=(label,v)=>{ if(v){ parts.push([label,v]); t+=v; } };
  add(plural(Math.min(3,count('well')),'well'),Math.min(3,count('well'))*4);
  add(plural(Math.min(2,count('shrine')),'shrine'),Math.min(2,count('shrine'))*8);
  add(plural(Math.min(2,count('tavern')),'tavern'),Math.min(2,count('tavern'))*4);
  for(const e of EDICTS) if(hasEdict(e.id)&&e.mood) add(T(e.name),e.mood);
  if(TAXES[taxLvl()].mood) add(`${TAXES[taxLvl()].name} taxes`,TAXES[taxLvl()].mood);
  if(S.stdTier) add(`${STD[S.stdTier].name} living`,STD[S.stdTier].mood);
  if(S.adjMood) add('Neighborhoods',S.adjMood);
  if(hasWonder('w_cathedral')) add('Cathedral of the Sun',12);
  if(skill('chaplain')) add('Chaplain',skill('chaplain')*3);
  for(const k in (S.council||{})) if(S.council[k].trait==='pious') add(`${S.council[k].name} is pious`,2);
  if(S.res.food>=15) add('Full granaries',5);
  if(season().name==='Harvest') add('Harvest festival',5);
  if(S.hungry) add('Hunger at the last dawn',-20);
  if(S.cold) add('Cold houses',-12);
  if(S.lostTonight) add('Buildings lost to raiders',-Math.min(20,S.lostTonight*5));
  if(S.idle>3) add('Many without work',-5);
  return {target:Math.max(0,Math.min(100,t)),parts};
}
const PERKS=[
  {id:'whirlwind',name:'Whirlwind',desc:'Charge ends in a spinning strike that hits every raider around your hero.'},
  {id:'secondwind',name:'Second wind',desc:'Your hero heals 1 health every 3 seconds.'},
  {id:'inspire',name:'Inspiring',desc:'Rally heals your soldiers fully and lasts 12 seconds instead of 8.'},
  {id:'swift',name:'Swift rider',desc:'Your hero rides 30% faster.'},
  {id:'bounty',name:'Bounty hunter',desc:'Raiders your hero fells pay 2 more gold.'},
  {id:'mason',name:'Master builder',desc:'Buildings your hero raises get half again as much health.'},
  {id:'shield',name:'Shield wall',desc:'Your hero takes 1 less damage from every hit.'},
  {id:'lance',name:'Long lance',desc:'Charge recharges 40% faster and carries further.'}];
const hasPerk=id=>S.perks.includes(id);
const xpNeed=l=>10+12*(l-1);
function gainXP(n){
  if(hasWonder('w_academy')) n=Math.round(n*1.5);
  S.hx+=n; let up=false;
  while(S.hx>=xpNeed(S.hl)){ S.hx-=xpNeed(S.hl); S.hl++; S.perkPending++; up=true; }
  if(up&&S.hero){ S.hero.max=heroMax(); S.hero.hp=S.hero.max; floatText(S.hero.x,S.hero.y,`Level ${S.hl}!`,CSS.gold); sfx('up'); party('small'); }
}
function offerPerk(){
  const pool=PERKS.filter(p=>!hasPerk(p.id)), pick=[];
  if(!pool.length){ S.perkPending=0; return; }
  while(pick.length<3&&pool.length) pick.push(pool.splice((Math.random()*pool.length)|0,1)[0]);
  showOver(`Your hero reached level ${S.hl-S.perkPending+1}`,'Choose a perk.',pick.map(p=>({label:p.name,sub:p.desc,fn:()=>{ S.perks.push(p.id); S.perkPending--; if(S.hero){ S.hero.max=heroMax(); S.hero.hp=S.hero.max; } hideOver(); sfx('build'); save(); ui(); }})));
}
const DIFF={easy:{label:'Easy',sub:'Smaller raids and a fuller treasury. Score ×0.7',wave:.75,hp:.85,res:1.35,mult:.7},
  normal:{label:'Normal',sub:'The intended challenge',wave:1,hp:1,res:1,mult:1},
  hard:{label:'Hard',sub:'Bigger, tougher raids and a lean start. Score ×1.5',wave:1.3,hp:1.2,res:.8,mult:1.5}};
const UPGS=[
  {id:'irrigation',branch:'Economy',name:'Irrigation',desc:'Farms grow +1 food each dawn.',cost:{gold:10,wood:6},apply:()=>{S.mods.harvest++}},
  {id:'tools',branch:'Economy',name:'Iron tools',desc:'Lumber camps cut +1 wood and mines dig +1 stone.',cost:{gold:12,stone:4},apply:()=>{S.mods.wood++;S.mods.stone++}},
  {id:'granary',branch:'Economy',name:'Granary',desc:'Every house holds 1 more villager.',cost:{wood:10,stone:4},day:3,apply:()=>{S.mods.housing++}},
  {id:'collectors',branch:'Economy',name:'Tax collectors',desc:'An extra gold for every 3 villagers each dawn.',cost:{gold:16},req:'granary',apply:()=>{S.mods.taxes++}},
  {id:'fletching',branch:'Defense',name:'Fletching',desc:'Watchtowers and the keep deal +1 damage.',cost:{gold:12,wood:6},apply:()=>{S.mods.dmg++}},
  {id:'masonry',branch:'Defense',name:'Masonry',desc:'Palisades and walls gain +5 health, including ones already built.',cost:{gold:6,stone:6},apply:()=>{S.mods.wall++;eachAll(b=>{if(b.type==='wall'){b.max+=5;b.hp+=5}})}},
  {id:'spikes',branch:'Defense',name:'Barbed spikes',desc:'Traps deal +1 damage and hold 3 more charges.',cost:{wood:6,stone:3},apply:()=>{S.mods.trap++}},
  {id:'counterweights',branch:'Defense',name:'Counterweights',desc:'Catapults fire a third faster.',cost:{gold:12,stone:8},day:4,req:'fletching',apply:()=>{S.mods.cataRate=.67}},
  {id:'drill',branch:'Army',name:'Drill yard',desc:'Soldiers deal +1 damage and have +2 health.',cost:{gold:14,wood:6},day:2,apply:()=>{S.mods.drill++;S.units.forEach(u=>{u.max=unitMax();u.hp=u.max})}},
  {id:'muster',branch:'Army',name:'Muster roll',desc:'Every barracks and archery range fields one more soldier.',cost:{gold:18,stone:6},req:'drill',apply:()=>{S.mods.muster++;S.grid.forEach((t,i)=>{ if(t.b&&(t.b.type==='barr'||t.b.type==='range')) spawnUnits(i); })}},
  {id:'warhorse',branch:'Hero',name:'Warhorse',desc:'Your hero gains +6 health and +2 damage.',cost:{gold:16},apply:()=>{S.mods.hero++;S.hero.max=heroMax();S.hero.hp=S.hero.max}},
  {id:'ships',branch:'Economy',name:'Shipwrights',desc:'Every harbor berths a second ship.',cost:{wood:12,stone:6},day:3,apply:()=>{S.mods.ships=1; if(S.kind==='coast') rebuildFleet();}},
  {id:'horn',branch:'Hero',name:'Great horn',desc:'Rally recharges twice as fast and Charge hits 2 harder.',cost:{gold:14,stone:4},req:'warhorse',apply:()=>{S.mods.horn=1}}
];
const hasUpg=id=>S.upg.includes(id);
function upgState(u){
  if(hasUpg(u.id)) return 'done';
  if(u.req&&!hasUpg(u.req)) return 'req';
  if(u.day&&S.day<u.day) return 'day';
  return canPay(upgCost(u))?'buy':'poor';
}
function upgCost(u){ if(!hasWonder('w_academy')) return u.cost; const c={}; for(const k in u.cost) c[k]=Math.ceil(u.cost[k]*.75); return c; }
function buyUpg(id){
  const u=UPGS.find(x=>x.id===id); if(!u||upgState(u)!=='buy'||S.over) return;
  spend(upgCost(u)); S.upg.push(id); u.apply(); S.ver++; party('small');
  floatText(C,C,u.name,CSS.gold); sfx('up'); say(`<b>${u.name}</b> is yours. ${u.desc}`); save(); ui();
}
const QUESTS=[
  {text:'Build a farm',goal:()=>[count('farm'),1],reward:{wood:3}},
  {text:'Build a house so more villagers can move in',goal:()=>[count('house'),1],reward:{wood:4}},
  {text:'Build a watchtower near a red raider route',goal:()=>[count('tower'),1],reward:{gold:4}},
  {text:'Survive your first night',goal:()=>[S.day-1,1],reward:{gold:5}},
  {text:'Build a lumber camp in a palm grove',goal:()=>[count('lumber'),1],reward:{gold:4}},
  {text:'Grow your village to 7 villagers',goal:()=>[S.pop,7],reward:{food:6}},
  {text:'Open a mine on ore',goal:()=>[count('mine'),1],reward:{gold:5}},
  {text:'Open the realm map and ride to Saltreach Cove',goal:()=>[S.visitedCoast?1:0,1],reward:{wood:6}},
  {text:'Build a harbor on the cove\u2019s shore',goal:()=>[count('harbor'),1],reward:{gold:8}},
  {text:'Send a ship on a trade voyage',goal:()=>[S.voyagesSent||0,1],reward:{stone:4}},
  {text:'Lay a road beside a farm or mine',goal:()=>[count('road'),1],reward:{stone:3}},
  {text:'Build a tavern',goal:()=>[count('tavern'),1],reward:{gold:6}},
  {text:'Settle a land on your border from the map of Ashkara',goal:()=>[S.prov?Math.max(0,landsOf('me').length-1):0,1],reward:{gold:10}},
  {text:'Appoint a steward to your council',goal:()=>[cm('steward')?1:0,1],reward:{gold:6}},
  {text:'Buy a kingdom upgrade',goal:()=>[S.upg.length,1],reward:{stone:4}},
  {text:'Grow your realm into a village',goal:()=>[rankIdx()>=1?1:0,1],reward:{gold:8}},
  {text:'Raise a barracks',goal:()=>[count('barr'),1],reward:{wood:6}},
  {text:'Use Charge or Rally in battle',goal:()=>[S.abilUsed||0,1],reward:{gold:5}},
  {text:'Upgrade a palisade to stone',goal:()=>[S.grid.filter(t=>t.b&&t.b.type==='wall'&&t.b.lvl>1).length,1],reward:{gold:6}},
  {text:'Build a market',goal:()=>[count('market'),1],reward:{gold:8}},
  {text:'Raise goats in a pasture',goal:()=>[count('pasture'),1],reward:{wood:5}},
  {text:'Weave your first cloth',goal:()=>[S.res.cloth>0?1:0,1],reward:{gold:8}},
  {text:'Place a farm next to two other farms',goal:()=>[S.grid.some((t,i)=>t.b&&t.b.type==='farm'&&nearCount(S.grid,i%N,(i/N)|0,['farm'],1)>=2)?1:0,1],reward:{food:6}},
  {text:'Begin a grand project from the throne',goal:()=>[WONDERS.some(w=>count(w)>0)?1:0,1],reward:{stone:10}},
  {text:'Give your villagers a comfortable living',goal:()=>[(S.stdTier||0)>=2?1:0,1],reward:{gold:15}},
  {text:'Defeat the first warlord',goal:()=>[S.day>5?1:0,1],reward:{gold:12,stone:6}},
  {text:'Grow your village to 15 villagers',goal:()=>[S.pop,15],reward:{gold:15}},
  {text:'Build a catapult',goal:()=>[count('cata'),1],reward:{stone:8}},
  {text:'Own 6 kingdom upgrades',goal:()=>[S.upg.length,6],reward:{gold:15,stone:6}},
  {text:'Survive night 10',goal:()=>[S.day-1,10],reward:{gold:20}},
  {text:'Survive night 15',goal:()=>[S.day-1,15],reward:{gold:25,stone:10}},
  {text:'Build a well to lift your villagers\u2019 mood',goal:()=>[count('well'),1],reward:{stone:4}},
  {text:'Raise your hero to level 3',goal:()=>[S.hl,3],reward:{gold:12}},
  {text:'Build an archery range',goal:()=>[count('range'),1],reward:{wood:8}},
  {text:'Build a shrine',goal:()=>[count('shrine'),1],reward:{gold:10,food:8}},
  {text:'Reach a mood of 75',goal:()=>[S.mood,75],reward:{gold:20}},
  {text:'Raise the keep into a castle',goal:()=>[keepLvl()>=2?1:0,1],reward:{stone:15}},
  {text:'Ride to Ironpeak Pass',goal:()=>[S.visitedMtn?1:0,1],reward:{food:8}},
  {text:'Open an iron mine in Ironpeak Pass',goal:()=>[S.res.iron>0||S.iron||S.plate?1:0,1],reward:{gold:10}},
  {text:'Build a blacksmith and forge arms or plate',goal:()=>[(S.iron||0)+(S.plate||0),1],reward:{gold:15}},
  {text:'Build a lighthouse on the cove\u2019s shore',goal:()=>[count('lighthouse'),1],reward:{wood:8}},
  {text:'Launch a warship',goal:()=>[S.warships||0,1],reward:{gold:12}},
  {text:'Sink a pirate boat',goal:()=>[S.sunk||0,1],reward:{gold:15,iron:3}}
];
const CONF_COL=['#F0BE4E','#D99A60','#E8604F','#8FCB7E','#F2EADD'];
function party(kind){
  const cf=window.confetti; if(!cf||reduce) return;
  const o={colors:CONF_COL,disableForReducedMotion:true,zIndex:50};
  try{
    if(kind==='quest'){ const r=$('quest').getBoundingClientRect(); cf({...o,particleCount:45,spread:60,startVelocity:28,origin:{x:(r.left+r.width*.15)/innerWidth,y:Math.max(.05,r.top/innerHeight)}}); }
    else if(kind==='small'){ cf({...o,particleCount:35,spread:50,origin:{x:.5,y:.45}}); }
    else if(kind==='big'){ cf({...o,particleCount:110,spread:90,origin:{x:.5,y:.4}}); }
    else if(kind==='win'){ let n=0; const t=setInterval(()=>{ cf({...o,particleCount:60,angle:60,spread:60,origin:{x:0,y:.6}}); cf({...o,particleCount:60,angle:120,spread:60,origin:{x:1,y:.6}}); if(++n>=5) clearInterval(t); },350); }
  }catch(e){}
}
function checkQuests(){
  let guard=0;
  while(S.quest<QUESTS.length&&guard++<5){
    const q=QUESTS[S.quest], [have,need]=q.goal(); if(have<need) break;
    RES.forEach(r=>S.res[r]+=q.reward[r]||0); S.quest++;
    floatText(C,C,'Quest complete',CSS.gold); sfx('dawn');
    say(`<b>Quest complete:</b> ${q.text}. Reward: ${costStr(q.reward)}.`); save(); party('quest');
  }
}
function score(){
  let b=0; eachAll(x=>{ if(x.type!=='keep') b++; });
  return Math.round(((S.day-1)*100+S.kills*5+S.pop*25+b*10+S.upg.length*20+(S.renown||0)*3)*DIFF[S.diff].mult*(dmod('lean')?1.3:1));
}
let bestScore=0; try{ bestScore=+localStorage.getItem('smallcrown-bestscore')||0 }catch(e){}
function recordScore(){ const sc=score(); if(sc>bestScore){ bestScore=sc; try{ localStorage.setItem('smallcrown-bestscore',sc) }catch(e){} } return sc; }
const TRAP_CHARGES=6;
const BOONS=[
  {name:'Stout keep',desc:'+4 keep health, fully repaired.',apply:()=>{S.keepMax+=4;S.keep=S.keepMax}},
  {name:'Fletchers',desc:'Watchtowers and the keep deal +1 damage.',apply:()=>{S.mods.dmg++}},
  {name:'Long sight',desc:'Watchtowers and catapults reach 0.4 tiles further.',apply:()=>{S.mods.range+=.4}},
  {name:'Good harvest',desc:'Farms grow +1 food each dawn.',apply:()=>{S.mods.harvest++}},
  {name:'Woodsmen',desc:'Lumber camps cut +2 wood each dawn.',apply:()=>{S.mods.wood+=2}},
  {name:'Masons',desc:'Palisades gain +5 health, including ones already built.',apply:()=>{S.mods.wall++;eachAll(b=>{if(b.type==='wall'){b.max+=5;b.hp+=5}})}},
  {name:'Sharp stakes',desc:'Traps deal +1 damage and hold 3 more charges.',apply:()=>{S.mods.trap++}},
  {name:'Bounty',desc:'Every raider felled pays +1 extra gold.',apply:()=>{S.mods.tax++}},
  {name:'Royal treasury',desc:'+20 gold, +10 wood and +6 stone right now.',apply:()=>{S.res.gold+=20;S.res.wood+=10;S.res.stone+=6}},
  {name:'Knighted',desc:'Your hero deals +2 damage and has +6 health.',apply:()=>{S.mods.hero++;S.hero.max=heroMax();S.hero.hp=S.hero.max}},
  {name:'Drill sergeant',desc:'Soldiers deal +1 damage and have +2 health.',apply:()=>{S.mods.drill++;S.units.forEach(u=>{u.max=unitMax();u.hp=u.max})}}
];
const NB=[[1,0],[-1,0],[0,1],[0,-1]];
const COL={sand:0xD99A5F,rockTop:0xDFD5C1,rockSide:0xAB563E,wood:0x86522F,woodLight:0xB27C4D,plank:0xEDE3CE,roof:0xB0533B,stone:0xDCD5C6,stoneDark:0x857D71,
  pine:0x5C7A34,pine2:0x6E8C3E,villager:0xC79A6B,awning:0xB0533B,ally:0x2F5D9E,allyLight:0x4F7FC4,horse:0xF1EBDD,foe:0x7A2230,foeLight:0xA8343A,brute:0x55161F,skin:0xE9D8BE,gold:0xF0BE4E,crop:0x7C9A3A,soil:0x9A6240,ore:0x6C7B8E,agave:0x8C9C47,steel:0x5B6470,dark:0x2A1C16,pebble:0xF2EBDC};
const CSS={gold:'#F0BE4E',foe:'#FF6E5C',ink:'#F2EADD',dark:'rgba(28,23,20,.85)'};
const $=id=>document.getElementById(id);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let S=null, hover=null, sel=null, best=0, speed=1, paused=false, nightA=0, shake=0, flash=0, sound=false, actx=null, lastShot=0;
try{best=+localStorage.getItem(BEST)||0}catch(e){}

const idx=(x,y)=>y*N+x;
const inb=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
const G=(x,y)=>S.grid[idx(x,y)];
function each(fn){ S.grid.forEach((t,i)=>{ if(t.b) fn(t.b,i%N,(i/N)|0,t); }); }
