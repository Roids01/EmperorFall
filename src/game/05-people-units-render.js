// ---------- jointed people: legs and arms swing from hip and shoulder pivots; +x is forward ----------
function canvasTex(draw){ const c=document.createElement('canvas'); c.width=c.height=64; draw(c.getContext('2d')); return new THREE.CanvasTexture(c); }
const glowTex=canvasTex(x=>{ const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,190,110,1)'); g.addColorStop(.35,'rgba(255,140,60,.5)'); g.addColorStop(1,'rgba(255,110,40,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); });
const softTex=canvasTex(x=>{ const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.5,'rgba(255,255,255,.55)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); });
const scorchTex=canvasTex(x=>{ const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(24,16,12,.85)'); g.addColorStop(.55,'rgba(30,20,14,.45)'); g.addColorStop(1,'rgba(30,20,14,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); });
const FLAME_A=new THREE.MeshBasicMaterial({color:0xFFE6A0}), FLAME_B=new THREE.MeshBasicMaterial({color:0xFF8A2A});
const glowMat=new THREE.MeshBasicMaterial({map:glowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0});
function limb(parent,x,y,z,len,w,col,foot){ const j=new THREE.Group(); j.position.set(x,y,z); parent.add(j); add(j,BX(w,len,w),col,0,-len/2,0); if(foot) add(j,BX(w*1.5,.03,w*1.15),foot,w*.25,-len+.015,0); return j; }
function person(o){
  const g=new THREE.Group(), rig=new THREE.Group(); g.add(rig); g.userData.body=rig;
  const W=o.wide||1, hips=new THREE.Group(); hips.position.y=.2; rig.add(hips);
  const legL=limb(hips,0,0,.045*W,.2,.055,o.legs||COL.dark,COL.dark), legR=limb(hips,0,0,-.045*W,.2,.055,o.legs||COL.dark,COL.dark);
  add(hips,BX(.1*W,.2,.17*W),o.body,0,.1,0);
  add(hips,BX(.106*W,.035,.176*W),o.belt||COL.wood,0,.025,0);
  const armL=limb(hips,0,.18,.108*W,.17,.045,o.arms||o.body), armR=limb(hips,0,.18,-.108*W,.17,.045,o.arms||o.body);
  add(armL,DO(.028),COL.skin,0,-.175,0); add(armR,DO(.028),COL.skin,0,-.175,0);
  const head=new THREE.Group(); head.position.y=.29; hips.add(head);
  add(head,DO(.062),o.skin||COL.skin,0,0,0);
  switch(o.hat){
    case 'hood': add(head,CN(.088,.15,6),o.hatCol,-.014,.035,0); break;
    case 'helm': add(head,CY(.064,.07,.05,8),COL.steel,0,.035,0); add(head,CY(.092,.092,.012,8),COL.steel,0,.014,0); break;
    case 'horns': add(head,CY(.066,.07,.06,8),0x2E2A2E,0,.03,0); add(head,CN(.022,.11,5),COL.plank,0,.075,.065,.75,0,0); add(head,CN(.022,.11,5),COL.plank,0,.075,-.065,-.75,0,0); break;
    case 'cap': add(head,CY(.058,.066,.035,8),o.hatCol,0,.045,0); break;
    case 'crown': add(head,CY(.058,.052,.045,6),COL.gold,0,.066,0); break;
    case 'band': add(head,BX(.13,.026,.13),o.hatCol,0,.02,0); break;
  }
  if(o.cape) add(hips,BX(.02,.25,.15*W),o.cape,-.062*W,.07,0,0,0,-.12);
  Object.assign(g.userData,{legs:[legL,legR],arms:[armL,armR],hips,head});
  return g;
}
function hold(arm,kind){
  const h=new THREE.Group(); h.position.set(0,-.17,0); arm.add(h); let w=null;
  const asset=(n,sc,rz)=>{ if(!ASSET.ready) return false; w=AM(n); if(!w) return false; w.scale.setScalar(sc); w.rotation.z=rz; h.add(w); return true; };
  if(kind==='axe'){ if(!asset('weapons_handaxe_01',.55,-Math.PI/2)){ add(h,BX(.2,.02,.02),COL.wood,.08,0,0); add(h,BX(.05,.07,.015),COL.steel,.17,.025,0); } }
  else if(kind==='sword'){ if(!asset('weapons_armingsword_01',.32,-Math.PI/2)){ add(h,BX(.28,.022,.012),COL.steel,.16,0,0); add(h,BX(.02,.012,.07),COL.gold,.03,0,0); } }
  else if(kind==='spear'){ if(!asset('weapons_spear_01',.24,0)){ add(h,BX(.016,.5,.016),COL.wood,0,.13,0); add(h,CN(.022,.07,4),COL.steel,0,.41,0); } }
  else if(kind==='club'){ add(h,CY(.04,.02,.28,6),COL.wood,.12,0,0,0,0,-Math.PI/2); add(h,DO(.04),COL.wood,.25,0,0); }
  else if(kind==='dagger'){ add(h,BX(.12,.016,.026),COL.steel,.07,0,0); }
  return h;
}
function shield(arm,round){
  const h=new THREE.Group(); h.position.set(.01,-.11,.035); arm.add(h);
  const n=round?'weapons_shield_round_01':'weapons_shield_wooden_01', w=ASSET.ready&&AM(n);
  if(w){ w.scale.setScalar(.27); h.add(w); } else add(h,BX(.13,.14,.02),round?COL.steel:COL.woodLight,0,0,0);
  return h;
}
function torch(arm){
  const t=new THREE.Group(); t.position.set(.015,-.17,0); arm.add(t);
  add(t,BX(.022,.2,.022),COL.wood,0,.07,0);
  const a=new THREE.Mesh(CN(.042,.12,5),FLAME_B), b=new THREE.Mesh(CN(.025,.085,5),FLAME_A);
  a.position.y=.21; b.position.y=.2; a.userData.noFlash=b.userData.noFlash=true; t.add(a); t.add(b); t.userData.f=[a,b];
  return t;
}
function groundGlow(g,x,z,size){ const m=new THREE.Mesh(geo('glowP',()=>new THREE.PlaneGeometry(1,1)),glowMat); m.rotation.x=-Math.PI/2; m.position.set(x,.02,z); m.scale.set(size,size,1); m.userData.noFlash=true; m.renderOrder=2; g.add(m); return m; }
// swing: 0..1, where 1 is the arm raised highest
function animPerson(m,ph,moving,swing,tt){
  const u=m.userData, [lL,lR]=u.legs, [aL,aR]=u.arms, s=moving&&!reduce?Math.sin(ph):0;
  lL.rotation.z=s*.7; lR.rotation.z=-s*.7;
  u.body.position.y=moving&&!reduce?Math.abs(Math.cos(ph))*.022:0;
  u.hips.rotation.z=moving&&!reduce?-.06:0;
  aL.rotation.z=u.torch?.5+s*.06:(u.carry?2.85:-s*.55);
  aR.rotation.z=u.carry?2.85:swing>0?swing*2.5:s*.55;
  if(u.torch&&!reduce) u.torch.userData.f.forEach((f,i)=>f.scale.set(1,1+Math.sin(tt*22+i*2+(u.seed||0))*.22,1));
}
function ramModel(){
  const g=new THREE.Group(), body=new THREE.Group(); g.add(body); g.userData.body=body; g.userData.ram=true;
  add(body,BX(.62,.08,.34),COL.wood,0,.13,0);
  for(const [a,c] of [[-.2,.19],[.2,.19],[-.2,-.19],[.2,-.19]]) add(body,CY(.09,.09,.05,8),COL.dark,a,.09,c,Math.PI/2,0,0);
  for(const a of [-.24,.24]) for(const c of [-.15,.15]) add(body,BX(.04,.3,.04),COL.wood,a,.3,c);
  const prism=geo('prism',()=>{ const p=new THREE.CylinderGeometry(.34,.34,.86,3,1); p.rotateZ(Math.PI/2); p.rotateX(-Math.PI/2); p.scale(1,.62,1); return p; });
  add(body,prism,0x6A4A30,0,.5,0).scale.set(.8,.75,.62);
  const log=new THREE.Group(); log.position.set(0,.3,0); body.add(log);
  add(log,CY(.06,.06,.74,8),COL.woodLight,.05,0,0,0,0,Math.PI/2); add(log,CY(.075,.07,.1,8),COL.steel,.43,0,0,0,0,Math.PI/2);
  g.userData.log=log; g.scale.setScalar(1.05); scene.add(g); return g;
}
function bow(arm){
  const h=new THREE.Group(); h.position.set(.02,-.17,0); arm.add(h);
  const b=new THREE.Mesh(geo('bowG',()=>new THREE.TorusGeometry(.14,.012,4,10,Math.PI)),M(COL.wood)); b.rotation.set(0,Math.PI/2,Math.PI/2); b.castShadow=true; h.add(b);
  add(h,BX(.004,.28,.004),COL.plank,0,0,0); return h;
}
function wolfModel(){
  const g=new THREE.Group(), b=new THREE.Group(); g.add(b); g.userData.body=b; g.userData.wolf=true; const c=0x6A625C, d=0x4A4440;
  add(b,BX(.22,.08,.08),c,0,.12,0); add(b,BX(.06,.09,.09),d,.08,.13,0);
  const hd=new THREE.Group(); hd.position.set(.14,.17,0); b.add(hd); add(hd,BX(.07,.06,.06),c,0,0,0); add(hd,BX(.05,.03,.04),d,.05,-.01,0); add(hd,CN(.016,.04,4),d,-.01,.04,.02); add(hd,CN(.016,.04,4),d,-.01,.04,-.02);
  const eye=new THREE.Mesh(BX(.01,.01,.07),new THREE.MeshBasicMaterial({color:0xFFD040})); eye.position.set(.025,.012,0); eye.userData.noFlash=true; hd.add(eye);
  const tl=new THREE.Group(); tl.position.set(-.11,.14,0); b.add(tl); add(tl,BX(.1,.03,.03),c,-.05,-.01,0,0,0,-.3);
  g.userData.legs=[[.08,.03],[.08,-.03],[-.08,.03],[-.08,-.03]].map(([x,z])=>{ const l=new THREE.Group(); l.position.set(x,.09,z); b.add(l); add(l,BX(.022,.09,.022),d,0,-.045,0); return l; });
  g.userData.tail=tl; g.userData.seed=Math.random()*9; scene.add(g); return g;
}
function enemyModel(e){
  if(e.type==='ram') return ramModel();
  if(e.type==='wolf') return wolfModel();
  let g;
  if(e.type==='brute') g=person({body:COL.brute,legs:0x3A2418,arms:COL.skin,wide:1.35,belt:COL.dark});
  else if(e.type==='runner') g=person({body:COL.foeLight,legs:0x4A2A20,hat:'band',hatCol:COL.foe});
  else if(e.type==='warlord') g=person({body:0x3A3036,legs:COL.dark,hat:'horns',cape:COL.foe,belt:COL.gold});
  else if(e.type==='archer') g=person({body:0x5E4A2E,legs:0x3A2A1E,hat:'hood',hatCol:0x2E3A26,cape:0x4A3A22});
  else if(e.type==='shaman'){ g=person({body:0x2E4A3A,legs:0x2E4A3A,hat:'hood',hatCol:0xD8CCB0,belt:0x7CFF9A});
    const st=new THREE.Group(); st.position.set(.02,-.17,0); g.userData.arms[1].add(st); add(st,BX(.022,.42,.022),COL.wood,0,.1,0);
    const orb=new THREE.Mesh(DO(.045),new THREE.MeshBasicMaterial({color:0x7CFF9A})); orb.position.y=.33; orb.userData.noFlash=true; st.add(orb); }
  else if(e.type==='knight'){ const kc=e.king&&KINGS[e.king]?new THREE.Color(KINGS[e.king].color).getHex():0x6A6A80; g=person({body:kc,legs:0x4A4A55,arms:0x8A8A96,hat:'helm',belt:0x2A2A30,cape:kc}); }
  else if(e.type==='captain'){ g=person({body:0x8A1E22,legs:0x2A2228,belt:COL.gold,cape:0x2A2228}); const hd=g.userData.head; add(hd,CY(.13,.13,.02,3),0x1A1A1E,0,.05,0); add(hd,CY(.06,.065,.05,8),0x1A1A1E,0,.075,0); add(hd,BX(.02,.02,.02),0xEDE3CE,.06,.07,0); }
  else if(e.type==='sapper'){ g=person({body:0x4A3A2A,legs:0x3A2A1E,hat:'band',hatCol:0x2A2220}); const k=new THREE.Group(); k.position.set(-.07,.13,0); g.userData.hips.add(k); add(k,CY(.06,.06,.12,8),0x6A4A2A,0,0,0,0,0,Math.PI/2); add(k,CY(.062,.062,.015,8),COL.dark,0,.035,0,0,0,Math.PI/2); add(k,CY(.062,.062,.015,8),COL.dark,0,-.035,0,0,0,Math.PI/2);
    const sp=new THREE.Mesh(DO(.022),new THREE.MeshBasicMaterial({color:0xFFB040})); sp.position.set(0,.09,0); sp.userData.noFlash=true; k.add(sp); g.userData.spark=sp; }
  else if(e.pirate) g=person({body:0x2A3348,legs:0x3A2A20,hat:'band',hatCol:0xC0392B,belt:0x1A1A1A});
  else g=person({body:COL.foe,legs:0x4A2A20,hat:'hood',hatCol:0x5A1A22});
  const [armL,armR]=g.userData.arms;
  if(e.type==='shaman'){}
  else if(e.type==='archer'){ bow(armL); add(g.userData.hips,CY(.03,.03,.18,6),COL.wood,-.07,.14,.04,0,0,.3); }
  else if(e.type==='sapper'){}
  else if(e.type==='knight'){ hold(armR,'sword'); shield(armL,true); }
  else hold(armR,e.type==='brute'?'club':e.type==='runner'||e.type==='captain'&&false?'dagger':e.type==='warlord'||e.type==='captain'?'sword':'axe');
  if(e.type==='raider'||e.type==='brute'){ g.userData.torch=torch(armL); g.userData.glow=groundGlow(g,.06,.16,1.2); }
  else if(e.type==='warlord'){ shield(armL,true); g.userData.glow=groundGlow(g,0,0,.9); }
  g.userData.seed=Math.random()*9;
  g.scale.setScalar(e.type==='captain'?1.3:e.type==='warlord'?1.45:e.type==='brute'?1.12:e.type==='runner'||e.type==='shaman'?.95:1);
  scene.add(g); return g;
}
const hitMat=new THREE.MeshBasicMaterial({color:0xFFF4E0});
let FR=1/60;
function turnTo(m,yaw,rate){ let cur=m.userData.yaw; if(cur===undefined||reduce){ cur=yaw; } else { const d=((yaw-cur+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI; cur+=d*Math.min(1,FR*rate); } m.userData.yaw=cur; m.rotation.y=cur; return cur; }
const dying=[];
function syncEnemies(){
  const alive=new Set(S.enemies);
  for(const [e,m] of eMeshes) if(!alive.has(e)){
    eMeshes.delete(e);
    if(e.died&&!reduce){ flashMat(m,false); if(m.userData.glow) m.userData.glow.visible=false; if(m.userData.torch) m.userData.torch.visible=false; dying.push({m,t:0}); }
    else scene.remove(m);
  }
  for(let i=dying.length-1;i>=0;i--){ const d=dying[i]; d.t+=FR; const b=d.m.userData.body;
    b.rotation.x=Math.min(1,d.t/.32)*Math.PI/2; b.position.y=Math.min(1,d.t/.32)*.06;
    d.m.position.y=-Math.max(0,d.t-.9)*.45;
    if(d.t>1.8){ scene.remove(d.m); dying.splice(i,1); } }
  for(const e of S.enemies){
    let m=eMeshes.get(e); if(!m){ m=enemyModel(e); eMeshes.set(e,m); }
    const yaw=turnTo(m,-e.dir,10), dir=-yaw, l=e.lane||0;
    e.px=e.x-Math.sin(dir)*l; e.py=e.y+Math.cos(dir)*l;
    m.position.set(W2(e.px),0,W2(e.py));
    if(m.userData.wolf){ const k=e.age*e.spd*14; m.userData.legs.forEach((l,i)=>l.rotation.z=e.moving&&!reduce?Math.sin(k+(i%2?Math.PI:0)+(i>1?Math.PI/2:0))*.8:0); m.userData.body.position.y=e.moving&&!reduce?Math.abs(Math.sin(k))*.02:0; m.userData.tail.rotation.z=Math.sin(e.age*9)*.3; flashMat(m,e.hit>0); continue; }
    if(m.userData.spark) m.userData.spark.scale.setScalar(reduce?1:.7+Math.random()*.7);
    if(m.userData.ram){ const b=m.userData.body; b.position.y=e.moving&&!reduce?Math.abs(Math.sin(e.age*8))*.012:0; m.userData.log.position.x=e.swing>0?-.12*e.swing:0; }
    else{ if(e.type==='archer'){ m.userData.arms[0].rotation.z=(e.swing>0||!e.moving)?1.5:0; m.userData.arms[0].rotation.x=0; } animPerson(m,e.age*e.spd*(e.type==='runner'?13:10),e.moving,e.type==='archer'?0:(e.swing||0),S.t); if(e.type==='archer'&&!e.moving){ m.userData.arms[0].rotation.z=1.5; m.userData.arms[1].rotation.z=1.2+(e.swing||0)*.3; } }
    flashMat(m,e.hit>0);
  }
}
function syncShots(){
  const live=new Set(S.shots);
  for(const [s,m] of sMeshes) if(!live.has(s)){ scene.remove(m); sMeshes.delete(s); }
  for(const s of S.shots){
    let m=sMeshes.get(s);
    if(!m){ m=(s.kind==='arrow'||s.kind==='earrow')?new THREE.Mesh(BX(.28,.025,.025),M(COL.plank)):new THREE.Mesh(DO(.11),M(COL.stoneDark)); m.castShadow=true; scene.add(m); sMeshes.set(s,m); }
    if(s.kind==='arrow'||s.kind==='earrow'){ m.position.set(W2(s.x),s.h,W2(s.y)); m.rotation.set(0,-s.dir,0); }
    else{ const x=s.sx+(s.tx-s.sx)*s.p, y=s.sy+(s.ty-s.sy)*s.p; m.position.set(W2(x),.5+Math.sin(s.p*Math.PI)*1.8,W2(y)); m.rotation.set(s.p*6,s.p*4,0); }
  }
}
function heroModel(){
  const g=new THREE.Group(), body=new THREE.Group(); g.add(body); g.userData.body=body; g.userData.legs=[];
  add(body,BX(.44,.18,.17),COL.horse,0,.31,0); add(body,BX(.15,.17,.165),COL.horse,.17,.33,0);
  for(const [a,c] of [[.16,.06],[.16,-.06],[-.16,.06],[-.16,-.06]]){ const leg=new THREE.Group(); leg.position.set(a,.24,c); add(leg,BX(.05,.24,.05),COL.horse,0,-.12,0); add(leg,BX(.056,.035,.056),COL.dark,0,-.235,0); body.add(leg); g.userData.legs.push(leg); }
  add(body,BX(.09,.2,.09),COL.horse,.22,.43,0,0,0,-.55);
  add(body,BX(.17,.08,.08),COL.horse,.3,.52,0,0,0,.25);
  add(body,BX(.03,.2,.04),0x8A7E70,.19,.48,0,0,0,-.55);                       // mane
  add(body,CN(.018,.05,4),COL.horse,.25,.58,.025); add(body,CN(.018,.05,4),COL.horse,.25,.58,-.025);   // ears
  add(body,BX(.12,.03,.1),COL.wood,.2,.47,0,0,0,-.55);
  add(body,BX(.2,.03,.19),COL.roof,-.02,.41,0); add(body,BX(.22,.012,.2),COL.gold,-.02,.395,0);
  const tail=new THREE.Group(); tail.position.set(-.22,.37,0); body.add(tail); add(tail,BX(.045,.24,.04),0x8A7E70,0,-.12,0); tail.rotation.z=-.45; g.userData.tail=tail;
  const rider=person({body:COL.ally,legs:COL.ally,arms:COL.allyLight,hat:'crown',cape:COL.roof,belt:COL.gold});
  rider.position.set(-.03,.22,0); body.add(rider); g.userData.rider=rider;
  rider.userData.legs.forEach((l,i)=>{ l.rotation.x=(i?1:-1)*.7; l.rotation.z=.75; });
  hold(rider.userData.arms[1],'sword'); shield(rider.userData.arms[0],true);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.3,.35,32),new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2; ring.position.y=.02; g.add(ring); g.userData.ring=ring;
  g.scale.setScalar(1.25); scene.add(g); return g;
}
function unitModel(u){
  if(u&&u.ranged){ const g=person({body:0x3A6A5A,legs:0x2A3A3E,hat:'cap',hatCol:0x2F5D4E,belt:COL.wood}); bow(g.userData.arms[0]); if(ASSET.ready) put(g.userData.hips,'weapons_quiver_01',-.07,.02,.03,0,.25); g.userData.ranged=true; scene.add(g); return g; }
  const g=person({body:COL.ally,legs:0x2A3A5E,hat:'helm',belt:COL.wood});
  hold(g.userData.arms[1],'spear'); shield(g.userData.arms[0],false);
  scene.add(g); return g;
}
let heroMesh=null; const uMeshes=new Map();
let rideMark=null;
const rallyRing=new THREE.Mesh(new THREE.RingGeometry(.4,.5,48),new THREE.MeshBasicMaterial({color:COL.gold,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
rallyRing.rotation.x=-Math.PI/2; rallyRing.visible=false; scene.add(rallyRing);
const markRing=new THREE.Mesh(new THREE.RingGeometry(.18,.24,24),new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
markRing.rotation.x=-Math.PI/2; markRing.visible=false; scene.add(markRing);
const orderPool=[]; for(let i=0;i<12;i++){ const m=new THREE.Mesh(geo('ordP',()=>new THREE.PlaneGeometry(.86,.86)),new THREE.MeshBasicMaterial({color:COL.gold,transparent:true,opacity:.35,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=.028; m.visible=false; scene.add(m); orderPool.push(m); }
function flashMat(group,on){ group.traverse(c=>{ if(!c.isMesh||c===group.userData.ring||c.userData.noFlash) return; if(on){ if(!c.userData.m0) c.userData.m0=c.material; c.material=hitMat; } else if(c.userData.m0){ c.material=c.userData.m0; } }); }
function syncHero(t,raw){
  const h=S.hero; if(!h) return;
  if(!heroMesh) heroMesh=heroModel();
  heroMesh.visible=!h.dead&&heroHere();
  heroMesh.position.set(W2(h.x),0,W2(h.y)); turnTo(heroMesh,-h.dir,9);
  const gal=h.moving&&!reduce, ph=h.age*16;
  heroMesh.userData.legs.forEach((l,i)=>{ l.rotation.z=gal?Math.sin(ph+(i<2?0:Math.PI)+(i%2)*.6)*.7:0; });
  heroMesh.userData.body.position.y=gal?Math.abs(Math.sin(ph))*.04:0;
  heroMesh.userData.body.rotation.z=gal?Math.sin(ph)*.05:0;
  const rd=heroMesh.userData.rider.userData;
  rd.arms[1].rotation.z=h.swing>0?(h.swing/.25)*2.6:gal?.35+Math.sin(ph)*.1:.15; rd.arms[0].rotation.z=.35;
  rd.hips.rotation.z=gal?-.12-Math.sin(ph)*.05:0;
  heroMesh.userData.tail.rotation.x=reduce?0:Math.sin(t*(gal?9:2))*(gal?.35:.12);
  heroMesh.userData.ring.material.opacity=.35+.25*(reduce?1:(Math.sin(t*3)+1)/2);
  flashMat(heroMesh,h.hit>0);
  // orders
  orderPool.forEach((m,i)=>{ const q=h.queue[i]; m.visible=!!q&&S.phase==='day'; if(q){ m.position.x=W2(q.x); m.position.z=W2(q.y); m.material.opacity=i===0?.5+(reduce?0:Math.sin(t*6)*.12):.3; } });
  if(h.rallyFx>0){ rallyRing.visible=true; rallyRing.position.set(W2(h.x),.04,W2(h.y)); const k=1-h.rallyFx; rallyRing.scale.setScalar(.5+k*4); rallyRing.material.opacity=h.rallyFx*.8; } else rallyRing.visible=false;
  if(rideMark){ rideMark.life-=raw; markRing.visible=rideMark.life>0; markRing.position.set(W2(rideMark.x),.03,W2(rideMark.y)); const k=1-rideMark.life/.9; markRing.scale.setScalar(1+k*1.2); markRing.material.opacity=.8*(1-k); if(rideMark.life<=0) rideMark=null; }
  // soldiers
  const live=new Set(S.units);
  for(const [u,m] of uMeshes) if(!live.has(u)){ scene.remove(m); uMeshes.delete(u); }
  for(const u of S.units){
    let m=uMeshes.get(u); if(!m){ m=unitModel(u); uMeshes.set(u,m); }
    m.position.set(W2(u.x),0,W2(u.y)); turnTo(m,-u.dir,10);
    animPerson(m,u.age*12,u.moving,m.userData.ranged?0:(u.swing>0?u.swing/.25*.6:0),t);
    if(m.userData.ranged&&u.aiming&&!u.moving){ m.userData.arms[0].rotation.z=1.5; m.userData.arms[1].rotation.z=1.25+(u.swing>0?.3:0); }
    flashMat(m,u.hit>0);
  }
  syncFolk(t);
}
const fMeshes=new Map(), aMeshes=new Map();
function toolMesh(kind){
  const h=new THREE.Group();
  switch(kind){
    case 'hoe': add(h,BX(.016,.36,.016),COL.wood,0,.08,0); add(h,BX(.07,.02,.02),COL.steel,.03,.25,0); break;
    case 'axe': add(h,BX(.016,.26,.016),COL.wood,0,.05,0); add(h,BX(.05,.06,.012),COL.steel,.025,.16,0); break;
    case 'pick': add(h,BX(.016,.26,.016),COL.wood,0,.05,0); add(h,BX(.16,.02,.02),COL.steel,0,.17,0,0,0,.15); break;
    case 'rod': add(h,BX(.012,.5,.012),COL.woodLight,.06,.2,0,0,0,-.5); break;
    case 'hammer': add(h,BX(.014,.16,.014),COL.wood,0,.03,0); add(h,BX(.06,.04,.04),0x3A3A40,0,.11,0); break;
    case 'basket': add(h,CY(.05,.04,.05,8),COL.woodLight,0,-.03,0); add(h,DO(.025),COL.crop,0,.0,0); break;
    case 'mug': add(h,CY(.022,.022,.045,6),COL.woodLight,0,0,0); break;
    case 'cane': add(h,BX(.014,.24,.014),COL.wood,.02,-.08,0); break;
    case 'bucket': add(h,CY(.04,.032,.06,8),0x8A8A92,0,-.05,0); add(h,DO(.03),0x6AB0D8,0,-.02,0); break;
  }
  h.position.y=-.17; h.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); return h;
}
function folkModel(f){
  if(f.trader){ const g=person({body:f.cloth,legs:f.cloth,arms:f.cloth,skin:f.skin,belt:f.cloth2,hat:null}); add(g.userData.head,DO(.075),0xF2EADD,0,.05,0).scale.set(1,.7,1); add(g.userData.hips,CY(.08,.12,.2,8),f.cloth,0,-.08,0);
    const cm=new THREE.Group(); cm.position.set(-.05,0,-.42); g.add(cm); const cc=0xC9A06A; add(cm,BX(.28,.12,.12),cc,0,.26,0); add(cm,DO(.07),cc,0,.36,0); add(cm,BX(.05,.16,.05),cc,.15,.36,0,0,0,-.3); add(cm,BX(.08,.05,.05),cc,.2,.44,0); for(const [a,c] of [[.1,.04],[.1,-.04],[-.1,.04],[-.1,-.04]]) add(cm,BX(.03,.2,.03),cc,a,.1,c); add(cm,BX(.16,.1,.18),0x8A3A2A,-.02,.33,0);
    add(g,BX(.3,.05,.2),COL.woodLight,.28,.12,.1); [0xF0BE4E,0xA9553E,0x6A8A5A].forEach((c,i)=>add(g,DO(.035),c,.2+i*.08,.17,.1));
    g.userData.tools={bucket:new THREE.Group()}; g.userData.box=new THREE.Group(); scene.add(g); return g; }
  const g=person({body:f.cloth,legs:f.skirt?f.cloth2:0x5A4030,arms:f.cloth,skin:f.skin,belt:f.cloth2,
    hat:f.role==='farmer'?null:f.role==='merchant'||f.role==='fisher'?'cap':f.skirt&&hash(f.id,2,3)<.5?'band':null,hatCol:f.cloth2});
  const u=g.userData, head=u.head;
  add(head,BX(.07,.05,.128),f.hair,-.018,.035,0); if(f.skirt) add(head,BX(.04,.1,.11),f.hair,-.05,-.02,0);
  if(f.role==='farmer'){ add(head,CY(.12,.12,.012,10),0xD8B868,0,.05,0); add(head,CY(.05,.06,.045,8),0xD8B868,0,.075,0); }
  if(f.skirt) add(u.hips,CY(.075,.115,.17,8),f.cloth2,0,-.065,0);
  if(f.role==='smith') add(u.hips,BX(.11,.17,.17),0x4A3A30,.005,.07,0);
  u.tools={}; const tk=ROLE_TOOL[f.role]; if(tk){ const tm=toolMesh(tk); u.arms[1].add(tm); u.tools.main=tm; }
  const bk=toolMesh('bucket'); u.arms[0].add(bk); bk.visible=false; u.tools.bucket=bk;
  u.box=add(u.hips,BX(.12,.08,.1),COL.woodLight,0,.42,0); u.box.visible=false; u.box.castShadow=false;
  g.scale.setScalar(f.child?.62:f.elder?.9:.92); g.traverse(o=>{ if(o.isMesh) o.castShadow=!f.child; });
  scene.add(g); return g;
}
const CARGOCOL={wool:0xEDE3CE,cloth:0xC98AB8,ale:0xB07A30,salt:0xF4F1EA,tools:0x6A7A8A,crop:COL.crop,wood:COL.woodLight,ore:COL.stoneDark,iron:0x9FB8D0,fish:0x9AB8C8};
function animalModel(a){
  const g=new THREE.Group(), b=new THREE.Group(); g.add(b); g.userData.body=b;
  if(a.kind==='chicken'){ const c=hash(a.ax*7|0,a.ay*3|0,1)<.6?0xF4EEE2:0xA8683C; add(b,BX(.07,.055,.05),c,0,.05,0); const hd=new THREE.Group(); hd.position.set(.04,.08,0); b.add(hd); add(hd,BX(.03,.035,.03),c,0,0,0); add(hd,BX(.012,.012,.008),0xD84030,0,.022,0); add(hd,BX(.014,.008,.01),0xF0A030,.018,0,0); g.userData.head=hd; add(b,BX(.02,.04,.04),c,-.04,.07,0); g.scale.setScalar(.9); }
  else if(a.kind==='dog'){ const c=[0x8A5A30,0x3A2E26,0xD8C8A8][(a.ax*13|0)%3]; add(b,BX(.15,.06,.06),c,0,.09,0); const hd=new THREE.Group(); hd.position.set(.09,.13,0); b.add(hd); add(hd,BX(.06,.05,.05),c,0,0,0); add(hd,BX(.03,.025,.03),0x2A2220,.04,-.01,0); add(hd,BX(.015,.03,.012),c,-.01,.035,.018); add(hd,BX(.015,.03,.012),c,-.01,.035,-.018); g.userData.head=hd;
    const tl=new THREE.Group(); tl.position.set(-.075,.11,0); b.add(tl); add(tl,BX(.012,.06,.012),c,-.01,.025,0,0,0,.6); g.userData.tail=tl;
    g.userData.legs=[[.05,.02],[.05,-.02],[-.05,.02],[-.05,-.02]].map(([x,z])=>{ const l=new THREE.Group(); l.position.set(x,.07,z); b.add(l); add(l,BX(.018,.06,.018),c,0,-.03,0); return l; }); }
  else if(a.kind==='goat'){ const c=hash(a.ax*5|0,1,1)<.5?0xEDE8DC:0x8A7A6A; add(b,BX(.16,.08,.08),c,0,.12,0); const hd=new THREE.Group(); hd.position.set(.1,.17,0); b.add(hd); add(hd,BX(.06,.055,.05),c,0,0,0); add(hd,CN(.012,.05,4),0x5A4A3A,-.01,.04,.015,0,0,-.4); add(hd,CN(.012,.05,4),0x5A4A3A,-.01,.04,-.015,0,0,-.4); add(hd,BX(.015,.03,.015),0xEDE8DC,.02,-.04,0); g.userData.head=hd;
    g.userData.legs=[[.06,.03],[.06,-.03],[-.06,.03],[-.06,-.03]].map(([x,z])=>{ const l=new THREE.Group(); l.position.set(x,.08,z); b.add(l); add(l,BX(.02,.08,.02),0x5A4A3A,0,-.04,0); return l; }); }
  else { add(b,BX(.07,.025,.09),0xC8442E,0,.02,0); add(b,BX(.02,.02,.03),0xC8442E,.03,.02,.06,0,.5,0); add(b,BX(.02,.02,.03),0xC8442E,.03,.02,-.06,0,-.5,0); }
  g.traverse(o=>{ if(o.isMesh) o.castShadow=a.kind!=='crab'; }); scene.add(g); return g;
}
function syncFolk(t){
  const live=new Set(folk);
  for(const [f,m] of fMeshes) if(!live.has(f)){ scene.remove(m); fMeshes.delete(f); }
  for(const f of folk){
    let m=fMeshes.get(f); if(!m){ m=folkModel(f); fMeshes.set(f,m); }
    const u=m.userData, act=f.state==='act'?f.act:null, ph=f.age*(f.child?13:f.state==='flee'?14:9);
    m.position.set(W2(f.x),0,W2(f.y));
    if(act==='dance'&&!reduce) m.rotation.y+=FR*3; else turnTo(m,-f.dir,8);
    u.carry=!!f.carry&&f.carry!=='water'; u.box.visible=u.carry; if(u.carry) u.box.material=M(CARGOCOL[f.carry]||COL.woodLight);
    u.tools.bucket.visible=f.carry==='water'||act==='fill';
    if(u.tools.main) u.tools.main.visible=!u.carry&&f.state!=='flee';
    animPerson(m,ph,f.moving,0,t);
    u.body.position.y=f.moving&&!reduce?Math.abs(Math.cos(ph))*.022:0; u.hips.rotation.z=f.elder&&!reduce?-.12:(f.moving?-.06:0);
    const [aL,aR]=u.arms, w=reduce?0:1;
    if(f.carry==='water'&&!f.moving) aL.rotation.z=0;
    if(act){ const k=t*6+f.id;
      switch(act){
        case 'hoe': case 'chop': aR.rotation.z=1.2+Math.max(0,Math.sin(k))*1.4*w; aL.rotation.z=.9+Math.max(0,Math.sin(k))*1.0*w; u.hips.rotation.z=-.15-Math.max(0,Math.sin(k))*.2*w; break;
        case 'hammer': aR.rotation.z=1.0+Math.abs(Math.sin(k*1.6))*1.3*w; break;
        case 'fish': aR.rotation.z=1.15+Math.sin(k*.4)*.08*w; aL.rotation.z=.9; break;
        case 'sell': aL.rotation.z=1.8+Math.sin(k*1.2)*.6*w; aR.rotation.z=.4; break;
        case 'sweep': aR.rotation.z=.5+Math.sin(k*1.4)*.35*w; aL.rotation.z=.6+Math.sin(k*1.4)*.35*w; break;
        case 'fill': u.hips.rotation.z=-.4; aL.rotation.z=.6; break;
        case 'pray': u.body.position.y=-.06; aR.rotation.z=1.25; aL.rotation.z=1.25; u.hips.rotation.z=-.25; break;
        case 'drink': aR.rotation.z=1.0+Math.max(0,Math.sin(k*.6))*1.6*w; break;
        case 'browse': aL.rotation.z=.3+Math.sin(k*.5)*.2*w; aR.rotation.z=1.1; break;
        case 'chat': aL.rotation.z=.25+Math.max(0,Math.sin(k*.9+1))*.9*w; aR.rotation.z=.2+Math.max(0,Math.sin(k*.7))*.6*w; break;
        case 'dance': aL.rotation.z=2.6+Math.sin(k*1.5)*.4*w; aR.rotation.z=2.6-Math.sin(k*1.5)*.4*w; u.body.position.y=Math.abs(Math.sin(k*1.5))*.04*w; break;
        case 'rest': aL.rotation.z=.15; aR.rotation.z=.15; break;
      } }
    if(f.state==='play'&&f.moving&&!reduce) u.body.position.y=Math.abs(Math.sin(ph))*.06;
  }
  const liveA=new Set(animals);
  for(const [a,m] of aMeshes) if(!liveA.has(a)){ scene.remove(m); aMeshes.delete(a); }
  for(const a of animals){
    let m=aMeshes.get(a); if(!m){ m=animalModel(a); aMeshes.set(a,m); }
    m.position.set(W2(a.x),0,W2(a.y)); if(a.kind!=='crab') turnTo(m,-a.dir,8); else m.rotation.y=0;
    const u=m.userData, k=a.age*(a.kind==='dog'?14:9);
    if(reduce) continue;
    if(a.kind==='chicken'){ u.body.position.y=a.moving?Math.abs(Math.sin(k*1.4))*.03:0; u.head.rotation.z=a.peck?-.9*Math.max(0,Math.sin(a.age*7)):0; u.head.position.y=a.peck?.08-.03*Math.max(0,Math.sin(a.age*7)):.08; }
    else if(a.kind==='crab'){ u.body.position.y=a.moving?Math.abs(Math.sin(k*2))*.008:0; }
    else { if(u.legs) u.legs.forEach((l,i)=>l.rotation.z=a.moving?Math.sin(k+(i%2?Math.PI:0)+(i>1?Math.PI/2:0))*.6:0);
      if(u.tail) u.tail.rotation.x=Math.sin(a.age*16)*.6; if(u.head&&a.kind==='goat'&&!a.moving) u.head.rotation.z=-.5+Math.sin(a.age*2)*.15; }
  }
  // chimney smoke from lived-in houses
  if(S.phase==='day'&&!paused){ smokeT-=FR; if(smokeT<=0){ smokeT=season().name==='Winter'?.35:.7; const hs=[]; each((b,x,y)=>{ if(b.type==='house'||b.type==='tavern'||b.type==='smith') hs.push([x,y,b.type]); });
    if(hs.length){ const [x,y,ty]=hs[(Math.random()*hs.length)|0]; emit(SMK,x+(ty==='smith'?.16:.12),y-.1,ty==='smith'?.95:.75,2.6,.2,ty==='smith'?0x6A625A:0xD8D2CA); } } }
}
function folkAt(ev){
  const r=glc.getBoundingClientRect(), mx=ev.clientX-r.left, my=ev.clientY-r.top; let best=null,bd=18;
  for(const f of folk){ const s=f.child?.62:.92, [px,py]=scr(W2(f.x),.28*s,W2(f.y)), d=Math.hypot(px-mx,py-my); if(d<bd){bd=d;best=f;} }
  return best;
}
function drawFolkHud(){
  if(S.phase!=='day'&&!folk.length) return;
  hctx.textAlign='center'; hctx.textBaseline='middle';
  for(const f of folk){
    const s=f.child?.62:.92;
    if(f===selFolk){ const [cx,cy]=scr(W2(f.x),.01,W2(f.y)); hctx.strokeStyle='rgba(240,190,78,.95)'; hctx.lineWidth=2; hctx.beginPath(); hctx.ellipse(cx,cy,11,5.5,0,0,6.29); hctx.stroke(); }
    const e=f.emote; if(!e) continue;
    const [px,py]=scr(W2(f.x),.52*s,W2(f.y)), a=Math.min(1,e.t*3,(e.max-e.t)*6+.2), y=py-10-(1-Math.min(1,(e.max-e.t)*4))*6;
    hctx.globalAlpha=a; hctx.fillStyle='rgba(250,244,232,.95)'; hctx.beginPath(); hctx.arc(px,y,9,0,6.29); hctx.fill();
    hctx.beginPath(); hctx.moveTo(px-3,y+7); hctx.lineTo(px,y+12); hctx.lineTo(px+3,y+7); hctx.fill();
    hctx.fillStyle=e.ch==='!'?'#C0392B':e.ch==='♥'?'#D0506A':e.ch==='★'||e.ch==='⚖'?'#C98A2E':'#3A2A20'; hctx.font='600 12px Inter,system-ui,sans-serif'; hctx.fillText(e.ch,px,y+.5);
  }
  if(selFolk){ const [px,py]=scr(W2(selFolk.x),.6*(selFolk.child?.62:.92),W2(selFolk.y)); hctx.globalAlpha=1; hctx.font='600 12px Inter,system-ui,sans-serif'; const txt=selFolk.name, w=hctx.measureText(txt).width+12;
    hctx.fillStyle='rgba(28,23,20,.85)'; hctx.fillRect(px-w/2,py-34,w,18); hctx.fillStyle='#F2EADD'; hctx.fillText(txt,px,py-25); }
  hctx.globalAlpha=1;
}
function folkThought(f){
  const o=[], sea=season().name;
  const RT={farmer:'Good soil, if the rain holds.',woodcutter:'These palms grow back faster than you think.',miner:'Found a vein that sparkles like gold. It isn’t.',merchant:'Prices are fair today. Mostly.',fisher:'The fish are biting near the rocks.',smith:'Bring me iron and I’ll make you a blade.',tavernkeeper:'First round is on the house. The second is not.',child:'When I grow up I’m going to ride a white horse too!',elder:'I remember when this canyon was empty.',water:'Every house needs water, every single day.',townsfolk:'Another day under the crown.'};
  o.push(RT[f.role]); if(f.role==='miner'&&S.kind==='mountain') o.push('Iron makes the best blades. Ask the smith.');
  if(S.res.food<6) o.push('My stomach is rumbling. We need more farms.');
  if(S.mood>=75) o.push('What a fine day to live under this crown!'); if(S.mood<35) o.push('Times are hard. Something has to change.');
  if(sea==='Winter') o.push('I can’t feel my toes. Is there wood for the fire?'); if(sea==='Harvest') o.push('The harvest festival is the best time of year.');
  if(S.weather==='rain') o.push('Rain at last. The fields will drink well.'); if(S.weather==='sandstorm') o.push('Sand in my teeth again.');
  if(S.blood) o.push('Did you see the moon? Blood red tonight. I’m scared.');
  if(S.queue.length>=12) o.push('They say a big war band is coming tonight.');
  if(S.raid===S.cur&&S.queue.length) o.push('Raiders are coming here tonight. I’ll bar the door.');
  else if(S.raid!==S.cur) o.push('They say the raiders will strike somewhere else tonight. Thank the stars.');
  if(count('tavern')) o.push('Meet me at the tavern later?'); if(count('well')===0&&S.cur==='home') o.push('A well nearby would save my back.');
  if(S.hero&&heroHere()&&Math.hypot(S.hero.x-f.x,S.hero.y-f.y)<2) o.push('Our hero! Ride well tonight!');
  o.push('@'+trace('chatter')); o.push('@'+trace('chatter'));
  if(S.kind==='coast') o.push('Smell that sea air.'); if(S.kind==='mountain') o.push('The snow never quite melts up here.');
  return o[(Math.random()*o.length)|0];
}
function selectFolk(f){ if(f.role==='trader'){ openShop(); return; } selFolk=f; sel=null; f.thought=S.req&&f.name===S.req.name?REQS[S.req.id].text:folkThought(f); emote(f,'!',1); renderInsp(); }


const wMeshes=[];
const SHIRTS=[COL.villager,0x9A6A9A,0x6A8A5A,0xB0884A,0x6A7A9A];
function walkerModel(){
  const i=wMeshes.length, g=person({body:SHIRTS[i%SHIRTS.length],legs:0x5A4030,hat:i%2?'cap':null,hatCol:0x8A6A43});
  g.userData.box=add(g.userData.hips,BX(.12,.08,.1),COL.woodLight,0,.42,0); g.scale.setScalar(.92); scene.add(g); return g; }
const SMK=[], FLM=[], SCORCH=[], rubble=new Map();
for(let i=0;i<150;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0x4A4440,transparent:true,depthWrite:false,opacity:0})); sp.visible=false; scene.add(sp); SMK.push({sp,life:0}); }
for(let i=0;i<90;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0xFF8A2A,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})); sp.visible=false; scene.add(sp); FLM.push({sp,life:0}); }
for(let i=0;i<18;i++){ const m=new THREE.Mesh(geo('glowP',()=>new THREE.PlaneGeometry(1,1)),new THREE.MeshBasicMaterial({map:scorchTex,transparent:true,depthWrite:false,opacity:0})); m.rotation.x=-Math.PI/2; m.visible=false; m.renderOrder=1; scene.add(m); SCORCH.push({m,life:0}); }
let scorchI=0;
function scorch(x,y){ const s=SCORCH[scorchI++%SCORCH.length]; s.life=25; s.m.position.set(W2(x),.014,W2(y)); s.m.rotation.z=Math.random()*6; const k=.7+Math.random()*.4; s.m.scale.set(k,k,1); s.m.visible=true; }
function emit(pool,x,y,h,life,sz,col){ const p=pool.find(q=>q.life<=0); if(!p) return; p.life=p.max=life; p.x=W2(x); p.z=W2(y); p.h=h; p.sz=sz; p.vx=(Math.random()-.5)*.12+.08; p.sp.visible=true; if(col!==undefined) p.sp.material.color.setHex(col); }
const TOPH={w_granary:.7,w_bazaar:.45,w_academy:.6,w_cathedral:1.2,w_colossus:1.2,storehouse:.6,brewery:.6,weaver:.55,workshop:.5,pasture:.2,saltpan:.15,lighthouse:1.1,smith:.6,tavern:.7,harbor:.45,well:.4,shrine:.6,range:.4,keep:1.25,tower:1.1,cata:.45,barr:.55,house:.65,wall:.45,mine:.4,market:.5,lumber:.45};
function buildingFrac(b){ return b.type==='keep'?S.keep/S.keepMax:b.hp/Math.max(1,b.max); }
function nearWell(x,y){ for(let j=Math.max(0,y-2);j<=Math.min(N-1,y+2);j++)for(let i=Math.max(0,x-2);i<=Math.min(N-1,x+2);i++){ const b=G(i,j).b; if(b&&b.type==='well'&&Math.hypot(i-x,j-y)<=1.6) return true; } return false; }
function stepBurn(raw,t){
  each((b,x,y)=>{
    if(b.type==='trap'||b.type==='farm'||b.type==='road') return;
    const f=buildingFrac(b); if(f>=.6) return;
    const top=(TOPH[b.type]||.5)+(b.type==='tower'?.15*b.lvl:0);
    b.sm_=(b.sm_||0)-raw; if(b.sm_<=0){ b.sm_=.12+f*.35; emit(SMK,x+(Math.random()-.5)*.35,y+(Math.random()-.5)*.35,top*.8,2.2+Math.random(),.35+(1-f)*.3,f<.3?0x2E2A28:0x5A544E); }
    if(f<.32&&S.weather!=='rain'&&!nearWell(x,y)){ b.fl_=(b.fl_||0)-raw; if(b.fl_<=0){ b.fl_=.05; emit(FLM,x+(Math.random()-.5)*.5,y+(Math.random()-.5)*.5,.1+Math.random()*top*.6,.45+Math.random()*.3,.32+Math.random()*.2,Math.random()<.5?0xFF8A2A:0xFFC060); }
      if(Math.random()<raw*2.5) embers(x,y,2); }
  });
  for(const [k,r] of rubble){ r.t+=raw; if(r.t<7&&Math.random()<raw*5) emit(SMK,r.x+(Math.random()-.5)*.4,r.y+(Math.random()-.5)*.4,.1,2,.4,0x3A3634); }
  for(const p of SMK){ if(p.life<=0) continue; p.life-=raw; const k=1-p.life/p.max; p.h+=raw*.45; p.x+=p.vx*raw;
    p.sp.position.set(p.x,p.h,p.z); const sc=p.sz*(.6+k*1.6); p.sp.scale.set(sc,sc,1); p.sp.material.opacity=Math.sin(Math.min(1,k)*Math.PI)*.5*(1-nightA*.35); if(p.life<=0) p.sp.visible=false; }
  for(const p of FLM){ if(p.life<=0) continue; p.life-=raw; const k=1-p.life/p.max; p.h+=raw*.7;
    p.sp.position.set(p.x,p.h,p.z); const sc=p.sz*(1-k*.7); p.sp.scale.set(sc,sc*1.3,1); p.sp.material.opacity=(1-k)*.85; if(p.life<=0) p.sp.visible=false; }
  for(const s of SCORCH){ if(s.life<=0) continue; s.life-=raw; s.m.material.opacity=Math.min(1,s.life/5)*.8; if(s.life<=0) s.m.visible=false; }
  for(const [k,r] of rubble) r.g.visible=!S.grid[k].b;
}
function addRubble(x,y,type){
  const i=idx(x,y); removeRubble(i);
  const g=new THREE.Group(); g.position.set(W2(x),0,W2(y));
  const stone=type==='wall'||type==='tower'||type==='keep'||type==='mine';
  for(let k=0;k<6;k++){ const a=k*1.7+x, r=.12+((k*37+y)%10)/40;
    if(stone||k%2) add(g,DO(.05+(k%3)*.025),k%2?COL.stoneDark:0x6A625A,Math.cos(a)*r,.03,Math.sin(a)*r,k,k*2,0);
    else add(g,BX(.26,.035,.05),0x3A2A20,Math.cos(a)*r,.03,Math.sin(a)*r,0,a,.15); }
  const sc=new THREE.Mesh(geo('glowP',()=>new THREE.PlaneGeometry(1,1)),new THREE.MeshBasicMaterial({map:scorchTex,transparent:true,depthWrite:false,opacity:.75}));
  sc.rotation.x=-Math.PI/2; sc.position.y=.013; sc.scale.set(1.05,1.05,1); g.add(sc);
  scene.add(g); rubble.set(i,{g,day:S.day,t:0,x,y});
}
function removeRubble(i){ const r=rubble.get(i); if(r){ scene.remove(r.g); rubble.delete(i); } }
function ageRubble(){ for(const [k,r] of [...rubble]) if(S.day-r.day>=2) removeRubble(k); }
const fleet={mgr:null,list:[],gulls:[]};
function ykReady(){ if(!window.YUKA) return false; if(!fleet.mgr) fleet.mgr=new YUKA.EntityManager(); return true; }
function boatModel(kind){
  const pirate=kind==='pirate', war=kind==='war';
  const g=new THREE.Group(), b=new THREE.Group(); g.add(b); const hc=pirate?0x2A2226:war?0x4A2E1E:COL.wood;
  if(war){ for(const z of [-.17,.17]) for(const x of [-.2,.15]) add(b,BX(.1,.04,.04),0x2A2A30,x,.09,z); }
  add(b,BX(.9,.16,.32),hc,0,.04,0); add(b,CN(.16,.3,4),hc,.55,.04,0,0,Math.PI/4,-Math.PI/2).scale.set(1,1,.82);
  add(b,BX(.82,.03,.28),COL.woodLight,0,.13,0); add(b,BX(.03,.78,.03),COL.wood,0,.5,0);
  add(b,BX(.02,.42,.5),pirate?0x2A2026:war?0x34548E:0xEDE3CE,.02,.55,0);
  add(b,BX(.021,.08,.5),pirate?0xEDE3CE:COL.roof,.02,pirate?.6:.66,0,0,0,0).scale.set(1,1,pirate?.24:1);
  add(b,BX(.03,.03,.14),pirate?0x9A2030:COL.gold,0,.91,.07);
  g.userData.body=b; scene.add(g); return g;
}
function gullModel(){
  const g=new THREE.Group(), wl=new THREE.Group(), wr=new THREE.Group(); g.add(wl); g.add(wr);
  add(g,BX(.12,.03,.04),0xF2EEE6,0,0,0); add(wl,BX(.05,.01,.16),0xF2EEE6,0,0,.08); add(wr,BX(.05,.01,.16),0xF2EEE6,0,0,-.08);
  g.userData.w=[wl,wr]; g.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); scene.add(g); return g;
}
function addBoat(kind,from,to,opt={}){
  if(!ykReady()) return null;
  const v=new YUKA.Vehicle(); v.position.set(from.x,0,from.z); v.maxSpeed=opt.speed||1.2; v.maxForce=2.5; v.mass=1.5;
  const ar=new YUKA.ArriveBehavior(new YUKA.Vector3(to.x,0,to.z),2,.05); v.steering.add(ar);
  if(opt.face) v.rotation.fromEuler(0,opt.face,0);
  const mesh=boatModel(kind); mesh.position.set(from.x,-.05,from.z); mesh.rotation.y=opt.yaw||0; mesh.userData.yaw=opt.yaw||0;
  fleet.mgr.add(v); const f={v,mesh,kind,ar,leaving:false,seed:Math.random()*6}; fleet.list.push(f); return f;
}
function clearFleet(){ if(!fleet.mgr) return; for(const f of fleet.list){ scene.remove(f.mesh); fleet.mgr.remove(f.v); } fleet.list=[]; for(const gl of fleet.gulls){ scene.remove(gl.m); fleet.mgr.remove(gl.v); } fleet.gulls=[]; }
function harborMoorings(){ const out=[]; S.grid.forEach((t,i)=>{ if(t.b&&t.b.type==='harbor'){ const x=i%N,y=(i/N)|0, d=waterDir(x,y); out.push({x:W2(x)+d[0]*1.5,z:W2(y)+d[1]*1.5,px:-d[1],pz:d[0],yaw:Math.atan2(-d[0],d[1])}); } }); return out; }
function rebuildFleet(arriving=0){
  if(!ykReady()) return; clearFleet(); if(S.kind!=='coast') return;
  const ms=harborMoorings(), free=ms.length?Math.max(0,ms.length*(1+(S.mods.ships||0))-S.voyages.length):0;
  for(let i=0;i<free;i++){ const m=ms[i%ms.length], o=Math.floor(i/ms.length)*.62, to={x:m.x+o*m.px,z:m.z+o*m.pz};
    const from=i>=free-arriving?{x:to.x+(Math.random()-.5)*3,z:W2(Math.round(shoreAt(C))+6)}:to;
    addBoat('trade',from,to,{speed:.9,yaw:m.yaw}); }
  for(let i=0;i<(ms.length?(S.warships||0):0);i++){ const m=ms[i%ms.length], o=.75+Math.floor(i/ms.length)*.7, to={x:m.x-m.px*o+m.pz*.0,z:m.z-m.pz*o}; const f=addBoat('war',to,to,{speed:1,yaw:m.yaw}); if(f) f.home={x:to.x,z:to.z}; }
  if(S.phase==='day'){ const cz=W2(shoreAt(C))+.5;
    for(let i=0;i<8;i++){ const v=new YUKA.Vehicle(); v.position.set((Math.random()-.5)*5,0,cz+(Math.random()-.5)*3); v.velocity.set(Math.random()-.5,0,Math.random()-.5); v.maxSpeed=1.5; v.updateNeighborhood=true; v.neighborhoodRadius=2.2;
      const al=new YUKA.AlignmentBehavior(), co=new YUKA.CohesionBehavior(), se=new YUKA.SeparationBehavior(), wa=new YUKA.WanderBehavior(), sk=new YUKA.SeekBehavior(new YUKA.Vector3(0,0,cz));
      al.weight=.9; co.weight=.8; se.weight=1.5; wa.weight=.7; sk.weight=.22; [al,co,se,wa,sk].forEach(bh=>v.steering.add(bh));
      fleet.mgr.add(v); fleet.gulls.push({v,m:gullModel(),ph:Math.random()*6}); } }
}
function departShip(){
  if(S.kind!=='coast') return;
  const f=fleet.list.find(x=>x.kind==='trade'&&!x.leaving); if(!f) return;
  f.leaving=true; f.v.maxSpeed=1.5; f.ar.target.set(f.v.position.x+(Math.random()-.5)*2,0,W2(Math.round(shoreAt(C))+8));
}
function launchPirates(){
  if(!ykReady()) return;
  for(const [x,y] of S.spawns){ const to={x:W2(x),z:W2(y)+1.15}; addBoat('pirate',{x:to.x+(Math.random()-.5)*2,z:W2(Math.round(shoreAt(x))+6)},to,{speed:1.7,yaw:Math.PI/2}); }
}
function syncFleet(raw){
  if(!fleet.mgr) return;
  fleet.mgr.update(Math.min(.05,raw*speed));
  for(let i=fleet.list.length-1;i>=0;i--){ const f=fleet.list[i], v=f.v, m=f.mesh;
    if(f.hunt){ const h=f.hunt; if(!h.tgt.sink) f.ar.target.set(h.tgt.v.position.x,0,h.tgt.v.position.z+.6); h.t-=raw*speed;
      if(!reduce&&Math.random()<raw*6) puff((v.position.x+C),(v.position.z+C),0xEDE3CE,1);
      if(h.t<=0){ f.hunt=null; if(h.win&&!h.tgt.sink) sinkRaiders(h.tgt); if(f.home) f.ar.target.set(f.home.x,0,f.home.z); } }
    if(f.sink){ f.sinkY=(f.sinkY||0)+raw*.3; m.rotation.z=Math.min(.9,f.sinkY*1.4); if(f.sinkY>1.3){ scene.remove(m); fleet.mgr.remove(v); fleet.list.splice(i,1); continue; } }
    m.position.x=v.position.x; m.position.z=v.position.z; m.position.y=-.05+Math.sin(clock*1.6+f.seed)*.02-(f.sinkY||0);
    const sp=Math.hypot(v.velocity.x,v.velocity.z); if(sp>.06&&!f.sink) turnTo(m,Math.atan2(-v.velocity.z,v.velocity.x),3);
    m.userData.body.rotation.x=Math.sin(clock*1.3+f.seed)*.05;
    if(f.leaving&&v.position.z>W2(Math.round(shoreAt(C))+6.5)){ scene.remove(m); fleet.mgr.remove(v); fleet.list.splice(i,1); } }
  for(const gl of fleet.gulls){ const v=gl.v, m=gl.m; m.visible=nightA<.5;
    m.position.set(v.position.x,1.9+Math.sin(clock*.8+gl.ph)*.25,v.position.z);
    const sp=Math.hypot(v.velocity.x,v.velocity.z); if(sp>.05) m.rotation.y=Math.atan2(-v.velocity.z,v.velocity.x);
    const fl=reduce?0:Math.sin(clock*9+gl.ph)*.5; m.userData.w[0].rotation.x=fl; m.userData.w[1].rotation.x=-fl; }
}
