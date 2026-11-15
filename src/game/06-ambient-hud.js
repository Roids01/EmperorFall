// ---------- ambient world effects ----------
const DUST=[], dustMat=new THREE.SpriteMaterial({map:softTex,color:0xD9B48A,transparent:true,depthWrite:false,opacity:.5});
for(let i=0;i<70;i++){ const sp=new THREE.Sprite(dustMat.clone()); sp.visible=false; scene.add(sp); DUST.push({sp,life:0}); }
let dustI=0;
function haze(x,y,k=1){ if(reduce) return; const d=DUST[dustI=(dustI+1)%DUST.length]; d.x=W2(x); d.z=W2(y); d.h=.05; d.life=d.max=.7+Math.random()*.5; d.k=k; d.vx=(Math.random()-.5)*.25; d.vz=(Math.random()-.5)*.25; d.sp.visible=true; }
function stepDust(raw){
  const col=S.kind==='mountain'?0xE8EEF5:0xD9B48A;
  for(const d of DUST){ if(d.life<=0) continue; d.life-=raw; const q=1-d.life/d.max;
    if(d.life<=0){ d.sp.visible=false; continue; }
    d.x+=d.vx*raw; d.z+=d.vz*raw; d.h+=raw*.18;
    d.sp.position.set(d.x,d.h,d.z); d.sp.scale.setScalar((.16+q*.38)*d.k); d.sp.material.opacity=(1-q)*.42*(1-nightA*.55); d.sp.material.color.setHex(col); }
}
let dustT=0;
function emitDust(raw){
  if(reduce) return; dustT-=raw; if(dustT>0) return; dustT=.12;
  const h=S.hero; if(h&&h.moving&&!h.dead&&heroHere()) haze(h.x-Math.cos(h.dir)*.15,h.y-Math.sin(h.dir)*.15,.9);
  for(const e of S.enemies) if(e.moving&&Math.random()<.12) haze(e.x,e.y,e.type==='brute'||e.type==='ram'?1.1:.7);
}
const cloudTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'), im=x.createImageData(256,256);
  const nz=mkNoise(); for(let j=0;j<256;j++)for(let i=0;i<256;i++){ const a=i/256*Math.PI*2, b=j/256*Math.PI*2;
    let v=nz?(nz.noise2D(Math.cos(a)*1.3+Math.cos(b)*.3,Math.sin(a)*1.3+Math.sin(b)*1.6)*.6+nz.noise2D(Math.cos(a)*3+Math.sin(b)*2.2,Math.sin(a)*3+Math.cos(b)*2.2)*.4):Math.sin(a*2)*Math.cos(b*3);
    v=Math.max(0,Math.min(1,(v+.05)*2.2)); const o=(j*256+i)*4; im.data[o]=im.data[o+1]=im.data[o+2]=255*v; im.data[o+3]=255; }
  x.putImageData(im,0,0); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2.2,2.2); return t; })();
const clouds=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({color:0x2A160C,alphaMap:cloudTex,transparent:true,opacity:.2,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4}));
clouds.rotation.x=-Math.PI/2; clouds.position.y=.03; clouds.renderOrder=2; scene.add(clouds);
function syncAmbient(raw,t){
  syncSeason(raw);
  const day=1-nightA;
  clouds.visible=day>.05; clouds.material.opacity=.2*day*(S.weather==='rain'||S.weather==='snow'?.55:1);
  if(!reduce){ cloudTex.offset.x+=raw*.0045; cloudTex.offset.y+=raw*.0022; }
  const wind=(S.weather==='sandstorm'?2.4:S.weather==='rain'?1.6:1);
  if(!reduce) for(const w of swayers){ const a=Math.sin(t*1.6+w.ph)*w.amp*wind+Math.sin(t*3.7+w.ph*2)*w.amp*.3; w.o.rotation.z=a; w.o.rotation.x=a*.5; }
  if(foamMesh){ foamMesh.material.uniforms.t.value=t; foamMesh.material.uniforms.night.value=nightA; }
  if(!paused){ emitDust(raw); stepDust(raw); }
}
let foamMesh=null;
const FOAM_MAT=()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{t:{value:0},night:{value:0}},
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader:'varying vec2 vUv; uniform float t,night; void main(){ float band=sin(vUv.y*18.-t*2.2+sin(vUv.x*40.)*.8)*.5+.5; band=pow(band,6.); float edge=smoothstep(0.,.25,vUv.y)*smoothstep(1.,.45,vUv.y); float a=(band*.45+smoothstep(.6,.15,vUv.y)*.3)*edge; gl_FragColor=vec4(mix(vec3(1.,.98,.92),vec3(.62,.7,.95),night),a*.5); }'});
function buildFoam(){
  foamMesh=null; if(S.kind!=='coast') return;
  const pts=[], segs=90, W=.42;
  for(let i=0;i<=segs;i++){ const fx=-1.5+i*(N+2)/segs, z=W2(shoreAt(fx)+.5);
    const z1=W2(shoreAt(fx+.05)+.5), z0=W2(shoreAt(fx-.05)+.5), dzdx=(z1-z0)/.1, nl=Math.hypot(1,dzdx), nx=-dzdx/nl, nz=1/nl;
    pts.push([W2(fx)-nx*W*.25,z-nz*W*.25,W2(fx)+nx*W*.75,z+nz*W*.75]); }
  const pos=[], uv=[], ind=[];
  pts.forEach((p,i)=>{ pos.push(p[0],-.045,p[1],p[2],-.055,p[3]); uv.push(i/segs,0,i/segs,1); if(i<segs){ const a=i*2; ind.push(a,a+1,a+2,a+1,a+3,a+2); } });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(ind);
  foamMesh=new THREE.Mesh(g,FOAM_MAT()); foamMesh.renderOrder=3; foamMesh.userData.own=true; world.add(foamMesh);
}
const puffPool=[]; for(let i=0;i<260;i++){ const m=new THREE.Mesh(BX(.07,.07,.07),M(COL.sand)); m.visible=false; scene.add(m); puffPool.push(m); }
function syncPuffs(){
  for(let i=0;i<puffPool.length;i++){
    const m=puffPool[i], p=S.puffs[i];
    if(!p){ m.visible=false; continue; }
    m.visible=true; m.material=M(p.col); m.position.set(W2(p.x),p.h,W2(p.y)); m.rotation.set(p.rot+p.life*4,p.rot,0);
    m.scale.setScalar(Math.max(.2,Math.min(1,p.life*2.2))*(p.s||1));
  }
}
const DOTS=1000;
const dots=new THREE.InstancedMesh(CY(.045,.045,.02,6),new THREE.MeshBasicMaterial({color:0xC0392B,transparent:true,opacity:.85}),DOTS);
dots.frustumCulled=false; dots.count=0; scene.add(dots);
let routes=[], routesVer=-1;
const dummy=new THREE.Object3D();
function syncRoutes(t){
  if(S.phase!=='day'||S.over){ dots.count=0; return; }
  if(routesVer!==S.ver){ routesVer=S.ver; routes=S.spawns.map(([sx,sy])=>{ const pts=[[sx,sy]]; let cx=sx,cy=sy;
    for(let i=0;i<80;i++){ const n=nextStep(cx,cy); if(!n) break; cx=n[0];cy=n[1]; pts.push([cx,cy]); if(cx===C&&cy===C) break; } return pts; }); }
  let n=0; const gap=.32, off=reduce?0:(t*.7)%gap;
  for(const pts of routes){
    for(let i=0;i<pts.length-1&&n<DOTS;i++){
      const [ax,ay]=pts[i],[bx,by]=pts[i+1]; const L=Math.hypot(bx-ax,by-ay);
      for(let d=(i===0?off+.25:off);d<L&&n<DOTS;d+=gap){
        if(i===pts.length-2&&d>L-.45) break;
        dummy.position.set(W2(ax+(bx-ax)*d/L),.02,W2(ay+(by-ay)*d/L)); dummy.updateMatrix(); dots.setMatrixAt(n++,dummy.matrix);
      }
    }
  }
  dots.count=n; dots.instanceMatrix.needsUpdate=true;
}
function syncSpawns(t){
  const key=S.phase+S.spawns.map(p=>p.join(',')).join(';');
  if(key!==spawnKey){ spawnKey=key; while(spawnGroup.children.length) spawnGroup.remove(spawnGroup.children[0]);
    if(S.phase==='day') for(const [x,y] of S.spawns){ const g=new THREE.Group();
      add(g,BX(.04,.95,.04),COL.wood,0,.47,0); g.userData.flag=add(g,BX(.32,.22,.02),0xC0392B,.17,.82,0);
      add(g,CN(.06,.1,4),COL.dark,0,1,0);
      const horiz=Math.abs(x-C)>=Math.abs(y-C);
      g.position.set(W2(x)+(horiz?Math.sign(x-C)*.32:0),0,W2(y)+(horiz?0:Math.sign(y-C)*.32)); spawnGroup.add(g); } }
  spawnGroup.children.forEach((g,i)=>{ if(g.userData.flag) g.userData.flag.rotation.y=reduce?0:Math.sin(t*4+i)*.4; });
}
const ringGeo=new THREE.RingGeometry(.975,1,96);
const rangeRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:COL.gold,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));
const minRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xC0392B,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
const selRing=new THREE.Mesh(new THREE.RingGeometry(.56,.64,4,1,Math.PI/4),new THREE.MeshBasicMaterial({color:COL.gold,side:THREE.DoubleSide,depthWrite:false}));
const hoverTile=new THREE.Mesh(new THREE.PlaneGeometry(.94,.94),new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:.28,depthWrite:false}));
for(const m of [rangeRing,minRing,selRing,hoverTile]){ m.rotation.x=-Math.PI/2; m.position.y=.025; m.visible=false; scene.add(m); }
function showRange(x,y,w){
  if(!w){ rangeRing.visible=minRing.visible=false; return; }
  rangeRing.visible=true; rangeRing.position.set(W2(x),.03,W2(y)); rangeRing.scale.set(w.range,w.range,1);
  minRing.visible=!!w.min; if(w.min){ minRing.position.set(W2(x),.03,W2(y)); minRing.scale.set(w.min,w.min,1); }
}
const ghostMats=new Map(), ghostBad=new THREE.MeshBasicMaterial({color:0xE04848,transparent:true,opacity:.07,depthWrite:false});
const edgeCache=new Map(), edgeMat=new THREE.LineBasicMaterial({color:0xFF4A3D,transparent:true,opacity:.95});
function edgesOf(g){ let e=edgeCache.get(g); if(!e){ e=new THREE.EdgesGeometry(g,40); edgeCache.set(g,e); } return e; }
function ghostMat(m){ let g=ghostMats.get(m); if(!g){ g=m.clone(); g.transparent=true; g.opacity=.55; g.depthWrite=false; ghostMats.set(m,g); } return g; }
function syncGhost(){
  let show=false; const d=DEF[S.tool];
  if(hover&&d&&S.phase==='day'&&!S.over&&!S.modal&&!(drag&&dragged)){
    const [hx,hy]=hover, t=G(hx,hy);
    if(t.land&&!t.b&&!S.hero.queue.some(q=>q.x===hx&&q.y===hy)){
      show=true;
      const ok=!buildError(S.tool,hx,hy,true), key=S.tool+ok+ASSET.ready+(S.tool==='wall'?hx+','+hy:'');
      if(key!==ghostKey){ if(ghost) scene.remove(ghost); ghostKey=key;
        ghost=modelFor({type:S.tool,lvl:1,hp:1,max:1,day:S.day,charges:1},hx,hy);
        if(ghost.userData.flame) ghost.userData.flame.visible=false;
        if(ghost.userData.worker) ghost.userData.worker.visible=false;
        const meshes=[]; ghost.traverse(o=>{ if(o.isMesh&&o.visible) meshes.push(o); });
        for(const o of meshes){ o.castShadow=false; o.receiveShadow=false; o.material=ok?ghostMat(o.material):ghostBad; if(!ok) o.add(new THREE.LineSegments(edgesOf(o.geometry),edgeMat)); }
        scene.add(ghost); }
      ghost.position.set(W2(hx),0,W2(hy)); ghost.visible=true;
    }
  }
  if(!show&&ghost) ghost.visible=false;
}
function syncSelection(){
  selRing.visible=false; hoverTile.visible=false; let ranged=false;
  if(sel&&G(...sel).b){ selRing.visible=true; selRing.position.set(W2(sel[0]),.03,W2(sel[1])); const w=weapon(G(...sel).b); if(w){showRange(sel[0],sel[1],w);ranged=true} }
  if(hover&&S.phase==='day'&&!S.over&&!S.modal){
    const [hx,hy]=hover, t=G(hx,hy);
    if(t.land){
      hoverTile.visible=true; hoverTile.position.set(W2(hx),.03,W2(hy));
      const d=DEF[S.tool];
      let ok=true;
      if(d&&!t.b) ok=!buildError(S.tool,hx,hy,true);
      hoverTile.material.color.setHex(ok?0xFFFFFF:0xC0392B); hoverTile.material.opacity=ok?.28:.35;
      if(d&&!t.b&&ok){ const w=weapon({type:S.tool,lvl:1}); if(w){showRange(hx,hy,w);ranged=true} }
    }
  }
  if(!ranged) showRange(0,0,null);
}

let BW=0,BH=0,dpr=1,dprCap=2,quality='high',qualityChosen=false,composer=null,bloom=null,finish=null;
function resize(){
  const r=$('board').getBoundingClientRect(); if(!r.width) return;
  BW=r.width; BH=r.height; dpr=Math.max(.75,Math.min(dprCap,window.devicePixelRatio||1)*renderScale);
  renderer.setPixelRatio(dpr); renderer.setSize(BW,BH,false);
  if(composer){ composer.setPixelRatio(dpr); composer.setSize(BW,BH); if(finish) finish.uniforms.res.value.set(BW*dpr,BH*dpr); }
  hud.width=Math.round(BW*dpr); hud.height=Math.round(BH*dpr);
  aspect=BW/BH; farHH=Math.max(5.5,6.5/aspect)*1.38; zoomHH=Math.min(zoomHH,farHH); if(!curHH) curHH=viewNear?zoomHH:farHH;
}
new ResizeObserver(resize).observe($('board'));
const ray=new THREE.Raycaster(), plane=new THREE.Plane(new THREE.Vector3(0,1,0),0), hitV=new THREE.Vector3(), ndc=new THREE.Vector2();
function tileAt(ev){
  const r=glc.getBoundingClientRect();
  ndc.set((ev.clientX-r.left)/r.width*2-1,-((ev.clientY-r.top)/r.height*2-1));
  ray.setFromCamera(ndc,camera); if(!ray.ray.intersectPlane(plane,hitV)) return null;
  const x=Math.round(hitV.x)+C, y=Math.round(hitV.z)+C;
  return inb(x,y)?[x,y]:null;
}
const pv=new THREE.Vector3();
function scr(x,y,z){ pv.set(x,y,z).project(camera); return [(pv.x+1)/2*BW,(1-pv.y)/2*BH]; }

const DAY={sun:new THREE.Color(0xFFF1DA),sky:new THREE.Color(0xFFF2DE),gnd:new THREE.Color(0xB2644A)};
const NIGHT={sun:new THREE.Color(0xA9C0FF),sky:new THREE.Color(0x7C96E0),gnd:new THREE.Color(0x2C3870)};
const BGM=new THREE.Color(0x56616E), BGD=new THREE.Color(0x7A3A2B), BGN=new THREE.Color(0x1C2A5E), DUSK=new THREE.Color(0xFF8A4A), DUSKBG=new THREE.Color(0x9A4630);
let goldK=0;
function syncLight(t){
  const k=nightA;
  scene.background.copy(S.kind==='mountain'?BGM:BGD).lerp(BGN,k);
  const dk=reduce?0:Math.pow(Math.sin(k*Math.PI),.8)*.95;   // golden hour on the way in and out of night
  goldK=dk;
  scene.background.lerp(DUSKBG,dk*.5);
  sun.intensity=.86-.44*k; sun.color.copy(DAY.sun).lerp(NIGHT.sun,k).lerp(DUSK,dk);
  hemi.intensity=.62-.1*k; hemi.color.copy(DAY.sky).lerp(NIGHT.sky,k); hemi.groundColor.copy(DAY.gnd).lerp(NIGHT.gnd,k);
  if(waterMesh&&waterMesh.material.uniforms){ const U=waterMesh.material.uniforms; U.sunColor.value.setHex(0xFFF1DA).lerp(new THREE.Color(0x5A6AA0),k); U.waterColor.value.setHex(0x1E6A78).lerp(new THREE.Color(0x0C2240),k); }
  sun.position.set(camTarget.x+10-k*16+dk*6,16-k*4-dk*10.5,camTarget.z+5-dk*3); sun.target.position.set(camTarget.x,0,camTarget.z);
  const sr=camera===chaseCam?13:curHH*Math.max(aspect,1)*1.2+3, sc=sun.shadow.camera;
  if(Math.abs(sc.right-sr)>.1){ sc.left=-sr; sc.right=sr; sc.top=sr; sc.bottom=-sr; sc.updateProjectionMatrix(); }
  const srcs=[]; each((b,x,y)=>{ if(b.type==='keep'||b.type==='tower'||b.type==='cata') srcs.push([b.type,x,y]); });
  srcs.sort((a,b)=>Math.hypot(a[1]-C,a[2]-C)-Math.hypot(b[1]-C,b[2]-C));
  if(S.hero&&!S.hero.dead&&heroHere()) srcs.splice(1,0,['hero',S.hero.x,S.hero.y]);
  torches.forEach((l,i)=>{ const s=srcs[i]; if(!s||k<.02){ l.intensity=0; return; }
    if(s[0]==='hero'){ l.position.set(W2(s[1]),.9,W2(s[2])); l.intensity=k*1.3; l.distance=2.6; return; }
    l.position.set(W2(s[1])+(s[0]==='tower'?.29:0),s[0]==='tower'?1.2:.9,W2(s[2])+(s[0]==='tower'?.29:.4));
    l.intensity=k*(s[0]==='keep'?1.6:1.25)*(reduce?1:1+Math.sin(t*11+i*2)*.06); l.distance=s[0]==='keep'?4.2:3.2; });
}
function bar(x,y,w,f,col){ hctx.fillStyle='rgba(28,23,20,.75)'; hctx.fillRect(x-1,y-1,w+2,5); hctx.fillStyle=col; hctx.fillRect(x,y,w*Math.max(0,f),3); }
let viewNear=true, camFree=null, aspect=1.6, farHH=8, curHH=0, drag=null, dragged=false;
let zoomHH=3.4, camVel=null; const SIN58=Math.sin(58*Math.PI/180), ZMIN=2.2;
function updateCamera(raw){
  const want=viewNear?zoomHH:farHH;
  curHH+=(want-curHH)*Math.min(1,raw*(reduce?30:5));
  const ax=(KD.arrowright?1:0)-(KD.arrowleft?1:0), az=(KD.arrowdown?1:0)-(KD.arrowup?1:0);
  if(ax||az){ if(!viewNear) toggleView(); camFree=camFree||{x:camTarget.x,y:camTarget.z}; const sp=curHH*1.4*raw; camFree.x+=ax*sp; camFree.y+=az*sp/SIN58; camVel=null; }
  if(camFree&&camVel&&!drag){ camFree.x+=camVel.x*raw; camFree.y+=camVel.y*raw; const f=Math.exp(-raw*5); camVel.x*=f; camVel.y*=f; if(Math.hypot(camVel.x,camVel.y)<.05) camVel=null; }
  if(camFree){ const L=C+.5; camFree.x=Math.max(-L,Math.min(L,camFree.x)); camFree.y=Math.max(-L,Math.min(L,camFree.y)); }
  let tx=0,tz=.35;
  if(viewNear){ if(camFree){ tx=camFree.x; tz=camFree.y; } else if(S.hero&&heroHere()){ tx=W2(S.hero.x); tz=W2(S.hero.y)+.3; } }
  const lim=C+.5; tx=Math.max(-lim,Math.min(lim,tx)); tz=Math.max(-lim,Math.min(lim,tz));
  const k=Math.min(1,raw*(reduce?30:camFree?12:3.5));
  camTarget.x+=(tx-camTarget.x)*k; camTarget.z+=(tz-camTarget.z)*k;
  orthoCam.left=-curHH*aspect; orthoCam.right=curHH*aspect; orthoCam.top=curHH; orthoCam.bottom=-curHH; orthoCam.updateProjectionMatrix();
}
function toggleView(){ viewNear=!viewNear; camFree=null; $('view').setAttribute('aria-pressed',!viewNear); $('view').setAttribute('aria-label',viewNear?'Show whole valley':'Follow hero'); }
// falling specks and embers live in screen space over the 3D view
const SPECKS=[]; for(let i=0;i<90;i++) SPECKS.push({x:Math.random(),y:Math.random(),v:.008+Math.random()*.02,s:.6+Math.random()*1.4,ph:Math.random()*6.28});
function stepFx(raw){
  for(const f of FX){ f.x+=f.vx*raw; f.y+=f.vy*raw; f.vx*=.94; f.vy*=.94; f.h+=f.vh*raw; f.vh-=5*raw; if(f.h<.03){f.h=.03;f.vh*=-.3} f.life-=raw; }
  for(let i=FX.length-1;i>=0;i--) if(FX[i].life<=0) FX.splice(i,1);
  if(!reduce) for(const p of SPECKS){ p.y+=p.v*raw; p.x+=Math.sin(clock*.6+p.ph)*.0004; if(p.y>1){p.y=0;p.x=Math.random()} }
}
const gradeEl=$('grade'), mc=$('mini'), mx=mc.getContext('2d');
const mixHex=(a,b,k)=>{ const A=new THREE.Color(a),B=new THREE.Color(b); return '#'+A.lerp(B,k).getHexString(); };
function drawMini(){
  const r=mc.getBoundingClientRect(); if(!r.width) return; const s=Math.round(r.width*dpr); if(mc.width!==s){ mc.width=mc.height=s; }
  mx.setTransform(1,0,0,1,0,0); mx.clearRect(0,0,s,s);
  const pad=s*.07, cs=(s-2*pad)/N, P=v=>pad+(v+.5)*cs;
  if(S.kind==='coast'){ mx.fillStyle=mixHex('#3E7E92','#22386E',nightA); for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(G(x,y).water) mx.fillRect(pad+x*cs,pad+y*cs,cs+.6,cs+.6); }
  mx.fillStyle=mixHex(S.kind==='mountain'?'#C9D2DC':'#C98A55','#4D68B8',nightA);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(G(x,y).land) mx.fillRect(pad+x*cs,pad+y*cs,cs+.6,cs+.6);
  S.grid.forEach((t,i)=>{ const x=i%N,y=(i/N)|0;
    if(t.b){ mx.fillStyle=t.b.type==='keep'?'#F0BE4E':t.b.type==='wall'?mixHex('#7A5A44','#2A3460',nightA):mixHex('#F2EADD','#B9C6F0',nightA); const k=t.b.type==='keep'?.05:.2; mx.fillRect(pad+(x+k)*cs,pad+(y+k)*cs,cs*(1-2*k),cs*(1-2*k)); }
    else if(t.grove){ mx.fillStyle='#4E6A2C'; mx.beginPath(); mx.arc(P(x),P(y),cs*.25,0,6.29); mx.fill(); }
    else if(t.ore){ mx.fillStyle='#6C7B8E'; mx.beginPath(); mx.arc(P(x),P(y),cs*.22,0,6.29); mx.fill(); } });
  { const pr=(x,y,t0)=>{ const a=S.t-t0; if(a<0||a>1.6) return; mx.strokeStyle=`rgba(240,190,78,${1-a/1.6})`; mx.lineWidth=Math.max(1.2,dpr*1.4); mx.beginPath(); mx.arc(P(x),P(y),cs*(.4+a*1.4),0,6.29); mx.stroke(); };
    S.grid.forEach((t,i)=>{ if(t.b&&t.b.hitT!=null) pr(i%N,(i/N)|0,t.b.hitT); }); if(S.keepHitT!=null) pr(C,C,S.keepHitT); }
  for(const pg of NET.pings){ const a=clock-pg.t; if(a>3) continue; mx.strokeStyle=pg.who==='me'?'#86B6FF':'#C77DFF'; mx.lineWidth=Math.max(1.5,dpr*1.6); mx.beginPath(); mx.arc(P(pg.x),P(pg.y),cs*(.5+(a%1)*1.2),0,6.29); mx.stroke(); }
  if(S.phase==='day'){ mx.fillStyle='#E04848'; for(const [x,y] of S.spawns){ mx.beginPath(); mx.arc(P(x),P(y),cs*.3,0,6.29); mx.fill(); } }
  const dot=(x,y,r,c)=>{ mx.fillStyle=c; mx.beginPath(); mx.arc(P(x),P(y),r,0,6.29); mx.fill(); };
  for(const e of S.enemies) dot(e.x,e.y,Math.max(1.6*dpr,cs*(e.type==='warlord'?.3:.18)),'#FF4A3D');
  for(const u of S.units) dot(u.x,u.y,Math.max(1.4*dpr,cs*.15),'#5E8DFF');
  if(S.hero&&!S.hero.dead&&heroHere()){ dot(S.hero.x,S.hero.y,Math.max(2.4*dpr,cs*.26),'#1A1A24'); dot(S.hero.x,S.hero.y,Math.max(1.7*dpr,cs*.19),'#FFFFFF'); }
  if(camera===chaseCam&&S.hero){ const a=chYaw; mx.strokeStyle='rgba(255,255,255,.8)'; mx.lineWidth=Math.max(1.5,dpr*1.5); mx.beginPath(); mx.moveTo(P(S.hero.x),P(S.hero.y)); mx.lineTo(P(S.hero.x+Math.cos(a-.5)*4),P(S.hero.y+Math.sin(a-.5)*4)); mx.moveTo(P(S.hero.x),P(S.hero.y)); mx.lineTo(P(S.hero.x+Math.cos(a+.5)*4),P(S.hero.y+Math.sin(a+.5)*4)); mx.stroke(); }
  else if(viewNear){ const hw=curHH*aspect, hd=curHH/SIN58;
    mx.strokeStyle='rgba(255,255,255,.7)'; mx.lineWidth=Math.max(1,dpr);
    mx.strokeRect(P(camTarget.x-hw+C),P(camTarget.z-hd+C),hw*2*cs,hd*2*cs); }
}
const WXP=[]; for(let i=0;i<170;i++) WXP.push({x:Math.random(),y:Math.random(),v:.55+Math.random()*.9,s:Math.random(),p:Math.random()*6.28});
function drawWeather(){
  const w=S.kind==='mountain'?'snow':S.weather, sea=season();
  if(sea.name==='Winter'){ hctx.fillStyle='rgba(215,230,255,.07)'; hctx.fillRect(0,0,BW,BH); }
  if(w==='clear') return;
  const mv=reduce?0:FR;
  if(w==='rain'){
    hctx.fillStyle='rgba(50,70,100,.12)'; hctx.fillRect(0,0,BW,BH);
    hctx.strokeStyle='rgba(205,222,255,.42)'; hctx.lineWidth=1; hctx.beginPath();
    for(const p of WXP){ p.y+=mv*1.7*p.v; p.x+=mv*.22; if(p.y>1){p.y-=1;p.x=Math.random()} if(p.x>1)p.x-=1; const X=p.x*BW,Y=p.y*BH; hctx.moveTo(X,Y); hctx.lineTo(X-3.5,Y-13*p.v); }
    hctx.stroke();
  }else if(w==='sandstorm'){
    hctx.fillStyle=`rgba(205,140,80,${.16+nightA*.1})`; hctx.fillRect(0,0,BW,BH);
    hctx.strokeStyle='rgba(235,185,125,.5)'; hctx.lineWidth=1.2; hctx.beginPath();
    for(const p of WXP){ p.x+=mv*.9*p.v; p.y+=mv*.06*Math.sin(p.p+clock); if(p.x>1){p.x-=1;p.y=Math.random()} const X=p.x*BW,Y=p.y*BH; hctx.moveTo(X,Y); hctx.lineTo(X-14*p.v,Y-1.5); }
    hctx.stroke();
  }else if(w==='snow'){
    hctx.fillStyle='rgba(220,232,255,.06)'; hctx.fillRect(0,0,BW,BH);
    hctx.fillStyle='rgba(255,255,255,.85)';
    for(const p of WXP){ p.y+=mv*.12*p.v; p.x+=mv*.03*Math.sin(clock*1.3+p.p); if(p.y>1){p.y-=1;p.x=Math.random()} hctx.beginPath(); hctx.arc(p.x*BW,p.y*BH,.8+p.s*1.7,0,6.29); hctx.fill(); }
  }
}
function drawHud(){
  hctx.setTransform(dpr,0,0,dpr,0,0); hctx.clearRect(0,0,BW,BH);
  const u=Math.max(26,BW/16)*(farHH/Math.max(curHH,1))*.75;
  if(nightA>.03){ hctx.fillStyle='#FFFFFF'; for(const p of SPECKS){ hctx.globalAlpha=nightA*(.35+.45*(Math.sin(clock*2+p.ph)+1)/2); hctx.fillRect(p.x*BW,p.y*BH,p.s,p.s); } hctx.globalAlpha=1; }
  drawWeather();
  hctx.lineCap='round';
  for(const s of S.shots){ if(s.kind!=='arrow'&&s.kind!=='earrow') continue; const red=s.kind==='earrow'; const [ax,ay]=scr(W2(s.x),s.h,W2(s.y)); const [bx,by]=scr(W2(s.x-Math.cos(s.dir)*.7),s.h+.12,W2(s.y-Math.sin(s.dir)*.7));
    const g=hctx.createLinearGradient(ax,ay,bx,by); g.addColorStop(0,red?'rgba(255,120,100,.95)':'rgba(255,250,235,.95)'); g.addColorStop(1,red?'rgba(255,120,100,0)':'rgba(255,250,235,0)'); hctx.strokeStyle=g; hctx.lineWidth=1.6; hctx.beginPath(); hctx.moveTo(ax,ay); hctx.lineTo(bx,by); hctx.stroke(); }
  if(FX.length){ hctx.globalCompositeOperation='lighter';
    for(const f of FX){ const [px,py]=scr(W2(f.x),f.h,W2(f.y)); const r=Math.max(1.2,(1.4+f.life*2.6)*(u/40));
      hctx.globalAlpha=Math.min(1,f.life*1.6); hctx.fillStyle=`hsl(${f.hue},100%,62%)`; hctx.beginPath(); hctx.arc(px,py,r,0,6.29); hctx.fill();
      hctx.globalAlpha*=.25; hctx.beginPath(); hctx.arc(px,py,r*2.6,0,6.29); hctx.fill(); }
    hctx.globalCompositeOperation='source-over'; hctx.globalAlpha=1; }
  if(S.warName) for(const e of S.enemies){ if(e.type!=='warlord'||e.gone) continue; const [px,py]=scr(W2(e.px??e.x),1.25,W2(e.py??e.y)); hctx.font='700 12px Inter, system-ui, sans-serif'; hctx.textAlign='center'; hctx.textBaseline='middle'; hctx.lineWidth=3; hctx.strokeStyle='rgba(20,14,12,.85)'; hctx.strokeText(S.warName,px,py-12); hctx.fillStyle='#FF8A7A'; hctx.fillText(S.warName,px,py-12); }
  for(const e of S.enemies){ if(e.gone||!e.plan||!e.plan.mode||(e.type!=='warlord'&&e.type!=='captain')) continue; const [px,py]=scr(W2(e.px??e.x),1.25,W2(e.py??e.y)); const L2={breach:T('Breaching'),flank:T('Flanking'),retreat:T('Retreating'),rally:T('Rallying')}[e.plan.mode]; if(!L2) continue;
    hctx.font='600 10.5px Inter, system-ui, sans-serif'; hctx.textAlign='center'; hctx.textBaseline='middle'; const w=hctx.measureText(L2).width+12, yy=py-(e.type==='warlord'&&S.warName?27:12); hctx.fillStyle='rgba(20,14,12,.85)'; hctx.beginPath(); if(hctx.roundRect) hctx.roundRect(px-w/2,yy-8,w,16,8); else hctx.rect(px-w/2,yy-8,w,16); hctx.fill(); hctx.fillStyle=e.plan.mode==='retreat'?'#B9CCF0':'#FFB27A'; hctx.fillText(L2,px,yy+.5); }
  for(const e of S.enemies){ if(e.rallyT>0&&!e.gone){ const [px,py]=scr(W2(e.px??e.x),.05,W2(e.py??e.y)); hctx.strokeStyle='rgba(255,150,80,.55)'; hctx.lineWidth=1.5; hctx.beginPath(); hctx.ellipse(px,py,u*.22,u*.12,0,0,6.29); hctx.stroke(); } }
  for(const e of S.enemies){ if(e.hp>=e.max) continue; const s=e.type==='warlord'?1.55:e.type==='brute'?1.1:1; const [px,py]=scr(W2(e.px??e.x),.68*s,W2(e.py??e.y)); bar(px-u*.35,py-6,u*.7,e.hp/e.max,CSS.foe); }
  each((b,x,y)=>{
    if(b.type==='keep'){ if(S.keep<S.keepMax){ const [px,py]=scr(W2(x),1.5,W2(y)); bar(px-u*.6,py-6,u*1.2,S.keep/S.keepMax,S.keep<=3?CSS.foe:CSS.gold); } return; }
    if(b.type==='trap'||b.hp>=b.max) return;
    const h=b.type==='tower'?1.4+.18*b.lvl:.8; const [px,py]=scr(W2(x),h,W2(y)); bar(px-u*.4,py-6,u*.8,b.hp/b.max,b.hp/b.max<.35?CSS.foe:CSS.ink);
  });
  const h=S.hero;
  if(h&&!h.dead&&heroHere()&&(h.hp<h.max||S.phase==='night')){ const [px,py]=scr(W2(h.x),1.05,W2(h.y)); bar(px-u*.4,py-6,u*.8,h.hp/h.max,'#86B6FF'); }
  for(const un of S.units){ if(un.hp>=un.max) continue; const [px,py]=scr(W2(un.x),.62,W2(un.y)); bar(px-u*.25,py-6,u*.5,un.hp/un.max,'#86B6FF'); }
  if(h&&h.dead&&heroHere()){ const [px,py]=scr(W2(C),1.9,W2(C)); hctx.font=`600 ${Math.round(Math.max(12,u*.36))}px Inter, system-ui, sans-serif`; hctx.textAlign='center'; hctx.lineWidth=4; hctx.strokeStyle=CSS.dark; const tx=`Hero back in ${Math.ceil(h.respawn)}s`; hctx.strokeText(tx,px,py); hctx.fillStyle='#86B6FF'; hctx.fillText(tx,px,py); }
  if(S.phase==='day'&&h&&!h.dead&&h.queue.length){
    hctx.setLineDash([4,5]); hctx.strokeStyle='rgba(240,190,78,.85)'; hctx.lineWidth=2; hctx.beginPath();
    let [ox,oy]=scr(W2(h.x),.05,W2(h.y)); hctx.moveTo(ox,oy);
    for(const q of h.queue){ const [qx,qy]=scr(W2(q.x),.05,W2(q.y)); hctx.lineTo(qx,qy); }
    hctx.stroke(); hctx.setLineDash([]);
    hctx.font=`700 11px Inter, system-ui, sans-serif`; hctx.textAlign='center'; hctx.textBaseline='middle';
    h.queue.forEach((q,i)=>{ const [qx,qy]=scr(W2(q.x),.05,W2(q.y)); hctx.fillStyle='rgba(28,23,20,.9)'; hctx.beginPath(); hctx.arc(qx,qy,9,0,6.29); hctx.fill();
      hctx.strokeStyle=CSS.gold; hctx.lineWidth=1.5; hctx.stroke(); hctx.fillStyle=CSS.gold; hctx.fillText(String(i+1),qx,qy+.5); });
  }
  if(hover&&!S.modal&&!S.over&&!(drag&&dragged)){
    const [hx,hy]=hover, t=G(hx,hy); let txt='', bad=false;
    if(t.land){
      if(t.b) txt=t.b.type==='wall'?(t.b.lvl>1?'Stone wall':'Palisade'):DEF[t.b.type].name+(t.b.type!=='keep'&&t.b.type!=='trap'?` · ${t.b.hp}/${t.b.max}`:'');
      else if(S.phase==='day'&&DEF[S.tool]){ const err=buildError(S.tool,hx,hy,true); if(err){ txt=cap1(err); bad=true; } else { const bt=bonusText(S.tool,hx,hy); txt=`${T(DEF[S.tool].name)} · ${costStr(DEF[S.tool].cost)}${bt?' · '+bt:''}`; } }
      else if(t.ore) txt='Ore'; else if(t.grove) txt='Grove';
    }
    if(txt){ const [px,py]=scr(W2(hx),.9,W2(hy)); hctx.font=`500 12px Inter, system-ui, sans-serif`; hctx.textAlign='center'; hctx.textBaseline='middle';
      const w=Math.min(BW-16,hctx.measureText(txt).width+16), x=Math.max(8+w/2,Math.min(BW-8-w/2,px)), y=Math.max(14,py-14);
      hctx.fillStyle='rgba(28,23,20,.9)'; hctx.beginPath(); if(hctx.roundRect) hctx.roundRect(x-w/2,y-11,w,22,11); else hctx.rect(x-w/2,y-11,w,22); hctx.fill();
      hctx.fillStyle=bad?'#FF8A7A':CSS.ink; hctx.fillText(txt,x,y+.5,w-12); }
  }
  hctx.textAlign='center'; hctx.textBaseline='middle'; hctx.font=`700 ${Math.round(Math.max(13,u*.42))}px Inter, system-ui, sans-serif`;
  for(const f of S.floats){ const rise=(1.2-f.life)*.9; const [px,py]=scr(W2(f.x),.9+rise,W2(f.y));
    hctx.globalAlpha=Math.min(1,f.life*1.8); hctx.lineWidth=4; hctx.strokeStyle=CSS.dark; hctx.strokeText(f.text,px,py); hctx.fillStyle=f.col; hctx.fillText(f.text,px,py); }
  hctx.globalAlpha=1;
  if(flash>0){ const g=hctx.createRadialGradient(BW/2,BH/2,Math.min(BW,BH)*.25,BW/2,BH/2,Math.max(BW,BH)*.75); g.addColorStop(0,'rgba(200,40,30,0)'); g.addColorStop(1,`rgba(200,40,30,${flash*.7})`); hctx.fillStyle=g; hctx.fillRect(0,0,BW,BH); }
  if(nightA>.02){ const g=hctx.createRadialGradient(BW/2,BH/2,Math.min(BW,BH)*.35,BW/2,BH/2,Math.max(BW,BH)*.8); g.addColorStop(0,'rgba(10,12,30,0)'); g.addColorStop(1,`rgba(8,12,40,${nightA*.32})`); hctx.fillStyle=g; hctx.fillRect(0,0,BW,BH); }
  drawDanger(); drawBigScore(); drawPings(); drawEdgeMarks(); drawHudBanner();
  if(paused&&!S.modal&&!S.over){ hctx.fillStyle='rgba(28,23,20,.45)'; hctx.fillRect(0,0,BW,BH); hctx.fillStyle=CSS.ink; hctx.font=`800 ${Math.round(u*.9)}px "Bricolage Grotesque", system-ui, sans-serif`; hctx.fillText('Paused',BW/2,BH/2); }
}
function initBloom(){
  if(composer||!THREE.EffectComposer||!THREE.UnrealBloomPass||!BW) return;
  try{
    const w=Math.max(1,Math.round(BW*dpr)), h=Math.max(1,Math.round(BH*dpr));
    const rt=new THREE.WebGLRenderTarget(w,h,{samples:isSmall?2:4,type:THREE.HalfFloatType});
    composer=new THREE.EffectComposer(renderer,rt); composer.setPixelRatio(dpr); composer.setSize(BW,BH);
    renderPassRef=new THREE.RenderPass(scene,camera); composer.addPass(renderPassRef);
    bloom=new THREE.UnrealBloomPass(new THREE.Vector2(BW,BH),0,.45,.84); composer.addPass(bloom);
    finish=new THREE.ShaderPass({uniforms:{tDiffuse:{value:null},res:{value:new THREE.Vector2(BW*dpr,BH*dpr)},tilt:{value:.8},vig:{value:.32},warm:{value:.3},sat:{value:1.08}},
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 res; uniform float tilt,vig,warm,sat; varying vec2 vUv;
        vec4 tap(vec2 o){ return texture2D(tDiffuse,vUv+o); }
        void main(){ vec4 c=tap(vec2(0.)); float b=smoothstep(.16,.5,abs(vUv.y-.5))*tilt;
          if(b>.002){ vec2 p=b*2.2/res, q=p*2.2; vec4 a=c+tap(vec2(p.x,0.))+tap(vec2(-p.x,0.))+tap(vec2(0.,p.y))+tap(vec2(0.,-p.y))+tap(p)+tap(-p)+tap(vec2(p.x,-p.y))+tap(vec2(-p.x,p.y));
            a+=tap(vec2(q.x,0.))+tap(vec2(-q.x,0.))+tap(vec2(0.,q.y))+tap(vec2(0.,-q.y)); c=a/13.; }
          vec3 col=c.rgb; float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,sat); col=(col-.5)*1.05+.5;
          col*=mix(vec3(1.),vec3(1.09,.97,.84),warm);
          float d=distance(vUv,vec2(.5,.47)); col*=1.-vig*smoothstep(.32,.86,d);
          gl_FragColor=vec4(col,c.a); }`});
    composer.addPass(finish);
    mirPass=new THREE.ShaderPass(MIR_POST); mirPass.enabled=false; composer.addPass(mirPass);
  }catch(e){ composer=null; quality='low'; }
}
function applyQuality(){
  const hi=quality==='high'; dprCap=hi?2:1;
  const ms=hi?(isSmall?1024:2048):1024; sun.shadow.mapSize.set(ms,ms); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; }
  resize(); if(S&&world) buildGrass(); $('qual').textContent=T(hi?'High':'Low'); $('qual').setAttribute('aria-label',`Graphics quality: ${hi?'high':'low'}`);
}
// ---------- heads-up display ----------
let hudKey='', hudBanner=null, abReady={c:true,r:true};
function syncHud(){
  const h=S.hero, night=S.phase==='night', left=S.enemies.length+S.queue.length, tot=Math.max(1,S.nightTotal||0,left);
  const kf=Math.max(0,S.keep)/Math.max(1,S.keepMax), hf=h&&!h.dead?h.hp/h.max:0;
  const key=[S.keep,S.keepMax,night,left,tot,Math.round(hf*40),h&&h.dead,speed,paused,lang,S.day,S.won,S.phase,Math.ceil(S.fever||0),Math.round((S.feverM||0)*40)].join('|'); if(key===hudKey) return; hudKey=key;
  const kp=$('kpf'); kp.style.width=(kf*100)+'%'; kp.style.background=kf<=.3?'#E8604F':kf<=.6?'#E0904A':'';
  $('cHp').classList.toggle('low',night&&kf<=.3&&S.keep>0);
  $('cHp').title=T('Keep {{a}} of {{b}}',{a:Math.max(0,S.keep),b:S.keepMax});
  $('hhpf').style.width=(hf*100)+'%'; $('hhpf').style.background=hf<=.3?'#E8604F':'';
  $('wbar').hidden=!night;
  $('day').textContent=night?T('Night {{n}}',{n:S.day})+' · '+T('{{n}} left',{n:left}):(S.phase==='night'?T('Night {{n}}',{n:S.day}):T('Day {{n}}',{n:S.day}))+(S.won?'':T(' of {{n}}',{n:WIN_NIGHTS}));
  if(night) $('wpf').style.width=(100*(1-left/tot))+'%';
  { const fv=$('cFever'), on=S.fever>0; fv.hidden=!(S.phase==='night'&&(on||(S.feverM||0)>0)); fv.classList.toggle('on',on); $('fvt').textContent=on?T('Fever {{n}}s',{n:Math.ceil(S.fever)}):T('Fever'); $('fvf').style.width=(on?S.fever/10*100:(S.feverM||0)*100)+'%'; }
  $('cSpd').hidden=!(paused||speed>1); $('spd').textContent=paused?T('Paused'):speed+'×';
}
function showHudBanner(title,sub,col){ hudBanner={t:clock,title,sub,col:col||CSS.ink}; }
function drawHudBanner(){
  if(!hudBanner) return; const a=clock-hudBanner.t, life=3.2; if(a>life){ hudBanner=null; return; }
  const al=Math.min(1,a/.3,(life-a)/.6), u=Math.max(26,BW/16), y=Math.max(BH*.3,chipsBottom()+u*.9)-(reduce?0:Math.max(0,.3-a)*30);
  hctx.save(); hctx.globalAlpha=al; hctx.textAlign='center'; hctx.textBaseline='middle';
  const g=hctx.createLinearGradient(0,0,BW,0); g.addColorStop(0,'rgba(18,14,12,0)'); g.addColorStop(.25,'rgba(18,14,12,.72)'); g.addColorStop(.75,'rgba(18,14,12,.72)'); g.addColorStop(1,'rgba(18,14,12,0)');
  hctx.fillStyle=g; hctx.fillRect(0,y-u*.95,BW,u*1.9);
  hctx.font=`800 ${Math.round(u*.85)}px "Bricolage Grotesque", system-ui, sans-serif`; hctx.fillStyle=hudBanner.col; hctx.fillText(hudBanner.title,BW/2,y-u*.22);
  hctx.font=`500 ${Math.round(Math.max(12,u*.34))}px Inter, system-ui, sans-serif`; hctx.fillStyle='rgba(242,234,221,.85)'; hctx.fillText(hudBanner.sub,BW/2,y+u*.45,BW-32);
  hctx.restore();
}
// arrows on the screen edge for raiders, the hero and buildings under attack that are out of view
function drawEdgeMarks(){
  if(S.modal||S.over||!BW) return;
  const L=18, Tp=chipsBottom(), Rt=BW-18, B=BH-18, cx=(L+Rt)/2, cy=(Tp+B)/2, groups=new Map();
  const add=(x,y,ht,kind)=>{ const [px,py]=scr(W2(x),ht,W2(y)); if(!isFinite(px)||!isFinite(py)) return; if(px>=L&&px<=Rt&&py>=Tp&&py<=B) return;
    const a=Math.atan2(py-cy,px-cx), k=kind+':'+Math.round(a/(Math.PI/7)); const g=groups.get(k)||{sx:0,sy:0,n:0,kind}; g.sx+=Math.cos(a); g.sy+=Math.sin(a); g.n++; groups.set(k,g); };
  for(const e of S.enemies) add(e.px??e.x,e.py??e.y,.5,e.type==='warlord'||e.type==='captain'?'boss':'foe');
  if(S.hero&&!S.hero.dead&&heroHere()) add(S.hero.x,S.hero.y,.8,'hero');
  each((b,x,y)=>{ if(b.hitT!=null&&S.t>=b.hitT&&S.t-b.hitT<2) add(x,y,.5,'hit'); });
  if(S.keepHitT!=null&&S.t>=S.keepHitT&&S.t-S.keepHitT<2) add(C,C,.8,'hit');
  const pulse=reduce?1:.75+.25*Math.sin(clock*7);
  hctx.save(); hctx.textAlign='center'; hctx.textBaseline='middle';
  for(const g of groups.values()){ const a=Math.atan2(g.sy,g.sx), c=Math.cos(a), sn=Math.sin(a);
    let t=1e9; if(c>1e-4) t=Math.min(t,(Rt-cx)/c); if(c<-1e-4) t=Math.min(t,(L-cx)/c); if(sn>1e-4) t=Math.min(t,(B-cy)/sn); if(sn<-1e-4) t=Math.min(t,(Tp-cy)/sn);
    const x=cx+c*t, y=cy+sn*t, col=g.kind==='hero'?'#86B6FF':g.kind==='hit'?'#F0BE4E':g.kind==='boss'?'#FF8A3D':'#FF5A4A', r=g.kind==='boss'?13:11;
    hctx.save(); hctx.translate(x,y); hctx.rotate(a); hctx.globalAlpha=g.kind==='hero'?.95:pulse;
    hctx.fillStyle=col; hctx.beginPath(); hctx.moveTo(r+8,0); hctx.lineTo(r-1,-6); hctx.lineTo(r-1,6); hctx.closePath(); hctx.fill(); hctx.restore();
    hctx.fillStyle='rgba(22,18,15,.88)'; hctx.beginPath(); hctx.arc(x,y,r,0,6.29); hctx.fill(); hctx.strokeStyle=col; hctx.lineWidth=2; hctx.stroke();
    hctx.fillStyle=col; hctx.font=`700 ${g.n>9?10:11}px Inter, system-ui, sans-serif`;
    hctx.fillText(g.kind==='hero'?'★':g.kind==='hit'?'!':String(g.n),x,y+.5); }
  hctx.restore();
}
let cbT=-9, cbV=52;
function chipsBottom(){ if(clock-cbT>.5||clock<cbT){ cbT=clock; const c=document.querySelector('.chips'), bd=$('board'); if(c&&bd){ const a=c.getBoundingClientRect(), b=bd.getBoundingClientRect(); cbV=Math.max(52,Math.min(BH*.4,a.bottom-b.top+16)); } } return cbV; }
function drawDanger(){
  if(S.phase!=='night'||S.keep<=0) return; const kf=S.keep/Math.max(1,S.keepMax); if(kf>.3) return;
  const a=(reduce?.6:.6+.4*Math.sin(clock*5))*(.32+(.3-kf)*1.2), g=hctx.createRadialGradient(BW/2,BH/2,Math.min(BW,BH)*.38,BW/2,BH/2,Math.max(BW,BH)*.72);
  g.addColorStop(0,'rgba(220,40,30,0)'); g.addColorStop(1,`rgba(220,40,30,${a})`); hctx.fillStyle=g; hctx.fillRect(0,0,BW,BH);
}
