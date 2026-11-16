// ================= TROOPS: orders at night and counter-units =================
const ORDERS={guard:{name:'Guard',key:'1',desc:'Hold the ground around their post and fight what comes near.'},hold:{name:'Hold',key:'2',desc:'Stand fast at their post and only strike what reaches them.'},charge:{name:'Charge',key:'3',desc:'Hunt down raiders anywhere in the valley, moving faster.'},fallback:{name:'Fall back',key:'4',desc:'Pull back around the keep and take a third less damage.'}};
const KINDS={soldier:{name:'Soldier',beat:'archers, shamans and sappers'},spear:{name:'Spearman',beat:'runners, wolves and knights'},archer:{name:'Archer',beat:'brutes and warlords'}};
const MATCH={spear:{runner:2,wolf:2,knight:2,captain:1.5,brute:.75},soldier:{archer:1.5,shaman:1.5,sapper:1.5},archer:{brute:1.5,warlord:1.25,ram:.5}};
const unitKind=u=>u.kind||(u.ranged?'archer':'soldier');
function matchDmg(u,e,base){ const m=(MATCH[unitKind(u)]||{})[e.type]||1; return Math.max(1,Math.round(base*m)); }
function setOrder(o){ if(!ORDERS[o]) return; S.order=o; for(const u of S.units){ u.target=null; u.pathKey=null; } renderOrders(); sfx('tap'); if(S.phase==='night') floatText(C,C,T(ORDERS[o].name),'#F2EADD'); }
let ordKey='';
function renderOrders(){ const box=$('orders'); if(!box) return; const show=!!S&&!S.over&&S.units.length>0; box.hidden=!show; if(!show) return;
  const key=(S.order||'guard')+lang; if(key===ordKey) return; ordKey=key;
  box.innerHTML=`<span class="ol">${T('Troops')}</span>`+Object.entries(ORDERS).map(([id,o])=>`<button type="button" data-ord="${id}" aria-pressed="${(S.order||'guard')===id}" title="${T(o.desc)} (${o.key})"><span class="k">${o.key}</span>${T(o.name)}</button>`).join('');
  box.querySelectorAll('[data-ord]').forEach(b=>b.addEventListener('click',()=>setOrder(b.dataset.ord))); }
function templeHeal(dt){ if(S.phase!=='night') return; const ts=[]; each((b,x,y)=>{ if(b.type==='temple') ts.push([x,y]); }); if(!ts.length) return;
  const near=o=>ts.some(([x,y])=>Math.hypot(o.x-x,o.y-y)<2); for(const u of S.units) if(u.hp>0&&u.hp<u.max&&near(u)) u.hp=Math.min(u.max,u.hp+dt*.6);
  const h=S.hero; if(h&&!h.dead&&h.hp<h.max&&near(h)) h.hp=Math.min(h.max,h.hp+dt*.6); }
