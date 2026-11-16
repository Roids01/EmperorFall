// ================= CROWN PATHS: three exclusive ways to rule =================
const PATHS={
  merchant:{name:'Merchant Republic',color:'#F0BE4E',icon:'⚖',desc:'Grow rich on trade. Gold buys what swords cannot.',tiers:[
    {name:'Counting houses',desc:'Unlocks the Counting House: +5 gold each dawn, +1 for each market or house beside it (up to +3). Caravans earn a quarter more.'},
    {name:'Guild charter',desc:'Market prices are 15% better and Merchant Guild loans cost no interest.'},
    {name:'Sellsword contracts',desc:'Each night, gold hires guards at the keep: one for every 30 gold in the treasury (up to 5), 3 gold each.'},
    {name:'Trade league',desc:'Every trade agreement adds 4 gold and 1 renown each dawn. The trade victory needs a third less gold.'}]},
  warlord:{name:'Iron Warlord',color:'#E8604F',icon:'⚔',desc:'Rule by the sword. Your armies march faster and hit harder.',tiers:[
    {name:'War camps',desc:'Unlocks the War Camp, which trains three spearmen. Your field armies march farther each dawn.'},
    {name:'Plunder',desc:'Every raider felled pays 1 more gold, and every land your armies take pays 30 gold.'},
    {name:'Iron discipline',desc:'Soldiers and spearmen get +2 health and +1 damage. Armies lose half as many men to hunger.'},
    {name:'Dread banner',desc:'Raiders march 15% slower at your walls. The conquest victory needs one capital fewer.'}]},
  holy:{name:'Holy Kingdom',color:'#B9CCF0',icon:'☀',desc:'Rule by faith. Your people are content and other crowns listen.',tiers:[
    {name:'Temples',desc:'Unlocks the Temple: +6 mood, +2 renown each dawn, and it heals your hero and soldiers nearby at night.'},
    {name:'Pilgrims',desc:'Every shrine and temple brings 2 gold each dawn, and the realm gains +3 mood.'},
    {name:'Sanctuary',desc:'The keep mends 2 health each dawn and your hero returns twice as fast.'},
    {name:'Holy union',desc:'Every crown warms to you each dawn. The diplomatic victory needs one alliance fewer.'}]}};
const PATH_AT=[0,40,90,150];
function pathTier(){ if(!S||!S.path) return 0; const r=(S.renown||0)-(S.pathR||0); let t=0; for(let i=0;i<4;i++) if(r>=PATH_AT[i]) t=i+1; return t; }
function hasTier(p,n){ return !!S&&S.path===p&&pathTier()>=n; }
const pathOpen=()=>S.day>=5||rankIdx()>=1;
function pathDawn(notes){
  let t=0; eachAll(b=>{ if(b.type==='temple') t++; }); if(t) addRenown(2*t);
  if(hasTier('merchant',4)) for(const k of liveKings()) if(K(k).pact) addRenown(1);
  if(hasTier('holy',3)&&S.keep<S.keepMax){ S.keep=Math.min(S.keepMax,S.keep+2); }
  if(hasTier('holy',4)) for(const k of liveKings()) relShift(k,2);
  const pt=pathTier(); if(S.path&&pt>(S.pathSeen||1)){ S.pathSeen=pt; const x=PATHS[S.path].tiers[pt-1]; notes.push(`<b>${T(PATHS[S.path].name)}: ${T(x.name)}.</b> ${T(x.desc)}`); toast(T(x.name),T(PATHS[S.path].name),PATHS[S.path].icon); }
}
function choosePath(id){ if(S.path||!PATHS[id]||!pathOpen()||S.phase!=='day') return; S.path=id; S.pathR=S.renown||0; addRenown(5); party('win'); sfx('up');
  toast(T('Path chosen'),T(PATHS[id].name),PATHS[id].icon); news(`Your realm swore to the ${PATHS[id].name}`); say(`<b>${T(PATHS[id].name)}.</b> ${T(PATHS[id].tiers[0].desc)}`); S.ver++; save(); ui(); }
// path buildings
Object.assign(DEF,{
  counting:{name:'Counting House',cost:{wood:4,stone:2},hp:4,enter:8,path:'merchant'},
  warcamp:{name:'War Camp',cost:{wood:8,gold:6},hp:7,enter:10,upkeep:1,path:'warlord'},
  temple:{name:'Temple',cost:{stone:8,gold:4},hp:6,enter:9,path:'holy'}});
TOOLS.splice(TOOLS.indexOf('clear'),0,'counting','warcamp','temple');
Object.assign(KEYS,{counting:';',warcamp:'/',temple:"'"});
Object.assign(TNAME,{counting:'Counting',warcamp:'War Camp',temple:'Temple'});
Object.assign(ICON,{counting:'<path d="M4 18h14M5 18V9l6-4 6 4v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="11" cy="12.5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  warcamp:'<path d="M3 18l8-12 8 12z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M11 6V2.5l4 1.5-4 1.5" fill="currentColor"/><path d="M9 18l2-4 2 4" fill="currentColor"/>',
  temple:'<path d="M3 9l8-5 8 5zM5 9v8M9 9v8M13 9v8M17 9v8M3 18h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="11" cy="6.3" r="1" fill="currentColor"/>'});
Object.assign(TOPH,{counting:.62,warcamp:.6,temple:.75});
// ================= VICTORY: five ways to win =================
const VICT={
  survive:{name:'The Long Watch',icon:'🏰',desc:'Hold the keep through 20 nights.'},
  conquest:{name:'Conquest',icon:'⚔',desc:'Take the capitals of the rival crowns.'},
  trade:{name:'Merchant Prince',icon:'⚖',desc:'Earn gold from trade while holding three trade agreements.'},
  wonder:{name:'Wonders of the World',icon:'✦',desc:'Complete three grand projects.'},
  diplo:{name:'Union of Crowns',icon:'☀',desc:'Be allied by treaty or marriage with every living crown, each Devoted (60) to you, for three dawns in a row.'}};
const TRADE_GOAL=()=>hasTier('merchant',4)?1000:1500;
function vicProgress(id){
  if(id==='survive') return {v:Math.min(1,(S.day-1)/WIN_NIGHTS),txt:T('{{n}} of {{m}} nights',{n:Math.min(WIN_NIGHTS,S.day-1),m:WIN_NIGHTS})};
  if(id==='conquest'){ crowns(); const need=3-(hasTier('warlord',4)?1:0), got=Object.keys(KINGS).filter(k=>K(k).dead).length; return {v:Math.min(1,got/need),txt:T('{{n}} of {{m}} capitals taken',{n:got,m:need})}; }
  if(id==='trade'){ const g=S.tradeGold||0, goal=TRADE_GOAL(), pacts=liveKings().filter(k=>K(k).pact).length; return {v:Math.min(g/goal,Math.min(1,pacts/3)),txt:T('{{g}} of {{t}} trade gold · {{p}} of 3 agreements',{g:Math.round(g),t:goal,p:pacts})}; }
  if(id==='wonder'){ const n=WONDERS.filter(hasWonder).length; return {v:Math.min(1,n/3),txt:T('{{n}} of 3 wonders',{n})}; }
  if(id==='diplo'){ const live=liveKings(), need=Math.max(1,live.length-(hasTier('holy',4)?1:0)), ok=live.filter(k=>(K(k).ally||K(k).wed)&&K(k).rel>=60).length; return {v:Math.min(1,ok/need)*Math.min(1,.5+(S.diploDays||0)/6),txt:T('{{n}} of {{m}} crowns devoted allies · {{d}} of 3 dawns',{n:ok,m:need,d:Math.min(3,S.diploDays||0)})}; }
  return {v:0,txt:''}; }
function victoryDawn(){
  const live=liveKings(), need=Math.max(1,live.length-(hasTier('holy',4)?1:0)); S.diploDays=live.length&&live.filter(k=>(K(k).ally||K(k).wed)&&K(k).rel>=60).length>=need?(S.diploDays||0)+1:0;
  S.vics=S.vics||[];
  for(const id of ['conquest','trade','wonder','diplo']){ if(S.vics.includes(id)) continue; const p=vicProgress(id); const done=id==='diplo'?S.diploDays>=3:p.v>=1; if(!done) continue;
    S.vics.push(id); addRenown(30); recordScore(); setTimeout(()=>{ party('big'); showOver(T('Victory: {{v}}',{v:T(VICT[id].name)}),T(VICT[id].desc)+' '+T('Your name will be sung in every court of {{c}}. You can keep ruling, and chase the other victories too.',{c:CONT_NAME}),[
      {label:T('Keep ruling'),sub:T('Play on for the other victories'),primary:true,fn:()=>{ hideOver(); ui(); }},{label:T('Found a new kingdom'),sub:T('Start a fresh valley'),fn:newGame}]); },900); break; } }
function pathHtml(){
  const t=pathTier(), night=S.phase!=='day';
  if(!S.path){ const open=pathOpen();
    return `<div class="tc wide"><h4>${T('Path of the crown')}</h4><span class="sub">${open?T('Swear your realm to one path. It cannot be undone, and each path closes the others.'):T('Opens on day 5, or when your realm becomes a village.')}</span><div class="paths">${Object.entries(PATHS).map(([id,p])=>`<div class="pathc" style="--pc:${p.color}"><b>${p.icon} ${T(p.name)}</b><span class="sd">${T(p.desc)}</span><ol>${p.tiers.map((x,i)=>`<li><b>${T(x.name)}</b> ${T(x.desc)}${i?` <i>${T('{{n}} renown',{n:PATH_AT[i]})}</i>`:''}</li>`).join('')}</ol><button type="button" data-path="${id}" ${!open||night?'disabled':''}>${T('Swear to this path')}</button></div>`).join('')}</div></div>`; }
  const p=PATHS[S.path], rn=(S.renown||0)-(S.pathR||0);
  return `<div class="tc wide"><h4>${T('Path of the crown')}</h4><span class="big" style="color:${p.color}">${p.icon} ${T(p.name)}</span><ol class="tiers">${p.tiers.map((x,i)=>`<li class="${i<t?'on':''}"><b>${T(x.name)}</b> <span class="sd">${T(x.desc)}</span>${i>=t?` <i>${T('{{n}} more renown',{n:PATH_AT[i]-rn})}</i>`:''}</li>`).join('')}</ol></div>`; }
function victoryHtml(){ return `<div class="tc wide"><h4>${T('Paths to victory')}</h4><div class="vics">${Object.entries(VICT).map(([id,v])=>{ const p=vicProgress(id), won=id==='survive'?S.won:(S.vics||[]).includes(id);
  return `<div class="vic ${won?'won':''}"><span class="vi">${v.icon}</span><div><b>${T(v.name)}</b>${won?` <span class="tag ally">${T('Won')}</span>`:''}<span class="sd">${T(v.desc)}</span><div class="rbar"><i style="width:${Math.round(p.v*100)}%"></i></div><span class="sd">${p.txt}</span></div></div>`; }).join('')}</div></div>`; }
