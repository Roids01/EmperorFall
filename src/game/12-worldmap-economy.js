// ================= WORLD MAP =================
let wBase=null, wOver=null, wOverVer=-1, wView={s:1,x:0,y:0}, wSel=null, wMode='legend', wCourt=null, wDrag=null;
const WMW=840, WMH=560;
function worldPixels(seed,WW,HH){
  const {H,M,n1}=worldFns(seed), data=new Uint8ClampedArray(WW*HH*4), hs=new Float32Array(WW*HH);
  for(let j=0;j<HH;j++)for(let i=0;i<WW;i++) hs[j*WW+i]=H(i/WW,j/HH,5);
  const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*Math.max(0,Math.min(1,t)));
  for(let j=0;j<HH;j++)for(let i=0;i<WW;i++){ const k=j*WW+i, h=hs[k], ny=j/HH; let col;
    if(h<0){ col=lerp([20,52,70],[48,112,128],1+h/.18); if(h>-.025) col=lerp(col,[120,170,170],.35); }
    else{ const m=M(i/WW,ny,3), t=terrOf(h,m,ny);
      col=t==='mountains'?(h>.62?[236,238,242]:lerp([132,120,110],[180,172,166],(h-.5)/.12)):t==='hills'?[168,146,108]:t==='forest'?(ny>.42?[98,124,70]:[72,104,62]):t==='desert'?lerp([226,180,112],[214,160,96],fbm(n1,i/30,j/30,2)+.5):t==='grass'?(ny>.42?[150,158,92]:[128,150,90]):[190,172,120];
      if(h<.03) col=lerp(col,[226,206,154],.7);
      const sh=((hs[k-WW-1]||h)-(hs[k+WW+1]||h))*14; col=col.map(v=>v*(1+sh)); }
    const o=k*4; data[o]=col[0]; data[o+1]=col[1]; data[o+2]=col[2]; data[o+3]=255; }
  return data;
}
function paintWorld(data){
  if(wBase&&wBase.seed===S.worldSeed) return;
  if(!data) data=worldPixels(S.worldSeed,WMW,WMH);
  const c=document.createElement('canvas'); c.width=WMW; c.height=WMH; const x=c.getContext('2d');
  x.putImageData(new ImageData(data,WMW,WMH),0,0);
  // rivers: walk downhill from high ground
  const W=WORLD, rr=mulberry32(S.worldSeed+9); x.strokeStyle='rgba(70,140,170,.85)'; x.lineCap='round';
  for(let r=0;r<9;r++){ let i=(rr()*W.GW)|0, j=(rr()*W.GH)|0, g=0; while(W.h[j*W.GW+i]<.38&&g<200){ i=(rr()*W.GW)|0; j=(rr()*W.GH)|0; g++; } if(g>=200) continue;
    x.beginPath(); x.moveTo((i+.5)*WMW/W.GW,(j+.5)*WMH/W.GH); let steps=0, wdt=.8;
    while(W.h[j*W.GW+i]>0&&steps<120){ let bi=i,bj=j,bh=W.h[j*W.GW+i]; for(const [a,c] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){ const ii=i+a,jj=j+c; if(ii<0||jj<0||ii>=W.GW||jj>=W.GH) continue; const v=W.h[jj*W.GW+ii]+rr()*.004; if(v<bh){bh=v;bi=ii;bj=jj;} } if(bi===i&&bj===j) break; i=bi; j=bj; steps++; x.lineTo((i+.5)*WMW/W.GW,(j+.5)*WMH/W.GH); }
    x.lineWidth=1.6; x.stroke(); }
  wBase={c,seed:S.worldSeed};
}
function paintOwners(){
  if(wOver&&wOverVer===worldVer) return; wOverVer=worldVer;
  const W=WORLD, c=wOver||document.createElement('canvas'); c.width=WMW; c.height=WMH; const x=c.getContext('2d'); x.clearRect(0,0,WMW,WMH);
  const cw=WMW/W.GW, ch=WMH/W.GH, col=o=>o==='me'?'#F0BE4E':o?KINGS[o].color:null;
  { const sc=document.createElement('canvas'); sc.width=W.GW; sc.height=W.GH; const sx=sc.getContext('2d'), im=sx.createImageData(W.GW,W.GH);
    for(let j=0;j<W.GH;j++)for(let i=0;i<W.GW;i++){ const k=W.pg[j*W.GW+i]; if(k<0) continue; const cc=col(S.prov['p'+k].owner); if(!cc) continue; const c3=new THREE.Color(cc), o=(j*W.GW+i)*4; im.data[o]=c3.r*255; im.data[o+1]=c3.g*255; im.data[o+2]=c3.b*255; im.data[o+3]=70; }
    sx.putImageData(im,0,0); x.imageSmoothingEnabled=true; x.drawImage(sc,0,0,WMW,WMH); }
  x.globalAlpha=1;
  for(let j=0;j<W.GH;j++)for(let i=0;i<W.GW;i++){ const k=W.pg[j*W.GW+i]; if(k<0) continue; const o=S.prov['p'+k].owner;
    for(const [a,b] of [[1,0],[0,1]]){ const ii=i+a,jj=j+b; if(ii>=W.GW||jj>=W.GH) continue; const k2=W.pg[jj*W.GW+ii]; if(k2<0||k2===k) continue; const o2=S.prov['p'+k2].owner;
      if(o!==o2){ x.strokeStyle=col(o)||col(o2)||'#3A2A20'; x.lineWidth=1.6; x.globalAlpha=.95; } else { x.strokeStyle='#2A1E16'; x.lineWidth=.6; x.globalAlpha=.35; }
      x.beginPath(); if(a){ x.moveTo(ii*cw,j*ch); x.lineTo(ii*cw,(j+1)*ch); } else { x.moveTo(i*cw,jj*ch); x.lineTo((i+1)*cw,jj*ch); } x.stroke(); } }
  x.globalAlpha=1; wOver=c;
}
function paintWorldAsync(done){
  if(wBase&&wBase.seed===S.worldSeed){ done(); return; }
  const seed=S.worldSeed; let fin=false; const finish=d=>{ if(fin) return; fin=true; if(S.worldSeed!==seed) return; paintWorld(d?new Uint8ClampedArray(d):null); done(); };
  try{
    const src=`importScripts('https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/simplex-noise.js');\n${mulberry32.toString()}\nconst seededNoise=seed=>new SimplexNoise(mulberry32(seed));\n${fbm.toString()}\n${worldFns.toString()}\n${terrOf.toString()}\n${worldPixels.toString()}\nonmessage=e=>{ const d=worldPixels(e.data.seed,e.data.W,e.data.H); postMessage(d.buffer,[d.buffer]); };`;
    const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'})), w=new Worker(url);
    const bail=()=>{ try{ w.terminate(); }catch(e){} URL.revokeObjectURL(url); finish(null); };
    const to=setTimeout(bail,9000);
    w.onmessage=e=>{ clearTimeout(to); w.terminate(); URL.revokeObjectURL(url); finish(e.data); };
    w.onerror=e=>{ e.preventDefault&&e.preventDefault(); clearTimeout(to); bail(); };
    w.postMessage({seed,W:WMW,H:WMH});
  }catch(e){ finish(null); }
}
function openWorld(mode,arg){ crowns(); closeRealm(); $('world').hidden=false; S.modal=false; if(mode==='court'){ wMode='court'; wCourt=arg; } else if(mode==='prov'){ wMode='prov'; wSel=arg; }
  const cv=$('wmap'); renderWorldPanel(); if(!wBase||wBase.seed!==S.worldSeed){ const c=cv.getContext('2d'); fitWorld(); c.setTransform(1,0,0,1,0,0); c.fillStyle='#173A48'; c.fillRect(0,0,cv.width,cv.height); c.fillStyle='#E8DCC8'; c.font=`600 ${16*(devicePixelRatio||1)}px Inter,system-ui,sans-serif`; c.textAlign='center'; c.fillText(T('Charting the continent…'),cv.width/2,cv.height/2); }
  paintWorldAsync(()=>{ paintOwners(); wView.fit=false; fitWorld(); drawWorld(); }); }
function closeWorld(){ $('world').hidden=true; }
function fitWorld(){ const cv=$('wmap'), r=cv.getBoundingClientRect(); const dp=Math.min(2,devicePixelRatio||1); cv.width=Math.round(r.width*dp); cv.height=Math.round(r.height*dp); const s=Math.min(cv.width/WMW,cv.height/WMH); if(!wView.fit){ wView={s,x:(cv.width-WMW*s)/2,y:(cv.height-WMH*s)/2,fit:true,min:s}; } }
function drawWorld(){
  const cv=$('wmap'); if(!cv||$('world').hidden||!wBase) return; paintOwners(); const x=cv.getContext('2d'), v=wView, dp=cv.width/Math.max(1,cv.getBoundingClientRect().width);
  x.setTransform(1,0,0,1,0,0); x.fillStyle='#143446'; x.fillRect(0,0,cv.width,cv.height);
  const parch=mapStyle==='parchment'&&ensureParch(); if(parch){ x.setTransform(1,0,0,1,0,0); x.fillStyle='#2B231D'; x.fillRect(0,0,cv.width,cv.height); }
  x.setTransform(v.s,0,0,v.s,v.x,v.y); x.imageSmoothingEnabled=true;
  if(parch){ x.drawImage(wParch.c,0,0); x.globalCompositeOperation='multiply'; x.globalAlpha=.5; x.drawImage(wOver,0,0); x.globalAlpha=1; x.globalCompositeOperation='source-over'; x.drawImage(wParch.ink,0,0); }
  else { x.drawImage(wBase.c,0,0); x.drawImage(wOver,0,0); }
  drawFog(x,parch);
  const W=WORLD;
  if(wSel){ const k=PROV[wSel].k, cw=WMW/W.GW, ch=WMH/W.GH; x.fillStyle='rgba(255,248,230,.28)'; for(let j=0;j<W.GH;j++)for(let i=0;i<W.GW;i++) if(W.pg[j*W.GW+i]===k) x.fillRect(i*cw,j*ch,cw+.4,ch+.4); }
  x.setTransform(1,0,0,1,0,0); x.textAlign='center'; x.textBaseline='middle';
  const P2=(px,py)=>[v.x+px*WMW*v.s,v.y+py*WMH*v.s], fs=Math.max(9,Math.min(14,v.s*4.2))*dp;
  const placed=[], fits=(cx,cy,w,h)=>{ for(const r of placed) if(Math.abs(r[0]-cx)<(r[2]+w)/2&&Math.abs(r[1]-cy)<(r[3]+h)/2) return false; placed.push([cx,cy,w,h]); return true; };
  const order=W.ids.slice().sort((a,b)=>(PROV[b].cap?1:0)-(PROV[a].cap?1:0)||(b===wSel)-(a===wSel));
  const vis=visibleProvs();
  for(const id of order){ const P=PROV[id], [sx,sy]=P2(P.x,P.y), o=seenOwner(id,vis);
    if(P.cap){ x.fillStyle=P.cap==='me'?'#F0BE4E':KINGS[P.cap].color; x.strokeStyle='#1C1714'; x.lineWidth=2*dp; const s=7*dp; x.beginPath(); x.moveTo(sx-s,sy+s*.6); x.lineTo(sx-s,sy-s*.3); x.lineTo(sx-s*.5,sy); x.lineTo(sx,sy-s*.8); x.lineTo(sx+s*.5,sy); x.lineTo(sx+s,sy-s*.3); x.lineTo(sx+s,sy+s*.6); x.closePath(); x.fill(); x.stroke(); if(K(P.cap)&&K(P.cap).dead&&P.cap!=='me'){ x.strokeStyle='#E8604F'; x.beginPath(); x.moveTo(sx-s,sy-s); x.lineTo(sx+s,sy+s); x.stroke(); } }
    else { x.fillStyle=o==='me'?'#F0BE4E':o?KINGS[o].color:'#E8DCC8'; x.beginPath(); x.arc(sx,sy,2.6*dp,0,6.29); x.fill(); }
    const f2=P.cap?fs:fs*.86; x.font=`${P.cap?700:500} ${f2}px Inter,system-ui,sans-serif`; const ty=sy+(P.cap?13:9)*dp, tw=x.measureText(T(P.name)).width; if(!fits(sx,ty,tw+4*dp,f2*1.1)&&id!==wSel) continue; x.lineWidth=3*dp; x.strokeStyle=parch?'rgba(240,228,198,.85)':'rgba(24,18,14,.75)'; x.strokeText(T(P.name),sx,ty); x.fillStyle=parch?(P.cap?'#2A1A10':'#4A3626'):P.cap?'#FFF4E0':'#F2EADD'; x.fillText(T(P.name),sx,ty); }
  // crown names over their territory
  const owners=['me',...Object.keys(KINGS)];
  for(const o of owners){ const L=landsOf(o).filter(p=>vis.has(p)); if(!L.length||(o!=='me'&&K(o).dead)) continue; let cx=0,cy=0; L.forEach(p=>{ cx+=PROV[p].x; cy+=PROV[p].y; }); cx/=L.length; cy/=L.length; const [sx,sy]=P2(cx,cy-.045);
    x.font=`800 ${Math.round(fs*1.35)}px "Bricolage Grotesque",system-ui,sans-serif`; const name=o==='me'?T('Small Crown'):T(CAPNAME[o]).toUpperCase(); x.lineWidth=4*dp; x.strokeStyle=parch?'rgba(240,228,198,.8)':'rgba(24,18,14,.6)'; x.strokeText(o==='me'?name.toUpperCase():name,sx,sy); x.fillStyle=o==='me'?'#F0BE4E':KINGS[o].color; x.fillText(o==='me'?name.toUpperCase():name,sx,sy); }
  drawArmies(x,P2,dp);
  x.font=`800 ${Math.round(fs*2)}px "Bricolage Grotesque",system-ui,sans-serif`; if(parch){ const [tx,ty]=P2(.045,.075); x.font=`800 ${Math.round(fs*2.2)}px "Bricolage Grotesque",Georgia,serif`; x.fillStyle='rgba(60,40,26,.78)'; x.textAlign='left'; x.fillText(CONT_NAME.toUpperCase(),tx,ty); } else { x.fillStyle='rgba(242,234,221,.5)'; x.textAlign='left'; x.fillText(CONT_NAME.toUpperCase(),14*dp,22*dp); }
}
let mapStyle='parchment', wParch=null; try{ if(localStorage.getItem('smallcrown-mapstyle')==='terrain') mapStyle='terrain'; }catch(e){}
function ensureParch(){ if(wParch&&wParch.seed===S.worldSeed) return true; if(!window.rough) return false; if(!ensureParch.pending){ ensureParch.pending=true; setTimeout(()=>{ try{ buildParch(); }catch(e){ console.warn(e); } ensureParch.pending=false; drawWorld(); },20); } return false; }
function buildParch(){
  const Wd=WMW, Hd=WMH, src=wBase.c.getContext('2d').getImageData(0,0,Wd,Hd).data, out=new ImageData(Wd,Hd), o=out.data, N2=Wd*Hd;
  const sea=new Uint8Array(N2); for(let k=0;k<N2;k++){ const r=src[k*4],g=src[k*4+1],b=src[k*4+2]; sea[k]=(b>r+18&&b>=g-30)?1:0; }
  const INF=1e9, dist=new Float32Array(N2); for(let k=0;k<N2;k++) dist[k]=sea[k]?INF:0;
  for(let j=0;j<Hd;j++)for(let i=0;i<Wd;i++){ const k=j*Wd+i; if(!sea[k]) continue; let d=dist[k]; if(i>0) d=Math.min(d,dist[k-1]+1); if(j>0){ d=Math.min(d,dist[k-Wd]+1); if(i>0) d=Math.min(d,dist[k-Wd-1]+1.414); if(i<Wd-1) d=Math.min(d,dist[k-Wd+1]+1.414); } dist[k]=d; }
  for(let j=Hd-1;j>=0;j--)for(let i=Wd-1;i>=0;i--){ const k=j*Wd+i; if(!sea[k]) continue; let d=dist[k]; if(i<Wd-1) d=Math.min(d,dist[k+1]+1); if(j<Hd-1){ d=Math.min(d,dist[k+Wd]+1); if(i<Wd-1) d=Math.min(d,dist[k+Wd+1]+1.414); if(i>0) d=Math.min(d,dist[k+Wd-1]+1.414); } dist[k]=d; }
  { const core=new Float32Array(N2); for(let k=0;k<N2;k++) core[k]=sea[k]&&dist[k]>=3?0:INF;
    for(let j=0;j<Hd;j++)for(let i=0;i<Wd;i++){ const k=j*Wd+i; let d=core[k]; if(i>0) d=Math.min(d,core[k-1]+1); if(j>0) d=Math.min(d,core[k-Wd]+1); core[k]=d; }
    for(let j=Hd-1;j>=0;j--)for(let i=Wd-1;i>=0;i--){ const k=j*Wd+i; let d=core[k]; if(i<Wd-1) d=Math.min(d,core[k+1]+1); if(j<Hd-1) d=Math.min(d,core[k+Wd]+1); core[k]=d; }
    for(let k=0;k<N2;k++) if(sea[k]&&core[k]>3.2){ sea[k]=0; dist[k]=0; core[k]=-1; } else core[k]=0;
    var river=core; }
  const rnd=mulberry32(S.worldSeed+77), ink=[64,46,32];
  for(let j=0;j<Hd;j++)for(let i=0;i<Wd;i++){ const k=j*Wd+i, r=src[k*4],g=src[k*4+1],b=src[k*4+2], gr=(rnd()-.5)*12; let c;
    if(sea[k]){ const d=dist[k]; c=[214+gr,205+gr,176+gr]; c=c.map((v,q)=>v*.86+[120,150,148][q]*.14); let a=0; if(d<1.6) a=.9; else if(Math.abs(d-6)<.7) a=.32; else if(Math.abs(d-12.5)<.6) a=.2; else if(Math.abs(d-20)<.5) a=.1; if(a) c=c.map((v,q)=>v+(ink[q]-v)*a); }
    else if(river[k]<0){ c=[78,92,104]; }
    else { const lum=(.3*r+.59*g+.11*b)/255, sh=.8+.34*lum; c=[236*sh+gr,222*sh+gr,188*sh+gr]; c=c.map((v,q)=>v*.8+[r,g,b][q]*.2); const nb=(i>0&&sea[k-1])||(i<Wd-1&&sea[k+1])||(j>0&&sea[k-Wd])||(j<Hd-1&&sea[k+Wd]); if(nb) c=ink; }
    const ex=i/Wd-.5, ey=j/Hd-.5, vg=1-.22*Math.max(0,Math.min(1,(Math.sqrt(ex*ex*1.2+ey*ey*1.5)-.36)/.42)); o[k*4]=c[0]*vg; o[k*4+1]=c[1]*vg; o[k*4+2]=c[2]*vg; o[k*4+3]=255; }
  const pc=document.createElement('canvas'); pc.width=Wd; pc.height=Hd; pc.getContext('2d').putImageData(out,0,0);
  // ink layer: dashed province borders and Rough.js glyphs
  const ic=document.createElement('canvas'); ic.width=Wd; ic.height=Hd; const ix=ic.getContext('2d'), W=WORLD, nz=seededNoise(S.worldSeed+5), pgAt=new Int16Array(N2);
  for(let j=0;j<Hd;j++)for(let i=0;i<Wd;i++){ const wx=i+nz.noise2D(i*.03,j*.03)*4, wy=j+nz.noise2D(i*.03+40,j*.03)*4; const gi=Math.max(0,Math.min(W.GW-1,Math.floor(wx/Wd*W.GW))), gj=Math.max(0,Math.min(W.GH-1,Math.floor(wy/Hd*W.GH))); pgAt[j*Wd+i]=sea[j*Wd+i]?-1:W.pg[gj*W.GW+gi]; }
  const bd=ix.createImageData(Wd,Hd), bo=bd.data;
  for(let j=0;j<Hd-1;j++)for(let i=0;i<Wd-1;i++){ const k=j*Wd+i, a=pgAt[k]; if(a<0) continue; const r2=pgAt[k+1], d2=pgAt[k+Wd]; if((r2>=0&&r2!==a)||(d2>=0&&d2!==a)){ if(((i+j)>>2)%3===0) continue; bo[k*4]=70; bo[k*4+1]=50; bo[k*4+2]=36; bo[k*4+3]=170; } }
  ix.putImageData(bd,0,0);
  const rc=rough.canvas(ic), {H,M}=worldFns(S.worldSeed), INK='rgba(64,46,32,.9)', step=24; let sd=1;
  for(let y=step/2;y<Hd-10;y+=step)for(let x=step/2;x<Wd-10;x+=step*1.1){ const px=x+(rnd()-.5)*step*.7, py=y+(rnd()-.5)*step*.6, h=H(px/Wd,py/Hd,4); if(h<.02) continue;
    const t=terrOf(h,M(px/Wd,py/Hd,3),py/Hd); sd++;
    if(t==='mountains'){ const s2=.8+rnd()*.5; rc.linearPath([[px-10*s2,py+5],[px-2*s2,py-9*s2],[px+1,py-4*s2],[px+4*s2,py-10*s2],[px+11*s2,py+5]],{stroke:INK,strokeWidth:1.1,roughness:1.2,seed:sd}); rc.polygon([[px+4*s2,py-10*s2],[px+11*s2,py+5],[px+3*s2,py+5]],{stroke:'none',fill:INK,fillStyle:'hachure',hachureGap:2.2,hachureAngle:-35,fillWeight:.6,roughness:1,seed:sd+1}); }
    else if(t==='hills'){ if(rnd()<.6) rc.arc(px,py,18,12,Math.PI*1.08,Math.PI*1.92,false,{stroke:INK,strokeWidth:1,roughness:1.1,seed:sd}); }
    else if(t==='forest'){ for(let q=0;q<3;q++){ const tx=px+(q-1)*6, ty=py+(q===1?-3:2); rc.line(tx,ty+3,tx,ty+7,{stroke:INK,strokeWidth:.9,roughness:.6,seed:sd+q}); rc.circle(tx,ty,7,{stroke:'rgba(52,64,36,.9)',strokeWidth:.8,fill:'rgba(78,98,52,.55)',fillStyle:'hachure',hachureGap:1.8,fillWeight:.6,roughness:1,seed:sd+q+5}); } }
    else if(t==='desert'){ ix.fillStyle='rgba(96,70,46,.55)'; for(let q=0;q<5;q++){ ix.beginPath(); ix.arc(px+(rnd()-.5)*12,py+(rnd()-.5)*8,.9,0,6.29); ix.fill(); } }
    else if(t==='grass'&&rnd()<.25){ rc.linearPath([[px-4,py],[px-2,py-4],[px,py],[px+2,py-4],[px+4,py]],{stroke:'rgba(70,84,44,.7)',strokeWidth:.8,roughness:.8,seed:sd}); } }
  rc.rectangle(10,10,Wd-20,Hd-20,{stroke:INK,strokeWidth:2.2,roughness:1.3,seed:3}); rc.rectangle(16,16,Wd-32,Hd-32,{stroke:'rgba(64,46,32,.6)',strokeWidth:1,roughness:1.6,seed:4});
  { const cx=Wd-74, cy=Hd-74, R0=40; rc.circle(cx,cy,R0*2,{stroke:INK,strokeWidth:1.2,roughness:1.2,seed:7}); rc.circle(cx,cy,R0*1.25,{stroke:'rgba(64,46,32,.5)',strokeWidth:.8,roughness:1.4,seed:8});
    for(let q=0;q<8;q++){ const a=q*Math.PI/4-Math.PI/2, L2=q%2?R0*.62:R0*.98, w2=q%2?5:8, a1=a+Math.PI/2; rc.polygon([[cx+Math.cos(a)*L2,cy+Math.sin(a)*L2],[cx+Math.cos(a1)*w2,cy+Math.sin(a1)*w2],[cx-Math.cos(a1)*w2,cy-Math.sin(a1)*w2]],{stroke:INK,strokeWidth:.9,fill:q%2?'rgba(64,46,32,.25)':'rgba(64,46,32,.75)',fillStyle:q%2?'hachure':'solid',hachureGap:2,roughness:.9,seed:20+q}); }
    ix.font='700 13px "Bricolage Grotesque", Georgia, serif'; ix.fillStyle='rgba(64,46,32,.9)'; ix.textAlign='center'; ix.textBaseline='middle'; ix.fillText('N',cx,cy-R0-10); }
  wParch={c:pc,ink:ic,seed:S.worldSeed};
}
function worldPick(ev){ const cv=$('wmap'), r=cv.getBoundingClientRect(), dp=cv.width/r.width, px=((ev.clientX-r.left)*dp-wView.x)/wView.s/WMW, py=((ev.clientY-r.top)*dp-wView.y)/wView.s/WMH;
  const W=WORLD, i=Math.floor(px*W.GW), j=Math.floor(py*W.GH); if(i<0||j<0||i>=W.GW||j>=W.GH) return null; const k=W.pg[j*W.GW+i]; return k<0?null:'p'+k; }
function wZoom(f,cx,cy){ const cv=$('wmap'); cx=cx??cv.width/2; cy=cy??cv.height/2; const ns=Math.max(wView.min,Math.min(wView.min*5,wView.s*f)); wView.x=cx-(cx-wView.x)*ns/wView.s; wView.y=cy-(cy-wView.y)*ns/wView.s; wView.s=ns; drawWorld(); }
function renderWorldPanel(){
  const box=$('wpanel'); crowns(); const night=S.phase!=='day', btn=(cls,attr,label,dis,cost)=>`<button type="button" class="${cls}" ${attr} ${dis?'disabled':''}>${label}${cost?` <span class="c">${cost}</span>`:''}</button>`;
  let h='';
  if(wMode==='army'&&armies().some(x=>x.id===wArmy&&x.o==='me')) h=campaignArmyHtml(btn,night);
  else if(wMode==='prov'&&wSel&&!visibleProvs().has(wSel)){ const P=PROV[wSel]; h=`<h3>${T(P.name)}</h3><div class="pd">${T(TERR_NAME[P.terr])}</div>`+campaignProvHtml(wSel,btn,night)+`<button type="button" class="link" data-w="legend">← ${T('All crowns')}</button>`; }
  else if(wMode==='prov'&&wSel){ const P=PROV[wSel], sp=S.prov[wSel], o=sp.owner, od=battleOdds(wSel), near=bordersMe(wSel);
    h=`<h3>${T(P.name)}</h3><div class="pd">${o==='me'?T('Yours'):o?T(KINGS[o].name):T('Unclaimed, held by bandits')}${P.cap?' · '+T('capital'):''}</div>
      <div class="pd">${T(TERR_NAME[P.terr])}${P.coastal?' · '+T('coastal'):''} · ${T('yields {{y}} each dawn',{y:yieldStr(wSel)})} · ${T('garrison {{g}}',{g:o&&o!=='me'?od.def:sp.gar})}</div>
      <div class="pd">${near||o==='me'?'':T('Not on your border.')}</div><div class="pa">`;
    if(!o) h+=btn('hot','data-w="settle"',T('Settle'),night||!near,`20g 15f, 2 ${T('villagers')}`)+(near?`<span class="pd">${T('Your army {{a}} vs bandits {{g}}',{a:armyPower(),g:sp.gar})}</span>`:'');
    else if(o==='me') h+=P.cap?`<span class="pd">${T('Your capital, home of The Valley, Saltreach Cove and Ironpeak Pass.')}</span>`:btn('','data-w="reinf"',T('Reinforce'),night,'12g');
    else{ if(K(o).war) h+=`<span class="pd">${T('At war: send an army to besiege it.')}</span>`;
      else if(!P.cap) h+=btn('','data-w="buy"',T('Offer to buy'),night||!near||K(o).rel<0,`${landPrice(wSel)}g`);
      h+=btn('','data-w="court"',T('Court of {{k}}',{k:kn(o)}),false); }
    if(o==='me'&&!P.cap){ for(const id of liveKings()) if(P.adj.some(a=>S.prov[a].owner===id)) h+=btn('','data-cede="'+id+'"',T('Cede to {{k}}',{k:kn(id)}),night); }
    h+=`</div>`+campaignProvHtml(wSel,btn,night)+`<button type="button" class="link" data-w="legend">← ${T('All crowns')}</button>`; }
  else if(wMode==='court'&&wCourt&&!K(wCourt).dead){ const id=wCourt, k=K(id), KG=KINGS[id], gc=15+Math.max(0,Math.round(-k.rel/5));
    const others=liveKings().filter(o=>o!==id).map(o=>`${kn(o)}: ${T(kwar(id,o)?'at war':relWord(krel(id,o)))}`).join(' · ');
    h=`<h3 style="color:${KG.color}">${T(KG.name)}</h3><div class="pd">${T(KG.desc)}</div>
      <div class="pd">${T('Prestige {{p}} · army {{a}} · {{l}} · {{g}} gold',{p:kPrestige(id),a:k.army,l:landsTxt(landsOf(id).length),g:Math.round(k.gold)})}</div>
      <div class="rel"><span>${T('Toward you')}: <b>${T(relWord(k.rel))}</b> (${k.rel})</span><span class="hb"><i style="width:${(k.rel+100)/2}%;background:${k.rel>=30?'#8FCB7E':k.rel>=0?'#F0BE4E':'#E8604F'}"></i></span></div>
      <div class="tags">${treatyTags(id)}</div><div class="pd">${T('With the other crowns')}: ${others||'—'}</div>`;
    if(k.war){ h+=`<h4>${T('War')}</h4><div class="pa">${btn('hot','data-c="peace"',T('Offer peace'),night,k.ws>=3?'':`${30+Math.max(0,-k.ws)*10}g`)}${btn('','data-c="surrender"',T('Demand surrender'),night||k.ws<4)}${liveKings().filter(o=>o!==id&&(K(o).ally||K(o).wed)&&!kwar(o,id)).map(o=>btn('','data-ask="'+o+'"',T('Ask {{a}} to join',{a:kn(o)}),night)).join('')}</div><div class="pd">${T('War score {{w}}. Win battles and slay their knights to raise it.',{w:Math.round(k.ws*10)/10})}</div>`; }
    else{ h+=`<h4>${T('Friendship')}</h4><div class="pa">${btn('hot','data-c="envoy"',T('Send envoy'),night||k.last===S.day||S.res.gold<gc,gc+'g')}${btn('','data-c="trade"',T('Trade agreement'),night||k.pact||k.rel<20)}${btn('','data-c="nap"',T('Pact of peace'),night||napOn(k)||k.rel<10)}${btn('','data-c="ally"',T('Military alliance'),night||k.ally||k.rel<60)}${btn('','data-c="wed"',T('Propose marriage'),night||k.wed||k.rel<50||Object.values(crowns()).some(x=>x.wed))}${btn('','data-c="aid"',T('Request aid'),night||!(k.ally||k.wed)||k.aid===seasonIdx())}</div>
        <div class="pd">${T('Trade needs Friendly (20), a pact of peace Cordial (10), a marriage 50, an alliance 60.')}</div>
        <h4>${T('Pressure')}</h4><div class="pa">${btn('','data-c="tribute"',T('Demand tribute'),night||k.last===S.day)}${btn('','data-c="embargo"',T('Embargo'),night||(k.emb||0)>=S.day||k.wed)}${btn('','data-c="sabotage"',T('Sabotage'),night||!cm('spymaster')||k.last===S.day)}${btn('','data-c="denounce"',T('Denounce'),night||k.last===S.day)}${k.ally&&!k.wed?btn('','data-c="unally"',T('Break alliance'),night):''}${k.wed?'':btn('red','data-c="war"',T('Declare war'),night)}</div>
        <div class="pd">${T('Tribute needs an army 20% larger than theirs. Sabotage needs a spymaster on your council.')}${napOn(k)?' <b>'+T('Declaring war now breaks your pact of peace.')+'</b>':''}</div>`; }
    h+=`<button type="button" class="link" data-w="legend">← ${T('All crowns')}</button>`; }
  else{ wMode='legend'; const st=standings();
    h=`<h3>${T('The crowns of {{c}}',{c:CONT_NAME})}</h3><div class="pd">${T('Tap a land on the map to see it. Lands on your border can be settled, bought or conquered.')}</div>`+st.map((r,i)=>{ if(r.id==='me') return `<div class="lg me"><b>${i+1}.</b> <span class="sw" style="background:#F0BE4E"></span> ${T('Your realm')} · ${r.p} <span class="pd">${landsTxt(landsOf('me').length)} · ${T('army')} ${armyPower()}</span></div>`;
      const k=K(r.id); return `<button type="button" class="lg" data-court="${r.id}"><b>${i+1}.</b> <span class="sw" style="background:${KINGS[r.id].color}"></span> ${T(KINGS[r.id].name)} · ${r.p} <span class="pd">${landsTxt(landsOf(r.id).length)} · ${T(relWord(k.rel))}${k.war?' · '+T('at war'):''}</span></button>`; }).join('')
      +`<div class="pa" style="margin-top:6px">${btn('hot','data-w="levy"',T('Raise levies'),night||(S.levy&&S.levy.until>=S.day),'20g 10f')}${btn('','data-w="host"',T('Host a tournament'),night||S.hosted===seasonIdx(),'40g')}</div>`
      +campaignLegendHtml(btn,night)
      +((S.newsLog||[]).length?`<h4>${T('News from the courts')}</h4>`+(S.newsLog||[]).slice(0,6).map(n=>`<div class="pd">${T('Day {{n}}',{n:n.d})}: ${n.t}</div>`).join(''):''); }
  box.innerHTML=h;
  box.querySelectorAll('[data-w]').forEach(b=>b.addEventListener('click',()=>{ const a=b.dataset.w;
    if(a==='legend'){ wMode='legend'; wSel=null; } else if(a==='settle') settle(wSel); else if(a==='reinf') reinforce(wSel); else if(a==='march'){ march(wSel); }
    else if(a==='buy') buyLand(wSel); else if(a==='court'){ wMode='court'; wCourt=S.prov[wSel].owner; } else if(a==='levy') raiseLevy(); else if(a==='host') hostTourney();
    renderWorldPanel(); drawWorld(); }));
  campaignWire(box);
  box.querySelectorAll('[data-court]').forEach(b=>b.addEventListener('click',()=>{ wMode='court'; wCourt=b.dataset.court; renderWorldPanel(); }));
  box.querySelectorAll('[data-cede]').forEach(b=>b.addEventListener('click',()=>{ cedeLand(wSel,b.dataset.cede); renderWorldPanel(); drawWorld(); }));
  box.querySelectorAll('[data-ask]').forEach(b=>b.addEventListener('click',()=>{ askJoinWar(b.dataset.ask,wCourt); renderWorldPanel(); }));
  box.querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{ const id=wCourt, a=b.dataset.c;
    ({envoy,trade:proposePact,nap:signNap,ally:signAlliance,wed:proposeMarriage,aid:requestAid,tribute:demandTribute,embargo,sabotage,denounce,unally:breakAlliance,war:declareWar,peace:offerPeace,surrender:demandSurrender})[a](id); renderWorldPanel(); drawWorld(); }));
}
function initWorldUI(){
  const ws=$('wStyle'); if(ws){ const lab=()=>{ ws.textContent=T(mapStyle==='parchment'?'Terrain':'Parchment'); ws.setAttribute('aria-pressed',mapStyle==='parchment'); }; lab(); ws.addEventListener('click',()=>{ mapStyle=mapStyle==='parchment'?'terrain':'parchment'; try{ localStorage.setItem('smallcrown-mapstyle',mapStyle); }catch(e){} lab(); drawWorld(); }); }
  const cv=$('wmap');
  cv.addEventListener('pointerdown',e=>{ wDrag={x:e.clientX,y:e.clientY,vx:wView.x,vy:wView.y,moved:false}; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove',e=>{ if(!wDrag) return; const dp=cv.width/cv.getBoundingClientRect().width, dx=(e.clientX-wDrag.x)*dp, dy=(e.clientY-wDrag.y)*dp; if(Math.abs(dx)+Math.abs(dy)>6) wDrag.moved=true; if(wDrag.moved){ wView.x=wDrag.vx+dx; wView.y=wDrag.vy+dy; drawWorld(); } });
  cv.addEventListener('pointerup',e=>{ if(wDrag&&!wDrag.moved){ const r=cv.getBoundingClientRect(), dp=cv.width/r.width, ah=armyHit((e.clientX-r.left)*dp,(e.clientY-r.top)*dp), p=worldPick(e);
    if(wPick&&p){ const a=armies().find(x=>x.id===wPick); if(a) orderArmy(a,p); wPick=null; wMode='army'; wArmy=a&&a.id; save(); }
    else if(ah!=null&&armies().find(x=>x.id===ah&&x.o==='me')){ wMode='army'; wArmy=ah; }
    else if(p){ wSel=p; wMode='prov'; } else { wSel=null; wMode='legend'; } renderWorldPanel(); drawWorld(); } wDrag=null; });
  cv.addEventListener('wheel',e=>{ e.preventDefault(); const r=cv.getBoundingClientRect(), dp=cv.width/r.width; wZoom(Math.exp(-e.deltaY*.0015),(e.clientX-r.left)*dp,(e.clientY-r.top)*dp); },{passive:false});
  $('wIn').addEventListener('click',()=>wZoom(1.4)); $('wOut').addEventListener('click',()=>wZoom(1/1.4)); $('wClose').addEventListener('click',closeWorld);
  new ResizeObserver(()=>{ if($('world').hidden) return; wView.fit=false; fitWorld(); drawWorld(); }).observe(cv);
}

// ---------- caravans to the other crowns ----------
const DEMAND={harun:{food:1.6,iron:1.6,tools:1.5,wood:1.2},ysolde:{cloth:1.8,salt:1.6,ale:1.2,iron:1.1},osric:{ale:1.7,wool:1.5,cloth:1.3,food:1.2}};
const ROUTE_GOODS=['food','wood','stone','iron','wool','cloth','ale','salt','tools'];
const routeOk=id=>{ const k=S.crowns&&S.crowns[id]; return !!k&&!k.dead&&k.pact&&!k.war&&!((k.emb||0)>=S.day); };
const satOf=(id,g)=>((S.sat||{})[id+':'+g])||0;
const unitPrice=(id,g,extra=0)=>{ const d=(DEMAND[id]||{})[g]||.9; return BASEP[g]*d/(1+(satOf(id,g)+extra)/30)*(hasWonder('w_bazaar')?1.15:1); };
function routeQuote(id,g,amt){ let gold=0; for(let i=0;i<amt;i++) gold+=unitPrice(id,g,i)*(hasTier('merchant',1)?1.25:1); return Math.round(gold*.85); }
function routesEcon(L,avail){ const out=[]; for(const id in (S.routes||{})){ const r=S.routes[id]; if(!r||!routeOk(id)) continue; const n=Math.min(r.amt,Math.floor(avail(r.good))); if(n<=0) continue;
    const g=routeQuote(id,r.good,n); L[r.good].push([`Caravan to ${CAPNAME[id]}`,-n]); L.gold.push([`${n} ${r.good} sold in ${CAPNAME[id]}`,g]); out.push([id,r.good,n]); } return out; }
function routesDawn(shipped){ S.sat=S.sat||{}; for(const k in S.sat) S.sat[k]*=.75; for(const [id,g,n] of shipped){ S.sat[id+':'+g]=(S.sat[id+':'+g]||0)+n; if(S.crowns[id]) relShift(id,1); } }
function setRoute(id,g,amt){ S.routes=S.routes||{}; if(!g||!amt){ delete S.routes[id]; } else S.routes[id]={good:g,amt}; mktKey=''; save(); ui(); }
// ---------- the merchant guild ----------
const LOANS=[{id:'small',amt:50,back:60,days:6},{id:'large',amt:120,back:150,days:8}];
function takeLoan(id){ const l=LOANS.find(x=>x.id===id); if(!l||S.loan||(S.guildBan||0)>S.day||S.phase!=='day') return; S.loan={back:hasTier('merchant',2)?l.amt:l.back,due:S.day+l.days}; S.res.gold+=l.amt; sfx('up'); say(`<b>The Merchant Guild lends you ${l.amt} gold.</b> Repay ${l.back} by day ${S.day+l.days}.`); mktKey=''; save(); ui(); }
function repayLoan(){ if(!S.loan) return; if(S.res.gold<S.loan.back){ say(`You need ${S.loan.back} gold to repay the guild.`); sfx('no'); return; } S.res.gold-=S.loan.back; S.loan=null; addRenown(1); say('<b>Loan repaid early.</b> The guild thinks well of you.'); mktKey=''; save(); ui(); }
function invest(){ if(S.inv||S.res.gold<50||S.phase!=='day') return; S.res.gold-=50; S.inv={back:58,due:S.day+6}; say('<b>You invest 50 gold</b> in a guild caravan. It should return 58 by day '+(S.day+6)+'.'); mktKey=''; save(); ui(); }
function guildDawn(notes){
  if(S.loan&&S.day>=S.loan.due){ if(S.res.gold>=S.loan.back){ S.res.gold-=S.loan.back; notes.push(`<b>The guild collected</b> ${S.loan.back} gold for your loan`); } else { const p=S.res.gold; S.res.gold=0; S.mood=Math.max(0,S.mood-10); addRenown(-5); S.guildBan=S.day+10; notes.push(`<b>Loan default:</b> the guild seized ${p} gold, mood −10, and refuses to lend for ten days`); } S.loan=null; }
  if(S.inv&&S.day>=S.inv.due){ if(Math.random()<.07){ notes.push('<b>Bad news:</b> the guild caravan you invested in was lost in the dunes'); } else { S.res.gold+=S.inv.back; notes.push(`<b>Your investment returned</b> ${S.inv.back} gold`); } S.inv=null; }
}
function guildHtml(){ const ban=(S.guildBan||0)>S.day, night=S.phase!=='day';
  return `<h4 style="margin:10px 0 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)">${T('Merchant Guild')}</h4><div class="std">${S.loan?`<span class="need">${T('Owe {{g}} gold by day {{d}}',{g:S.loan.back,d:S.loan.due})}</span><button type="button" class="gbtn" data-g="repay">${T('Repay now')}</button>`:LOANS.map(l=>`<button type="button" class="gbtn" data-g="${l.id}" ${ban||night?'disabled':''}>${T('Borrow {{a}}, repay {{b}} in {{d}} days',{a:l.amt,b:l.back,d:l.days})}</button>`).join('')}
    ${S.inv?`<span class="need">${T('Investment returns {{g}} on day {{d}}',{g:S.inv.back,d:S.inv.due})}</span>`:`<button type="button" class="gbtn" data-g="invest" ${night||S.res.gold<50?'disabled':''}>${T('Invest 50 for 58 in 6 days')}</button>`}${ban?`<span style="color:var(--foe)">${T('The guild will not lend to you until day {{d}}',{d:S.guildBan})}</span>`:''}</div>`; }
function routesHtml(){ if(!S.crowns) return ''; const ids=Object.keys(KINGS).filter(id=>!S.crowns[id].dead);
  return `<h4 style="margin:10px 0 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)">${T('Caravans to other crowns')}</h4><p class="info" style="margin:0 0 6px">${T('Each dawn a caravan carries goods to a crown you have a trade agreement with. Every crown wants different goods, and prices fall the more you send.')}</p>
    <div class="mktwrap"><table class="mkt"><tbody>${ids.map(id=>{ const ok=routeOk(id), r=(S.routes||{})[id], want=Object.entries(DEMAND[id]).sort((a,b)=>b[1]-a[1]).map(([g])=>T(g)).join(', ');
      return `<tr><td class="rt"><b style="color:${KINGS[id].color}">${T(CAPNAME[id])}</b><br><span style="color:var(--muted)">${T('wants {{g}}',{g:want})}</span></td><td>${ok?`<select data-rg="${id}">${['',...ROUTE_GOODS].map(g=>`<option value="${g}" ${r&&r.good===g?'selected':''}>${g?T(cap1(g)):T('No caravan')}</option>`).join('')}</select> <select data-ra="${id}">${[5,10,20].map(a=>`<option value="${a}" ${r&&r.amt===a?'selected':''}>${a}</option>`).join('')}</select>`:`<span style="color:var(--muted);white-space:normal">${T(S.crowns[id].war?'At war':'Needs a trade agreement')}</span>`}${ok&&r?`<br><span style="color:var(--gold)">${T('about {{g}} gold',{g:routeQuote(id,r.good,r.amt)})}</span>`:''}</td></tr>`; }).join('')}</tbody></table></div>`; }
// ---------- placement bonuses: neighbors matter ----------
function nearCount(g,x,y,types,r){ let n=0; for(let j=Math.max(0,y-r);j<=Math.min(N-1,y+r);j++)for(let i=Math.max(0,x-r);i<=Math.min(N-1,x+r);i++){ if(i===x&&j===y) continue; if(Math.max(Math.abs(i-x),Math.abs(j-y))>r) continue; const b=g[j*N+i].b; if(b&&types.includes(b.type)) n++; } return n; }
function adjBonus(type,g,x,y){ const out=[];
  if(type==='farm'){ if(nearCount(g,x,y,['farm'],1)>=2) out.push(['Field cluster','food',1]); if(nearCount(g,x,y,['well'],2)) out.push(['Irrigated from a well','food',1]); }
  if(type==='mine'&&nearCount(g,x,y,['smith','workshop'],2)) out.push(['Short haul to the forge','stone',1]);
  if(type==='lumber'&&nearCount(g,x,y,['lumber'],1)) out.push(['Crowded grove','wood',-1]);
  if(type==='workshop'&&nearCount(g,x,y,['smith'],2)) out.push(['Next to the smith','tools',1]);
  if(type==='market'){ const h=Math.min(3,nearCount(g,x,y,['house'],2)); if(h) out.push([`${h} houses nearby`,'gold',h]); }
  if(type==='tavern'&&nearCount(g,x,y,['house'],2)>=2) out.push(['Locals drink here','gold',1]);
  if(type==='pasture'&&nearCount(g,x,y,['farm'],1)) out.push(['Grazes the stubble','wool',1]);
  if(type==='house'){ const am=nearCount(g,x,y,['well','market','shrine','tavern'],2), ns=nearCount(g,x,y,['mine','smith','workshop','brewery'],1); if(am>=2) out.push(['Well served','mood',1]); if(ns) out.push(['Noisy neighbors','mood',-1]); }
  return out; }
function bonusText(type,x,y){ return adjBonus(type,S.grid,x,y).map(([t,r,v])=>`${v>0?'+':''}${v} ${r==='mood'?T('mood'):T(r)} ${T(t).toLowerCase()}`).join(' · '); }
// what dawn changed, and why: the two or three biggest ledger lines behind each shift
function dawnHtml(e){ if(!e) return ''; const sg=v=>`<b class="${v<0?'neg':v>0?'pos':''}">${v>0?'+':''}${v}</b>`, why=a=>a.map(([t,v])=>`${t} ${v>0?'+':''}${v}`).join(' · ');
  let E2=null; try{ E2=econ(); }catch(err){} const warn=[];
  if(E2&&E2.foodAfter<0) warn.push(T('Food runs short next dawn by {{n}}. Build farms or buy food.',{n:-E2.foodAfter}));
  if(E2&&E2.goldAfter<0) warn.push(T('Gold won’t cover upkeep next dawn.'));
  if(S.mood<40&&e.mood<0) warn.push(T('Mood is sliding toward unrest. Open the ledger to see why.'));
  return `<div class="rsec"><h4>${T('At dawn')}</h4>
    <div class="rr"><span>${T('Gold')}</span>${sg(e.g)}</div>${e.gl.length?`<div class="why">${why(e.gl)}</div>`:''}
    <div class="rr"><span>${T('Food')}</span>${sg(e.f)}</div>${e.fl.length?`<div class="why">${why(e.fl)}</div>`:''}
    ${e.pop?`<div class="rr"><span>${T('Villagers')}</span>${sg(e.pop)}</div>`:''}
    <div class="rr"><span>${T('Mood')}</span><span>${e.moodNow} ${sg(e.mood)}</span></div>${e.mc&&e.mood?`<div class="why">${T('Mostly: {{c}}',{c:e.mc})}</div>`:''}
    ${warn.map(w=>`<div class="rwarn">${w}</div>`).join('')}</div>`; }
function showReport(r){
  const box=$('board'); box.querySelectorAll('.report').forEach(e=>e.remove());
  const by=r.by, parts=[['hero',T('Your hero'),'#F2EADD'],['tower',T('Towers and keep'),'#F0BE4E'],['soldier',T('Soldiers'),'#5E8DFF'],['cata',T('Catapults'),'#E0904A'],['trap',T('Traps'),'#B9C6D8']].filter(p=>by[p[0]]);
  const tot=parts.reduce((a,p)=>a+by[p[0]],0)||1, mvp=parts.slice().sort((a,b)=>by[b[0]]-by[a[0]])[0];
  const el=document.createElement('div'); el.className='report'; el.setAttribute('role','status');
  el.innerHTML=`<h3><span>${T('Night {{n}} report',{n:r.day})}</span><button type="button" aria-label="${T('Close')}">×</button></h3>
    <div class="rr"><span>${T('Raiders felled')}</span><b>${r.kills}/${r.total}</b></div>
    ${parts.length?`<div class="bar">${parts.map(p=>`<i style="width:${(by[p[0]]/tot*100).toFixed(1)}%;background:${p[2]}" title="${p[1]}"></i>`).join('')}</div>${parts.map(p=>`<div class="rr"><span>${p[1]}</span><b>${by[p[0]]}</b></div>`).join('')}`:''}
    ${r.sunk?`<div class="rr"><span>${T('Pirate boats sunk')}</span><b>${r.sunk}</b></div>`:''}
    <div class="rr"><span>${T('Damage to the {{f}}',{f:T(REGIONS[r.region].fort).toLowerCase()})}</span><b>${r.keep}</b></div>
    <div class="rr"><span>${T('Buildings lost')}</span><b>${r.lost}</b></div>
    <div class="rr"><span>${T('Bounty earned')}</span><b>${r.gold}g</b></div>
    ${mvp?`<div class="mvp">★ ${T('Best defender: {{w}}',{w:mvp[1].toLowerCase()})}</div>`:''}${dawnHtml(r.eco)}`;
  el.querySelector('button').addEventListener('click',()=>el.remove());
  box.appendChild(el); setTimeout(()=>el.remove(),r.eco?16000:11000);
}
// ---------- villager requests ----------
const REQS={
  well:{text:'Could we have a well? My back aches from hauling water.',ok:()=>true,base:()=>count('well'),done:r=>count('well')>r.base,reward:{gold:8},mood:5},
  road:{text:'The paths turn to mud. Lay three roads, please.',ok:()=>S.day>=2,base:()=>count('road'),done:r=>count('road')>=r.base+3,reward:{gold:6},mood:3},
  food:{text:'I worry about the lean days. Fill the granary to 30 food.',ok:()=>S.res.food<30,base:()=>0,done:()=>S.res.food>=30,reward:{gold:6},mood:4},
  tavern:{text:'We need somewhere to gather in the evenings. Build a tavern!',ok:()=>S.day>=4&&!count('tavern'),base:()=>count('tavern'),done:r=>count('tavern')>r.base,reward:{gold:10},mood:5},
  shrine:{text:'Build a shrine so we can pray for safe nights.',ok:()=>S.day>=5&&count('shrine')<2,base:()=>count('shrine'),done:r=>count('shrine')>r.base,reward:{gold:8},mood:6},
  houses:{text:'My cousins want to move here. Build two more houses.',ok:()=>true,base:()=>count('house'),done:r=>count('house')>=r.base+2,reward:{gold:8},mood:3},
  tower:{text:'The raiders frighten the children. Build another watchtower.',ok:()=>true,base:()=>count('tower'),done:r=>count('tower')>r.base,reward:{gold:6},mood:4},
  iron:{text:'The smith is idle. Stockpile 10 iron for the forge.',ok:()=>S.mtnUnlocked&&S.res.iron<10,base:()=>0,done:()=>S.res.iron>=10,reward:{gold:12},mood:3},
  feast:{text:'It has been ages since we celebrated. Hold a feast!',ok:()=>S.day>=4&&S.feastSeason!==seasonIdx(),base:()=>S.feastDay||0,done:r=>(S.feastDay||0)>r.base,reward:{gold:5},mood:4},
  manor:{text:'Our house is bursting. Could you raise it into a manor?',ok:()=>S.day>=4&&count('house')>0,base:()=>countLvl('house',2),done:r=>countLvl('house',2)>r.base,reward:{gold:8},mood:4}};
const seasonIdx=()=>Math.floor((S.day-1)/5);
const countLvl=(t,l)=>{ let n=0; eachAll(b=>{ if(b.type===t&&(b.lvl||1)>=l) n++; }); return n; };
function newRequest(){
  const ids=Object.keys(REQS).filter(k=>k!==S.lastReq&&REQS[k].ok()); if(!ids.length) return null;
  const id=ids[(Math.random()*ids.length)|0], r=REQS[id];
  S.req={id,name:FOLK_NAMES[(Math.random()*FOLK_NAMES.length)|0],base:r.base(),until:S.day+3}; S.lastReq=id;
  return `<b>${S.req.name}</b> has a request: “${T(r.text)}”`;
}
function checkRequest(){
  const q=S.req; if(!q||S.phase!=='day') return; const r=REQS[q.id]; if(!r){ S.req=null; return; }
  if(r.done(q)){ addRenown(4); for(const k in r.reward) S.res[k]=(S.res[k]||0)+r.reward[k]; S.mood=Math.min(100,S.mood+r.mood);
    toast(T('Request fulfilled'),T('{{n}} thanks you',{n:q.name}),'♥'); say(`<b>${q.name} is delighted.</b> +${costStr(r.reward)}, mood +${r.mood}.`);
    const f=folk.find(o=>o.name===q.name); if(f) emote(f,'♥',3); S.req=null; sfx('up'); save(); }
}
function renderReq(){
  const box=$('req'), q=S.req;
  if(!q||S.over){ box.hidden=true; }
  else { const r=REQS[q.id], left=q.until-S.day+1; box.hidden=false;
    box.innerHTML=`<span class="rl">${T('Request')}</span><span class="rt"><b></b> <q></q></span><span class="rm">${T('Reward')} <b>${costStr(r.reward)}, +${r.mood} ${T('mood')}</b> · ${T(left===1?'last day':'{{n}} days left',{n:left})}</span>`;
    box.querySelector('.rt b').textContent=q.name+':'; box.querySelector('.rt q').textContent=T(r.text); }
  const tb=$('trader'), tr=S.trader;
  if(!tr||tr.day!==S.day||S.phase!=='day'||S.over||!tr.items.length){ tb.hidden=true; return; }
  tb.hidden=false; tb.innerHTML=`<span class="rl">${T('Trader')}</span><span class="rt">${T('A wandering trader has set up by the keep in The Valley until nightfall.')}</span><button type="button" id="trBtn">${T('See wares')}</button>`;
  $('trBtn').addEventListener('click',openShop);
}
// ---------- wandering trader ----------
const WARES={
  map:{name:'Prospector’s map',desc:'Marks two new ore deposits in The Valley.',cost:20},
  seeds:{name:'Desert seeds',desc:'Farms grow 2 more food for the next three dawns.',cost:15},
  banner:{name:'War banner',desc:'Your hero deals 2 more damage, for good.',cost:30},
  oil:{name:'Pitch barrels',desc:'Towers and the keep deal 1 more damage for the next two nights.',cost:18},
  mules:{name:'Pack mules',desc:'12 wood and 8 stone, delivered today.',cost:16},
  relic:{name:'Saint’s relic',desc:'Lifts your villagers’ mood by 12.',cost:22},
  ingots:{name:'Iron ingots',desc:'8 iron for your blacksmith.',cost:20},
  spyglass:{name:'Spyglass',desc:'Warships find pirate boats more often, for good.',cost:18}};
function openShop(){
  const tr=S.trader; if(!tr||tr.day!==S.day||S.phase!=='day') return;
  const opts=tr.items.map(id=>{ const w=WARES[id]; return {label:`${T(w.name)} · ${w.cost} ${T('gold')}`,sub:T(w.desc),fn:()=>buyWare(id)}; });
  opts.push({label:T('Not today'),sub:'',fn:()=>{ hideOver(); ui(); }});
  showOver(T('The wandering trader'),T('“Rare goods from far roads. Everything must go before nightfall.”'),opts);
}
function buyWare(id){
  const w=WARES[id], tr=S.trader; if(!w||!tr) return;
  if(S.res.gold<w.cost){ say(`The ${T(w.name).toLowerCase()} costs ${w.cost} gold. You have ${S.res.gold}.`); sfx('no'); hideOver(); ui(); return; }
  S.res.gold-=w.cost; tr.items=tr.items.filter(x=>x!==id);
  switch(id){
    case 'map': withRegion('home',()=>{ const c=[]; S.grid.forEach((t,i)=>{ const x=i%N,y=(i/N)|0; if(t.land&&!t.b&&!t.ore&&!t.grove&&Math.hypot(x-C,y-C)>=2) c.push(t); }); for(let k=0;k<2&&c.length;k++) c.splice((Math.random()*c.length)|0,1)[0].ore=true; }); if(S.cur==='home') buildWorld(); break;
    case 'seeds': S.seedDays=3; break;
    case 'banner': S.banner=(S.banner||0)+2; break;
    case 'oil': S.oilNights=2; break;
    case 'mules': S.res.wood+=12; S.res.stone+=8; break;
    case 'relic': S.mood=Math.min(100,S.mood+12); break;
    case 'ingots': S.res.iron+=8; break;
    case 'spyglass': S.spy=true; break;
  }
  sfx('up'); party('small'); say(`<b>Bought: ${T(w.name)}.</b> ${T(w.desc)}`); save(); hideOver(); ui();
  if(tr.items.length) openShop();
}
// ---------- feasts ----------
function holdFeast(){
  if(S.phase!=='day'||S.over||S.feastSeason===seasonIdx()) return;
  const c={food:20,gold:10}; if(!canPay(c)){ say(`A feast needs ${costStr(c)}.`); sfx('no'); return; }
  spend(c); S.feastSeason=seasonIdx(); S.feastDay=S.day; S.mood=Math.min(100,S.mood+12); addRenown(6); councilShift(10);
  for(const f of folk){ if(f.job==null&&!f.goal){ f.state='act'; f.act='dance'; f.t=6+Math.random()*4; f.after=null; emote(f,'♪',3); } }
  party('win'); sfx('dawn'); toast(T('Feast'),T('The whole town is dancing'),'♪'); say('<b>A feast!</b> Tables in the square, music until dark. Mood +12.'); save(); ui();
}
