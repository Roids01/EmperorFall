// Balance bot: runs inside the game's scope (evaluated through the test harness).
// simGame(strategy, diff) plays a whole game without rendering and returns a summary.
var BOT_STRATS={
  balanced:{path:'holy',tower:d=>1+Math.floor(d/2.5), wall:d=>d>=4?Math.min(10,(d-3)*2):0, cata:d=>d>=6?1+Math.floor((d-6)/5):0, barr:d=>d>=3?1+Math.floor(d/8):0, range:d=>d>=5?1:0, foodPad:2, upg:['irrigation','tools','fletching','masonry','granary','drill','warhorse','spikes','counterweights','collectors','muster','horn','ships']},
  turtle:{path:'warlord',tower:d=>2+Math.floor(d/1.6), wall:d=>d>=2?Math.min(16,d*2):0, cata:d=>d>=5?1+Math.floor((d-5)/3):0, barr:d=>d>=3?1+Math.floor(d/6):0, range:d=>d>=4?1+Math.floor(d/10):0, foodPad:1, upg:['fletching','masonry','spikes','counterweights','drill','muster','irrigation','tools','warhorse','horn','granary','collectors']},
  economy:{path:'merchant',tower:d=>1+Math.floor(d/4), wall:d=>d>=7?Math.min(8,(d-6)*2):0, cata:d=>d>=9?1:0, barr:d=>d>=6?1:0, range:d=>0, foodPad:4, upg:['irrigation','tools','granary','collectors','fletching','masonry','drill','warhorse','spikes','counterweights','muster','horn']},
  random:{random:true}
};
function botFree(near){ const out=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const t=G(x,y); if(!t.land||t.b||t.ore||t.grove||t.water) continue; const r=Math.hypot(x-C,y-C); if(r<1) continue; out.push([x,y,r]); } return out; }
function botTry(tool,pick){ const d=DEF[tool]; if(!d||!canPay(d.cost)||(d.unlock&&S.day<d.unlock)) return false; let cands;
  if(d.need==='grove'){ cands=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const t=G(x,y); if(t.grove&&!t.b) cands.push([x,y,Math.hypot(x-C,y-C)]); } }
  else if(d.need==='ore'){ cands=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const t=G(x,y); if(t.ore&&!t.b) cands.push([x,y,Math.hypot(x-C,y-C)]); } }
  else cands=botFree();
  cands=cands.filter(([x,y])=>!buildError(tool,x,y,true)); if(!cands.length) return false;
  const c=pick?pick(cands):cands.sort((a,b)=>a[2]-b[2])[0]; if(!c) return false;
  doBuild(tool,c[0],c[1]); BOT_LOG.built[tool]=(BOT_LOG.built[tool]||0)+1; return true; }
function botLane(cands,r0,r1){ // tiles on the raiders' approach, at a ring around the keep
  const sp=S.spawns||[]; let best=null,bv=1e9; for(const c of cands){ if(c[2]<r0||c[2]>r1) continue; let v=0; for(const [sx,sy] of sp) v+=Math.hypot(c[0]-sx,c[1]-sy); v=v/(sp.length||1)+Math.random()*1.5; if(v<bv){ bv=v; best=c; } } return best; }
function botNear(type){ return cands=>{ let best=null,bv=-1; for(const c of cands){ let v=nearCount(S.grid,c[0],c[1],[type],1)*2-c[2]*.1; if(v>bv){ bv=v; best=c; } } return best; }; }
var BOT_LOG=null;
function botMarket(){ if(typeof marketOpen!=='function'||!marketOpen()) return; for(let i=0;i<6;i++){ const need=S.res.wood<18?'wood':S.res.stone<14?'stone':null; if(!need||S.res.gold<buyCost(need)+30) break; trade(need,true); BOT_LOG.built['buy_'+need]=(BOT_LOG.built['buy_'+need]||0)+1; } }
function botDay(st){
  let n=0; const E0=econ(); if(!st.random) botMarket();
  if(!S.path&&pathOpen()&&!st.random){ choosePath(st.path||'holy'); }
  if(S.path){ const pb={merchant:'counting',warlord:'warcamp',holy:'temple'}[S.path]; if(count(pb)<1+Math.floor(S.day/8)) botTry(pb,pb==='warcamp'?c=>botLane(c,2,3.5):null); }
  if(st.random){ const tools=Object.keys(DEF).filter(t=>!DEF[t].wonder&&t!=='keep'&&t!=='road'); for(let i=0;i<25&&n<6;i++){ const t=tools[(Math.random()*tools.length)|0]; if(botTry(t,c=>c[Math.floor(Math.random()*c.length)])) n++; } }
  else for(let pass=0;pass<14;pass++){ const E=econ(), d=S.day; let did=false;
    if(E.net.food<st.foodPad+d/5) did=botTry('farm',botNear('farm'));
    else if(S.pop>=E.cap-1) did=botTry('house');
    else if(count('lumber')<1+Math.floor(d/6)) did=botTry('lumber');
    else if(count('mine')<1+Math.floor(d/8)) did=botTry('mine');
    else if(count('tower')<st.tower(d)) did=botTry('tower',c=>botLane(c,1.5,3.2));
    else if(d>=2&&count('well')<1) did=botTry('well');
    else if(d>=3&&count('market')<1) did=botTry('market',botNear('house'));
    else if(count('barr')<st.barr(d)) did=botTry('barr',c=>botLane(c,2,3.5));
    else if(count('wall')<st.wall(d)) did=botTry('wall',c=>botLane(c,2.5,4.2));
    else if(count('cata')<st.cata(d)) did=botTry('cata',c=>botLane(c,1,2.5));
    else if(count('range')<st.range(d)) did=botTry('range',c=>botLane(c,1.5,3));
    else if(d>=5&&count('shrine')<1) did=botTry('shrine');
    else if(d>=4&&count('storehouse')<1&&E.capS<200) did=botTry('storehouse');
    if(!did){ for(const id of st.upg){ const u=UPGS.find(x=>x.id===id); if(u&&upgState(u)==='buy'){ buyUpg(id); BOT_LOG.upg.push(id+'@'+d); did=true; break; } } }
    if(!did) break; n++; }
  // towers up a level when rich
  each((b,x,y)=>{ if(b.type==='tower'&&b.lvl<3){ const c=DEF.tower.upg&&DEF.tower.upg[b.lvl-1]; if(c&&canPay(c)&&S.res.gold>25){ spend(c); b.lvl++; BOT_LOG.built.towerUp=(BOT_LOG.built.towerUp||0)+1; } } });
  return n; }
function botClear(){ try{ hideOver(); }catch(e){} S.modal=false;
  if(S.perkPending>0){ const p=(typeof PERKS!=='undefined'?PERKS:[]).filter(p=>!hasPerk(p.id)); if(p.length){ S.perks.push(p[(Math.random()*p.length)|0].id); } S.perkPending=0; }
  S.lootPending=0; if(S.demand){ S.demand=null; } S.royalMsg=null; S.petition=null; if(S.aud) S.aud.pend=null; S.req=null; S.trader=null; }
function simGame(strat,diff){
  const st=BOT_STRATS[strat]; BOT_LOG={built:{},upg:[],nights:[],keep:[]};
  saveOn=false; startGame(diff||'normal'); botClear();
  const t0=performance.now(); let guard=0;
  while(!S.over&&S.day<=21&&guard++<40){
    botClear(); botDay(st); botClear();
    if(S.day>20&&S.won) break;
    startNight(); let k=0; const keep0=S.keep;
    while(S.phase==='night'&&!S.over&&k<9000){ step(.05); k++; if(S.modal) botClear();
      if(k%8===0&&heroHere()&&!S.hero.dead){ let best=null,bd=1e9; for(const e of S.enemies){ if(e.gone) continue; const d=Math.hypot(e.x-C,e.y-C)*1.5+Math.hypot(e.x-S.hero.x,e.y-S.hero.y); if(d<bd){ bd=d; best=e; } }
        if(best){ const dh=Math.hypot(best.x-S.hero.x,best.y-S.hero.y); if(dh>.7){ S.hero.tx=best.x; S.hero.ty=best.y; S.hero.pathKey=null; } if(dh<2.2&&S.hero.cdC<=0) try{ useCharge(); }catch(e){} if(S.enemies.filter(e=>!e.gone&&Math.hypot(e.x-C,e.y-C)<3).length>=3&&S.hero.cdR<=0) try{ useRally(); }catch(e){} } } }
    botClear(); BOT_LOG.nights.push(k); BOT_LOG.keep.push(keep0-Math.max(0,S.keep));
    if(S.won&&S.day>20) break; }
  return {phase:S.phase,modal:S.modal,guard,nightsK:BOT_LOG.nights,strat,diff:diff||'normal',won:!!S.won,day:S.day,over:!!S.over,score:score(),kills:S.kills,pop:S.pop,gold:S.res.gold,ms:Math.round(performance.now()-t0),built:BOT_LOG.built,upg:BOT_LOG.upg,keepLoss:BOT_LOG.keep,renown:S.renown||0}; }
