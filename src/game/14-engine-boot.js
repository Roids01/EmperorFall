// ---- engine: fixed-step simulation, adaptive resolution and a crash guard ----
const FIX=1/60; let simAcc=0, renderScale=1, rsT=0, crashes=0, crashT=0;
function adaptResolution(real){
  if(document.hidden||real>.5) return;
  if(ftAvg>.026&&renderScale>.62){ rsT+=real; if(rsT>1.5){ rsT=0; renderScale=Math.max(.6,renderScale-.1); resize(); } }
  else if(ftAvg<.018&&renderScale<1){ rsT+=real; if(rsT>4){ rsT=0; renderScale=Math.min(1,renderScale+.1); resize(); } }
  else rsT=0;
}
function loop(now){
  requestAnimationFrame(loop);
  const real=(now-last)/1000, raw=Math.min(.05,real); last=now;
  try{
    if(!document.hidden&&real<.5){ ftAvg=ftAvg*.97+real*.03; adaptResolution(real);   // drop to Low once if even the lowest resolution struggles
      if(quality==='high'&&!qualityChosen&&ftAvg>.045&&renderScale<=.61){ slowT+=real; if(slowT>4){ quality='low'; applyQuality(); savePrefs(); say('Graphics switched to Low to keep the game smooth. Tap the quality button to change it back.'); } } else slowT=0; }
    if(NET.role==='guest'){ guestTick(raw); uiT+=raw; if(uiT>.4){ uiT=0; ui(); } }
    else if(!S.over&&!paused&&!S.modal){ simAcc=Math.min(simAcc+raw*speed,FIX*12); let n=0; while(simAcc>=FIX&&n<12){ step(FIX); simAcc-=FIX; n++; if(S.over||S.modal) break; } uiT+=raw; if(uiT>.3&&S.phase==='night'){uiT=0;ui()} }
    else if(!paused){ for(const f of S.floats) f.life-=raw; S.floats=S.floats.filter(f=>f.life>0); }
    if(!paused) clock+=raw;
    if(flash>0) flash=Math.max(0,flash-raw*1.5);
    if(shake>0) shake=Math.max(0,shake-raw);
    if(!BW) resize();
    if(BW) render(raw,clock);
    if(crashes&&now-crashT>8000) crashes=0;
  }catch(err){
    console.error(err); crashes++; crashT=now;
    if(crashes===1){ try{ toast(T('Something went wrong'),T('The game caught an error and kept running'),'!'); }catch(e){} }
    if(crashes>30){ paused=true; try{ say('<b>The game hit repeated errors and paused itself.</b> Your progress is saved; reload the page to continue.'); save(); }catch(e){} }
  }
}

loadPrefs();
applyQuality();
startGame('normal'); applyLang(); S.modal=true;
slotMenu(true);
loadAssets();
{ const k=new URLSearchParams(location.search).get('k'); if(k){ let n=0; const tryK=()=>{ if(window.LZString){ loadCodeDialog(k); try{ history.replaceState(null,'',location.pathname); }catch(e){} } else if(n++<40) setTimeout(tryK,250); }; setTimeout(tryK,600); } }
requestAnimationFrame(loop);
};
{ let booted=false; const boot=()=>{ if(booted) return; booted=true; __main(); };
  if(window.THREE&&window.THREE.WebGLRenderer) boot(); else window.addEventListener('three-ready',boot,{once:true});
  setTimeout(()=>{ if(!booted) document.getElementById('board').insertAdjacentHTML('beforeend','<div class="nogl">The 3D engine did not load. Check your connection and reload.</div>'); },20000); }
