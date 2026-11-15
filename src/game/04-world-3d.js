// =============== 3D WORLD ===============
const glc=$('gl'), hud=$('hud'), hctx=hud.getContext('2d');
let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas:glc,antialias:true,powerPreference:'high-performance'}); }
catch(e){ $('board').insertAdjacentHTML('beforeend','<div class="nogl">This device could not start 3D graphics.</div>'); return; }
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.LinearSRGBColorSpace; if('useLegacyLights' in renderer) renderer.useLegacyLights=true;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x7A3A2B);
const orthoCam=new THREE.OrthographicCamera(-7,7,6,-6,.1,100), chaseCam=new THREE.PerspectiveCamera(62,1.6,.1,90);
let camera=orthoCam, renderPassRef=null;
scene.fog=new THREE.Fog(0x7A3A2B,500,900);
const CAM_DIR=new THREE.Vector3(0,Math.sin(58*Math.PI/180),Math.cos(58*Math.PI/180)).multiplyScalar(40);
const camTarget=new THREE.Vector3(0,0,.35);
const hemi=new THREE.HemisphereLight(0xFFF2DE,0xB2644A,.62); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xFFF1DA,.95);
sun.position.set(10,16,5); sun.castShadow=true;
const isSmall=Math.min(screen.width,screen.height)<700;
sun.shadow.mapSize.set(isSmall?1024:2048,isSmall?1024:2048);
Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:70}); sun.shadow.bias=-.0008;
scene.add(sun); scene.add(sun.target);
const torches=[]; for(let i=0;i<8;i++){ const l=new THREE.PointLight(0xFFA24A,0,3.6,2); scene.add(l); torches.push(l); }

const W2=(x)=>x-C;            // tile → world
const GEO={}, MATS={};
const geo=(k,f)=>GEO[k]||(GEO[k]=f());
const M=(c)=>MATS[c]||(MATS[c]=new THREE.MeshLambertMaterial({color:c}));
const BX=(w,h,d)=>geo(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d));
const CN=(r,h,s)=>geo(`c${r},${h},${s}`,()=>new THREE.ConeGeometry(r,h,s));
const CY=(r1,r2,h,s)=>geo(`y${r1},${r2},${h},${s}`,()=>new THREE.CylinderGeometry(r1,r2,h,s));
const DO=(r)=>geo(`d${r}`,()=>new THREE.DodecahedronGeometry(r,0));
function add(g,gm,c,x,y,z,rx=0,ry=0,rz=0,mat){ const m=new THREE.Mesh(gm,mat||M(c)); m.position.set(x,y,z); m.rotation.set(rx,ry,rz); m.castShadow=true; m.receiveShadow=true; g.add(m); return m; }
function tree(g,a,c,sc,k){
  const t=new THREE.Group(); t.position.set(a,0,c); t.scale.setScalar(sc); t.rotation.y=k*1.3;
  add(t,BX(.06,.2,.06),COL.wood,0,.1,0); add(t,CN(.17,.3,6),COL.pine,0,.32,0); add(t,CN(.12,.24,6),COL.pine2,0,.5,0); g.add(t);
}
function hash(a,b,s){ const v=Math.sin(a*12.9898+b*78.233+s*37.719)*43758.5453; return v-Math.floor(v); }

// ---------- model library (Avramania, CC0) ----------
const MODEL_NAMES='castle_curtain_01 castle_curtain_gate_01 castle_tower_round_base_01 castle_tower_round_mid_01 castle_tower_round_top_01 castle_tower_round_roof_01 castle_banner_01 nature_cliff_01 nature_cliff_02 nature_cliff_03 nature_cave_01 nature_pine_01 nature_oak_01 nature_oak_sapling_01 nature_rocks_01 nature_boulder_01 nature_stump_01 farm_furrow_01 farm_cabbage_stage_01 farm_cabbage_stage_02 farm_cabbage_stage_03 farm_scarecrow_01 village_cottage_01 village_stall_01 interiors_woodpile_01 props_axe_01 props_wheelbarrow_01 props_crate_01 props_barrel_01 food_produce_crate_01 props_sack_01 weapons_rack_01 weapons_armingsword_01 weapons_shield_round_01 weapons_spear_01 weapons_shield_wooden_01 weapons_handaxe_01 village_well_01 interiors_altar_01 weapons_quiver_01'.split(' ')
  .concat('Cactus_1 Cactus_2 Cactus_3 Cactus_4 Cactus_5 CactusFlower_1 CactusFlowers_2 CactusFlowers_3 CactusFlowers_4 CactusFlowers_5 Rock_1 Rock_2 Rock_3 Rock_5 Rock_6 CommonTree_Dead_1 CommonTree_Dead_2 CommonTree_Dead_4 Grass Grass_Short Grass_2 Plant_1 Plant_3 Bush_1 BushBerries_1 PalmTree_1 PalmTree_2 PalmTree_3 PalmTree_4 Wheat Corn_1 Corn_2 TreeStump WoodLog'.split(' ').map(n=>'q_'+n));   // q_ = Quaternius Ultimate Nature (CC0), vertex-colored
const CANYON=new Set(['nature_cliff_01','nature_cliff_02','nature_cliff_03','nature_cave_01']);
const ASSET={m:{},ready:false,pal:null,canyon:null};
const V3=THREE.Vector3, flameMat=new THREE.MeshBasicMaterial({color:0xFFB347});
function loadAssets(){
  if(!THREE.GLTFLoader){ $('cLoad').hidden=true; return; }
  const L=new THREE.GLTFLoader(), TL=new THREE.TextureLoader();
  TL.load('models/waternormals.png',t=>{ t.wrapS=t.wrapT=THREE.RepeatWrapping; waterTex=t; if(S&&S.kind==='coast') buildWorld(); });
  const canyonTex=new Promise(res=>TL.load('models/canyon_palette.png',t=>res(t),undefined,()=>res(null)));
  const b64=t=>{ const bin=atob(t), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u.buffer; };
  const bundle=fetch('models/models.json').then(r=>{ if(!r.ok) throw new Error('missing'); return r.json(); }).catch(()=>({}));
  const loads=MODEL_NAMES.map(n=>bundle.then(B=>new Promise(res=>{ if(!B[n]) return res([n,null]); try{ L.parse(b64(B[n]),'',g=>res([n,g.scene]),()=>res([n,null])); }catch(e){ res([n,null]); } })));
  Promise.all([canyonTex,...loads]).then(([ct,...pairs])=>{
    let pal=null;
    for(const [n,sc] of pairs){ if(!sc) continue;
      sc.traverse(o=>{ if(o.isMesh){ if(!pal&&o.material.map) pal=o.material.map; o.castShadow=true; o.receiveShadow=true; } });
      ASSET.m[n]=sc; }
    for(const t of [pal,ct]) if(t){ t.colorSpace=THREE.NoColorSpace; t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; t.generateMipmaps=false; t.flipY=false; t.needsUpdate=true; }
    ASSET.pal=new THREE.MeshLambertMaterial({map:pal}); ASSET.canyon=new THREE.MeshLambertMaterial({map:ct||pal});
    ASSET.vc=new THREE.MeshLambertMaterial({vertexColors:true}); ASSET.h={};
    for(const n in ASSET.m){ ASSET.m[n].traverse(o=>{ if(o.isMesh) o.material=n.startsWith('q_')?ASSET.vc:CANYON.has(n)?ASSET.canyon:ASSET.pal; }); ASSET.h[n]=new THREE.Box3().setFromObject(ASSET.m[n]).getSize(new V3()).y||1; }
    ASSET.ready=!!pal&&Object.keys(ASSET.m).length>MODEL_NAMES.length/2;
    $('cLoad').hidden=true;
    if(ASSET.ready){ if(heroMesh){ scene.remove(heroMesh); heroMesh=null; } buildWorld(); }
    ui();
  });
}
function AM(n){ const s=ASSET.m[n]; return s?s.clone(true):null; }
function put(g,n,x,y,z,ry=0,sc=1){ const o=AM(n); if(!o) return null; o.position.set(x,y,z); o.rotation.y=ry; if(sc!==1) o.scale.setScalar(sc); g.add(o); return o; }
const swayers=[];
function qput(g,n,x,z,h,ry=0,shadow=true){ const k='q_'+n, o=AM(k); if(!o) return null;
  if(/^(PalmTree|Grass|Bush|CommonTree)/.test(n)) swayers.push({o,ph:Math.random()*6.28,amp:/^Palm/.test(n)?.035:/^Common/.test(n)?.02:.12}); o.scale.setScalar(h/(ASSET.h[k]||1)); o.position.set(x,0,z); o.rotation.y=ry; if(!shadow) o.traverse(c=>{ if(c.isMesh) c.castShadow=false; }); g.add(o); return o; }
const QCACTUS=['Cactus_1','Cactus_2','Cactus_3','Cactus_4','Cactus_5'], QFLOWER=['CactusFlower_1','CactusFlowers_2','CactusFlowers_3','CactusFlowers_4','CactusFlowers_5'], QROCK=['Rock_1','Rock_2','Rock_3','Rock_5','Rock_6'], QDEAD=['CommonTree_Dead_1','CommonTree_Dead_2','CommonTree_Dead_4'];
function towerStack(g,x,z,mids){
  put(g,'castle_tower_round_base_01',x,0,z);
  for(let i=1;i<=mids;i++) put(g,'castle_tower_round_mid_01',x,2.4*i,z);
  const top=2.4*(mids+1); put(g,'castle_tower_round_top_01',x,top,z); put(g,'castle_tower_round_roof_01',x,top+2,z);
}
function fitTo(inner,w){
  const box=new THREE.Box3().setFromObject(inner), size=box.getSize(new V3()), c=box.getCenter(new V3());
  const s=w/Math.max(size.x,size.z);
  inner.scale.multiplyScalar(s); inner.position.set(-c.x*s,-box.min.y*s,-c.z*s);
  const o=new THREE.Group(); o.add(inner); o.userData={h:size.y*s}; return o;
}
function farmStage(b){ return Math.min(3,1+Math.max(0,S.day-(b.day||S.day))); }
function addWorker(g,b){
  if(!DEF[b.type].work) return;
  const w=new THREE.Group(); add(w,CN(.07,.22,6),COL.villager,0,.11,0); add(w,DO(.05),COL.skin,0,.26,0); add(w,BX(.02,.22,.02),COL.wood,.06,.15,.05,0,0,.45);
  w.position.set(.33,0,.33); g.add(w); g.userData.worker=w;
}
function assetModel(b,x,y){
  const g=new THREE.Group(); let o;
  switch(b.type){
  case 'keep':
    if(S.kind!=='canyon'){ put(g,'castle_curtain_gate_01',0,0,0); towerStack(g,-.4,-.5,1); towerStack(g,4.4,-.5,1); put(g,'castle_banner_01',2,5.6,.55); o=fitTo(g,1.15); o.userData.flame=add(o,BX(.08,.1,.08),0,0,.28,.38,0,0,0,flameMat); return o; }
    { const kl=b.lvl||1; put(g,'castle_curtain_gate_01',0,0,0); put(g,'castle_curtain_01',-2,0,0); put(g,'castle_curtain_01',4,0,0); towerStack(g,-2.2,-.5,1+kl); towerStack(g,6.2,-.5,1+kl); put(g,'castle_banner_01',2,6.4,.55);
      if(kl>=2){ towerStack(g,2,-4,kl+1); put(g,'castle_curtain_01',-2,0,-3.5); put(g,'castle_curtain_01',4,0,-3.5); put(g,'castle_banner_01',2,4+2.4*(kl+2),-3.5); }
      if(kl>=3){ put(g,'castle_banner_01',-2.2,2.4*(kl+1)+4,-.5); put(g,'castle_banner_01',6.2,2.4*(kl+1)+4,-.5); } }
    o=fitTo(g,(b.lvl||1)>=2?1.5:1.45); o.userData.flame=add(o,BX(.08,.1,.08),0,0,.3,.42,0,0,0,flameMat); return o;
  case 'tower':
    towerStack(g,0,0,b.lvl-1); o=fitTo(g,.78);
    o.userData.flame=add(o,BX(.06,.09,.06),0,.36,o.userData.h*.55,.1,0,0,0,flameMat); return o;
  case 'wall':{
    if(b.lvl<2) return null;
    const conn=NB.filter(([a,c])=>inb(x+a,y+c)&&G(x+a,y+c).b&&G(x+a,y+c).b.type==='wall');
    const ew=conn.some(([a])=>a!==0), ns=conn.some(([,c])=>c!==0);
    const bay=rot=>{ const w=new THREE.Group(), c=AM('castle_curtain_01'); c.position.set(-1,0,.69); w.add(c); w.rotation.y=rot; w.scale.set(.5,.3,.3); return w; };
    if(ew||!ns) g.add(bay(0));
    if(ns) g.add(bay(Math.PI/2));
    if((ew&&ns)||conn.length<2){ const t=new THREE.Group(); put(t,'castle_tower_round_base_01',0,0,0); put(t,'castle_tower_round_top_01',0,2.4,0); t.scale.set(.15,.32,.15); g.add(t); }
    return g; }
  case 'farm':{
    const st=farmStage(b), f=AM('farm_furrow_01'); f.scale.set(.86,1.4,.86); f.position.set(-.43,0,.43); g.add(f);
    const kind=hash(x,y,7);
    if(kind<.34||!ASSET.m.q_Wheat){ for(let i=0;i<3;i++)for(let k=0;k<3;k++){ if(i===2&&k===0) continue; put(g,'farm_cabbage_stage_0'+st,-.27+i*.27,.04,-.27+k*.27,(i*3+k)*1.1,1.05); } }
    else{ const crop=kind<.67?'Wheat':(hash(x,y,9)<.5?'Corn_1':'Corn_2'), hh=(crop==='Wheat'?[.1,.19,.27]:[.13,.26,.4])[st-1];
      for(let i=0;i<3;i++)for(let k=0;k<4;k++){ if(i===2&&k===0) continue; qput(g,crop,-.27+i*.27,-.3+k*.2,hh*(.88+hash(i,k,x+y)*.24),(i*4+k)*1.7,false); } }
    put(g,'farm_scarecrow_01',.3,0,-.3,.4,.28);
    return g; }
  case 'house': put(g,'village_cottage_01',0,0,0); if((b.lvl||1)>1){ put(g,'village_cottage_01',1.9,0,1.6,Math.PI/2,.72); put(g,'castle_banner_01',-1.6,0,-1.4,0,.6); return fitTo(g,.98); } return fitTo(g,.86);
  case 'lumber':{
    put(g,'interiors_woodpile_01',0,0,.25); put(g,'nature_stump_01',1.25,0,.45,0,.6);
    const ax=put(g,'props_axe_01',1.25,.3,.45); if(ax) ax.rotation.z=.45;
    if(!ASSET.m.q_PalmTree_1){ put(g,'nature_pine_01',.5,0,-1.5,.7,.42); put(g,'nature_oak_sapling_01',-.7,0,-.6,0,1); return fitTo(g,.95); }
    o=fitTo(g,.6); o.children[0].position.x+=.12; o.children[0].position.z+=.2;
    qput(o,'PalmTree_'+(1+(x+y)%4),-.26,-.24,1.05,x*1.3); qput(o,'WoodLog',.2,-.3,.13,.5); qput(o,'TreeStump',-.32,.26,.1,y);
    return o; }
  case 'mine':
    put(g,'nature_cave_01',0,0,0); put(g,'props_wheelbarrow_01',3,0,1.1,-.6); put(g,'props_crate_01',.8,0,.9,.3); put(g,'nature_rocks_01',3.8,0,.3);
    return fitTo(g,.98);
  case 'well': put(g,'village_well_01',0,0,0); return fitTo(g,.66);
  case 'shrine':
    put(g,'interiors_altar_01',0,0,0); put(g,'castle_banner_01',-.9,1.6,-.42); put(g,'castle_banner_01',.9,1.6,-.42);
    o=fitTo(g,.7); add(o,BX(.6,.06,.5),COL.stone,0,.03,0); o.children[0].position.y+=.06;
    o.userData.flame=add(o,CN(.05,.12,5),0,0,.32,0,0,0,0,flameMat); return o;
  case 'market':
    put(g,'village_stall_01',0,0,0); put(g,'food_produce_crate_01',.4,0,.45); put(g,'food_produce_crate_01',1.3,0,.55,.4);
    put(g,'props_barrel_01',2.6,0,-.4); put(g,'props_sack_01',2.55,0,.35);
    return fitTo(g,.92);
  }
  return null;
}
let _mtnMat=null;
const mtnCliffMat=()=>{ if(!_mtnMat){ _mtnMat=ASSET.canyon.clone(); _mtnMat.color=new THREE.Color(0xAFC0D4); } return _mtnMat; };
function decorateWorld(){
  swayers.length=0;
  if(!ASSET.ready) return;
  for(const k in oreMeshes){ const g=oreMeshes[k]; while(g.children.length) g.remove(g.children[0]);
    put(g,'nature_rocks_01',-.1,0,.05,+k,.42); put(g,'nature_boulder_01',.22,0,-.16,1+(+k),.24); put(g,'nature_rocks_01',.18,0,.24,2,.22);
    [[-.12,-.02],[.06,.14],[.2,-.1]].forEach(([a,c])=>add(g,BX(.05,.05,.05),COL.gold,a,.22,c,.5,.5,0)); }
  for(const k in groveMeshes){ const g=groveMeshes[k]; while(g.children.length) g.remove(g.children[0]);
    if(S.kind==='mountain'){ put(g,'nature_pine_01',-.16,0,-.14,+k,.13); put(g,'nature_pine_01',.2,0,.14,(+k)*2,.1); put(g,'nature_pine_01',-.2,0,.28,1,.07); qput(g,'Grass_2',.26,-.24,.1,0,false); }
    else if(ASSET.m.q_PalmTree_1){ qput(g,'PalmTree_'+(1+k%4),-.16,-.14,1.15,+k); qput(g,'PalmTree_'+(1+(+k+2)%4),.22,.14,.82,(+k)*2); qput(g,'Bush_1',-.22,.27,.17,1); qput(g,'Grass_2',.26,-.24,.11,0,false); qput(g,'Grass',-.02,.3,.1,2,false); }
    else{ put(g,'nature_pine_01',-.18,0,-.16,+k,.11); put(g,'nature_oak_01',.2,0,.12,(+k)*2,.12); put(g,'nature_oak_sapling_01',-.22,0,.28,1,.32); } }
  // canyon cliffs line every edge where rock meets the valley floor
  const isL=(x,y)=>inb(x,y)&&G(x,y).land, P={nature_cliff_01:[],nature_cliff_02:[],nature_cliff_03:[]};
  for(let y=-1;y<=N;y++)for(let x=-1;x<=N;x++){ if(isL(x,y)||isSea(x,y)) continue;
    for(const [dx,dz] of NB){ if(!isL(x+dx,y+dz)) continue;
      const h=dz>0?.66:dz<0?.26:.5, v=dz<0?'nature_cliff_03':(hash(x,y,dx+3*dz)<.5?'nature_cliff_01':'nature_cliff_02');
      P[v].push([W2(x)+dx*.5,W2(y)+dz*.5,Math.atan2(dx,dz),h]); } }
  const m4=new THREE.Matrix4(), off=new THREE.Matrix4().makeTranslation(-2,0,0), q=new THREE.Quaternion(), e=new THREE.Euler(), pos=new V3(), sc=new V3();
  for(const v in P){ const list=P[v]; if(!list.length||!ASSET.m[v]) continue;
    let mesh=null; ASSET.m[v].traverse(o=>{ if(o.isMesh&&!mesh) mesh=o; });
    const im=new THREE.InstancedMesh(mesh.geometry,S.kind==='mountain'?mtnCliffMat():ASSET.canyon,list.length);
    list.forEach(([px,pz,th,h],i)=>{ q.setFromEuler(e.set(0,th,0)); m4.compose(pos.set(px,0,pz),q,sc.set(.27,h*(.9+hash(i,px,3)*.2),.8)); m4.multiply(off); im.setMatrixAt(i,m4); });
    im.castShadow=im.receiveShadow=true; world.add(im); }
  if(!ASSET.m.q_Cactus_1) return;
  const seed=S.seed||1;
  // cacti and dead trees along the canyon rim
  const rim=new Map();
  for(const v in P) for(const [px,pz,th,h] of P[v]){ const rx=Math.round(px-Math.sin(th)*.5)+C, ry=Math.round(pz-Math.cos(th)*.5)+C, key=rx+','+ry; rim.set(key,Math.max(rim.get(key)||0,h)); }
  for(const [key,h] of rim){ const [rx,ry]=key.split(',').map(Number), r=hash(rx,ry,seed+4); if(r>.22) continue;
    const g=new THREE.Group(); g.position.set(W2(rx)+(hash(ry,rx,1)-.5)*.3,h*2.75,W2(ry)+(hash(rx,ry,2)-.5)*.3);
    if(S.kind==='mountain'){ if(r<.12) put(g,'nature_pine_01',0,0,0,r*40,.09+r*.3); else qput(g,QROCK[Math.floor(r*50)%5],0,0,.18+r,r*30); }
    else if(r<.09) qput(g,QDEAD[Math.floor(r*100)%3],0,0,.75+r*3,r*40); else qput(g,QCACTUS[Math.floor(r*50)%5],0,0,.35+r,r*30);
    world.add(g); }
  // the valley floor: agaves give way to cacti, flowering cacti, rocks and dry grass
  for(let i=plantMeshes.length-1;i>=0;i--){ const m=plantMeshes[i][1]; if(m.isGroup){ world.remove(m); plantMeshes.splice(i,1); } }
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const t=G(x,y); if(!t.land||t.ore||t.grove||isSpawn(x,y)||(Math.abs(x-C)<=1&&Math.abs(y-C)<=1)) continue;
    const edge=NB.some(([a,c])=>!isL(x+a,y+c)), r=hash(x,y,seed);
    if(r>(edge?.8:.4)) continue;
    const g=new THREE.Group(); g.position.set(W2(x),0,W2(y));
    const n=1+Math.floor(hash(y,x,seed)*3);
    for(let k=0;k<n;k++){
      const h1=hash(x+k*7,y,seed+k), px=(hash(x,y+k,seed)-.5)*.72, pz=(hash(x+k*3,y,seed*2)-.5)*.72, ry=h1*6.28;
      if(S.kind==='mountain'){ if(edge&&h1<.35) put(g,'nature_pine_01',px,0,pz,ry,.05+h1*.08); else if(h1<.6) qput(g,QROCK[Math.floor(h1*17)%5],px,pz,.07+h1*.08,ry); else if(h1<.85) qput(g,'Grass_Short',px,pz,.08,ry,false); else put(g,'nature_stump_01',px,0,pz,ry,.25); continue; }
      if(edge&&h1>.94) qput(g,QDEAD[Math.floor(h1*300)%3],px,pz,.6,ry);
      else if(edge&&h1<.42&&NB.some(([a,c])=>isSea(x+a,y+c))) qput(g,h1<.2?'PalmTree_'+(1+Math.floor(h1*20)%4):QROCK[Math.floor(h1*17)%5],px,pz,h1<.2?.7:.1,ry);
      else if(edge&&h1<.42) qput(g,QCACTUS[Math.floor(h1*11)%5],px,pz,.28+h1*.4,ry);
      else if(h1<.5) qput(g,QFLOWER[Math.floor(h1*10)%5],px,pz,.12+h1*.1,ry,false);
      else if(h1<.7) qput(g,QROCK[Math.floor(h1*17)%5],px,pz,.07+h1*.07,ry);
      else if(h1<.9) qput(g,h1<.8?'Grass':'Grass_Short',px,pz,.09,ry,false);
      else qput(g,h1<.95?'Plant_1':'Plant_3',px,pz,.13,ry,false);
    }
    world.add(g); plantMeshes.push([idx(x,y),g]);
  }
}
let gridLines=null, ghost=null, ghostKey='', waterMesh=null, waterTex=null, groundMesh=null, grassMesh=null, grassTiles=null, grassVer=-1, snowMesh=null;
const SEASON_TINT={Spring:new THREE.Color(.95,1.03,.9),Summer:new THREE.Color(1.03,1,.95),Harvest:new THREE.Color(1.02,.96,.88),Winter:new THREE.Color(1.04,1.07,1.12)};
const GRASS_TINT={Spring:new THREE.Color(.5,.72,.3),Summer:new THREE.Color(.72,.7,.36),Harvest:new THREE.Color(.82,.6,.3),Winter:new THREE.Color(.86,.88,.86)};
const grassU={uTime:{value:0},uWind:{value:1}};
function grassGeo(){ const g=new THREE.BufferGeometry(), P=[], Cc=[];
  for(let b=0;b<5;b++){ const a=b/5*Math.PI*2+(b%2)*.4, cx=Math.cos(a)*.02, cz=Math.sin(a)*.02, w=.026, h=.08+((b*37)%7)/100, lo=.05;
    const pc=Math.cos(a+Math.PI/2)*w, ps=Math.sin(a+Math.PI/2)*w;
    P.push(cx-pc,0,cz-ps, cx+pc,0,cz+ps, cx+Math.cos(a)*lo,h,cz+Math.sin(a)*lo); Cc.push(.8,.8,.8, .8,.8,.8, 1.2,1.2,1.2); }
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(new Array(P.length/3).fill(0).flatMap(()=>[0,1,0]),3)); return g; }
function buildGrass(){
  if(grassMesh){ scene.remove(grassMesh); grassMesh.geometry.dispose(); grassMesh=null; }
  const per=quality==='high'?(isSmall?7:10):4, kind=S.kind, density=kind==='mountain'?.5:kind==='coast'?1.1:.9, tiles=[];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const t=G(x,y); if(!t.land||t.ore||t.grove) continue; tiles.push([x,y]); }
  const count=Math.floor(tiles.length*per*density); if(!count) return;
  const mat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
  mat.onBeforeCompile=sh=>{ sh.uniforms.uTime=grassU.uTime; sh.uniforms.uWind=grassU.uWind;
    sh.vertexShader='uniform float uTime; uniform float uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n  vec4 gp=instanceMatrix*vec4(0.,0.,0.,1.); float hh=position.y*8.; float ph=uTime*1.8+gp.x*1.1+gp.z*.8;\n  transformed.x+=(sin(ph)*.6+sin(ph*2.3)*.25)*hh*.035*uWind; transformed.z+=cos(ph*.9)*hh*.02*uWind;'); };
  const im=new THREE.InstancedMesh(grassGeo(),mat,count); im.receiveShadow=false; im.castShadow=false; im.frustumCulled=false;
  const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), pos=new V3(), sc=new V3(), col=new THREE.Color(), seed=S.seed||1;
  grassTiles=new Map(); let n=0;
  for(const [x,y] of tiles){ const k=idx(x,y), list=[]; const m=Math.round(per*density*(.6+hash(x,y,seed+5)*.8));
    for(let i=0;i<m&&n<count;i++){ const px=W2(x)+(hash(x+i*3,y,seed)-.5)*.92, pz=W2(y)+(hash(x,y+i*5,seed+1)-.5)*.92;
      if(S.kind==='coast'&&isSea(Math.round(px+C),Math.round(pz+C))) continue;
      const s=.6+hash(i,x+y,seed+2)*.7; q.setFromEuler(e.set(0,hash(x,i,y)*6.28,0)); m4.compose(pos.set(px,0,pz),q,sc.set(s,s*(.8+hash(y,i,x)*.6),s)); im.setMatrixAt(n,m4);
      col.setScalar(.85+hash(i,y,x)*.3); im.setColorAt(n,col); list.push([n,m4.clone()]); n++; }
    grassTiles.set(k,list); }
  im.count=n; im.userData.base=im.instanceColor.array.slice(); grassMesh=im; scene.add(im); grassVer=-1; tintGrass(true);
}
const ZERO4=new THREE.Matrix4().makeScale(0,0,0);
function syncGrass(){
  if(!grassMesh||grassVer===S.ver) return; grassVer=S.ver;
  for(const [k,list] of grassTiles){ const t=S.grid[k], hide=!!t.b&&t.b.type!=='farm'; for(const [i,m] of list) grassMesh.setMatrixAt(i,hide?ZERO4:(t.b&&t.b.type==='farm'?m.clone().multiply(new THREE.Matrix4().makeScale(.5,.5,.5)):m)); }
  grassMesh.instanceMatrix.needsUpdate=true;
}
let seasonCol=new THREE.Color(1,1,1), seasonName='';
function tintGrass(force){ if(!grassMesh) return; const sn=season().name; const gc=S.kind==='mountain'?new THREE.Color(.62,.7,.5):S.kind==='coast'?GRASS_TINT[sn].clone().lerp(new THREE.Color(.5,.74,.36),.4):GRASS_TINT[sn];
  const base=grassMesh.userData.base, arr=grassMesh.instanceColor.array; for(let i=0;i<arr.length;i+=3){ arr[i]=base[i]*gc.r; arr[i+1]=base[i+1]*gc.g; arr[i+2]=base[i+2]*gc.b; } grassMesh.instanceColor.needsUpdate=true; }
function syncSeason(raw){
  const sn=season().name; if(sn!==seasonName){ seasonName=sn; tintGrass(); if(snowMesh) snowMesh.userData.target=sn==='Winter'||S.weather==='snow'?.5:0; }
  if(groundMesh){ const tg=S.kind==='mountain'?SEASON_TINT.Winter:SEASON_TINT[sn]; seasonCol.lerp(tg,Math.min(1,raw*.8)); groundMesh.material.color.copy(seasonCol); }
  if(snowMesh){ const tgt=(sn==='Winter'||S.weather==='snow')&&S.kind!=='mountain'?.55:0; snowMesh.material.opacity+=(tgt-snowMesh.material.opacity)*Math.min(1,raw*.6); snowMesh.visible=snowMesh.material.opacity>.01; }
  grassU.uTime.value=reduce?0:clock; grassU.uWind.value=S.weather==='sandstorm'?2.6:S.weather==='rain'?1.7:S.weather==='snow'?.6:1;
  syncGrass();
}
const snowTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'), im=x.createImageData(128,128); const nz=mkNoise();
  for(let j=0;j<128;j++)for(let i=0;i<128;i++){ const a=i/128*6.283, b=j/128*6.283; let v=nz?nz.noise2D(Math.cos(a)*1.6+Math.cos(b)*.4,Math.sin(a)*1.6+Math.sin(b)*1.9)*.6+nz.noise2D(Math.cos(a)*5+Math.sin(b)*3,Math.sin(a)*5+Math.cos(b)*3)*.4:.5; v=Math.max(0,Math.min(1,(v+.25)*1.6)); const o=(j*128+i)*4; im.data[o]=im.data[o+1]=im.data[o+2]=255*v; im.data[o+3]=255; }
  x.putImageData(im,0,0); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(6,6); return t; })();
let world=null, groveMeshes={}, oreMeshes={}, plantMeshes=[], bMeshes={}, spawnKey='';
const spawnGroup=new THREE.Group(); scene.add(spawnGroup);
const eMeshes=new Map(), sMeshes=new Map();

// --- static world: ground, canyon walls, ore, plants ---
function buildWorld(){
  clearPhys();
  if(world){ scene.remove(world); world.traverse(o=>{ if(o.geometry&&o.userData.own) o.geometry.dispose(); }); }
  world=new THREE.Group(); scene.add(world);
  const seed=S.seed||1;
  const gg=new THREE.PlaneGeometry(60,60,150,150); gg.rotateX(-Math.PI/2);
  const gp=gg.attributes.position, gc=[], base=new THREE.Color(S.kind==='mountain'?0xDCE2EA:COL.sand), coast=S.kind==='coast', wetC=new THREE.Color(0xA8784C), bedC=new THREE.Color(0x2F6A72), tc=new THREE.Color();
  for(let i=0;i<gp.count;i++){ const x=gp.getX(i),z=gp.getZ(i);
    const v=1+.035*Math.sin(x*2.3+z*1.1+Math.sin(z*.7)*2)+.02*(hash(Math.round(x*3),Math.round(z*3),seed)-.5);
    if(coast){ const d=(z+C)-(shoreAt(x+C)+.5);
      if(d>-.4){ gp.setY(i,-Math.min(.9,Math.max(0,d+.1)*.75)); tc.copy(base).lerp(wetC,Math.min(1,(d+.4)/.45)).lerp(bedC,Math.max(0,Math.min(1,(d-.05)/.9))); gc.push(tc.r*v,tc.g*v,tc.b*v); continue; } }
    gc.push(base.r*v,base.g*v,base.b*v); }
  gg.setAttribute('color',new THREE.Float32BufferAttribute(gc,3));
  if(coast) gg.computeVertexNormals();
  const ground=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({vertexColors:true})); groundMesh=ground; ground.material.color.copy(seasonCol); ground.receiveShadow=true; ground.userData.own=true; world.add(ground);
  waterMesh=null;
  if(coast){ const wg=new THREE.PlaneGeometry(60,60); let wm;
    if(THREE.Water&&waterTex&&quality==='high'){ try{ wm=new THREE.Water(wg,{textureWidth:512,textureHeight:512,waterNormals:waterTex,sunDirection:new THREE.Vector3(.5,.8,.3).normalize(),sunColor:0xFFF1DA,waterColor:0x1E6A78,distortionScale:2.4,fog:false,alpha:.9}); wm.material.transparent=true; }catch(e){ wm=null; } }
    if(!wm) wm=new THREE.Mesh(wg,new THREE.MeshLambertMaterial({color:0x2C7486,transparent:true,opacity:.86}));
    wm.rotation.x=-Math.PI/2; wm.position.y=-.07; wm.userData.own=true; world.add(wm); waterMesh=wm; }
  { const gp2=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(!G(x,y).land) continue; const a=W2(x)-.5,b=W2(y)-.5;
      gp2.push(a,.012,b, a+1,.012,b, a,.012,b, a,.012,b+1);
      if(!(inb(x+1,y)&&G(x+1,y).land)) gp2.push(a+1,.012,b, a+1,.012,b+1);
      if(!(inb(x,y+1)&&G(x,y+1).land)) gp2.push(a,.012,b+1, a+1,.012,b+1); }
    const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(gp2,3));
    gridLines=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0xFFF4E2,transparent:true,opacity:0,depthWrite:false})); gridLines.userData.own=true; gridLines.visible=false; world.add(gridLines); }
  const land=[]; S.grid.forEach((t,i)=>{ if(t.land) land.push([i%N,(i/N)|0]); });
  const nearLand=(x,y)=>{ let m=99; for(const [a,b] of land){ const d=Math.hypot(a-x,b-y); if(d<m)m=d; } return m; };
  const mtn=S.kind==='mountain', pos=[],nor=[],col=[], top=new THREE.Color(mtn?0xF1F4F8:COL.rockTop), side=new THREE.Color(mtn?0x76808E:COL.rockSide);
  function rock(x,z,r,h,s){
    const sides=5+Math.floor(hash(s,1,2)*3);
    let g=new THREE.CylinderGeometry(r*.72,r,h,sides,1); g.translate(0,h/2,0);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);
      const kx=Math.round(px*1000),kz=Math.round(pz*1000);
      if(py>h*.5) p.setY(i,py+(hash(kx,kz,s)-.5)*h*.4);
      p.setX(i,px*(1+(hash(kz,kx,s+1)-.5)*.35)); p.setZ(i,pz*(1+(hash(kx+7,kz,s+2)-.5)*.35)); }
    g=g.toNonIndexed(); g.rotateY(hash(s,3,4)*6.28); g.translate(x,0,z); g.computeVertexNormals();
    const P=g.attributes.position.array, Nn=g.attributes.normal.array;
    for(let i=0;i<P.length;i+=9){
      const isTop=Nn[i+1]>.5, c=isTop?top:side, v=1+(hash(Math.round(P[i]*50),Math.round(P[i+2]*50),5)-.5)*(isTop?.05:.14);
      for(let j=0;j<9;j++){ pos.push(P[i+j]); nor.push(Nn[i+j]); }
      for(let j=0;j<3;j++) col.push(c.r*v,c.g*v,c.b*v);
    }
    g.dispose();
  }
  let s=seed;
  for(let y=-7;y<N+4;y++)for(let x=-6;x<N+6;x++){
    if(inb(x,y)&&G(x,y).land) continue;
    if(coast&&y>shoreAt(x)-.6) continue;
    if(ASSET.ready&&NB.some(([a,c])=>inb(x+a,y+c)&&G(x+a,y+c).land)) continue;   // the cliff models line this edge instead
    const d=nearLand(x,y); if(d>9) continue;
    s+=1.37;
    if(d>2.2&&hash(s,11,3)<.42) continue;     // thin the outer field so big slabs read as cliffs, not rubble
    const front=y>C+1;                        // rocks nearer the camera stay low so they don't hide the valley
    let h=(.9+d*1.05+hash(s,9,1)*.9); h=front?Math.min(h*.5,.85+hash(s,2,2)*.45):Math.min(h,5);
    const r=d>2.2?1.05+hash(s,4,4)*.5:.66+hash(s,4,4)*.22;
    rock(W2(x)+(hash(s,5,5)-.5)*.35,W2(y)+(hash(s,6,6)-.5)*.35,r,h,s);
    if(d>1.5&&hash(s,7,7)<.35) rock(W2(x)+(hash(s,8,8)-.5)*.9,W2(y)+(hash(s,9,9)-.5)*.9,r*.6,h*(front?.8:.7),s+.5);
  }
  const rg=new THREE.BufferGeometry();
  rg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  rg.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  rg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const rocks=new THREE.Mesh(rg,new THREE.MeshLambertMaterial({vertexColors:true})); rocks.castShadow=rocks.receiveShadow=true; rocks.userData.own=true; world.add(rocks);
  oreMeshes={};
  S.grid.forEach((t,i)=>{ if(!t.ore) return; const x=i%N,y=(i/N)|0, g=new THREE.Group();
    [[-.18,-.1,.16],[.16,-.16,.12],[.04,.18,.18],[.24,.16,.09]].forEach(([a,b,r],k)=>add(g,DO(r),COL.ore,a,r*.6,b,k,k*2,0));
    [[-.12,-.02],[.1,.12],[.2,-.1]].forEach(([a,b])=>add(g,BX(.05,.05,.05),COL.gold,a,.2,b,.5,.5,0));
    g.position.set(W2(x),0,W2(y)); world.add(g); oreMeshes[i]=g; });
  groveMeshes={};
  S.grid.forEach((t,i)=>{ if(!t.grove) return; const x=i%N,y=(i/N)|0, g=new THREE.Group();
    [[-.2,-.15,1],[.18,-.05,.85],[-.02,.22,1.1],[.25,.25,.7]].forEach(([a,c,sc],k)=>tree(g,a,c,sc,k));
    g.position.set(W2(x),0,W2(y)); world.add(g); groveMeshes[i]=g; });
  plantMeshes=[];
  const edge=edgeTiles().filter(([x,y])=>!isSpawn(x,y));
  for(let i=0;i<Math.min(7,edge.length);i++){
    const [x,y]=edge[Math.floor(hash(seed,i,3)*edge.length)], g=new THREE.Group();
    for(let k=0;k<6;k++){ const a=k/6*6.28; add(g,CN(.05,.42,4),COL.agave,Math.cos(a)*.07,.18,Math.sin(a)*.07,Math.sin(a)*.55,0,-Math.cos(a)*.55); }
    g.position.set(W2(x)+(hash(i,x,1)-.5)*.5,0,W2(y)+(hash(i,y,2)-.5)*.5); g.scale.setScalar(.8+hash(i,i,4)*.6); world.add(g); plantMeshes.push([idx(x,y),g]);
  }
  for(let i=0;i<14;i++){ const [x,y]=land[Math.floor(hash(seed,i,9)*land.length)]; if(x===C&&y===C) continue;
    const m=add(world,BX(.07,.06,.07),COL.pebble,W2(x)+(hash(i,1,seed)-.5)*.8,.03,W2(y)+(hash(i,2,seed)-.5)*.8,0,hash(i,3,3)*3,0); plantMeshes.push([idx(x,y),m]); }
  for(const k in bMeshes) scene.remove(bMeshes[k].g); bMeshes={};
  for(const [,m] of eMeshes) scene.remove(m); eMeshes.clear();
  for(const [,m] of sMeshes) scene.remove(m); sMeshes.clear();
  for(const [,m] of uMeshes) scene.remove(m); uMeshes.clear();
  for(const d of dying) scene.remove(d.m); dying.length=0; walkers.length=0; folkReset();
  for(const k of [...rubble.keys()]) removeRubble(k);
  for(const sc of SCORCH){ sc.life=0; sc.m.visible=false; }
  if(ghost){ scene.remove(ghost); ghost=null; ghostKey=''; }
  spawnKey=''; routesVer=-1;
  decorateWorld();
  buildFoam(); buildGrass();
  snowMesh=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshLambertMaterial({color:0xF4F7FA,alphaMap:snowTex,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3})); snowMesh.rotation.x=-Math.PI/2; snowMesh.position.y=.025; snowMesh.renderOrder=1; snowMesh.userData.own=true; world.add(snowMesh); seasonName='';
  rebuildFleet();
}

// --- building models ---
function modelFor(b,x,y){
  if(ASSET.ready){ const am=assetModel(b,x,y); if(am){ addWorker(am,b); am.position.set(W2(x),0,W2(y)); return am; } }
  const g=new THREE.Group(); g.userData={};
  switch(b.type){
  case 'keep':{
    add(g,BX(.92,.42,.92),COL.stone,0,.21,0);
    for(const [a,c] of [[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]]) add(g,BX(.16,.18,.16),COL.stone,a,.5,c);
    add(g,BX(.64,.46,.64),COL.plank,0,.65,0);
    add(g,BX(.05,.47,.66),COL.woodLight,0,.65,0);
    add(g,CN(.56,.46,4),COL.roof,0,1.11,0,0,Math.PI/4,0);
    add(g,BX(.22,.28,.04),COL.dark,0,.14,.47);
    add(g,BX(.03,.5,.03),COL.wood,0,1.48,0);
    g.userData.flag=add(g,BX(.24,.14,.02),COL.gold,.13,1.64,0);
    g.userData.flame=add(g,BX(.08,.1,.08),0,.28,.42,.5,0,0,0,new THREE.MeshBasicMaterial({color:0xFFB347}));
    break;}
  case 'tower':{
    const L=.75+.18*b.lvl;
    for(const [a,c] of [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]]) add(g,BX(.065,L,.065),COL.wood,a,L/2,c);
    add(g,BX(.03,L*.95,.03),COL.woodLight,0,L/2,.2,0,0,.52);
    add(g,BX(.03,L*.95,.03),COL.woodLight,.2,L/2,0,.52,0,0);
    add(g,BX(.64,.06,.64),COL.wood,0,L,0);
    add(g,BX(.5,.28,.5),COL.plank,0,L+.17,0);
    for(let i=0;i<3;i++) add(g,BX(.52,.02,.02),COL.woodLight,0,L+.08+i*.07,.26);
    add(g,CN(.46,.34,4),b.lvl>=3?COL.gold:COL.roof,0,L+.48,0,0,Math.PI/4,0);
    if(b.lvl>=2){ add(g,BX(.02,.3,.02),COL.wood,0,L+.75,0); g.userData.flag=add(g,BX(.16,.1,.02),b.lvl>=3?COL.roof:COL.gold,.09,L+.85,0); }
    g.userData.flame=add(g,BX(.06,.09,.06),0,.29,L+.08,.29,0,0,0,new THREE.MeshBasicMaterial({color:0xFFB347}));
    break;}
  case 'wall':{
    if(b.lvl>=2){
      const nb=NB.filter(([a,c])=>inb(x+a,y+c)&&G(x+a,y+c).b&&G(x+a,y+c).b.type==='wall');
      add(g,BX(.36,.56,.36),COL.stone,0,.28,0); add(g,BX(.4,.08,.4),COL.stoneDark,0,.04,0);
      for(const [a,c] of [[-.13,-.13],[.13,-.13],[-.13,.13],[.13,.13]]) add(g,BX(.1,.11,.1),COL.stone,a,.61,c);
      for(const [a,c] of nb){ add(g,BX(a?.5:.28,.44,c?.5:.28),COL.stone,a*.25,.22,c*.25); add(g,BX(a?.5:.3,.06,c?.5:.3),COL.stoneDark,a*.25,.03,c*.25);
        for(const t of [.24,.42]) add(g,BX(.09,.1,.09),COL.stone,a*t,.49,c*t); }
      break;
    }
    const stake=geo('stake',()=>new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(.055,0),new THREE.Vector2(.055,.62),new THREE.Vector2(0,.76)],6));
    const pts=[[0,0]]; let n=0;
    for(const [a,c] of NB) if(inb(x+a,y+c)&&G(x+a,y+c).b&&G(x+a,y+c).b.type==='wall'){ n++; for(const t of [.13,.26,.39]) pts.push([a*t,c*t]); add(g,BX(a?.5:.04,.05,c?.5:.04),COL.woodLight,a*.25,.42,c*.25); }
    if(!n) for(const [a,c] of [[-.13,0],[.13,0],[0,-.13],[0,.13]]) pts.push([a,c]);
    pts.forEach(([a,c],i)=>{ const m=add(g,stake,COL.wood,a,0,c,0,i,0); m.scale.y=.92+hash(x*9+i,y,1)*.18; });
    break;}
  case 'farm':{
    add(g,BX(.84,.04,.84),COL.soil,0,.02,0);
    for(let i=0;i<4;i++){ const z=-.3+i*.2;
      for(let k=0;k<4;k++) add(g,CN(.05,.16+hash(x+k,y+i,2)*.06,4),COL.crop,-.27+k*.18,.12,z,0,k,0); }
    add(g,BX(.86,.08,.03),COL.woodLight,0,.08,.43); add(g,BX(.86,.08,.03),COL.woodLight,0,.08,-.43);
    break;}
  case 'mine':{
    add(g,DO(.42),COL.stoneDark,0,.08,-.05,0,.4,0).scale.set(1,.62,.9);
    add(g,BX(.26,.28,.1),COL.dark,0,.14,.3);
    add(g,BX(.05,.32,.05),COL.wood,-.15,.16,.34); add(g,BX(.05,.32,.05),COL.wood,.15,.16,.34); add(g,BX(.38,.05,.06),COL.wood,0,.33,.34);
    for(const [a,c] of [[-.2,.1],[.18,.05],[.05,-.2]]) add(g,BX(.06,.06,.06),COL.gold,a,.3,c,.6,.6,0);
    add(g,BX(.18,.08,.12),COL.woodLight,.32,.04,.32);
    break;}
  case 'trap':{
    add(g,BX(.72,.04,.72),COL.woodLight,0,.02,0);
    if(b.charges>0) for(let i=0;i<3;i++)for(let k=0;k<3;k++) add(g,CN(.05,.2,4),COL.steel,-.22+i*.22,.13,-.22+k*.22);
    break;}
  case 'cata':{
    add(g,BX(.74,.1,.42),COL.wood,0,.17,0);
    for(const [a,c] of [[-.26,.23],[.26,.23],[-.26,-.23],[.26,-.23]]) add(g,CY(.12,.12,.05,8),COL.dark,a,.12,c,Math.PI/2,0,0);
    add(g,BX(.06,.34,.06),COL.wood,-.05,.38,.15); add(g,BX(.06,.34,.06),COL.wood,-.05,.38,-.15); add(g,BX(.06,.05,.36),COL.woodLight,-.05,.54,0);
    const arm=new THREE.Group(); arm.position.set(-.05,.3,0); g.add(arm);
    add(arm,BX(.05,.62,.05),COL.woodLight,0,.31,0); add(arm,DO(.08),COL.stoneDark,0,.64,0);
    g.userData.arm=arm;
    if(b.lvl>=2){ add(g,BX(.02,.36,.02),COL.wood,.3,.4,0); g.userData.flag=add(g,BX(.14,.09,.02),COL.gold,.37,.52,0); }
    break;}
  case 'house':{
    add(g,BX(.5,.3,.42),COL.plank,0,.15,0);
    const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
    add(g,prism,COL.roof,0,.4,0).scale.set(.66,.95,.78);
    add(g,BX(.07,.18,.07),COL.stoneDark,.14,.52,-.08);
    add(g,BX(.1,.16,.02),COL.dark,.08,.08,.215);
    g.userData.win=add(g,BX(.09,.08,.02),0,-.13,.17,.215,0,0,0,new THREE.MeshBasicMaterial({color:0x3A2A20}));
    add(g,BX(.02,.08,.09),0,.255,.17,0,0,0,0,g.userData.win.material);
    add(g,BX(.5,.06,.03),COL.woodLight,0,.05,.38); add(g,BX(.03,.06,.2),COL.woodLight,-.24,.05,.29);
    break;}
  case 'lumber':{
    tree(g,-.24,-.22,1.05,1); tree(g,.26,-.26,.8,2);
    add(g,BX(.04,.34,.04),COL.wood,-.3,.17,.12); add(g,BX(.04,.26,.04),COL.wood,-.3,.13,.36);
    add(g,BX(.04,.34,.04),COL.wood,.02,.17,.12); add(g,BX(.04,.26,.04),COL.wood,.02,.13,.36);
    add(g,BX(.42,.03,.34),COL.roof,-.14,.33,.24,.22,0,0);
    for(let i=0;i<3;i++) add(g,CY(.055,.055,.38,6),COL.woodLight,-.14,.06+(i===2?.09:0),.2+(i===2?0:(i?.06:-.06))+(i===2?.0:0),0,0,Math.PI/2);
    add(g,CY(.09,.1,.08,7),COL.woodLight,.25,.04,.25);
    add(g,BX(.02,.16,.02),COL.wood,.25,.14,.25,0,0,.3); add(g,BX(.07,.05,.02),COL.steel,.28,.21,.25);
    break;}
  case 'market':{
    for(const [a,c] of [[-.26,-.16],[.26,-.16],[-.26,.16],[.26,.16]]) add(g,BX(.035,.46,.035),COL.wood,a,.23,c);
    add(g,BX(.58,.14,.3),COL.wood,0,.17,0);
    for(let i=0;i<4;i++) add(g,BX(.155,.03,.42),i%2?COL.plank:COL.awning,-.24+i*.16,.5,0,.22,0,0);
    for(const [a,col] of [[-.18,COL.gold],[0,COL.crop],[.18,0xC0532F]]) add(g,DO(.05),col,a,.28,.02);
    add(g,BX(.14,.14,.14),COL.woodLight,.34,.07,.28,0,.3,0); add(g,BX(.12,.12,.12),COL.woodLight,-.33,.06,.3,0,-.2,0);
    break;}
  case 'well':{
    add(g,CY(.26,.28,.2,10),COL.stone,0,.1,0); add(g,CY(.2,.2,.21,10),0x2A4A6A,0,.11,0);
    for(const a of [-.22,.22]) add(g,BX(.04,.42,.04),COL.wood,a,.3,0);
    add(g,BX(.56,.04,.1),COL.wood,0,.51,0); add(g,CN(.36,.18,4),COL.roof,0,.62,0,0,Math.PI/4,0);
    break;}
  case 'shrine':{
    add(g,BX(.6,.08,.6),COL.stone,0,.04,0); add(g,BX(.42,.08,.42),COL.stone,0,.12,0);
    add(g,BX(.14,.42,.14),0xEDE3CE,0,.37,0); add(g,CN(.1,.14,4),COL.gold,0,.65,0,0,Math.PI/4,0);
    for(const [a,c] of [[-.24,.24],[.24,.24]]){ add(g,CY(.03,.04,.16,6),COL.dark,a,.24,c); }
    g.userData.flame=add(g,CN(.05,.12,5),0,-.24,.38,.24,0,0,0,flameMat);
    break;}
  case 'range':{
    add(g,BX(.7,.02,.5),0xB98A5A,0,.01,0);
    for(const [a,c] of [[-.2,-.16],[.12,-.2]]){ const t=new THREE.Group(); t.position.set(a,0,c); g.add(t);
      add(t,BX(.03,.3,.03),COL.wood,-.06,.15,.02,0,0,.25); add(t,BX(.03,.3,.03),COL.wood,.06,.15,.02,0,0,-.25);
      add(t,CY(.13,.13,.04,14),0xEDE3CE,0,.3,0,Math.PI/2,0,0); add(t,CY(.09,.09,.045,14),COL.roof,0,.3,0,Math.PI/2,0,0); add(t,CY(.045,.045,.05,12),0xEDE3CE,0,.3,0,Math.PI/2,0,0); }
    add(g,BX(.03,.6,.03),COL.wood,.3,.3,.18); g.userData.flag=add(g,BX(.18,.12,.02),b.lvl>=2?COL.gold:0x3A6A5A,.39,.54,.18);
    if(ASSET.ready){ put(g,'weapons_rack_01',-.18,0,.22,0,.28); put(g,'weapons_quiver_01',.12,0,.22,0,.3); put(g,'props_crate_01',.28,0,-.05,.4,.35); }
    else add(g,BX(.3,.18,.05),COL.wood,-.18,.09,.22);
    break;}
  case 'harbor':{
    const d=waterDir(x,y), dock=new THREE.Group(); dock.rotation.y=Math.atan2(-d[1],d[0]); g.add(dock);
    add(dock,BX(1.55,.05,.42),COL.woodLight,.6,.07,0);
    for(let i=0;i<4;i++) for(const sd of [-.18,.18]) add(dock,CY(.03,.03,.6,6),COL.wood,.15+i*.4,-.2,sd);
    for(let i=0;i<8;i++) add(dock,BX(.02,.056,.43),COL.wood,-.12+i*.2,.075,0);
    add(dock,BX(.36,.28,.44),COL.plank,-.24,.14,0);
    const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
    add(dock,prism,COL.roof,-.24,.38,0).scale.set(.52,.6,.6);
    add(dock,BX(.04,.7,.04),COL.wood,.5,.42,.17); add(dock,BX(.42,.035,.035),COL.wood,.68,.76,.17,0,0,-.18); add(dock,BX(.01,.24,.01),COL.dark,.86,.6,.17);
    if(ASSET.ready){ put(dock,'props_crate_01',.2,.09,-.12,.3,.33); put(dock,'props_barrel_01',.32,.09,.12,0,.3); put(dock,'props_sack_01',-.02,.09,.14,0,.3); }
    else add(dock,BX(.14,.14,.14),COL.woodLight,.2,.16,-.12);
    break;}
  case 'w_granary': case 'w_bazaar': case 'w_academy': case 'w_cathedral': case 'w_colossus':{
    const done=b.done, f=done?1:Math.max(.25,((b.prog||0)+1)/((DEF[b.type].days||3)+1));
    add(g,BX(.96,.06,.96),COL.stone,0,.03,0);
    const top=new THREE.Group(); top.scale.set(1,f,1); g.add(top);
    const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
    if(b.type==='w_granary'){ for(const [a,c] of [[-.24,-.2],[.24,-.2],[0,.22]]){ add(top,CY(.17,.19,.5,12),0xE8D8B8,a,.31,c); add(top,CN(.2,.22,12),COL.roof,a,.67,c); } add(top,BX(.5,.18,.18),COL.woodLight,0,.15,.05); }
    else if(b.type==='w_bazaar'){ [[-.25,-.22,0xA9553E],[.25,-.22,0x6A8AD8],[-.25,.22,0xD8A848],[.25,.22,0x6A8A5A]].forEach(([a,c,col])=>{ for(const [ox,oz] of [[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]]) add(top,BX(.02,.3,.02),COL.wood,a+ox,.15,c+oz); add(top,CN(.26,.18,4),col,a,.38,c,0,Math.PI/4,0); add(top,BX(.2,.08,.12),COL.woodLight,a,.06,c); }); }
    else if(b.type==='w_academy'){ add(top,BX(.8,.32,.5),0xEDE3CE,0,.22,-.1); for(let i=0;i<6;i++) add(top,CY(.03,.03,.32,8),0xF4F1EA,-.33+i*.13,.22,.2); add(top,BX(.86,.05,.6),0xD8CFC0,0,.4,-.05); add(top,DO(.17),0x6A8AD8,0,.5,-.1).scale.set(1,.7,1); add(top,BX(.86,.06,.08),0xD8CFC0,0,.06,.24); }
    else if(b.type==='w_cathedral'){ add(top,BX(.42,.5,.8),0xEDE3CE,0,.29,0); add(top,prism,COL.roof,0,.68,0).scale.set(.62,.7,.95); add(top,BX(.22,.95,.22),0xE8DCC8,0,.5,.38); add(top,CN(.15,.35,4),COL.gold,0,1.15,.38,0,Math.PI/4,0); add(top,CY(.12,.12,.02,10),0xFFD060,0,.6,.495,Math.PI/2,0,0); }
    else { add(top,BX(.42,.24,.42),COL.stone,0,.18,0); const st=new THREE.Group(); st.position.y=.3; top.add(st); const br=0xC9963E;
      add(st,BX(.11,.32,.2),br,0,.16,0); add(st,BX(.13,.3,.24),br,0,.47,0); add(st,DO(.075),br,0,.7,0); add(st,CY(.08,.07,.04,8),COL.gold,0,.78,0);
      add(st,BX(.05,.3,.05),br,0,.48,.16,0,0,.0); add(st,BX(.02,.9,.02),COL.wood,.02,.65,.2); add(st,CN(.03,.1,4),COL.gold,.02,1.12,.2); add(st,CY(.12,.12,.02,10),br,0,.45,-.17,Math.PI/2,0,0); }
    if(!done){ for(const [a,c] of [[-1,-1],[1,-1],[1,1],[-1,1]]) add(g,BX(.03,.9,.03),COL.wood,a*.44,.45,c*.44); for(const h of [.3,.6]){ add(g,BX(.9,.02,.02),COL.woodLight,0,h,.44); add(g,BX(.9,.02,.02),COL.woodLight,0,h,-.44); } }
    else { const fl=new THREE.Group(); fl.position.set(.42,0,.42); g.add(fl); add(fl,BX(.02,.5,.02),COL.wood,0,.25,0); const fg=new THREE.Group(); fg.position.set(0,.45,0); fl.add(fg); add(fg,BX(.12,.08,.01),COL.gold,.06,0,0); g.userData.flag=fg; }
    break;}
  case 'pasture':{
    add(g,BX(.88,.012,.88),0xA8A05A,0,.006,0);
    for(const [a,c,w,d] of [[0,-.42,.86,.025],[0,.42,.86,.025],[-.42,0,.025,.86],[.42,0,.025,.86]]){ add(g,BX(w,.025,d),COL.wood,a,.1,c); add(g,BX(w,.025,d),COL.wood,a,.18,c); }
    for(const [a,c] of [[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42],[0,-.42],[0,.42]]) add(g,BX(.04,.24,.04),COL.wood,a,.12,c);
    for(const [a,c,col,r] of [[-.15,-.1,0xEDE8DC,.4],[.18,.12,0x8A7A6A,-.8],[.05,-.25,0xEDE8DC,2]]){ const gt=new THREE.Group(); gt.position.set(a,0,c); gt.rotation.y=r; g.add(gt); add(gt,BX(.16,.08,.08),col,0,.12,0); add(gt,BX(.06,.055,.05),col,.1,.17,0); for(const [x,z] of [[.06,.03],[.06,-.03],[-.06,.03],[-.06,-.03]]) add(gt,BX(.02,.08,.02),0x5A4A3A,x,.04,z); }
    add(g,BX(.24,.06,.08),COL.wood,.25,.03,-.3);
    break;}
  case 'storehouse':{
    add(g,BX(.82,.36,.62),COL.woodLight,0,.18,0);
    const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
    add(g,prism,0x8A5A3A,0,.5,0).scale.set(1.05,.85,1); add(g,BX(.22,.24,.02),COL.wood,0,.12,.315); add(g,BX(.02,.24,.022),COL.dark,0,.12,.32);
    add(g,BX(.12,.12,.12),COL.woodLight,.3,.06,.4); add(g,BX(.1,.1,.1),COL.woodLight,.33,.17,.38,0,.4,0); add(g,CY(.05,.05,.12,8),COL.wood,-.32,.06,.4);
    break;}
  case 'brewery':{
    add(g,BX(.6,.24,.5),COL.stone,-.08,.12,0); add(g,BX(.62,.18,.52),COL.wood,-.08,.33,0);
    const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
    add(g,prism,COL.roof,-.08,.52,0).scale.set(.78,.62,.62);
    add(g,CY(.15,.15,.2,10),0x8A5A30,.3,.1,.18); add(g,CY(.155,.155,.02,10),COL.dark,.3,.06,.18); add(g,CY(.155,.155,.02,10),COL.dark,.3,.15,.18);
    for(const z of [-.2,0]) add(g,CY(.06,.06,.13,8),COL.wood,.36,.07,z,Math.PI/2,0,0);
    break;}
  case 'weaver':{
    add(g,BX(.5,.28,.42),0xE8D8B8,-.1,.14,-.05);
    const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
    add(g,prism,0x6A7A9A,-.1,.38,-.05).scale.set(.66,.7,.62);
    for(const x of [.2,.42]) add(g,BX(.03,.28,.03),COL.wood,x,.14,.25); add(g,BX(.26,.03,.03),COL.wood,.31,.27,.25); add(g,BX(.2,.16,.012),0xC98AB8,.31,.16,.25);
    [0xC98AB8,0x6A8A5A,0xD8A848].forEach((c,i)=>add(g,CY(.035,.035,.18,8),c,.3+i*.0,.04+i*.07,-.2+i*0,Math.PI/2,0,0));
    break;}
  case 'saltpan':{
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){ add(g,BX(.26,.03,.36),0xC8B898,-.28+i*.28,.015,-.19+j*.38); add(g,BX(.22,.012,.32),0xF4F1EA,-.28+i*.28,.035,-.19+j*.38); }
    add(g,CN(.1,.14,8),0xF4F1EA,.36,.07,.34); add(g,BX(.02,.24,.02),COL.wood,-.42,.12,.42);
    break;}
  case 'workshop':{
    for(const [a,c] of [[-.32,-.25],[.32,-.25],[-.32,.25],[.32,.25]]) add(g,BX(.04,.34,.04),COL.wood,a,.17,c);
    add(g,BX(.76,.04,.62),0x8A5A3A,0,.36,0,.12,0,0); add(g,BX(.56,.3,.04),COL.plank,0,.15,-.26);
    add(g,BX(.36,.04,.16),COL.woodLight,.05,.18,.05); for(const x of [-.1,.2]) add(g,BX(.03,.16,.12),COL.wood,x,.08,.05);
    add(g,BX(.03,.1,.02),COL.steel,-.12,.27,-.24); add(g,BX(.06,.02,.02),COL.steel,.0,.27,-.24); add(g,BX(.02,.12,.02),COL.wood,.12,.25,-.24);
    add(g,BX(.12,.12,.12),COL.woodLight,.32,.06,.36);
    break;}
  case 'road':{
    add(g,BX(.96,.03,.96),0xB89A74,0,.015,0);
    const st=[[-.28,-.27,.3,.26],[.06,-.3,.32,.22],[.34,-.22,.2,.34],[-.3,.06,.26,.3],[.0,.0,.3,.3],[.32,.14,.24,.28],[-.22,.33,.36,.2],[.16,.36,.3,.18]];
    st.forEach(([a,c,w,d],i)=>add(g,BX(w,.03,d),i%2?0xCFC4B2:0xBFB39E,a,.03,c,0,(i*.37)%.3-.15,0));
    if(hash(x,y,5)<.45){ add(g,BX(.025,.46,.025),0x2E2A28,.42,.23,.42); add(g,BX(.08,.015,.015),0x2E2A28,.39,.46,.42); g.userData.win=add(g,BX(.05,.06,.05),0,.36,.42,.42,0,0,0,new THREE.MeshBasicMaterial({color:0x3A2A20})); }
    break;}
  case 'lighthouse':{
    add(g,CY(.28,.32,.12,8),COL.stoneDark,0,.06,0);
    add(g,CY(.15,.21,.95,10),0xF2EEE6,0,.6,0); add(g,CY(.165,.18,.14,10),0xB0393B,0,.42,0); add(g,CY(.15,.16,.14,10),0xB0393B,0,.78,0);
    add(g,CY(.19,.19,.04,10),COL.wood,0,1.08,0);
    const lamp=add(g,CY(.11,.11,.16,8),0xFFE6A0,0,1.18,0,0,0,0,FLAME_A); lamp.castShadow=false;
    add(g,CN(.15,.16,8),0xB0393B,0,1.34,0);
    const beam=new THREE.Group(); beam.position.y=1.18; g.add(beam);
    const bm=new THREE.MeshBasicMaterial({color:0xFFE8B0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    for(const sgn of [1,-1]){ const c=new THREE.Mesh(CN(.5,3.2,12,true),bm); c.rotation.z=sgn*Math.PI/2; c.position.x=sgn*1.6; beam.add(c); }
    beam.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); g.userData.beam=beam;
    break;}
  case 'smith':{
    add(g,BX(.6,.32,.48),COL.stone,-.05,.16,0); add(g,BX(.62,.04,.5),COL.wood,-.05,.34,0);
    const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
    add(g,prism,0x5A4A44,-.05,.48,0).scale.set(.78,.7,.62);
    add(g,BX(.12,.42,.12),COL.stoneDark,.16,.55,-.14);
    add(g,BX(.22,.04,.3),COL.wood,.32,.27,.1); add(g,BX(.04,.27,.04),COL.wood,.42,.13,.24); add(g,BX(.04,.27,.04),COL.wood,.42,.13,-.04);
    add(g,BX(.08,.12,.08),COL.wood,.36,.06,-.24); add(g,BX(.14,.05,.06),0x3A3A40,.36,.15,-.24); add(g,BX(.05,.03,.05),0x3A3A40,.43,.13,-.24);
    const fg=add(g,BX(.12,.08,.02),0xFF8A2A,.25,.14,.0,0,0,0,FLAME_B); fg.castShadow=false; g.userData.forge=fg;
    break;}
  case 'tavern':{
    add(g,BX(.62,.3,.5),0xE8D8B8,0,.15,0); add(g,BX(.68,.22,.56),COL.woodLight,0,.41,0);
    const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
    add(g,prism,COL.roof,0,.63,0).scale.set(.85,.75,.7);
    for(const z of [-.12,.12]) add(g,BX(.012,.08,.1),0x3A2A20,.311,.2,z);
    const wm=new THREE.MeshLambertMaterial({color:0x3A2A20}); const win=add(g,BX(.012,.08,.36),0x3A2A20,.341,.42,0,0,0,0,wm); g.userData.win=win;
    add(g,BX(.012,.18,.1),COL.wood,.311,.09,0);
    add(g,BX(.18,.03,.03),COL.wood,.4,.36,.26); const sign=new THREE.Group(); sign.position.set(.46,.34,.26); g.add(sign); add(sign,BX(.02,.1,.12),COL.gold,0,-.06,0); g.userData.flag=sign;
    add(g,CY(.06,.06,.12,8),COL.wood,.42,.06,-.18); add(g,CY(.06,.06,.12,8),COL.wood,.42,.06,-.04);
    break;}
  case 'barr':{
    add(g,BX(.8,.3,.52),COL.plank,0,.15,0);
    add(g,BX(.82,.04,.54),COL.wood,0,.31,0);
    const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
    add(g,prism,COL.roof,0,.43,0);
    add(g,BX(.16,.2,.02),COL.dark,0,.1,.27);
    for(const a of [-.28,.28]) add(g,BX(.06,.06,.02),COL.dark,a,.18,.27);
    add(g,BX(.03,.7,.03),COL.wood,.46,.35,.2);
    g.userData.flag=add(g,BX(.2,.14,.02),b.lvl>=2?COL.gold:COL.ally,.56,.62,.2);
    if(ASSET.ready){ put(g,'weapons_rack_01',-.3,0,.4,0,.3); put(g,'props_barrel_01',.32,0,.38,0,.28); }
    break;}
  }
  addWorker(g,b);
  g.position.set(W2(x),0,W2(y));
  return g;
}
function sigOf(b,x,y){
  if(b.type==='wall') return 'w'+b.lvl+NB.map(([a,c])=>inb(x+a,y+c)&&G(x+a,y+c).b&&G(x+a,y+c).b.type==='wall'?1:0).join('');
  if(b.type==='farm') return 'f'+farmStage(b);
  if(b.type==='trap') return 't'+(b.charges>0);
  if(DEF[b.type]&&DEF[b.type].wonder) return b.type+(b.done?'done':'p'+(b.prog||0));
  return b.type+(b.lvl||0)+(b.spec||'');
}
const blobTex=canvasTex(x=>{ const g=x.createRadialGradient(32,32,4,32,32,32); g.addColorStop(0,'rgba(20,10,6,.55)'); g.addColorStop(.6,'rgba(20,10,6,.25)'); g.addColorStop(1,'rgba(20,10,6,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); });
const blobGeo=new THREE.PlaneGeometry(1,1), blobMat=new THREE.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
const CON=1.15;
function scaffoldModel(){
  const g=new THREE.Group(), mat=COL.woodLight;
  for(const [a,c] of [[-1,-1],[1,-1],[1,1],[-1,1]]) add(g,BX(.03,.8,.03),COL.wood,a*.38,.4,c*.38);
  for(const h of [.28,.58]){ add(g,BX(.8,.025,.025),mat,0,h,.38); add(g,BX(.8,.025,.025),mat,0,h,-.38); add(g,BX(.025,.025,.8),mat,.38,h,0); add(g,BX(.025,.025,.8),mat,-.38,h,0); }
  add(g,BX(.8,.02,.12),COL.plank,0,.6,.32); add(g,BX(.02,.42,.02),COL.wood,.3,.21,.42,0,0,.5);
  g.traverse(c=>{ if(c.isMesh) c.castShadow=true; }); return g;
}
function towerSpecDecor(g,b){
  const top=new THREE.Box3().setFromObject(g).max.y, d=new THREE.Group(); d.position.y=top; g.add(d);
  if(b.spec==='ballista'){ add(d,BX(.06,.06,.06),COL.wood,0,.03,0); add(d,BX(.34,.04,.05),COL.wood,.05,.08,0); add(d,BX(.04,.04,.32),COL.woodLight,.18,.08,0,0,0,0); add(d,BX(.22,.012,.012),COL.steel,.12,.11,0); }
  else { add(d,CY(.08,.05,.08,8),0x3A3A40,0,.04,0); const f=add(d,CN(.06,.12,6),0xFF8A2A,0,.13,0,0,0,0,FLAME_B); f.castShadow=false; g.userData.brazier=f; }
}
function houseDecor(g,x,y){
  const h=hash(x,y,31), h2=hash(y,x,17), d=new THREE.Group(); g.add(d);
  if(h<.55){ const cl=[0xE8E0D0,0xB0533B,0x5A7A9A,0xC9A86A,0x8A6A9A];
    add(d,BX(.015,.24,.015),COL.wood,.43,.12,-.32); add(d,BX(.015,.24,.015),COL.wood,.43,.12,.22); add(d,BX(.006,.006,.54),0xD8D2CA,.43,.235,-.05);
    const cloths=[]; for(let i=0;i<3;i++){ const c=add(d,BX(.008,.09,.1),cl[(i+Math.floor(h*10))%5],.43,.19,-.24+i*.15); c.castShadow=false; cloths.push(c); } g.userData.cloths=cloths; }
  else { add(d,CY(.055,.05,.11,8),COL.wood,.4,.055,.36); add(d,CY(.057,.057,.012,8),COL.dark,.4,.09,.36); }
  if(h2<.6){ add(d,CY(.035,.028,.05,6),0xA9553E,-.4,.025,.4); add(d,DO(.04),h2<.3?0xD0506A:0xE8C040,-.4,.07,.4); add(d,DO(.035),0x5C7A34,-.38,.055,.42); }
  if(h2>.7){ add(d,BX(.12,.06,.08),COL.woodLight,-.4,.03,-.36); add(d,BX(.12,.06,.08),COL.woodLight,-.4,.09,-.36,0,.3,0); }
  d.traverse(o=>{ if(o.isMesh) o.castShadow=false; });
}
function syncBuildings(){
  for(let i=0;i<N*N;i++){
    const t=S.grid[i], x=i%N, y=(i/N)|0, cur=bMeshes[i];
    if(!t.b){ if(cur){ scene.remove(cur.g); if(cur.sc) scene.remove(cur.sc); delete bMeshes[i]; } continue; }
    const sig=sigOf(t.b,x,y);
    if(cur&&cur.b===t.b&&cur.sig===sig) continue;
    if(cur){ scene.remove(cur.g); if(cur.sc) scene.remove(cur.sc); }
    const g=modelFor(t.b,x,y); scene.add(g); bMeshes[i]={g,b:t.b,sig};
    if(t.b.type==='house'||t.b.type==='tavern') houseDecor(g,x,y);
    if(t.b.type==='tower'&&t.b.spec) towerSpecDecor(g,t.b);
    if(t.b.type!=='trap'&&t.b.type!=='road'){ const sh=new THREE.Mesh(blobGeo,blobMat); sh.rotation.x=-Math.PI/2; sh.position.set(0,.012,0); sh.scale.setScalar(t.b.type==='keep'?1.5:t.b.type==='wall'?.95:1.15); sh.renderOrder=1; g.add(sh); }
  }
  for(const k in oreMeshes) oreMeshes[k].visible=!S.grid[k].b;
  for(const k in groveMeshes) groveMeshes[k].visible=!S.grid[k].b;
  for(const [i,m] of plantMeshes) m.visible=!S.grid[i].b;
}
function animateBuildings(t){
  for(const k in bMeshes){
    const {g,b}=bMeshes[k];
    const age=S.t-(b.born??-9), e=bMeshes[k];
    const rising=!reduce&&(b.lvl||1)===1&&b.type!=='keep'&&b.type!=='road'&&b.type!=='trap'&&age>=0&&age<CON;
    if(g.userData.beam){ g.userData.beam.visible=nightA>.15; g.userData.beam.rotation.y=t*1.1; g.userData.beam.children.forEach(c=>{ if(c.material) c.material.opacity=nightA*.22; }); }
    const pop=!rising&&age>=0&&age<.35&&!reduce?1-Math.pow(1-age/.35,3):1;
    let sy=pop; if(b.hitT&&S.t-b.hitT<.15&&S.t>=b.hitT&&!reduce) sy*=.94;
    if(rising){ const q=age/CON, ez=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2; g.position.y=-(1-ez)*.95; g.scale.set(1,1,1);
      if(!e.sc){ e.sc=scaffoldModel(); e.sc.position.set(g.position.x,0,g.position.z); scene.add(e.sc); }
      e.sc.position.y=q>.8?-(q-.8)*4:0;
      if(Math.random()<.25) haze(+k%N+(Math.random()-.5)*.7,((+k/N)|0)+(Math.random()-.5)*.7,.6);
    } else {
      if(g.position.y!==0) g.position.y=0;
      if(e.sc){ scene.remove(e.sc); e.sc=null; for(let i=0;i<8;i++) haze(+k%N+(Math.random()-.5)*.9,((+k/N)|0)+(Math.random()-.5)*.9,1); }
      g.scale.set(.6+.4*pop,Math.max(.05,sy),.6+.4*pop);
    }
    if(g.userData.flag) g.userData.flag.rotation.y=reduce?0:Math.sin(t*3+k*1.3)*.35;
    if(g.userData.brazier) g.userData.brazier.scale.set(1,reduce?1:.8+Math.sin(t*14+(+k))*.25,1);
    if(g.userData.cloths&&!reduce) g.userData.cloths.forEach((c,i)=>{ c.rotation.z=Math.sin(t*3.2+i+(+k))*.35; });
    if(g.userData.worker){ const on=!!b.worked&&!b.off; g.userData.worker.visible=on; if(on&&!reduce) g.userData.worker.rotation.z=Math.sin(t*5+(+k))*.18; }
    if(g.userData.win) g.userData.win.material.color.setHex(nightA>.35?0xFFC45A:0x3A2A20);
    if(g.userData.flame){ const f=Math.max(.001,nightA); g.userData.flame.scale.setScalar(f*(1+(reduce?0:Math.sin(t*14+(+k))*.15))); }
    if(g.userData.arm){
      const w=weapon(b), since=w.rate-Math.max(0,b.cd||0);
      let a; if(since<.2) a=-1+1.7*(since/.2); else a=.7-1.7*Math.min(1,(since-.2)/.9);
      g.userData.arm.rotation.z=a; g.rotation.y=-(b.aim??Math.PI);
    }
  }
}
