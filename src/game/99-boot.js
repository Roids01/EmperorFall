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
