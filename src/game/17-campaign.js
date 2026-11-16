// ================= THE CAMPAIGN: armies, fog of war, supply and sieges on the map of Ashkara =================
// Every crown follows the same rules: armies cost gold and food, march province by province at dawn,
// starve outside their supply, fight in the field and besiege walls. Orders are given by day and play out at dawn.
const armies=()=>S.armies||(S.armies=[]);
const fieldMen=o=>armies().filter(a=>a.o===o).reduce((s,a)=>s+a.men,0);
const atWar=(a,b)=>!a||!b||a===b?false:a==='me'?!!(K(b)&&K(b).war):b==='me'?!!(K(a)&&K(a).war):kwar(a,b);
const friendly=(a,b)=>a===b||(a==='me'&&K(b)&&(K(b).ally||K(b).wed))||(b==='me'&&K(a)&&(K(a).ally||K(a).wed));
function armyQual(o){ if(o==='me') return 1+unitDmg()*.12+((S.hl||1)-1)*.03+(hasTier('warlord',3)?.25:0)+((S.plate||0)*.05); const st=KINGS[o].style; return st==='warlike'?1.2:st==='pious'?1.05:1; }
const armyPow=a=>a.men*armyQual(a.o)*(.55+.45*a.mor/100);
const moveCost=p=>{ const t=PROV[p].terr; return t==='mountains'?2:t==='hills'||t==='forest'?1.5:1; };
const provDef=p=>{ const t=PROV[p].terr; return t==='mountains'?1.35:t==='hills'?1.2:t==='forest'?1.1:1; };
const provFort=p=>(PROV[p].cap?2.2:1)*provDef(p);
const canEnter=(o,p)=>{ const ow=S.prov[p].owner; return !ow||ow===o||friendly(o,ow)||atWar(o,ow); };
function provPath(o,from,to){ if(from===to) return []; const dist={[from]:0}, prev={}, done=new Set();
  for(;;){ let u=null,m=1e9; for(const k in dist) if(!done.has(k)&&dist[k]<m){ m=dist[k]; u=k; } if(!u||u===to) break; done.add(u);
    for(const v of PROV[u].adj){ if(v!==to&&!canEnter(o,v)) continue; const d=m+moveCost(v); if(dist[v]==null||d<dist[v]){ dist[v]=d; prev[v]=u; } } }
  if(dist[to]==null) return null; const path=[]; for(let c=to;c!==from;c=prev[c]) path.unshift(c); return path; }
const supplied=a=>S.prov[a.p].owner===a.o||PROV[a.p].adj.some(x=>S.prov[x].owner===a.o||friendly(a.o,S.prov[x].owner));
const levyCap=()=>10+5*landsOf('me').length+S.units.length*2;
function nextArmyId(){ return armies().reduce((m,a)=>Math.max(m,a.id),0)+1; }
// ---------- fog of war ----------
function visibleProvs(){ const v=new Set(); if(!S.prov) return v; for(const p of landsOf('me')){ v.add(p); for(const a of PROV[p].adj) v.add(a); }
  for(const a of armies()) if(a.o==='me'){ v.add(a.p); for(const x of PROV[a.p].adj) v.add(x); }
  for(const p in S.scout||{}) if(S.scout[p]>=S.day) v.add(p);
  for(const k of liveKings()) if(K(k).ally||K(k).wed) for(const p of landsOf(k)) v.add(p);
  return v; }
function seenOwner(p,vis){ if((vis||visibleProvs()).has(p)) return S.prov[p].owner; const k=(S.known||{})[p]; return k?k.o:undefined; }
function scout(p){ if(S.phase!=='day') return; const c=cm('spymaster')?3:6; if(S.res.gold<c){ say(T('Scouts need {{c}} gold.',{c})); sfx('no'); return; } S.res.gold-=c; S.scout=S.scout||{};
  const until=S.day+(cm('spymaster')?4:3); S.scout[p]=until; for(const a of PROV[p].adj) S.scout[a]=Math.max(S.scout[a]||0,until-1); rememberSeen(); sfx('tap'); say(T('Scouts ride out toward {{p}}.',{p:T(PROV[p].name)})); afterDiplo(); }
function rememberSeen(){ S.known=S.known||{}; for(const p of visibleProvs()) S.known[p]={o:S.prov[p].owner,g:S.prov[p].gar,d:S.day}; }
// ---------- your armies ----------
function armyUpkeep(L){ const m=fieldMen('me'); if(!m) return; const c=Math.ceil(m/5); L.gold.push(['Armies in the field',-c]); L.food.push(['Armies in the field',-c]); }
function raiseArmy(p,men){ if(S.phase!=='day'||S.prov[p].owner!=='me') return; const mine=armies().filter(a=>a.o==='me');
  if(mine.length>=3){ say(T('You can field three armies at most.')); sfx('no'); return; }
  if(fieldMen('me')+men>levyCap()){ say(T('Your realm can field {{n}} men in all. Hold more land or train more soldiers to raise more.',{n:levyCap()})); sfx('no'); return; }
  const c={gold:men*2,food:men}; if(!canPay(c)){ say(T('Raising {{m}} men costs {{c}}.',{m:men,c:costStr(c)})); sfx('no'); return; }
  spend(c); const a={id:nextArmyId(),o:'me',p,men,mor:80,dest:null,prog:0,siege:0,from:null}; armies().push(a); sfx('horn'); toast(T('Army raised'),T('{{m}} men at {{p}}',{m:men,p:T(PROV[p].name)}),'⚑');
  wMode='army'; wArmy=a.id; afterDiplo(); }
function orderArmy(a,dest){ if(!a||a.o!=='me') return false; if(a.siege&&dest!==a.p) a.siege=0; const path=provPath('me',a.p,dest); if(!path){ say(T('No road for your army to {{p}}. It cannot cross lands of crowns you are at peace with.',{p:T(PROV[dest].name)})); sfx('no'); return false; }
  a.dest=dest===a.p?null:dest; a.prog=0; sfx('tap'); say(a.dest?T('The army will march for {{p}}: about {{d}} dawns.',{p:T(PROV[dest].name),d:Math.ceil(path.reduce((s,q)=>s+moveCost(q),0)/armySpeed(a))}):T('The army holds its ground.')); return true; }
function armySpeed(a){ return 1+(a.o==='me'&&hasTier('warlord',1)?.5:0)+(a.o!=='me'&&KINGS[a.o].style==='warlike'?.25:0); }
function disband(a){ if(!a||a.o!=='me') return; const home=S.prov[a.p].owner==='me'; S.armies=armies().filter(x=>x!==a); if(home) S.pop+=Math.floor(a.men/6); say(T('The army disbands.')+(home?' '+T('Some of the men settle in your realm.'):'')); wMode='legend'; afterDiplo(); }
function playerAssault(a){ if(!a||!a.siege||S.phase!=='day') return; if(a.assaulted===S.day) return; a.assaulted=S.day; const r=assault(a,null);
  showOver(r.win?T('The walls of {{p}} fall',{p:T(PROV[r.p].name)}):T('The assault on {{p}} fails',{p:T(PROV[r.p].name)}),r.win?(r.cap?T('{{p}} is yours. The crown of {{k}} is broken.',{p:T(PROV[r.p].name),k:kn(r.prev)}):T('Your army stormed the walls and took {{p}}.',{p:T(PROV[r.p].name)})):T('The garrison threw your army back. It pulls away from the walls to recover.'),[{label:T('Onward'),primary:true,fn:()=>{ hideOver(); afterDiplo(); }}]); }
// ---------- battles, sieges and captures (shared by every crown) ----------
const crownName=o=>o==='me'?T('your army'):kn(o);
function logBattle(t){ S.blog=S.blog||[]; S.blog.unshift({d:S.day,t}); if(S.blog.length>12) S.blog.length=12; news(t); }
function retreat(a){ const home=WORLD.caps[a.o]; const opts=PROV[a.p].adj.filter(x=>S.prov[x].owner===a.o||friendly(a.o,S.prov[x].owner)); a.siege=0; a.dest=null; a.prog=0;
  if(a.from&&opts.includes(a.from)) a.p=a.from; else if(opts.length) a.p=opts.sort((x,y)=>(provPath(a.o,x,home)||[]).length-(provPath(a.o,y,home)||[]).length)[0]; }
function fieldBattle(att,def,p,notes){ let pa=armyPow(att)*(.85+Math.random()*.3), pd=armyPow(def)*provDef(p)*(S.prov[p].owner===def.o?1.15:1)*(.85+Math.random()*.3);
  const [w,l]=pa>=pd?[att,def]:[def,att], r=Math.min(pa,pd)/Math.max(pa,pd);
  w.men=Math.max(1,Math.round(w.men*(1-.35*r))); w.mor=Math.min(100,w.mor+10); l.men=Math.round(l.men*(.4-.2*r)); l.mor=Math.max(5,l.mor-35);
  const t=`${crownName(w.o)} beat ${crownName(l.o)} at ${PROV[p].name}`; logBattle(t);
  if(w.o==='me'||l.o==='me'){ const won=w.o==='me'; notes.push(`<b>${T(won?'Victory at {{p}}':'Defeat at {{p}}',{p:T(PROV[p].name)})}:</b> ${T('your {{a}} men against {{b}}',{a:(won?w:l).men,b:(won?l:w).men})}`); toast(T(won?'Battle won':'Battle lost'),T(PROV[p].name),won?'⚔':'✖'); addRenown(won?6:-3); }
  if(l.men<4) S.armies=armies().filter(x=>x!==l); else retreat(l); return w; }
function siegeDef(p){ const o=S.prov[p].owner; return S.prov[p].gar*provFort(p)+(PROV[p].cap&&o&&o!=='me'?K(o).army*.6:0)+(o==='me'?armyPower()*.15:0); }
function capture(a,p,notes){ const prev=S.prov[p].owner; S.prov[p].owner=a.o; S.prov[p].gar=Math.max(4,Math.round(a.men*.2)); a.men=Math.max(1,a.men-Math.round(S.prov[p].gar*.5)); a.siege=0; if(a.dest===p) a.dest=null; a.prog=0; worldVer++;
  if(a.o==='me'){ addRenown(prev?10:5); if(prev&&hasTier('warlord',2)){ S.res.gold+=30; } }
  if(prev==='me'){ addRenown(-5); notes&&notes.push(`<b>${kn(a.o)} took ${T(PROV[p].name)}</b> from you`); }
  logBattle(`${a.o==='me'?'You':KINGS[a.o].short} took ${PROV[p].name}${prev?` from ${prev==='me'?'you':KINGS[prev].short}`:''}`);
  if(prev&&prev!=='me'&&PROV[p].cap) fallOfCrown(prev,a.o); return prev; }
function assault(a,notes){ const p=a.p, prev=S.prov[p].owner, def=siegeDef(p), pow=armyPow(a)*(1+Math.min(.4,a.siege*.07)), pct=1/(1+Math.pow(def/Math.max(1,pow),2.2));
  if(Math.random()<pct){ capture(a,p,notes); a.men=Math.max(1,Math.round(a.men-def*.3/armyQual(a.o))); if(a.o==='me'){ party('win'); sfx('up'); } return {win:true,p,prev,cap:!!PROV[p].cap}; }
  a.men=Math.round(a.men*.6); a.mor=Math.max(5,a.mor-25); logBattle(`${prev==='me'?'Your':KINGS[prev]?KINGS[prev].short+'’s':'The'} garrison at ${PROV[p].name} threw back ${crownName(a.o)}`); retreat(a); if(a.o==='me') sfx('hurt'); return {win:false,p,prev}; }
const assaultOdds=a=>{ const def=siegeDef(a.p), pow=armyPow(a)*(1+Math.min(.4,a.siege*.07)); return Math.round(100/(1+Math.pow(def/Math.max(1,pow),2.2))); };
function marchArmy(a,notes){ if(a.siege||!a.dest||a.p===a.dest){ if(a.p===a.dest) a.dest=null; return; }
  const path=provPath(a.o,a.p,a.dest); if(!path||!path.length){ a.dest=null; return; } a.prog+=armySpeed(a);
  while(path.length&&a.prog>=moveCost(path[0])-1e-6&&armies().includes(a)){ const nx=path[0]; a.prog-=moveCost(nx);
    const foe=armies().find(b=>b!==a&&b.p===nx&&atWar(a.o,b.o)); if(foe){ const w=fieldBattle(a,foe,nx,notes); if(w!==a||!armies().includes(a)){ a.prog=0; return; } }
    path.shift(); a.from=a.p; a.p=nx; const ow=S.prov[nx].owner;
    if(!ow){ const d=S.prov[nx].gar*provDef(nx); if(armyPow(a)>d*1.1){ a.men=Math.max(1,Math.round(a.men-d*.3)); capture(a,nx,notes); if(a.o==='me') notes.push(`<b>${T('Your army claimed {{p}}',{p:T(PROV[nx].name)})}</b>`); } else { a.men=Math.round(a.men*.8); a.p=a.from; a.dest=null; if(a.o==='me') notes.push(T('Bandits at {{p}} threw back your army',{p:T(PROV[nx].name)})); } a.prog=0; return; }
    if(ow!==a.o&&atWar(a.o,ow)){ a.siege=1; a.prog=0; if(a.o==='me') notes.push(`<b>${T('Your army lays siege to {{p}}',{p:T(PROV[nx].name)})}</b>`); else if(ow==='me') notes.push(`<b>${T('{{k}} lays siege to {{p}}',{k:kn(a.o),p:T(PROV[nx].name)})}</b>`); return; } }
  if(a.p===a.dest) a.dest=null; }
function siegeStep(a,notes){ const p=a.p, ow=S.prov[p].owner; if(!ow||ow===a.o||!atWar(a.o,ow)){ a.siege=0; return; } a.siege++;
  S.prov[p].gar=Math.max(1,Math.round(S.prov[p].gar*(PROV[p].cap?.94:.88)));
  if(ow==='me'&&PROV[p].cap){ const n=Math.min(14,Math.max(2,Math.round(a.men/4))); S.siegeRaid={o:a.o,id:a.id,n}; for(let i=0;i<n;i++) S.queue.splice(Math.floor(S.queue.length*Math.random()),0,'knight:'+a.o);
    notes.push(`<b>${T('The army of {{k}} will storm your walls tonight',{k:kn(a.o)})}</b> (${T('{{n}} knights',{n})})`); toast(T('Siege of The Valley'),kn(a.o),'⚔'); return; }
  if(a.o!=='me'&&(armyPow(a)>siegeDef(p)*1.25||a.siege>=5)) assault(a,notes); }
// ---------- the other crowns plan their campaigns ----------
function aiTarget(a){ const o=a.o, foes=['me',...liveKings()].filter(x=>x!==o&&atWar(o,x)); let best=null,bv=-1e9;
  for(const p of landsOf(o)){ const besieger=armies().find(b=>b.p===p&&atWar(o,b.o)); if(besieger){ const d=(provPath(o,a.p,p)||[]).length; const v=150-d*8; if(v>bv){ bv=v; best=p; } } }
  for(const p of WORLD.ids){ const ow=S.prov[p].owner; if(ow===o) continue; const path=provPath(o,a.p,p); if(!path||path.length>6) continue; const d=path.length;
    if(ow&&foes.includes(ow)){ const def=siegeDef(p), pw=armyPow(a); const v=(PROV[p].cap?(pw>def*1.2?60:-40):30)-def*.6+pw*.2-d*6; if(v>bv){ bv=v; best=p; } }
    else if(!ow&&S.prov[p].gar*provDef(p)*1.25<armyPow(a)&&(!foes.length||d<=2)){ const v=25-S.prov[p].gar-d*7; if(v>bv){ bv=v; best=p; } } }
  return best; }
function aiCampaign(notes){ for(const k of liveKings()){ const kk=K(k), mine=armies().filter(a=>a.o===k), foes=['me',...liveKings()].filter(x=>x!==k&&atWar(k,x));
    kk.gold-=Math.ceil(fieldMen(k)/5); if(kk.gold<0){ kk.gold=0; for(const a of mine) a.men=Math.max(1,a.men-2); }
    const cap=WORLD.caps[k], freeNear=frontier(k).some(p=>!S.prov[p].owner);
    if(mine.length<(foes.length?2:1)&&kk.army>=16&&(foes.length||freeNear)&&!armies().some(a=>a.p===cap&&atWar(k,a.o))){ const men=Math.round(kk.army*(foes.length?.55:.3)); kk.army-=men;
      const a={id:nextArmyId(),o:k,p:cap,men,mor:80,dest:null,prog:0,siege:0,from:null}; armies().push(a); if(visibleProvs().has(cap)) notes.push(T('{{k}} has raised an army of {{m}}',{k:kn(k),m:men})); }
    for(const a of armies().filter(a=>a.o===k)){ if(a.siege) continue; if(a.dest&&S.prov[a.dest].owner!==k&&(!S.prov[a.dest].owner||atWar(k,S.prov[a.dest].owner))) continue;
      const t=aiTarget(a); if(t) a.dest=t; else if(a.p===cap){ kk.army+=a.men; S.armies=armies().filter(x=>x!==a); } else a.dest=cap; } } }
// ---------- dawn ----------
function campaignDawn(notes){
  if(!WORLD) return; crowns();
  if(S.siegeRaid){ const a=armies().find(x=>x.id===S.siegeRaid.id); if(a&&!S.over){ a.men=Math.round(a.men*.4); a.mor=15; retreat(a); notes.push(`<b>${T('Your walls held.')}</b> ${T('The army of {{k}} breaks and flees.',{k:kn(a.o)})}`); addRenown(8); logBattle(`The Valley threw back the army of ${KINGS[a.o].short}`); } S.siegeRaid=null; }
  aiCampaign(notes);
  for(const a of [...armies()]) if(armies().includes(a)) marchArmy(a,notes);
  for(const a of [...armies()]) if(armies().includes(a)&&a.siege) siegeStep(a,notes);
  for(const a of armies()){ if(supplied(a)) a.mor=Math.min(100,a.mor+6); else { a.men=Math.round(a.men*(a.o==='me'&&hasTier('warlord',3)?.96:.92)); a.mor=Math.max(5,a.mor-8); if(a.o==='me') notes.push(T('Your army at {{p}} is out of supply and losing men',{p:T(PROV[a.p].name)})); } }
  for(const a of [...armies()]) if(a.men<3){ S.armies=armies().filter(x=>x!==a); if(a.o==='me') notes.push(T('Your army at {{p}} has melted away',{p:T(PROV[a.p].name)})); }
  rememberSeen(); worldVer++; }
// ---------- map drawing ----------
let wArmy=null, wPick=null, wHits=[], fogC=null, fogKey='';
function drawFog(x,parch){ const vis=visibleProvs(), W=WORLD, key=[...vis].sort().join()+parch+S.worldSeed; if(key!==fogKey){ fogKey=key;
    fogC=fogC||document.createElement('canvas'); fogC.width=WMW; fogC.height=WMH; const f=fogC.getContext('2d'); f.clearRect(0,0,WMW,WMH); const cw=WMW/W.GW, ch=WMH/W.GH;
    f.fillStyle=parch?'rgb(58,44,30)':'rgb(8,12,20)'; for(let j=0;j<W.GH;j++)for(let i=0;i<W.GW;i++){ const k=W.pg[j*W.GW+i]; if(k<0) continue; if(!vis.has('p'+k)) f.fillRect(i*cw,j*ch,cw+.6,ch+.6); }
    if(parch){ f.globalCompositeOperation='source-atop'; f.strokeStyle='rgba(240,228,198,.18)'; f.lineWidth=1; for(let d=-WMH;d<WMW;d+=7){ f.beginPath(); f.moveTo(d,0); f.lineTo(d+WMH,WMH); f.stroke(); } f.globalCompositeOperation='source-over'; } }
  x.globalAlpha=parch?.5:.55;
  x.drawImage(fogC,0,0); x.globalAlpha=1; }
function drawArmies(x,P2,dp){ wHits=[]; const vis=visibleProvs(), by={};
  for(const a of armies()){ if(a.o!=='me'&&!vis.has(a.p)) continue; (by[a.p]=by[a.p]||[]).push(a); }
  const sel=armies().find(a=>a.id===wArmy);
  if(sel&&sel.dest){ const path=provPath(sel.o,sel.p,sel.dest)||[]; let [px,py]=P2(PROV[sel.p].x,PROV[sel.p].y); x.save(); x.strokeStyle='rgba(240,190,78,.9)'; x.lineWidth=2.5*dp; x.setLineDash([6*dp,5*dp]); x.beginPath(); x.moveTo(px,py); for(const q of path){ const [qx,qy]=P2(PROV[q].x,PROV[q].y); x.lineTo(qx,qy); } x.stroke(); x.setLineDash([]);
    const [dx,dy]=P2(PROV[sel.dest].x,PROV[sel.dest].y); x.fillStyle='rgba(240,190,78,.9)'; x.beginPath(); x.arc(dx,dy,5*dp,0,6.29); x.fill(); x.restore(); }
  for(const p in by){ const [cx,cy]=P2(PROV[p].x,PROV[p].y); by[p].forEach((a,i)=>{ const bx=cx+(i-(by[p].length-1)/2)*30*dp, by2=cy-20*dp, w=26*dp, h=22*dp, col=a.o==='me'?'#F0BE4E':KINGS[a.o].color;
    x.save(); x.translate(bx,by2); x.fillStyle='rgba(20,14,12,.85)'; x.beginPath(); x.moveTo(-w/2,-h/2); x.lineTo(w/2,-h/2); x.lineTo(w/2,h*.15); x.lineTo(0,h/2+4*dp); x.lineTo(-w/2,h*.15); x.closePath(); x.fill();
    x.strokeStyle=a.id===wArmy?'#FFF4E0':col; x.lineWidth=(a.id===wArmy?3:2)*dp; x.stroke(); x.fillStyle=col; x.font=`700 ${11*dp}px Inter,system-ui,sans-serif`; x.textAlign='center'; x.textBaseline='middle'; x.fillText(String(a.men),0,-1*dp);
    if(a.siege){ x.strokeStyle='#FF8A7A'; x.lineWidth=2*dp; x.beginPath(); x.moveTo(-9*dp,h/2+8*dp); x.lineTo(9*dp,h/2+18*dp); x.moveTo(9*dp,h/2+8*dp); x.lineTo(-9*dp,h/2+18*dp); x.stroke(); }
    x.restore(); wHits.push({id:a.id,x:bx,y:by2,r:16*dp}); }); } }
function armyHit(cx,cy){ for(const h of wHits) if(Math.hypot(h.x-cx,h.y-cy)<h.r) return h.id; return null; }
// ---------- panels ----------
function armyRowHtml(a){ const sup=supplied(a); return `<button type="button" class="lg" data-army="${a.id}"><span class="sw" style="background:#F0BE4E"></span> ${T('{{m}} men at {{p}}',{m:a.men,p:T(PROV[a.p].name)})} <span class="pd">${a.siege?T('besieging'):a.dest?T('marching to {{p}}',{p:T(PROV[a.dest].name)}):T('holding')}${sup?'':' · '+T('out of supply')}</span></button>`; }
function campaignLegendHtml(btn,night){ const mine=armies().filter(a=>a.o==='me');
  return `<h4>${T('Your armies')}</h4>${mine.length?mine.map(armyRowHtml).join(''):`<div class="pd">${T('No armies in the field. Tap one of your lands to raise one.')}</div>`}<div class="pd">${T('Men in the field {{m}} of {{c}} · upkeep 1 gold and 1 food per 5 men each dawn. Orders play out at dawn.',{m:fieldMen('me'),c:levyCap()})}</div>`
    +((S.blog||[]).length?`<h4>${T('War reports')}</h4>`+(S.blog||[]).slice(0,5).map(b=>`<div class="pd">${T('Day {{n}}',{n:b.d})}: ${b.t}</div>`).join(''):''); }
function campaignProvHtml(p,btn,night){ const vis=visibleProvs(), here=armies().filter(a=>a.p===p&&(a.o==='me'||vis.has(p))); let h='';
  if(!vis.has(p)){ const k=(S.known||{})[p]; h+=`<div class="pd"><b>${T('Unknown land.')}</b> ${k?T('Last seen on day {{d}}: {{o}}, garrison {{g}}.',{d:k.d,o:k.o?k.o==='me'?T('yours'):kn(k.o):T('unclaimed'),g:k.g}):T('Your scouts have never been here.')}</div><div class="pa">${btn('','data-k="scout"',T('Send scouts'),night,(cm('spymaster')?3:6)+'g')}</div>`; return h; }
  if(here.length) h+=`<h4>${T('Armies here')}</h4>`+here.map(a=>a.o==='me'?armyRowHtml(a):`<div class="pd"><span class="sw" style="background:${KINGS[a.o].color}"></span> ${T('{{k}}: {{m}} men',{k:kn(a.o),m:a.men})}${a.siege?' · '+T('besieging'):''}${atWar('me',a.o)?' · '+T('at war with you'):''}</div>`).join('');
  if(S.prov[p].owner==='me'){ h+=`<h4>${T('Raise an army here')}</h4><div class="pa">${[10,20,30].map(m=>btn('','data-raise="'+m+'"',T('{{m}} men',{m}),night,`${m*2}g ${m}f`)).join('')}</div>`; }
  const mine=armies().filter(a=>a.o==='me'&&a.p!==p); if(mine.length&&canEnter('me',p)) h+=`<div class="pa">${btn('hot','data-k="sendhere"',T('Send an army here'),night)}</div>`;
  else if(mine.length&&!canEnter('me',p)) h+=`<div class="pd">${T('Your armies may only enter free land, your own and your allies’ lands, and the lands of crowns you are at war with.')}</div>`;
  return h; }
function campaignArmyHtml(btn,night){ const a=armies().find(x=>x.id===wArmy&&x.o==='me'); if(!a){ wMode='legend'; return ''; }
  const sup=supplied(a), path=a.dest?provPath('me',a.p,a.dest)||[]:[], eta=a.dest?Math.ceil(path.reduce((s,q)=>s+moveCost(q),0)/armySpeed(a)):0;
  return `<h3>${T('Your army')}</h3><div class="pd">${T('{{m}} men at {{p}} · morale {{o}} · strength {{s}}',{m:a.men,p:T(PROV[a.p].name),o:a.mor,s:Math.round(armyPow(a))})}</div>
    <div class="pd">${sup?T('In supply.'):`<b style="color:var(--foe)">${T('Out of supply: it loses men and morale each dawn. Keep it beside your own lands.')}</b>`}</div>
    <div class="pd">${a.siege?T('Besieging {{p}} for {{d}} dawns. Garrison {{g}}.',{p:T(PROV[a.p].name),d:a.siege,g:S.prov[a.p].gar}):a.dest?T('Marching to {{p}}, about {{d}} dawns.',{p:T(PROV[a.dest].name),d:eta}):T('Holding its ground.')}</div>
    <div class="pa">${btn(wPick?'hot':'','data-a="pick"',wPick?T('Tap a land on the map…'):T('Choose a destination'),night)}${a.dest?btn('','data-a="hold"',T('Hold here'),night):''}${a.siege?btn('hot','data-a="assault"',`${T('Storm the walls')} · ${assaultOdds(a)}%`,night||a.assaulted===S.day):''}${btn('','data-a="disband"',T('Disband'),night)}</div>
    <div class="pd">${T('Starving a garrison weakens it each dawn; waiting makes the assault easier. Capitals are hard to take.')}</div>
    <button type="button" class="link" data-w="legend">← ${T('All crowns')}</button>`; }
function campaignWire(box){
  box.querySelectorAll('[data-army]').forEach(b=>b.addEventListener('click',()=>{ wMode='army'; wArmy=+b.dataset.army; wPick=null; renderWorldPanel(); drawWorld(); }));
  box.querySelectorAll('[data-raise]').forEach(b=>b.addEventListener('click',()=>{ raiseArmy(wSel,+b.dataset.raise); renderWorldPanel(); drawWorld(); }));
  box.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.k; if(k==='scout') scout(wSel); else if(k==='sendhere'){ const mine=armies().filter(a=>a.o==='me'); let best=null,bl=1e9; for(const a of mine){ const pa=provPath('me',a.p,wSel); if(pa&&pa.length<bl){ bl=pa.length; best=a; } } if(best&&orderArmy(best,wSel)){ wMode='army'; wArmy=best.id; } } renderWorldPanel(); drawWorld(); }));
  box.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',()=>{ const a=armies().find(x=>x.id===wArmy), k=b.dataset.a; if(!a) return;
    if(k==='pick') wPick=wPick?null:a.id; else if(k==='hold'){ a.dest=null; wPick=null; } else if(k==='assault') playerAssault(a); else if(k==='disband') disband(a); save(); renderWorldPanel(); drawWorld(); })); }
