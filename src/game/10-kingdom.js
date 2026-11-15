// ================= THE KINGDOM =================
const RANKS=[{name:'Hamlet',at:0},{name:'Village',at:30},{name:'Town',at:80},{name:'City',at:160},{name:'Capital',at:280}];
const rankIdx=()=>{ let i=0; RANKS.forEach((r,k)=>{ if((S.renown||0)>=r.at) i=k; }); return i; };
const rankName=()=>RANKS[rankIdx()].name;
function addRenown(n,why){
  if(!n) return; const before=rankIdx(); S.renown=Math.max(0,(S.renown||0)+n); const after=rankIdx();
  if(after>before){ const nm=RANKS[after].name; party('win'); sfx('dawn');
    showChapter({n:'★',name:T('Your realm is now a {{r}}',{r:T(nm)}),text:T(RANK_TEXT[nm]||'')}); toast(T('New rank'),T(nm),'♛');
    if(nm==='Town'||nm==='City') say(`<b>Your realm is now a ${T(nm).toLowerCase()}.</b> ${T(RANK_TEXT[nm])}`); }
}
const RANK_TEXT={Village:'A second council seat opens: the Marshal.',Town:'The Treasurer and Chaplain may join your council, and the keep can be raised into a castle.',City:'The keep can become a citadel, and a third edict slot opens.',Capital:'The Spymaster joins your council. Bards across the desert sing your name.'};
// taxes
const TAXES=[{name:'Low',mult:.5,mood:8},{name:'Fair',mult:1,mood:0},{name:'High',mult:1.5,mood:-8},{name:'Crushing',mult:2,mood:-18}];
const taxLvl=()=>S.tax??1;
function setTax(i){ if(S.phase!=='day'||S.over) return; S.tax=i; councilShift(i>=2?-3:i===0?2:0); say(`<b>Taxes set to ${T(TAXES[i].name).toLowerCase()}.</b>`); sfx('order'); save(); ui(); }
// the royal council
const SEATS=[
  {id:'steward',name:'Steward',rank:0,eff:c=>`+${c*2} food each dawn`},
  {id:'marshal',name:'Marshal',rank:1,eff:c=>`Soldiers have ${c} more health`},
  {id:'treasurer',name:'Treasurer',rank:2,eff:c=>`+${c*2} gold each dawn`},
  {id:'chaplain',name:'Chaplain',rank:2,eff:c=>`Mood +${c*3}`},
  {id:'spymaster',name:'Spymaster',rank:4,eff:c=>`Every neighbor's hostility grows ${c} less each dawn`}];
const TRAITS={shrewd:{name:'Shrewd',desc:'+1 skill'},loyal:{name:'Loyal',desc:'Loyalty never falls below 40'},greedy:{name:'Greedy',desc:'Skims 2 gold each dawn'},pious:{name:'Pious',desc:'Mood +2'},ambitious:{name:'Ambitious',desc:'+1 skill, but loyalty falls twice as fast'},brave:{name:'Brave',desc:'Your hero deals 1 more damage'}};
const council=()=>S.council||(S.council={});
const cm=id=>council()[id]||null;
const skill=id=>{ const m=cm(id); return m?m.skill+(m.trait==='shrewd'||m.trait==='ambitious'?1:0):0; };
function candidates(){ const out=[], tr=Object.keys(TRAITS);
  for(let i=0;i<3;i++) out.push({name:FOLK_NAMES[(Math.random()*FOLK_NAMES.length)|0],skill:1+((Math.random()*3)|0),trait:tr[(Math.random()*tr.length)|0],loy:55+((Math.random()*25)|0)});
  return out; }
function appoint(seat){
  const st=SEATS.find(x=>x.id===seat); if(rankIdx()<st.rank||S.phase!=='day') return;
  const cs=candidates();
  showOver(T('Appoint a {{s}}',{s:T(st.name)}),T('Three candidates seek the seat. Skill sets how strong their effect is; traits bend it.'),cs.map(c=>({label:`${c.name} · ${T('skill {{n}}',{n:c.skill})} · ${T(TRAITS[c.trait].name)}`,sub:`${T(TRAITS[c.trait].desc)} · ${T(st.eff(c.skill+(c.trait==='shrewd'||c.trait==='ambitious'?1:0)))}`,
    fn:()=>{ if(cm(seat)) S.mood=Math.max(0,S.mood-3); council()[seat]=c; hideOver(); sfx('bell'); toast(T(st.name),c.name,'♛'); say(`<b>${c.name}</b> is your new ${T(st.name).toLowerCase()}.`); applyCouncilUnits(); save(); ui(); }})).concat([{label:T('Not now'),sub:'',fn:()=>{ hideOver(); ui(); }}]));
}
function dismiss(seat){ const m=cm(seat); if(!m||S.phase!=='day') return; delete council()[seat]; S.mood=Math.max(0,S.mood-3); say(`<b>${m.name}</b> leaves the council. Mood −3.`); applyCouncilUnits(); save(); ui(); }
function applyCouncilUnits(){ S.units.forEach(u=>{ u.max=unitMax(); u.hp=Math.min(u.hp,u.max); }); if(S.hero){ S.hero.max=heroMax(); S.hero.hp=Math.min(S.hero.hp,S.hero.max); } }
function councilShift(d){ for(const k in council()){ const m=cm(k); const dd=d<0&&m.trait==='ambitious'?d*2:d; m.loy=Math.max(m.trait==='loyal'?40:0,Math.min(100,m.loy+dd)); } }
function councilDawn(notes){
  const c=council(); if(!Object.keys(c).length) return;
  councilShift(-1+(taxLvl()>=2?-2:0)+(S.mood>=70?1:0)+(S.mood<35?-2:0));
  for(const k of Object.keys(c)){ const m=c[k];
    if(m.trait==='greedy'){ S.res.gold=Math.max(0,S.res.gold-2); }
    if(m.loy<20&&Math.random()<.5){ const g=Math.min(S.res.gold,10+S.day); S.res.gold-=g; delete c[k]; notes.push(`<b>${m.name} the ${T(SEATS.find(x=>x.id===k).name).toLowerCase()} fled in the night</b> with ${g} gold from the treasury`); toast(T('Betrayal'),m.name,'✖'); } }
  applyCouncilUnits();
}
// petitions at the throne
const PETITIONS=[
  {id:'field',text:'Two farmers both claim the same field.',a:['Split it between them',{mood:2}],b:['Give it to the elder farmer',{gold:4,mood:-2,renown:1}]},
  {id:'loan',text:'A merchant offers a loan: 40 gold now, 60 back in five days.',a:['Take the loan',{gold:40,debt:60}],b:['Politely refuse',{}]},
  {id:'refugees',text:'Refugees from the east beg for shelter.',a:['Take them in',{pop:3,food:-10,renown:5,mood:-2}],b:['Turn them away',{mood:-3}]},
  {id:'procession',text:'The priests ask you to fund a grand procession.',a:['Fund it',{gold:-12,mood:8,renown:3}],b:['Refuse',{mood:-3}]},
  {id:'knight',text:'A knight errant offers to train your hero, for a fee.',a:['Pay him',{gold:-15,xp:20,renown:2}],b:['Send him off',{}]},
  {id:'thieves',text:'Thieves were caught raiding the granary.',a:['Pardon them',{mood:3,food:-5}],b:['Make an example of them',{mood:-4,gold:4,renown:3}]},
  {id:'envoy',text:'An envoy of the Sand Wolves offers a truce for gold.',a:['Pay 20 gold',{gold:-20,host:['nomads',-20]}],b:['Send him back',{host:['nomads',6],renown:2}]},
  {id:'plague',text:'Rumors of sickness spread through the houses.',a:['Quarantine the sick',{gold:-8,mood:-2}],b:['Ignore the rumors',{gamble:true}]},
  {id:'tomb',text:'Miners broke into an ancient tomb.',a:['Take the treasure',{gold:20,mood:-5}],b:['Seal it with honor',{renown:5,mood:2}]},
  {id:'festival',text:'The children beg for a festival of kites.',a:['Let them fly',{gold:-6,mood:5}],b:['Not this year',{mood:-1}]},
  {id:'scholar',text:'A traveling scholar asks to stay and teach.',a:['Welcome her',{gold:-10,renown:8}],b:['There is no room',{}]},
  {id:'smugglers',text:'Smugglers of the Red Brotherhood offer cheap iron.',a:['Buy the iron',{gold:-10,iron:6,host:['brotherhood',-5]}],b:['Arrest them',{renown:3,host:['brotherhood',6]}],need:()=>S.coastUnlocked},
  {id:'quarrel',text:'Your councillors quarrel over who sits nearest the throne.',a:['Host a banquet to make peace',{gold:-8,loyal:8}],b:['Let them sort it out',{loyal:-8}],need:()=>Object.keys(council()).length>=2},
  {id:'grove',text:'Woodcutters want to clear the old sacred grove.',a:['Allow it',{wood:15,mood:-4}],b:['Forbid it',{mood:2}]},
  {id:'wedding',text:'A wedding in the village! The couple hope you will come.',a:['Attend with a gift',{gold:-5,mood:6,renown:2}],b:['Send your regrets',{mood:-1}]},
  {id:'clans',text:'The Iron Clans offer iron in return for timber.',a:['Trade 15 wood',{wood:-15,iron:6,host:['clans',-8]}],b:['Keep your timber',{host:['clans',3]}],need:()=>S.mtnUnlocked},
  {id:'statue',text:'Masons offer to carve a statue of your hero.',a:['Commission it',{stone:-12,gold:-8,renown:10,mood:3}],b:['Not now',{}]}];
function effText(e){ const o=[];
  for(const r of ['gold','food','wood','stone','iron']) if(e[r]) o.push(`${e[r]>0?'+':''}${e[r]} ${T(r)}`);
  if(e.mood) o.push(`${T('mood')} ${e.mood>0?'+':''}${e.mood}`); if(e.renown) o.push(`${T('renown')} +${e.renown}`);
  if(e.pop) o.push(T('+{{n}} villagers',{n:e.pop})); if(e.xp) o.push(T('+{{n}} hero XP',{n:e.xp})); if(e.debt) o.push(T('repay {{n}} gold later',{n:e.debt}));
  if(e.host) o.push(T(e.host[1]<0?'{{f}} calmer':'{{f}} angrier',{f:T(FACTIONS[e.host[0]].name)})); if(e.loyal) o.push(T(e.loyal>0?'council more loyal':'council less loyal'));
  if(e.gamble) o.push(T('a gamble')); return o.join(', ')||T('no effect'); }
function decide(which){
  const pt=S.petition&&PETITIONS.find(x=>x.id===S.petition); if(!pt||S.phase!=='day') return;
  const [label,e]=pt[which];
  for(const r of ['gold','food','wood','stone','iron']) if(e[r]){ if(e[r]<0&&S.res[r]<-e[r]){ say(`You need ${-e[r]} ${r} for that.`); sfx('no'); return; } }
  for(const r of ['gold','food','wood','stone','iron']) if(e[r]) S.res[r]+=e[r];
  if(e.mood) S.mood=Math.max(0,Math.min(100,S.mood+e.mood)); if(e.renown) addRenown(e.renown);
  if(e.pop) S.pop=Math.min(housing(),S.pop+e.pop); if(e.xp) gainXP(e.xp);
  if(e.debt) S.debt={amt:e.debt,due:S.day+5}; if(e.host) shiftHost(e.host[0],e.host[1],true); if(e.loyal) councilShift(e.loyal);
  let extra='';
  if(e.gamble){ if(Math.random()<.5){ const n=Math.min(2,S.pop); S.pop-=n; S.mood=Math.max(0,S.mood-6); extra=` The sickness was real: ${plural(n,'villager')} died. Mood −6.`; } else extra=' The rumors were only rumors.'; }
  say(`<b>${T(label)}.</b>${extra}`); S.petition=null; sfx('order'); save(); ui();
}
function renderPetition(){
  const box=$('petition'), pt=S.petition&&PETITIONS.find(x=>x.id===S.petition);
  if(!pt||S.phase!=='day'||S.over){ box.hidden=true; return; }
  box.hidden=false;
  box.innerHTML=`<div class="ph"><span class="rl">${T('Petition at the throne')}</span><span class="rt"></span></div><div class="pc"><button type="button" data-pt="a"><span></span><small></small></button><button type="button" data-pt="b"><span></span><small></small></button></div>`;
  box.querySelector('.rt').textContent=T(pt.text);
  for(const w of ['a','b']){ const b=box.querySelector(`[data-pt="${w}"]`); b.querySelector('span').textContent=T(pt[w][0]); b.querySelector('small').textContent=effText(pt[w][1]); b.addEventListener('click',()=>decide(w)); }
}
// the keep itself
const KEEP_UP=[null,{name:'Castle',rank:2,cost:{stone:30,wood:20,gold:30}},{name:'Citadel',rank:3,cost:{stone:50,iron:10,gold:60}}];
const keepLvl=()=>S.keepLvl||1;
function raiseKeep(){
  const up=KEEP_UP[keepLvl()]; if(!up||rankIdx()<up.rank||S.phase!=='day') return;
  if(!canPay(up.cost)){ say(`Raising the ${T(up.name).toLowerCase()} needs ${costStr(up.cost)}.`); sfx('no'); return; }
  spend(up.cost); S.keepLvl=keepLvl()+1;
  withRegion('home',()=>{ S.keepMax+=6; S.keep+=6; const k=G(C,C).b; if(k){ k.lvl=S.keepLvl; k.born=S.t; } });
  addRenown(15); party('win'); sfx('up'); S.ver++; say(`<b>The keep is now a ${T(up.name).toLowerCase()}.</b> More health, sharper archers and room for 4 more villagers.`); save(); ui();
}
// dawn upkeep for the kingdom layer
function wonderDawn(notes){
  eachAll((b,x,y,t,here,rid)=>{ const d=DEF[b.type]; if(!d||!d.wonder||b.done) return;
    if(!b.worked){ notes.push(`<b>Work stalled on the ${d.name}:</b> no villager free to build`); return; }
    if(!canPay(d.daily)){ notes.push(`<b>Work stalled on the ${d.name}:</b> it needs ${costStr(d.daily)} each dawn`); return; }
    spend(d.daily); b.prog=(b.prog||0)+1; S.ver++;
    if(b.prog>=d.days){ b.done=true; b.hp=b.max; if(here) setTimeout(()=>cineTo(x,y,{zoom:2.2,hold:2.2,orbit:true}),900); addRenown(d===DEF.w_colossus?30:15); party('win'); sfx('dawn'); toast(T('Wonder complete'),T(d.name),'✦'); notes.push(`<b>The ${d.name} is complete!</b> ${d.desc}`); news(`Your realm completed the ${d.name}`); }
    else notes.push(`<b>${d.name}:</b> ${b.prog} of ${d.days} dawns of work done`); });
  if(hasWonder('w_cathedral')) addRenown(2);
}
function wondersHtml(){ const night=S.phase!=='day', ri=rankIdx();
  return `<div class="tc wonders"><h4>${T('Grand projects')}</h4>${WONDERS.map(id=>{ const d=DEF[id]; let st='', act='';
    let b=null; eachAll(x=>{ if(x.type===id) b=x; });
    if(b&&b.done) st=`<span style="color:var(--good)">${T('Complete')}</span>`;
    else if(b) st=T('Building: {{p}} of {{d}} dawns',{p:b.prog||0,d:d.days});
    else if(ri<d.rank) st=T('Needs a {{r}}',{r:T(RANKS[d.rank].name).toLowerCase()});
    else if(S.day<d.unlock) st=T('Opens on day {{n}}',{n:d.unlock});
    else act=`<button type="button" data-wonder="${id}" ${night?'disabled':''}>${T('Choose a site')} <span class="c">${costShort(d.cost)}</span></button>`;
    return `<div class="seat"><span class="sn">${T(d.name)}</span><span class="sd">${T(d.desc)} ${b&&b.done?'':T('{{d}} dawns, each needing {{c}}.',{d:d.days,c:costStr(d.daily)})} ${st}</span>${act}</div>`; }).join('')}</div>`; }
function kingdomDawn(notes,rep){
  addRenown(rep&&rep.total?(rep.keep===0&&!rep.lost?4:2):0);
  const st=skill('steward'), tr=skill('treasurer');
  if(st) S.res.food+=st*2; if(tr) S.res.gold+=tr*2;
  councilDawn(notes);
  if(S.debt&&S.day>=S.debt.due){ const pay=Math.min(S.res.gold,S.debt.amt); S.res.gold-=pay; if(pay<S.debt.amt){ S.mood=Math.max(0,S.mood-10); notes.push(`<b>Debt unpaid:</b> the merchant could only collect ${pay} of ${S.debt.amt} gold, and the town talks. Mood −10`); } else notes.push(`<b>Loan repaid:</b> ${pay} gold to the merchant`); S.debt=null; }
  if(taxLvl()===3&&S.mood<35&&S.pop>3){ S.pop--; notes.push('<b>Crushing taxes:</b> a family packed up and left'); }
  S.petition=S.day>=2&&Math.random()<.65?(()=>{ const ok=PETITIONS.filter(x=>x.id!==S.lastPet&&(!x.need||x.need())); const pt=ok[(Math.random()*ok.length)|0]; S.lastPet=pt.id; return pt.id; })():null;
}
let throneKey='';
function renderThrone(){
  const key=[S.renown,taxLvl(),JSON.stringify(council()),keepLvl(),S.phase,lang,S.res.gold,S.res.stone,S.res.wood,S.res.iron,S.day,S.ver,S.cur].join('|'); if(key===throneKey) return; throneKey=key;
  const ri=rankIdx(), nx=RANKS[ri+1], rn=S.renown||0, pct=nx?Math.round((rn-RANKS[ri].at)/(nx.at-RANKS[ri].at)*100):100, night=S.phase!=='day';
  $('thronesum').textContent=T(rankName());
  const up=KEEP_UP[keepLvl()];
  const seats=SEATS.map(st=>{ const m=cm(st.id), lock=ri<st.rank;
    if(lock) return `<div class="seat locked"><span class="sn">${T(st.name)}</span><span class="sd">${T('Opens when your realm becomes a {{r}}',{r:T(RANKS[st.rank].name).toLowerCase()})}</span></div>`;
    if(!m) return `<div class="seat"><span class="sn">${T(st.name)} · <span style="color:var(--muted);font-weight:500">${T('vacant')}</span></span><span class="sd">${T(st.eff(2))} ${T('(at skill 2)')}</span><button type="button" data-appoint="${st.id}" ${night?'disabled':''}>${T('Appoint')}</button></div>`;
    const lc=m.loy<25?'#E8604F':m.loy<50?'#F0BE4E':'#8FCB7E';
    return `<div class="seat"><span class="sn">${m.name} · ${T(st.name)} <span class="loy" title="${T('Loyalty')} ${m.loy}"><i style="width:${m.loy}%;background:${lc}"></i></span></span><span class="sd">${T(st.eff(skill(st.id)))} · ${T(TRAITS[m.trait].name)}: ${T(TRAITS[m.trait].desc)}</span><button type="button" data-dismiss="${st.id}" ${night?'disabled':''}>${T('Dismiss')}</button></div>`; }).join('');
  $('throne').innerHTML=`<div class="th">
    <div class="tc"><h4>${T('Realm')}</h4><span class="big">${T(rankName())}</span><div class="rbar"><i style="width:${pct}%"></i></div><span class="sub">${nx?T('{{r}} renown · {{n}} more to become a {{x}}',{r:rn,n:nx.at-rn,x:T(nx.name).toLowerCase()}):T('{{r}} renown · the greatest realm in the desert',{r:rn})}</span><span class="sub">${T('Renown comes from clean defenses, slain champions, feasts, fulfilled requests and wise petitions.')}</span></div>
    <div class="tc"><h4>${T('Taxes')}</h4><div class="seg">${TAXES.map((t,i)=>`<button type="button" data-tax="${i}" aria-pressed="${taxLvl()===i}" ${night?'disabled':''}>${T(t.name)}</button>`).join('')}</div><span class="sub">${T('Each villager pays {{g}} gold a dawn',{g:TAXES[taxLvl()].mult})} · ${TAXES[taxLvl()].mood?`${T('mood')} ${TAXES[taxLvl()].mood>0?'+':''}${TAXES[taxLvl()].mood}`:T('no effect on mood')}${taxLvl()===3?' · '+T('families leave when unhappy'):''}</span>
      <h4 style="margin-top:6px">${T('The keep')}</h4><span class="big" style="font-size:16px">${T(['Keep','Castle','Citadel'][keepLvl()-1])}</span>
      ${up?`<span class="sub">${T('Raise it into a {{n}}: +6 health, +1 damage and range for its archers, room for 4 more villagers, +15 renown.',{n:T(up.name).toLowerCase()})}${ri<up.rank?' '+T('Needs a {{r}}.',{r:T(RANKS[up.rank].name).toLowerCase()}):''}</span><button type="button" id="raiseKeep" ${night||ri<up.rank||!canPay(up.cost)?'disabled':''}>${T('Raise the {{n}}',{n:T(up.name).toLowerCase()})} <span class="c">${costShort(up.cost)}</span></button>`:`<span class="sub">${T('Your citadel is complete.')}</span>`}</div>
    <div class="tc"><h4>${T('Royal council')}</h4>${seats}</div>${wondersHtml()}</div>`;
  $('throne').querySelectorAll('[data-tax]').forEach(b=>b.addEventListener('click',()=>setTax(+b.dataset.tax)));
  $('throne').querySelectorAll('[data-appoint]').forEach(b=>b.addEventListener('click',()=>appoint(b.dataset.appoint)));
  $('throne').querySelectorAll('[data-dismiss]').forEach(b=>b.addEventListener('click',()=>dismiss(b.dataset.dismiss)));
  $('raiseKeep')?.addEventListener('click',raiseKeep);
  $('throne').querySelectorAll('[data-wonder]').forEach(b=>b.addEventListener('click',()=>{ if(S.cur!=='home'){ say('Wonders rise only in The Valley. Ride home first.'); return; } setTool(b.dataset.wonder); say(`<b>Choose a site for the ${DEF[b.dataset.wonder].name}.</b> Tap a free tile and your hero will lay the foundations.`); document.getElementById('board').scrollIntoView({behavior:'smooth',block:'center'}); }));
}
