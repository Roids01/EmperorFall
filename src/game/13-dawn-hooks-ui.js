// ---------- dawn hooks for this round ----------
function dawnExtras(){
  if(S.seedDays>0) S.seedDays--; if(S.oilNights>0) S.oilNights--;
  if(S.req&&S.day>S.req.until){ S.mood=Math.max(0,S.mood-6); say($('msg').innerHTML+` <b>${S.req.name} gave up waiting.</b> Mood −6.`); S.req=null; }
  if(!S.req&&S.day>=2&&Math.random()<.55){ const n=newRequest(); if(n){ $('msg').innerHTML+=' '+n; toast(T('Request'),S.req.name,'?'); } }
  if(S.day>=3&&Math.random()<(hasEdict('markets')?.64:.32)&&!(S.trader&&S.trader.day===S.day-1)){ const ids=Object.keys(WARES).filter(k=>!(k==='spyglass'&&(S.spy||!S.coastUnlocked))&&!(k==='ingots'&&!S.mtnUnlocked)); const items=[]; while(items.length<3&&ids.length) items.push(ids.splice((Math.random()*ids.length)|0,1)[0]);
    S.trader={day:S.day,items}; $('msg').innerHTML+=' <b>A wandering trader</b> has set up by the keep in The Valley.'; toast(T('Trader'),T('A wandering trader arrives'),'⚖'); }
  save(); ui();
}
function toast(title,body,icon='★'){
  const box=$('toasts'); if(!box) return;
  const el=document.createElement('div'); el.className='toast'; el.innerHTML='<span class="ti"></span><span><span class="tt"></span><br><span class="tb"></span></span>';
  el.querySelector('.ti').textContent=icon; el.querySelector('.tt').textContent=title; el.querySelector('.tb').textContent=body;
  box.appendChild(el); while(box.children.length>3) box.firstChild.remove();
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),420); },3600);
}
function bump(id,cls){ const el=$(id); el.classList.remove('bump','hurt'); void el.offsetWidth; el.classList.add(cls); setTimeout(()=>el.classList.remove(cls),700); }
function ui(){
  assignWorkers(); checkQuests();
  $('hp').textContent=`${Math.max(0,S.keep)}/${S.keepMax}`; hudKey=''; syncHud();
  $('cRegion').hidden=!(S.coastUnlocked||S.mtnUnlocked||S.cur!=='home');
  const night=S.phase!=='day', bell=$('bell');
  bell.disabled=night||S.modal;
  bell.innerHTML=S.phase==='night'?`${T('Night {{n}}',{n:S.day})}<small>${T('{{n}} raiders still out there',{n:S.enemies.length+S.queue.length})}</small>`
    :S.phase==='over'?`${T('The keep has fallen')}<small>${T('Start again from the board')}</small>`
    :`${T('Ring the bell')}<small>${T('Begin night {{n}}',{n:S.day})} · ${T('{{n}} coming',{n:S.queue.length})}${S.coastUnlocked?T(' to {{r}}',{r:T(regionName(S.raid))})+(S.heroAt!==S.raid?T(', hero away'):''):''}${S.hero.queue.length?' · '+T('{{n}} unbuilt orders will be dropped',{n:S.hero.queue.length}):''}</small>`;
  renderTools(); renderRes(); renderLedger(); renderQuest(); renderUpgrades();
  $('region').textContent=T(regionName(S.cur))+(heroHere()?'':T(' · hero away')); if(!$('realm').hidden) renderRealm();
  const sea=season(); $('season').textContent=T(sea.name)+(S.weather!=='clear'?` · ${T(WX[S.weather].name)}`:'')+(S.blood?' · '+T('Blood moon'):''); $('seaDot').setAttribute('fill',sea.col); $('cSeason').classList.toggle('blood',!!S.blood);
  $('hlv').textContent=T(innerWidth<=520?'Lv {{n}}':'Hero Lv {{n}}',{n:S.hl}); $('cSeason').title=$('season').textContent; $('xpf').style.width=Math.round(100*S.hx/xpNeed(S.hl))+'%';
  checkRequest(); renderReq(); renderPetition(); renderThrone(); syncTabs(); renderCharts(); renderOrders();
  if(S.phase==='day'&&!S.modal&&!S.over&&S.perkPending>0) offerPerk();
  if(S.phase==='day'&&!S.modal&&!S.over&&S.lootPending>0) offerLoot();
  if(S.phase==='day'&&!S.modal&&!S.over&&S.demand) offerDemand();
  if(S.phase==='day'&&!S.modal&&!S.over&&S.royalMsg) offerRoyal();
  if(S.phase==='day'&&!S.modal&&!S.over&&S.aud&&S.aud.pend) openAudience();
  renderEdicts(); renderHeroPanel();
  if(S.phase==='day') checkAch(); else renderAch();
  $('best').textContent=[S.crowns?T('{{n}} crown',{n:ordinal(myPlace())}):'',T(rankName()),T(DIFF[S.diff].label),T('score {{n}}',{n:score().toLocaleString()}),bestScore?T('best {{n}}',{n:bestScore.toLocaleString()}):''].filter(Boolean).join(' · ');
  renderInsp();
}
function renderQuest(){
  const box=$('quest');
  if(S.quest>=QUESTS.length){ box.innerHTML=`<span class="ql">${T('Quest')}</span><span class="qt"></span>`; box.querySelector('.qt').textContent=S.won?T('Every quest done and the crown secure. Endless mode: see how long you can last.'):T('Every quest done. Hold the keep until night {{n}}.',{n:WIN_NIGHTS}); return; }
  const q=QUESTS[S.quest], [have,need]=q.goal();
  box.innerHTML=`<span class="ql">${T('Quest')} ${S.quest+1}/${QUESTS.length}</span><span class="qt"></span>${need>1?`<span class="qp">${Math.min(have,need)}/${need}</span>`:''}<span class="qr">${T('Reward')} <b></b></span>`;
  box.querySelector('.qt').textContent=T(q.text); box.querySelector('.qr b').textContent=costStr(q.reward);
}
let upgKey='';
function renderUpgrades(){
  const box=$('upg'), key=UPGS.map(u=>upgState(u)).join()+S.day+S.over+lang;
  if(key===upgKey) return; upgKey=key;
  box.innerHTML=UPGS.map(u=>{ const st=upgState(u);
    const why=st==='req'?T('Needs {{n}}',{n:T(UPGS.find(x=>x.id===u.req).name)}):st==='day'?T('Opens on day {{n}}',{n:u.day}):'';
    return `<div class="uc${st==='done'?' done':''}"><div class="un">${T(u.name)}<small>${T(u.branch)}</small></div><div class="ud">${T(u.desc)}</div>${st==='done'?'':why?`<div class="ud">${why}</div>`:`<button type="button" data-upg="${u.id}" ${st!=='buy'?'disabled':''}>${T('Buy')} <span class="c">${costShort(upgCost(u))}</span></button>`}</div>`; }).join('');
  box.querySelectorAll('[data-upg]').forEach(b=>b.addEventListener('click',()=>buyUpg(b.dataset.upg)));
}
function renderTools(){
  const box=$('tools');
  if(!box.dataset.built){
    box.innerHTML=TOOLS.map(t=>`<button class="tool" data-tool="${t}" type="button" title="${T(DEF[t]?DEF[t].name:TNAME[t])} (${KEYS[t]})"><span class="k">${KEYS[t]}</span><svg viewBox="0 0 22 22" aria-hidden="true">${ICON[t]}</svg><span class="n">${T(TNAME[t])}</span><span class="c"></span></button>`).join('');
    box.dataset.built=1; box.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
  }
  const night=S.phase!=='day', grp=(TGROUPS.find(g=>g[0]===toolGroup)||TGROUPS[0])[2];
  renderTcats();
  box.querySelectorAll('.tool').forEach(b=>{
    const t=b.dataset.tool, d=DEF[t];
    b.classList.toggle('hid',(!!grp&&!grp.includes(t)&&t!=='clear'&&t!=='ride'&&t!==S.tool)||(!!d&&!!d.path&&S.path!==d.path));
    b.setAttribute('aria-pressed',t===S.tool); b.disabled=night&&t!=='ride';
    if(d){ const locked=d.unlock&&S.day<d.unlock;
      b.classList.toggle('locked',!!locked); b.classList.toggle('poor',!locked&&!canPay(d.cost));
      b.querySelector('.c').innerHTML=locked?T('day {{n}}',{n:d.unlock}):costShort(d.cost); }
    else b.querySelector('.c').textContent=t==='clear'?T('refund'):T('move');
  });
}
function tweenNum(el,v){
  const cur=+el.dataset.v; if(cur===v) return; el.dataset.v=v;
  if(reduce||isNaN(cur)||Math.abs(v-cur)>400){ el.textContent=v; return; }
  const t0=performance.now(), d=420; cancelAnimationFrame(el._raf||0);
  const tick=n=>{ const k=Math.min(1,(n-t0)/d), e=1-Math.pow(1-k,3); el.textContent=Math.round(cur+(v-cur)*e); if(k<1) el._raf=requestAnimationFrame(tick); };
  el._raf=requestAnimationFrame(tick);
}
function renderRes(){
  const E=econ(), box=$('res');
  if(!box.dataset.built){
    box.innerHTML=[...RES,'people','mood'].map(r=>`<div class="rc" id="r-${r}" style="--rcol:${RCOL[r]}"><div class="lab"><i style="background:${RCOL[r]}"></i>${r==='people'?T('Villagers'):T(cap1(r))}</div><div class="v">0</div><div class="d"></div></div>`).join('');
    box.dataset.built=1;
  }
  if(!renderRes.last) renderRes.last={}; const LST=renderRes.last, sig=S.cur+S.day+'|'+(S.seed||0);
  RES.forEach(r=>{ const c=$('r-'+r), was=LST[r], now=S.res[r]; if(was&&was.sig===sig&&was.v!==now&&!reduce){ const df=now-was.v, sp=document.createElement('span'); sp.className='pop '+(df>0?'up':'dn'); sp.textContent=(df>0?'+':'')+df; c.querySelectorAll('.pop').forEach(o=>o.remove()); c.appendChild(sp); setTimeout(()=>sp.remove(),1600); } LST[r]={v:now,sig}; });
  RES.forEach(r=>{ const c=$('r-'+r), n=E.net[r], d=c.querySelector('.d');
    tweenNum(c.querySelector('.v'),S.res[r]);
    if(r==='iron') c.hidden=!(S.mtnUnlocked||S.res.iron>0);
    d.innerHTML=n?`${n>0?'+':''}${n}<span class="ad"> ${T('at dawn')}</span>`:T('steady'); d.className='d'+(n>0?' up':n<0?' dn':''); c.title=`${cap1(r)}: ${S.res[r]}, ${n>=0?'+':''}${n} at dawn`; });
  const c=$('r-people'), d=c.querySelector('.d');
  c.querySelector('.v').textContent=`${S.pop}/${E.cap}`;
  d.innerHTML=E.popD<0?`${E.popD} ${T('famine')}`:S.idle?`${S.idle} <span class="ad">${T('unemployed')}</span><span class="sh">${T('idle')}</span>`:E.popD>0?`+${E.popD}<span class="ad"> ${T('at dawn')}</span>`:T('all working');
  d.className='d'+(E.popD<0?' dn':E.popD>0?' up':'');
  const mc=$('r-mood'), md=mc.querySelector('.d'), MI=moodInfo();
  mc.querySelector('.v').textContent=S.mood;
  md.innerHTML=`${T(S.mood>=70?'content':S.mood>=35?'steady':'unhappy')}<span class="ad"> → ${MI.target}</span>`; md.className='d'+(S.mood>=70?' up':S.mood<35?' dn':'');
  mc.title=`Mood ${S.mood}, heading toward ${MI.target} at dawn`;
}
function spark(h){ if(!h||h.length<2) return ''; const mn=Math.min(...h), mx=Math.max(...h), w=56, ht=16, k=mx>mn?ht/(mx-mn):0;
  const pts=h.map((v,i)=>`${(i/(h.length-1)*w).toFixed(1)},${(ht-(v-mn)*k+1).toFixed(1)}`).join(' '), up=h[h.length-1]>=h[h.length-2];
  return `<svg width="${w}" height="${ht+2}" viewBox="0 0 ${w} ${ht+2}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${up?'#E0904A':'#8FCB7E'}" stroke-width="1.5" stroke-linejoin="round"/></svg>`; }
let mktKey='';
function renderMarket(E){
  ensureEco(); const open=marketOpen(), cap=E.capS;
  const key=JSON.stringify([S.res,S.price,E.net,open,S.day,lang,E.tier,S.routes,S.loan,S.inv,S.phase]); if(key===mktKey) return; mktKey=key;
  $('mktsum').textContent=T(STD[E.tier].name);
  const nd=E.needs, pc=r=>nd[r]?Math.round(E.met[r]*100)+'%':'—';
  const rows=TRADE.map(r=>{ const n=E.net[r]||0;
    return `<tr><td><span style="color:${RCOL[r]}">■</span> ${T(cap1(r))}</td><td class="n">${S.res[r]}<span style="color:var(--muted)">/${cap}</span></td><td class="n ${n>0?'pos':n<0?'neg':''}"><span class="${n>0?'pos':n<0?'neg':''}">${n>0?'+':''}${n}</span></td><td class="n">${buyCost(r)}g</td><td class="n">${sellGain(r)}g</td><td>${spark(S.ph[r])}</td>
      <td><button type="button" data-mb="${r}" ${!open||S.res.gold<buyCost(r)?'disabled':''}>${T('Buy')} ${LOT}</button> <button type="button" data-ms="${r}" ${!open||S.res[r]<LOT?'disabled':''}>${T('Sell')} ${LOT}</button></td></tr>`; }).join('');
  $('mkt').innerHTML=`<div class="std"><span>${T('Living standard')}:</span><span class="tier">${T(STD[E.tier].name)}</span><span class="need">${T('Cloth')} ${pc('cloth')}</span><span class="need">${T('Ale')} ${pc('ale')}</span><span class="need">${T('Salt')} ${pc('salt')}</span><span style="color:var(--muted)">${T('Mood +{{m}}, taxes ×{{t}}',{m:STD[E.tier].mood,t:STD[E.tier].tax})}</span></div>
    <p class="info" style="margin:6px 0 0">${T('Villagers want 1 cloth per 6, 1 ale per 5 and 1 salt per 8 people each dawn. Meeting their wants raises their living standard, their mood and the taxes they can pay. Prices follow the seasons and fall when your stores are full.')}${open?'':' <b>'+T('Trading needs a market with a villager working it.')+'</b>'}</p>
    ${routesHtml()}${guildHtml()}
    <h4 style="margin:10px 0 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)">${T('Local market')}</h4><div class="mktwrap"><table class="mkt"><thead><tr><th>${T('Good')}</th><th>${T('Stock')}</th><th>${T('At dawn')}</th><th>${T('Buy')}</th><th>${T('Sell')}</th><th>${T('Trend')}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  $('mkt').querySelectorAll('[data-rg],[data-ra]').forEach(el=>el.addEventListener('change',()=>{ const id=el.dataset.rg||el.dataset.ra, g=$('mkt').querySelector(`[data-rg="${id}"]`).value, a=+$('mkt').querySelector(`[data-ra="${id}"]`).value; setRoute(id,g,a); }));
  $('mkt').querySelectorAll('[data-g]').forEach(b=>b.addEventListener('click',()=>{ const g=b.dataset.g; if(g==='repay') repayLoan(); else if(g==='invest') invest(); else takeLoan(g); }));
  $('mkt').querySelectorAll('[data-mb]').forEach(b=>b.addEventListener('click',()=>trade(b.dataset.mb,true)));
  $('mkt').querySelectorAll('[data-ms]').forEach(b=>b.addEventListener('click',()=>trade(b.dataset.ms,false)));
}
function renderGoods(E){
  const box=$('goods'), show=GOODS.filter(r=>S.res[r]>0||(E.net[r]||0)!==0||(r==='tools'&&count('workshop'))||(r==='salt'&&count('saltpan'))||(r==='ale'&&count('brewery'))||(r==='wool'&&count('pasture'))||(r==='cloth'&&count('weaver')));
  box.hidden=!show.length; if(!show.length) return;
  box.innerHTML=show.map(r=>{ const n=E.net[r]||0; return `<span class="gd2" title="${T(cap1(r))}"><i style="background:${RCOL[r]}"></i>${T(cap1(r))} <b>${S.res[r]}</b>${n?`<span class="${n>0?'up':'dn'}">${n>0?'+':''}${n}</span>`:''}</span>`; }).join('')+`<span class="gd2">${T('Living')}: <b>${T(STD[E.tier].name)}</b></span>`;
}
function renderLedger(){
  const E=econ(); renderMarket(E); renderGoods(E);
  const rows=RES.map(r=>{
    const lines=E.L[r].map(([t,v])=>`${t} <span class="${v<0?'neg':'pos'}">${v>0?'+':''}${v}</span>`).join('<br>')||'Nothing yet';
    const n=E.net[r];
    return `<tr><th><span class="c${r[0]}">${T(cap1(r))}</span></th><td>${lines}</td><td class="n ${n<0?'neg':n>0?'pos':''}">${n>0?'+':''}${n}</td></tr>`;
  });
  const grow=E.popD>0?`<span class="pos">+${E.popD}</span> will move in`:E.popD<0?`<span class="neg">${-E.popD}</span> will leave hungry`:S.pop>=E.cap?'Houses are full. Build more to grow':'No change';
  const MI=moodInfo(); rows.push(`<tr><th style="color:${RCOL.mood}">${T('Mood')}</th><td>${S.mood} now, heading toward ${MI.target}. ${MI.parts.map(([t,v])=>`${t} <span class="${v<0?'neg':'pos'}">${v>0?'+':''}${v}</span>`).join(', ')||'Nothing yet'}. ${S.mood>=70?'Content villagers pay extra taxes.':S.mood<35?'Unhappy villagers pay less and stop moving in.':''}</td><td class="n">${S.mood}</td></tr>`);
  rows.push(`<tr><th style="color:${RCOL.people}">${T('Villagers')}</th><td>${S.pop} living here, room for ${E.cap}. ${grow}.${S.idle?` ${plural(S.idle,'villager')} without work still pay taxes.`:''}</td><td class="n ${E.popD<0?'neg':E.popD>0?'pos':''}">${E.popD>0?'+':''}${E.popD}</td></tr>`);
  const warn=[];
  if(E.foodAfter<0) warn.push(`Food will run short by ${-E.foodAfter}. Build farms, buy food at a market, or expect villagers to leave.`);
  if(E.goldAfter<0) warn.push(`Gold won't cover upkeep. ${plural(Math.min(-E.goldAfter,99),'military building')} will sit out the next night.`);
  if(E.idleP) warn.push(`${plural(E.idleP,'producer')} ${E.idleP===1?'has':'have'} no worker. Build houses so more villagers move in.`);
  const prices='';
  $('ledger').innerHTML=`<div class="tw"><table><tbody>${rows.join('')}</tbody></table></div>${warn.map(w=>`<p class="warn">${w}</p>`).join('')}${prices}`;
}
function renderInsp(){
  const box=$('insp');
  if(selFolk&&!folk.includes(selFolk)) selFolk=null;
  if(selFolk){ const f=selFolk;
    box.innerHTML=`<div class="info"><div class="name"></div><div class="det"></div></div><div class="acts"><button id="fClose" type="button">${T('Close')}</button></div>`;
    box.querySelector('.name').textContent=`${f.name} · ${T(ROLE_NAME[f.role]||'Townsperson')}`;
    box.querySelector('.det').textContent=`“${(f.thought||'').startsWith('@')?f.thought.slice(1):T(f.thought||'')}”`;
    $('fClose').addEventListener('click',()=>{ selFolk=null; renderInsp(); }); return; }
  if(sel&&!G(...sel).b) sel=null;
  if(!sel){
    const q=S.hero.queue.length, d=DEF[S.tool];
    const tip=S.phase==='day'?(S.tool==='ride'?(COARSE?'Use the joystick to ride, or tap the ground to send your hero. Tap a building to inspect it, or a villager to meet them.':'Tap the ground to send your hero. Tap a building to inspect it, or a villager to meet them.'):S.tool==='clear'?'Tap a building to clear it for a refund.':`Ordering: ${d.name.toLowerCase()} for ${costStr(d.cost)}. Tap tiles for your hero to build${q?` · ${q} order${q>1?'s':''} queued`:''}.`)
      :'Tap the ground to send your hero into the fight. Tap a building to upgrade it or trade.';
    const rp=repairAllCost();
    box.innerHTML=`<span class="hint" style="flex:1;min-width:0"></span>${rp&&S.phase==='day'?`<div class="acts"><button class="up" id="iFixAll" type="button" ${!canPay(rp.c)?'disabled':''}>${T('Repair all ({{n}})',{n:rp.n})} <span class="c">${costShort(rp.c)}</span></button></div>`:''}`;
    box.querySelector('.hint').textContent=T(tip); $('iFixAll')?.addEventListener('click',repairAll); return;
  }
  const i=idx(...sel), b=G(...sel).b, d=DEF[b.type], w=weapon(b);
  const hp=`Health ${b.hp}/${b.max}`;
  let det='';
  const work=b.off?'paused':b.worked?'worked by a villager':'idle, no free villager';
  switch(b.type){
    case 'keep': det=S.cur==='home'&&keepLvl()>1?`${T(['Keep','Castle','Citadel'][keepLvl()-1])} · Health ${S.keep}/${S.keepMax} · houses ${4*keepLvl()} villagers · shoots raiders close by`:S.cur!=='home'?`Health ${S.keep}/${S.keepMax} · if it falls, raiders plunder a third of your gold and food · shoots raiders close by`:`Health ${S.keep}/${S.keepMax} · houses 4 villagers · shoots raiders close by`; break;
    case 'pasture': det=`${hp} · ${work} · +${2+(S.kind==='mountain'?1:0)} wool at dawn`; break;
    case 'storehouse': det=`${hp} · every good can be stored up to ${storeCap()}`; break;
    case 'brewery': det=`${hp} · ${work} · 3 food into 2 ale at dawn`; break;
    case 'weaver': det=`${hp} · ${work} · 2 wool into 2 cloth at dawn`; break;
    case 'saltpan': det=`${hp} · ${work} · +3 salt at dawn`; break;
    case 'workshop': det=`${hp} · ${work} · 1 iron and 1 wood into 2 tools at dawn`; break;
    case 'counting': det=`${hp} · +${5+Math.min(3,nearCount(S.grid,sel[0],sel[1],['market','house'],1))} ${T('gold each dawn')} · ${T('+1 for each market or house beside it, up to +3')}`; break;
    case 'warcamp': det=`${hp} · ${S.units.filter(u=>u.home===i).length}/${3+S.mods.muster} ${T('spearmen')} · ${T('double damage against runners, wolves and knights')} · ${T('1 gold upkeep')}`; break;
    case 'temple': det=`${hp} · ${T('+6 mood, +2 renown each dawn, heals your hero and soldiers within two tiles at night')}`; break;
    case 'w_granary': case 'w_bazaar': case 'w_academy': case 'w_cathedral': case 'w_colossus': det=b.done?`${T('Wonder')} · ${T(d.desc)}`:`${T('Under construction')}: ${b.prog||0}/${d.days} · ${work} · ${costStr(d.daily)} ${T('each dawn')}`; break;
    case 'road': det=`${hp} · your hero rides 40% faster on roads · farms, lumber camps and mines next to a road yield 1 more`; break;
    case 'lighthouse': det=`${hp} · pirates land with a quarter less health · warships are more likely to find pirate boats`; break;
    case 'smith': det=`${hp} · arms ${S.iron||0}/3 (+${S.iron||0} damage for your hero and soldiers) · plate ${S.plate||0}/3 (+${(S.plate||0)*2} soldier health, +${(S.plate||0)*3} hero health)`; break;
    case 'tavern': det=`${hp} · +4 mood (up to 2 taverns) · +2 gold at dawn${S.mercs?` · ${S.mercs} sellswords hired for tonight`:''}`; break;
    case 'harbor': det=`${hp} · ${work} · +3 food from fishing · ${shipsFree()} of ${shipsTotal()} ship${shipsTotal()===1?'':'s'} in port`; break;
    case 'tower': det=`${hp}${b.spec==='ballista'?' · ballista':b.spec==='fire'?' · fire arrows':b.lvl===3?' · ready to specialize':''}`; break;
    case 'trap': det=`${b.charges}/${trapMax()} charges · ${1+S.mods.trap} damage and slows`; break;
    case 'barr': det=`${hp} · ${S.units.filter(u=>u.home===i).length}/${b.lvl+1+S.mods.muster} ${b.train==='spear'?T('spearmen'):T('soldiers')} · ${T(b.train==='spear'?'double damage against runners, wolves and knights':'half again as much damage against archers, shamans and sappers')} · ${unitDmg()} damage each · 1 gold upkeep, soldiers eat 1 food each`+(b.unpaid?' · unpaid, idle tonight':''); break;
    case 'house': det=`${hp} · room for ${3+S.mods.housing+((b.lvl||1)>1?2:0)} villagers${(b.lvl||1)>1?' · a manor':''} · ${S.pop}/${housing()} housed`; break;
    case 'farm': det=`${hp} · ${work} · +${farmOut()} food at dawn`; break;
    case 'well': det=`${hp} · +4 mood (up to 3 wells) · keeps fire off the buildings around it`; break;
    case 'shrine': det=`${hp} · +8 mood (up to 2 shrines)`; break;
    case 'range': det=`${hp} · ${S.units.filter(u=>u.home===i).length}/${b.lvl+1+S.mods.muster} archers · shoot raiders up to 2.7 tiles away · 1 gold upkeep, archers eat 1 food each`+(b.unpaid?' · unpaid, idle tonight':''); break;
    case 'lumber': det=`${hp} · ${work} · +${4+S.mods.wood} wood at dawn`; break;
    case 'mine': det=S.kind==='mountain'?`${hp} · ${work} · +${2+S.mods.stone} iron at dawn`:`${hp} · ${work} · +${3+S.mods.stone} stone at dawn`; break;
    case 'market': det=`${hp} · ${work} · +3 gold at dawn`; break;
    case 'wall': det=b.lvl>1?`${hp} · crenellated stone`:`${hp} · upgrade to stone for 10 more health`; break;
    default: det=hp;
  }
  { const bt=bonusText(b.type,...sel); if(bt) det+=' · '+bt; }
  if(w&&b.type!=='keep') det+=` · ${w.dmg} damage · range ${w.range.toFixed(1)}`+(w.splash?' · splash':'')+(d.upkeep?' · 1 gold upkeep':'')+(b.unpaid&&b.type==='cata'?' · unpaid, idle tonight':'');
  let acts='';
  if(b.type==='tower'&&b.lvl===3&&!b.spec&&S.phase==='day'){ const sc={stone:8,gold:12}; acts+=`<button class="up" id="iSpecB" type="button" ${!canPay(sc)?'disabled':''} title="${T('+3 damage, longer range, slower shots')}">${T('Ballista')} <span class="c">${costShort(sc)}</span></button><button class="up" id="iSpecF" type="button" ${!canPay(sc)?'disabled':''} title="${T('Arrows set raiders alight for 3 seconds')}">${T('Fire arrows')} <span class="c">${costShort(sc)}</span></button>`; }
  if(d.upg&&b.lvl<=d.upg.length){ const c=d.upg[b.lvl-1]; acts+=`<button class="up" id="iUp" type="button" ${!canPay(c)||S.over?'disabled':''}>${b.type==='wall'?'To stone':'Upgrade'} <span class="c">${costShort(c)}</span></button>`; }
  else if(d.upg&&b.type!=='wall') acts+=`<button type="button" disabled>Max level</button>`;
  const rc=repairCost(b);
  if(rc&&S.phase==='day') acts+=`<button class="up" id="iFix" type="button" ${!canPay(rc)||S.over?'disabled':''}>Repair <span class="c">${costShort(rc)}</span></button>`;
  if(d.work) acts+=`<button id="iOff" type="button">${b.off?'Resume':'Pause'}</button>`;
  if(b.type==='barr'&&S.phase==='day') acts+=`<button id="iTrain" type="button" title="${T('Spearmen deal double damage to runners, wolves and knights. Soldiers deal more to archers, shamans and sappers.')}">${b.train==='spear'?T('Train soldiers'):T('Train spearmen')}</button>`;
  if(b.type==='keep'&&S.cur==='home'&&S.phase==='day') acts+=`<button class="up" id="iFeast" type="button" ${S.feastSeason===seasonIdx()||!canPay({food:20,gold:10})?'disabled':''}>${S.feastSeason===seasonIdx()?T('Feast held this season'):`${T('Hold a feast')} <span class="c">${costShort({food:20,gold:10})}</span>`}</button>`;
  if(b.type!=='keep') acts+=`<button id="iClr" type="button" ${S.phase!=='day'?'disabled':''}>Clear <span class="c">${costShort(refundOf(b))}</span></button>`;
  let extra='';
  if(b.type==='smith'){
    const ca={iron:3+(S.iron||0)*2,gold:6}, cp={iron:3+(S.plate||0)*2,gold:6};
    extra=`<div class="ports"><div class="port"><span class="pn">${T('Forge arms')} · ${S.iron||0}/3</span><span class="pd">${T('Sharper blades: +1 damage for your hero and every soldier.')}</span><button type="button" data-forge="arms" ${(S.iron||0)>=3||!canPay(ca)?'disabled':''}>${(S.iron||0)>=3?T('Done'):`${T('Forge')} <span class="c">${costShort(ca)}</span>`}</button></div>
      <div class="port"><span class="pn">${T('Forge plate')} · ${S.plate||0}/3</span><span class="pd">${T('Iron plate: +2 health for every soldier and +3 for your hero.')}</span><button type="button" data-forge="plate" ${(S.plate||0)>=3||!canPay(cp)?'disabled':''}>${(S.plate||0)>=3?T('Done'):`${T('Forge')} <span class="c">${costShort(cp)}</span>`}</button></div></div>`;
  }
  if(b.type==='tavern'){
    extra=`<div class="ports"><div class="port"><span class="pn">${T('Hire sellswords')}</span><span class="pd">${T('Three hardened fighters guard the keep of whichever region is raided tonight, then leave at dawn.')}</span><button type="button" data-hire="1" ${S.mercs||S.phase!=='day'||S.res.gold<12?'disabled':''}>${S.mercs?T('Hired'):`${T('Hire')} <span class="c">12g</span>`}</button></div></div>`;
  }
  if(b.type==='harbor'){
    const sea=S.voyages.map(v=>{ const p=PORTS.find(x=>x.id===v.port); return T('{{p}} (home day {{d}})',{p:p?T(p.name):'?',d:v.back}); });
    extra=`<div class="ports">${PORTS.map(p=>`<div class="port"><span class="pn">${T(p.name)} · ${TP(p.days,'day')}</span><span class="pd">${T(p.desc)} ${T('Ship {{a}} {{g}}, get about {{e}} gold · {{r}}% risk',{a:p.amt,g:T(p.good),e:portEst(p),r:Math.round(portRisk(p)*100)})}</span><button type="button" data-port="${p.id}" ${!shipsFree()||S.res[p.good]<p.amt?'disabled':''}>${T('Send')} <span class="c">${p.amt}${p.good[0]}</span></button></div>`).join('')}</div>${sea.length?`<div class="prod">${T('At sea:')} ${sea.join(', ')}</div>`:''}<div class="ports"><div class="port"><span class="pn">${T('Warships')} · ${S.warships||0}/${count('harbor')}</span><span class="pd">${T('Each warship sails out to meet a pirate boat when raiders come to the cove, and may sink it with its crew aboard. 1 gold upkeep each.')}</span><button type="button" data-war="1" ${(S.warships||0)>=count('harbor')||!canPay(WARSHIP)?'disabled':''}>${T('Build')} <span class="c">${costShort(WARSHIP)}</span></button></div></div>`;
  }
  if(b.type==='market'){
    extra=b.worked?`<div class="trade">${TRADE.map(r=>`<span class="tn" style="color:${RCOL[r]}">${T(cap1(r))}</span><span class="ts">you have ${S.res[r]}</span><button type="button" data-buy="${r}" ${S.res.gold<buyCost(r)?'disabled':''}>Buy ${LOT} <span class="c">${buyCost(r)}g</span></button><button type="button" data-sell="${r}" ${S.res[r]<LOT?'disabled':''}>Sell ${LOT} <span class="c">+${sellGain(r)}g</span></button>`).join('')}</div>`
      :`<div class="prod">Trading opens once a villager works the market.</div>`;
  }
  box.innerHTML=`<div class="info"><div class="name"></div><div class="det"></div></div><div class="acts">${acts}</div>${extra}`;
  box.querySelector('.name').textContent=b.type==='keep'?T(REGIONS[S.cur].fort):b.type==='wall'?T(b.lvl>1?'Stone wall':'Palisade'):T(d.name)+(d.upg?' · '+T('level {{n}}',{n:b.lvl}):'');
  box.querySelector('.det').textContent=det;
  $('iUp')?.addEventListener('click',upgradeSel);
  $('iFix')?.addEventListener('click',()=>{ const c=repairCost(b); if(!c||!canPay(c)) return; spend(c); if(b.type==='keep') S.keep=S.keepMax; else b.hp=b.max; puff(sel[0],sel[1],COL.gold,10); dustRing(sel[0],sel[1]); sfx('up'); say(`${b.type==='keep'?'Keep':DEF[b.type].name} repaired.`); save(); ui(); });
  $('iClr')?.addEventListener('click',()=>{ if(sel) clearAt(...sel); });
  $('iFeast')?.addEventListener('click',holdFeast);
  const spec=k=>{ const sc={stone:8,gold:12}; if(!canPay(sc)||b.spec) return; spend(sc); b.spec=k; b.spent=addC(spentOf(b),sc); puff(sel[0],sel[1],COL.gold,12); sfx('up'); say(k==='ballista'?'<b>Ballista mounted.</b> Heavy bolts hit 3 harder from further away, but more slowly.':'<b>Fire arrows.</b> Raiders hit by this tower burn for 3 seconds.'); S.ver++; save(); ui(); };
  $('iSpecB')?.addEventListener('click',()=>spec('ballista')); $('iSpecF')?.addEventListener('click',()=>spec('fire'));
  $('iTrain')?.addEventListener('click',()=>{ b.train=b.train==='spear'?null:'spear'; spawnUnits(sel[1]*N+sel[0]); S.ver++; save(); ui(); renderInsp(); say(b.train==='spear'?T('The barracks now trains spearmen.'):T('The barracks now trains soldiers.')); });
  $('iOff')?.addEventListener('click',()=>{ b.off=!b.off; save(); ui(); say(b.off?`${d.name} paused. Its worker is free for other jobs.`:`${d.name} back to work.`); });
  box.querySelectorAll('[data-port]').forEach(el=>el.addEventListener('click',()=>sendVoyage(el.dataset.port)));
  box.querySelectorAll('[data-forge]').forEach(el=>el.addEventListener('click',()=>forge(el.dataset.forge)));
  box.querySelectorAll('[data-hire]').forEach(el=>el.addEventListener('click',hireMercs));
  box.querySelectorAll('[data-war]').forEach(el=>el.addEventListener('click',buildWarship));
  box.querySelectorAll('[data-buy]').forEach(el=>el.addEventListener('click',()=>trade(el.dataset.buy,true)));
  box.querySelectorAll('[data-sell]').forEach(el=>el.addEventListener('click',()=>trade(el.dataset.sell,false)));
}
function repairAllCost(){ let n=0; const c={}; each(b=>{ const r=repairCost(b); if(!r) return; n++; for(const k in r) c[k]=(c[k]||0)+r[k]; }); return n?{n,c}:null; }
function repairAll(){
  const rp=repairAllCost(); if(!rp||S.phase!=='day') return;
  if(!canPay(rp.c)){ say(`Repairing everything needs ${costStr(rp.c)}.`); sfx('no'); return; }
  spend(rp.c); each((b,x,y)=>{ if(!repairCost(b)) return; if(b.type==='keep') S.keep=S.keepMax; else b.hp=b.max; puff(x,y,COL.gold,6); });
  sfx('up'); say(`<b>Every building repaired.</b>`); S.ver++; save(); ui();
}
function repairCost(b){
  if(b.type==='trap') return null;
  if(b.type==='keep'){ const m=S.keepMax-S.keep; return m>0?{wood:m*2,stone:m}:null; }
  const m=b.max-b.hp; if(m<=0) return null;
  const stone=(b.type==='wall'&&b.lvl>1)||(b.type==='tower'&&b.lvl>1);
  return stone?{stone:Math.ceil(m/3),wood:Math.ceil(m/4)}:{wood:Math.ceil(m/2)};
}
function closeRealm(){ const r=$('realm'); if(r) r.hidden=true; }
function openRealm(){ renderRealm(); $('realm').hidden=false; }
function toggleRealm(){ if($('realm').hidden) openRealm(); else closeRealm(); }
function regionStatus(id){
  const r=id===S.cur?S:S.R[id]; if(!r||!r.grid) return null;
  let b=0; r.grid.forEach(t=>{ if(t.b&&t.b.type!=='keep') b++; });
  return {keep:r.keep,keepMax:r.keepMax,buildings:b};
}
function renderRealm(){
  const night=S.phase!=='day', ids=['home','coast','mountain'];
  const node=(id,x,y)=>{ const raid=S.raid===id, hero=S.heroAt===id, open=!!S.R[id];
    return `<g class="node" data-go="${id}" tabindex="0" role="button" aria-label="${T(regionName(id))}">
      <circle cx="${x}" cy="${y}" r="17" fill="${open?'#3A2E26':'#2A221D'}" stroke="${raid?'#E8604F':open?'#D99A60':'#5A4A3E'}" stroke-width="${raid?3:2}" ${open?'':'stroke-dasharray="4 4"'}/>
      ${id==='home'?`<path d="M${x-8} ${y+6}v-9l3-3 3 3v-3l2-2 2 2v3l3-3 3 3v9z" fill="#F0BE4E"/>`:id==='mountain'?`<path d="M${x-10} ${y+6}l6-11 4 6 3-4 7 9z" fill="${open?'#E8EEF5':'#6A5A4E'}"/><path d="M${x-6} ${y-1}l2-4 2 3z" fill="${open?'#9FB8D0':'#5A4A3E'}"/>`:`<path d="M${x} ${y-9}v15M${x-6} ${y-3}h12M${x-9} ${y+2}c2 7 16 7 18 0" fill="none" stroke="${open?'#BFE0EA':'#6A5A4E'}" stroke-width="2" stroke-linecap="round"/>`}
      ${hero?`<circle cx="${x+15}" cy="${y-14}" r="7" fill="#F2EADD"/><path d="M${x+11} ${y-15}l2 2 2-4 2 4 2-2v4h-8z" fill="#28201C"/>`:''}
      ${raid&&open?`<path d="M${x-14} ${y-20}c2-5 6-4 5-9 4 3 5 7 3 10" fill="#E8604F"/>`:''}
      <text x="${x}" y="${y+33}" text-anchor="middle" font-size="12" font-family="Inter,system-ui,sans-serif" font-weight="600" fill="${open?'#F2EADD':'#8A7A6A'}">${open?T(regionName(id)):T('Unknown lands')}</text></g>`; };
  const sea=S.voyages.map((v,i)=>{ const p=PORTS.find(x=>x.id===v.port); return `<g transform="translate(${70+i*70},214)"><path d="M-10 0h20l-4 6h-12z" fill="#D99A60"/><path d="M0 0v-12l7 8h-7" fill="#EDE3CE"/><text y="18" text-anchor="middle" font-size="9" fill="#BFE0EA" font-family="Inter,system-ui,sans-serif">${p?T(p.name):''}</text></g>`; }).join('');
  const mOpen=!!S.mtnUnlocked;
  const svg=`<svg viewBox="0 0 400 240" role="img" aria-label="Map of the realm">
    <defs><pattern id="wv" width="24" height="10" patternUnits="userSpaceOnUse"><path d="M0 6c4-4 8-4 12 0s8 4 12 0" fill="none" stroke="#3E7E92" stroke-width="1.2"/></pattern></defs>
    <rect width="400" height="240" fill="#2A221D"/>
    <path d="M0 165c50-12 90 8 140-2s90-22 140-8 80 16 120 4V240H0z" fill="#1E4A58"/><path d="M0 165c50-12 90 8 140-2s90-22 140-8 80 16 120 4V240H0z" fill="url(#wv)" opacity=".7"/>
    <path d="M0 0h400v170c-40 12-80-2-120-12s-90 6-140 6-90-10-140 2z" fill="#6A4430"/>
    <g transform="translate(-40,24)"><path d="M150 20c40-10 90-6 110 14s14 54-8 66-74 12-98-6-30-62-4-74z" fill="#C98A55"/>
    <path d="M150 20c40-10 90-6 110 14s14 54-8 66-74 12-98-6-30-62-4-74z" fill="none" stroke="#A9553E" stroke-width="6" stroke-linejoin="round"/></g>
    <path d="M268 14c22-10 70-8 84 8s8 42-14 50-56 6-70-8-18-40 0-50z" fill="#C9D2DC" opacity="${mOpen?1:.3}"/>
    <path d="M268 14c22-10 70-8 84 8s8 42-14 50-56 6-70-8-18-40 0-50z" fill="none" stroke="#7C8A9C" stroke-width="5" stroke-linejoin="round" opacity="${mOpen?1:.3}"/>
    <path d="M196 72c20-10 44-20 82-28" fill="none" stroke="#EDE3CE" stroke-width="2" stroke-dasharray="3 5" opacity="${mOpen?.8:.3}"/>
    <path d="M226 120c20-4 44 4 52 18s-6 26-30 26-40-6-42-20 4-22 20-24z" fill="#C98A55" opacity="${S.coastUnlocked?1:.35}"/>
    <path d="M176 104c18 12 36 18 56 22" fill="none" stroke="#EDE3CE" stroke-width="2" stroke-dasharray="3 5" opacity="${S.coastUnlocked?.8:.3}"/>
    ${[[30,70],[90,135],[360,125],[50,30],[110,20],[236,22]].map(([x,y])=>`<path d="M${x} ${y}l10-16 10 16z" fill="#8A5238"/><path d="M${x+6} ${y-9}l4-7 4 7z" fill="#EDE6D4"/>`).join('')}
    <text x="200" y="232" text-anchor="middle" font-size="10" fill="#9CC6D2" font-family="Inter,system-ui,sans-serif" letter-spacing="2">${T('THE OPEN SEA')}</text>
    ${node('home',170,82)}${node('coast',250,140)}${node('mountain',310,40)}${sea}</svg>`;
  const card=id=>{ const st=regionStatus(id), open=!!S.R[id];
    if(!open) return `<div class="rcard"><b>${T('Unknown lands')}</b><div class="rd">${T(id==='mountain'?'Your scouts are crossing the northern mountains. They should find a way by day 7.':'Your scouts are searching the coast to the south. They should find a way by day 3.')}</div></div>`;
    const here=S.cur===id&&S.heroAt===id, raid=S.raid===id;
    return `<div class="rcard"><b>${T(regionName(id))}</b><div class="rd">${T(REGIONS[id].desc)}</div>
      <div class="tags">${S.heroAt===id?`<span class="tag hero">${T('Your hero is here')}</span>`:''}${raid?`<span class="tag raid">${T(night?'Under attack':'Tonight’s raid')}</span>`:''}<span class="tag">${T(REGIONS[id].fort)} ${st.keep}/${st.keepMax}</span><span class="tag">${TP(st.buildings,'building')}</span>${id==='coast'?`<span class="tag">${T('{{a}} of {{b}} ships in port',{a:shipsFree(),b:shipsTotal()})}</span>`:''}${id==='mountain'?`<span class="tag">${T('{{n}} iron',{n:S.res.iron})}</span>`:''}</div>
      <button type="button" data-go="${id}" ${here||night?'disabled':''}>${T(here?'You are here':night?'Travel by day':'Ride here')}</button></div>`; };
  const facH=factionsHtml()+crownsHtml();
  $('realm').innerHTML=`<div class="rh"><h2>${T('The realm')}</h2><span style="display:flex;gap:6px"><button class="x" type="button" id="realmSlots">${T('Save slots')}</button><button class="x" type="button" id="realmClose">${T('Close')}</button></span></div>${svg}<div class="rcards">${ids.map(card).join('')}</div>${facH}${S.voyages.length?`<div class="rd" style="font-size:13px;color:var(--muted)">${T('At sea:')} ${S.voyages.map(v=>{ const p=PORTS.find(x=>x.id===v.port); return T('{{p}}, home on day {{d}}',{p:p?T(p.name):'',d:v.back}); }).join(' · ')}</div>`:''}`;
  $('realmClose').addEventListener('click',closeRealm);
  $('realmSlots').addEventListener('click',()=>{ closeRealm(); save(); slotMenu(false); });
  $('worldBtn2')?.addEventListener('click',()=>openWorld()); $('hostBtn')?.addEventListener('click',hostTourney);
  roughSvg($('realm').querySelector('svg'));
  $('realm').querySelectorAll('[data-court]').forEach(b=>b.addEventListener('click',()=>openWorld('court',b.dataset.court)));
  const RQ=(sel,fn)=>$('realm').querySelectorAll(sel).forEach(b=>b.addEventListener('click',()=>fn(Object.values(b.dataset)[0])));
  RQ('[data-envoy]',envoy); RQ('[data-pact2]',proposePact); RQ('[data-wed]',proposeMarriage); RQ('[data-den]',denounce); RQ('[data-war]',declareWar); RQ('[data-peace]',offerPeace);
  RQ('[data-settle]',settle); RQ('[data-reinf]',reinforce); RQ('[data-march]',march); $('levyBtn')?.addEventListener('click',raiseLevy);
  $('realm').querySelectorAll('[data-gift]').forEach(b=>b.addEventListener('click',()=>sendGift(b.dataset.gift)));
  $('realm').querySelectorAll('[data-pact]').forEach(b=>b.addEventListener('click',()=>makePact(b.dataset.pact)));
  $('realm').querySelectorAll('[data-go]').forEach(el=>{ const go=()=>{ if(S.R[el.dataset.go]) travelTo(el.dataset.go); }; el.addEventListener('click',go); el.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } }); });
}
function setTool(t){ if(S.phase!=='day'&&t!=='ride') return; S.tool=t; if(t!=='ride') sel=null; ui(); }
document.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
$('bell').addEventListener('click',startNight);
function togglePause(){ paused=!paused; $('pause').setAttribute('aria-pressed',paused); $('pause').setAttribute('aria-label',paused?'Resume':'Pause'); }
$('pause').addEventListener('click',togglePause);
function toggleSpeed(){ speed=speed===1?2:speed===2?3:1; $('speed').textContent=speed+'×'; savePrefs(); }
const PREF='smallcrown-prefs';
function applyLang(){
  if(window.i18next&&i18next.isInitialized) i18next.changeLanguage(lang);
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-t]').forEach(el=>{ if(el.dataset.en==null) el.dataset.en=el.textContent; el.textContent=T(el.dataset.en); });
  document.querySelectorAll('[data-th]').forEach(el=>{ if(el.dataset.en==null) el.dataset.en=el.innerHTML; el.innerHTML=lang==='es'?T(el.dataset.th,{defaultValue:el.dataset.en}):el.dataset.en; });
  const lb=$('lang'); lb.textContent=lang.toUpperCase(); lb.setAttribute('aria-label',lang==='es'?'Idioma: español. Cambiar a inglés':'Language: English. Switch to Spanish');
  $('install').textContent=T('Install');
  delete $('tools').dataset.built; delete $('res').dataset.built; upgKey=''; achKey=''; edictKey=''; heroKey=''; throneKey=''; mktKey='';
  if(S){ ui(); if(!$('realm').hidden) renderRealm(); }
  $('qual').textContent=T(quality==='high'?'High':'Low');
}
function savePrefs(){ try{ localStorage.setItem(PREF,JSON.stringify({lang,slot,speed,zoom:+zoomHH.toFixed(2),sound,music:musicOn,quality,qualityChosen,artStyle,heroCam})); }catch(e){} }
function loadPrefs(){ lang=/^es/i.test(navigator.language||'')?'es':'en'; try{ const p=JSON.parse(localStorage.getItem(PREF)||'{}');
  if(p.lang==='es'||p.lang==='en') lang=p.lang; if(p.slot>=1&&p.slot<=4) slot=p.slot;
  if([1,2,3].includes(p.speed)){ speed=p.speed; $('speed').textContent=speed+'×'; }
  if(p.zoom>=ZMIN&&p.zoom<20) zoomHH=p.zoom;
  if(p.quality==='low'||p.quality==='high'){ quality=p.quality; qualityChosen=!!p.qualityChosen; }
  if(p.artStyle==='mirage'){ artStyle='mirage'; $('style').textContent=T('Mirage'); $('style').setAttribute('aria-pressed','true'); }
  if(p.heroCam){ heroCam=true; $('cam').setAttribute('aria-pressed','true'); }
  if(p.sound){ sound=true; musicOn=!!p.music; $('sound').setAttribute('aria-pressed',true); $('sndwave').setAttribute('opacity','1'); if(musicOn) setTimeout(()=>setAudio(2,true),0); }
}catch(e){} }
addEventListener('pointerdown',()=>{ if(sound&&!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } },true);
$('speed').addEventListener('click',toggleSpeed);
$('qual').addEventListener('click',()=>{ quality=quality==='high'?'low':'high'; qualityChosen=true; applyQuality(); savePrefs(); say(quality==='high'?'Graphics set to High: night glow and sharper shadows.':'Graphics set to Low: smoother on older phones.'); });
let musicOn=false, music=null;
// A generative score with Tone.js: a wandering pentatonic pluck and warm pads by day, a minor key and war drums by night.
function startMusic(){
  const T=window.Tone; if(!T) return false;
  try{
    T.start();
    if(!music){
      const out=new T.Volume(-16).toDestination(), rev=new T.Reverb({decay:5,wet:.35}).connect(out);
      const pluck=new T.PolySynth(T.Synth,{oscillator:{type:'triangle'},envelope:{attack:.01,decay:.35,sustain:.08,release:1.4}}).connect(rev);
      const pad=new T.PolySynth(T.Synth,{oscillator:{type:'sine'},envelope:{attack:1.8,decay:1,sustain:.6,release:3}}).connect(rev); pad.volume.value=-12;
      const drum=new T.MembraneSynth({pitchDecay:.06,octaves:4,envelope:{attack:.001,decay:.45,sustain:0}}).connect(out); drum.volume.value=-4;
      const DAY=['D4','E4','F#4','A4','B4','D5','E5','F#5'], NIGHT=['D4','F4','G4','A4','C5','D5','F5'];
      let i=3;
      new T.Loop(t=>{ const sc=S&&S.phase==='night'?NIGHT:DAY; if(Math.random()<.68){ i=Math.max(0,Math.min(sc.length-1,i+Math.floor(Math.random()*3)-1)); pluck.triggerAttackRelease(sc[i],'8n',t,.35+Math.random()*.3); } },'8n').start(0);
      new T.Loop(t=>{ const n=S&&S.phase==='night'; pad.triggerAttackRelease(n?(Math.random()<.5?['D3','F3','A3']:['A#2','D3','F3']):(Math.random()<.5?['D3','F#3','A3']:['G2','B2','D3']),'1m',t,.35); },'1m').start(0);
      new T.Loop(t=>{ if(S&&S.phase==='night'){ drum.triggerAttackRelease('D1','8n',t,.8); if(Math.random()<.45) drum.triggerAttackRelease('A1','16n',t+T.Time('8n').toSeconds(),.5); } },'4n').start(0);
      T.Transport.bpm.value=78; music={out};
    }
    T.Transport.start(); return true;
  }catch(e){ return false; }
}
function stopMusic(){ try{ if(window.Tone&&music) Tone.Transport.pause(); }catch(e){} }
function syncMusicTempo(){ if(!music||!musicOn||!window.Tone) return; const want=S.phase==='night'?(S.queue.length+S.enemies.length>8?104:94):78; if(Math.abs(Tone.Transport.bpm.value-want)>1) Tone.Transport.bpm.rampTo(want,3); }
function setAudio(level,quiet){
  sound=level>0; musicOn=level>1;
  if(sound&&!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ sound=false; } }
  if(sound&&actx) actx.resume?.();
  if(musicOn){ if(!startMusic()&&!quiet) say('The music is still loading. Tap the sound button again in a moment.'); } else stopMusic();
  const b=$('sound'); b.setAttribute('aria-pressed',sound); $('sndwave').setAttribute('opacity',sound?'1':'.3');
  b.setAttribute('aria-label',musicOn?'Sound and music on':sound?'Sound effects on':'Sound off');
  let n=b.querySelector('.note'); if(musicOn&&!n){ n=document.createElement('span'); n.className='note'; n.textContent='♪'; n.setAttribute('aria-hidden','true'); b.appendChild(n); } else if(!musicOn&&n) n.remove();
  if(!quiet){ say(musicOn?'Sound effects and music on.':sound?'Sound effects on. Tap again for music.':'Sound off.'); if(sound) sfx('build'); }
  savePrefs();
}
$('sound').addEventListener('click',()=>setAudio(sound?(musicOn?0:2):1));
addEventListener('pointerdown',()=>{ if(musicOn&&window.Tone&&(!music||Tone.Transport.state!=='started')) startMusic(); },true);
// touch joystick (nipplejs), shown on touch screens
const COARSE=matchMedia('(pointer: coarse)').matches;
let joyMgr=null;
function initJoy(){
  if(joyMgr||!COARSE||!window.nipplejs) return;
  const z=$('joy'); z.hidden=false;
  try{
    joyMgr=nipplejs.create({zone:z,mode:'static',position:{left:'50%',top:'50%'},color:'#F0BE4E',size:100,restOpacity:.6});
    joyMgr.on('move',(e,d)=>{ if(!d||!d.vector) return; const f=Math.min(1,d.force||0); JOY.x=d.vector.x*f; JOY.y=-d.vector.y*f; camFree=null; });
    joyMgr.on('end',()=>{ JOY.x=0; JOY.y=0; });
  }catch(e){ z.hidden=true; }
}
// guided tour (driver.js)
function startTour(){
  const D=window.driver&&window.driver.js&&window.driver.js.driver;
  if(!D){ say('The tour is still loading. Try again in a moment.'); return; }
  const steps=[
    {element:'#res',popover:{title:T('Your goods'),description:T('Gold, food, wood and stone, plus your villagers. The small line under each number is what the next dawn will bring.')}},
    {element:'#board',popover:{title:T('The valley'),description:COARSE?T('Tap a tile to send your hero to build there. Steer him with the joystick in the corner, drag to look around and pinch to zoom.'):T('Tap a tile to send your hero to build there. Right-click to ride somewhere or steer with W A S D. Drag to look around and scroll to zoom.')}},
    {element:'#quest',popover:{title:T('Quests'),description:T('Your next goal and what it pays. The first few walk you through the basics.')}},
    {element:'#tools',popover:{title:T('Build tools'),description:T('Farms feed your villagers, houses bring more of them, and every villager pays taxes. Palisades, traps and towers stop raiders.')}},
    {element:'#abil',popover:{title:T('Hero abilities'),description:T('Charge cuts through raiders in a line. Rally pulls every soldier to your hero.')}},
    {element:'#bell',popover:{title:T('Ring the bell'),description:T('When you are ready, start the night. Red dots on the ground show where raiders will walk. Hold the keep for {{n}} nights.',{n:WIN_NIGHTS})}},
    {element:'#upg',popover:{title:T('Kingdom upgrades'),description:T('Spend spare goods on permanent improvements to your economy, defenses, army and hero.')}}
  ];
  try{ D({showProgress:true,nextBtnText:T('Next'),prevBtnText:T('Back'),doneBtnText:T('Start ruling'),progressText:lang==='es'?'{{current}} de {{total}}':'{{current}} of {{total}}',steps}).drive(); }catch(e){}
  try{ localStorage.setItem('smallcrown-toured','1'); }catch(e){}
}
function maybeTour(){ let seen=false; try{ seen=!!localStorage.getItem('smallcrown-toured'); }catch(e){} if(seen) return; let tries=0; const go=()=>{ if(window.driver&&window.driver.js) startTour(); else if(++tries<20) setTimeout(go,500); }; setTimeout(go,700); }
document.addEventListener('click',e=>{ if(e.target&&e.target.id==='tourBtn') startTour(); });
// full screen where the browser allows it
const fsEl=document.documentElement;
if(document.fullscreenEnabled&&fsEl.requestFullscreen){ $('fs').hidden=false;
  $('fs').addEventListener('click',()=>{ (document.fullscreenElement?document.exitFullscreen():fsEl.requestFullscreen()).catch(()=>{}); }); }
addEventListener('load',()=>{ if(S&&S.kind==='coast') rebuildFleet(); });
addEventListener('load',initJoy); setTimeout(initJoy,1500);
const ptrs=new Map(); let paint=null, pinch=null;
const LINE_TOOLS=new Set(['wall','trap','road']);
function setZoom(z){ if(!viewNear) toggleView(); zoomHH=Math.max(ZMIN,Math.min(farHH,z)); savePrefs(); }
function paintTo(t){
  let [x,y]=paint.last; const [tx,ty]=t;
  while(x!==tx||y!==ty){ if(x!==tx) x+=Math.sign(tx-x); else y+=Math.sign(ty-y); if(G(x,y).land&&!G(x,y).b) queueOrder(x,y,true); }
  paint.last=t;
}
glc.addEventListener('pointermove',ev=>{ if(ev.pointerType==='mouse') hover=tileAt(ev); });
glc.addEventListener('pointerleave',()=>hover=null);
glc.addEventListener('click',ev=>{ if(dragged){ dragged=false; return; }
  if(S&&S.phase==='day'&&!S.modal&&(S.tool==='ride'||!DEF[S.tool])){ const f=folkAt(ev); if(f){ selectFolk(f); return; } }
  const t=tileAt(ev); if(t&&NET.pingMode){ netSend({t:'ping',x:t[0],y:t[1]}); addPing(t[0],t[1],'me'); NET.pingMode=false; renderCoopBar(); return; } if(t) place(t[0],t[1]); });
glc.addEventListener('contextmenu',ev=>{
  ev.preventDefault(); if(!S||S.over||S.modal) return;
  const t=tileAt(ev); if(!t) return;
  const h=S.hero, qi=h.queue.findIndex(q=>q.x===t[0]&&q.y===t[1]);
  if(qi>=0){ h.queue.splice(qi,1); say('Order cancelled.'); ui(); return; }
  if(G(...t).land) rideTo(t[0],t[1]);
});
glc.addEventListener('pointerdown',ev=>{
  ptrs.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:viewNear?zoomHH:farHH}; paint=null; drag=null; dragged=true; return; }
  if(ev.button!==0) return;
  dragged=false; camVel=null;
  const t=tileAt(ev);
  if(t&&LINE_TOOLS.has(S.tool)&&S.phase==='day'&&!S.over&&!S.modal&&G(...t).land&&!G(...t).b){
    paint={last:t,id:ev.pointerId}; place(t[0],t[1]); dragged=true; return;
  }
  drag={x:ev.clientX,y:ev.clientY,cx:camTarget.x,cz:camTarget.z,id:ev.pointerId,lx:ev.clientX,ly:ev.clientY,lt:performance.now(),vx:0,vy:0};
});
glc.addEventListener('pointermove',ev=>{
  if(ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  if(pinch&&ptrs.size===2){ const [a,b]=[...ptrs.values()], d=Math.hypot(a.x-b.x,a.y-b.y); if(d>10) setZoom(pinch.z*pinch.d/d); return; }
  if(paint&&ev.pointerId===paint.id){ const t=tileAt(ev); if(t&&(t[0]!==paint.last[0]||t[1]!==paint.last[1])) paintTo(t); return; }
  if(!drag||ev.pointerId!==drag.id) return;
  const dx=ev.clientX-drag.x, dy=ev.clientY-drag.y;
  if(!dragged&&Math.hypot(dx,dy)>8){ dragged=true; if(!viewNear) toggleView(); }
  if(dragged&&camera===chaseCam){ chYaw+=(ev.clientX-drag.lx)*.008; chHold=1.6; drag.lx=ev.clientX; hover=null; return; }
  if(dragged){
    const wpp=(2*curHH*aspect)/BW; camFree={x:drag.cx-dx*wpp,y:drag.cz-dy*wpp/SIN58}; hover=null;
    const now=performance.now(), dt=Math.max(1,now-drag.lt)/1000;
    drag.vx=drag.vx*.6+(-(ev.clientX-drag.lx)*wpp/dt)*.4; drag.vy=drag.vy*.6+(-(ev.clientY-drag.ly)*wpp/SIN58/dt)*.4;
    drag.lx=ev.clientX; drag.ly=ev.clientY; drag.lt=now;
  }
});
function endPointer(ev){
  ptrs.delete(ev.pointerId);
  if(ptrs.size<2) pinch=null;
  if(paint&&ev.pointerId===paint.id) paint=null;
  if(drag&&ev.pointerId===drag.id){ if(dragged&&!reduce&&performance.now()-drag.lt<90) camVel={x:drag.vx,y:drag.vy}; drag=null; }
}
addEventListener('pointerup',endPointer);
glc.addEventListener('pointercancel',ev=>{ endPointer(ev); dragged=false; });
glc.addEventListener('wheel',ev=>{ ev.preventDefault(); setZoom((viewNear?zoomHH:farHH)*Math.exp(ev.deltaY*.0015)); },{passive:false});
mc.addEventListener('pointerdown',ev=>{
  ev.stopPropagation(); const r=mc.getBoundingClientRect(), pad=r.width*.07, cs=(r.width-2*pad)/N;
  const tx=(ev.clientX-r.left-pad)/cs-.5, ty=(ev.clientY-r.top-pad)/cs-.5;
  if(!viewNear) toggleView(); camFree={x:tx-C,y:ty-C}; camVel=null;
});
$('view').addEventListener('click',toggleView);
$('style').addEventListener('click',()=>setArtStyle(artStyle==='mirage'?'classic':'mirage'));
$('cam').addEventListener('click',toggleHeroCam);
function setMenu(open){ $('setmenu').hidden=!open; $('setBtn').setAttribute('aria-expanded',open); $('setBtn').setAttribute('aria-pressed',open); if(open){ $('installRow').hidden=$('install').hidden; } }
$('setBtn').addEventListener('click',e=>{ e.stopPropagation(); setMenu($('setmenu').hidden); });
$('setmenu').addEventListener('click',e=>e.stopPropagation());
document.addEventListener('click',()=>{ if(!$('setmenu').hidden) setMenu(false); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('setmenu').hidden){ setMenu(false); $('setBtn').focus(); } });
initTabs();
$('shareBtn').addEventListener('click',()=>{ setMenu(false); shareKingdom(); });
$('coopBtn').addEventListener('click',()=>{ setMenu(false); coopDialog(); });
$('cCoop').addEventListener('click',()=>renderCoopBar());
$('codeBtn').addEventListener('click',()=>{ setMenu(false); loadCodeDialog(); });
$('realmBtn').addEventListener('click',toggleRealm);
$('worldBtn').addEventListener('click',()=>{ if($('world').hidden) openWorld(); else closeWorld(); });
initWorldUI();
$('chronD').addEventListener('toggle',()=>{ if($('chronD').open) renderChron(); });
$('lang').addEventListener('click',()=>{ lang=lang==='es'?'en':'es'; applyLang(); savePrefs(); });
// installable app (only where the page ships with a service worker, i.e. the Netlify build)
let installEvt=null;
if(document.querySelector('meta[name="pwa"]')&&'serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; $('install').hidden=false; });
$('install').addEventListener('click',async()=>{ if(!installEvt) return; installEvt.prompt(); try{ await installEvt.userChoice; }catch(e){} installEvt=null; $('install').hidden=true; });
$('aCharge').addEventListener('click',useCharge);
$('aRally').addEventListener('click',useRally);
const HELD=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
addEventListener('keydown',ev=>{
  if(!S||S.modal) return;
  if(ev.target.closest&&ev.target.closest('input,textarea,select')) return;
  const k=ev.key.toLowerCase();
  if(HELD.has(k)){ KD[k]=true; if(k.startsWith('arrow')) ev.preventDefault(); return; }
  const kk=ev.key.toUpperCase();
  if(S.phase==='night'&&'1234'.includes(kk)&&S.units.length){ setOrder(Object.keys(ORDERS)['1234'.indexOf(kk)]); return; }
  const tk=TOOLS.find(t=>KEYS[t]===kk); if(tk){ setTool(tk); return; }
  if(ev.key===' '&&!(ev.target instanceof HTMLButtonElement)){ ev.preventDefault(); startNight(); }
  else if(k==='p') togglePause();
  else if(k==='f') toggleSpeed();
  else if(k==='u') upgradeSel();
  else if(k==='escape'){ sel=null; closeRealm(); closeWorld(); renderInsp(); }
  else if(k==='v') toggleView();
  else if(k===']') setArtStyle(artStyle==='mirage'?'classic':'mirage');
  else if(k==='[') toggleHeroCam();
  else if(k==='m') toggleRealm();
  else if(k==='q') useCharge();
  else if(k==='e') useRally();
  else if(k==='h'){ if(!viewNear) toggleView(); camFree=null; camVel=null; }
  else if(k==='+'||k==='=') setZoom((viewNear?zoomHH:farHH)/1.2);
  else if(k==='-'||k==='_') setZoom((viewNear?zoomHH:farHH)*1.2);
});
addEventListener('keyup',ev=>{ delete KD[ev.key.toLowerCase()]; });
addEventListener('blur',()=>{ for(const k in KD) delete KD[k]; });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&S&&S.phase==='night'&&!paused) togglePause(); });

let last=performance.now(), uiT=0, clock=0, ftAvg=1/60, slowT=0;
