// ---------- Mirage: psychedelic art style, hero view and fever ----------
let artStyle='classic', heroCam=false, mirK=0, mirSpeed=0, mirOn=false, mirPatchT=0, chYaw=-Math.PI/2, chHold=0, mirPass=null, bigScore={v:0,t:-9,shown:0,bump:0};
const MIRU={uMir:{value:0},uMirT:{value:0},uBend:{value:0},uMirC:{value:new THREE.Vector2()}};
const MIR_D=renderer.capabilities.isWebGL2;
const MIR_PROJ=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
#endif
vec4 mirWP = modelMatrix * mvPosition; vMirW = mirWP.xyz;
vec2 mirD = mirWP.xz - uMirC; mirWP.y -= uBend * dot(mirD, mirD);
mvPosition = viewMatrix * mirWP;
gl_Position = projectionMatrix * mvPosition;`;
const MIR_FRAG=`if(uMir>0.001){
  vec3 mBase=gl_FragColor.rgb; float mL=dot(mBase,vec3(.299,.587,.114));
  vec3 mCr=${MIR_D?'cross(dFdx(vMirW),dFdy(vMirW))':'vec3(0.,1.,0.)'}; float mV=clamp(1.0-abs(mCr.y)/max(length(mCr),1e-6),0.,1.);
  float mB=vMirW.y*2.4*(0.35+mV)+(vMirW.x*0.55-vMirW.z*0.35)*(0.4+mV*0.8)+uMirT*0.32;
  float mF=fract(mB*1.15), mS=smoothstep(0.40,0.47,mF)*(1.0-smoothstep(0.90,0.97,mF));
  vec3 mP1=0.5+0.5*cos(6.2831*(vec3(0.0,0.33,0.67)+mB*0.21));
  vec3 mP2=0.5+0.5*cos(6.2831*(vec3(0.62,0.12,0.9)+mB*0.17+0.5));
  vec3 mPsy=mix(mP1,mP2,mS)*(0.3+1.1*mL)+0.06;
  gl_FragColor.rgb=mix(mBase,mPsy,uMir*(0.5+0.45*mV));
}
#include <fog_fragment>`;
function patchMat(m){
  if(!m||m.userData.mirP||!(m.isMeshLambertMaterial||m.isMeshStandardMaterial||m.isMeshPhongMaterial||m.isMeshBasicMaterial||m.isLineBasicMaterial)) return;
  const prev=m.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile?m.onBeforeCompile:null, key='mir|'+(prev?prev.toString():'');
  m.onBeforeCompile=(sh,r)=>{ if(prev) prev.call(m,sh,r); Object.assign(sh.uniforms,MIRU);
    sh.vertexShader='uniform float uBend; uniform vec2 uMirC; varying vec3 vMirW;\n'+sh.vertexShader.replace('#include <project_vertex>',MIR_PROJ);
    sh.fragmentShader='uniform float uMir; uniform float uMirT; varying vec3 vMirW;\n'+sh.fragmentShader.replace('#include <fog_fragment>',MIR_FRAG); };
  m.customProgramCacheKey=()=>key; m.userData.mirP=1; m.needsUpdate=true; }
function patchWater(){ const m=waterMesh&&waterMesh.material; if(!m||!m.isShaderMaterial||m.userData.mirP) return; m.userData.mirP=1;
  m.uniforms.uBend=MIRU.uBend; m.uniforms.uMirC=MIRU.uMirC;
  m.vertexShader='uniform float uBend; uniform vec2 uMirC;\n'+m.vertexShader.replace(/gl_Position\s*=\s*projectionMatrix\s*\*\s*mvPosition\s*;/,'{ vec4 mw=modelMatrix*vec4(position,1.0); vec2 md=mw.xz-uMirC; mw.y-=uBend*dot(md,md); gl_Position=projectionMatrix*viewMatrix*mw; }'); m.needsUpdate=true; }
function patchScene(){ scene.traverse(o=>{ const m=o.material; if(!m) return; if(Array.isArray(m)) m.forEach(patchMat); else patchMat(m); }); patchWater(); }
const MIR_POST={uniforms:{tDiffuse:{value:null},uK:{value:0},uTime:{value:0},uSpeed:{value:0}},
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader:`uniform sampler2D tDiffuse; uniform float uK,uTime,uSpeed; varying vec2 vUv;
    void main(){ vec2 c=vUv-.5; vec2 uv=vUv+uK*.0035*vec2(sin(vUv.y*16.+uTime*2.1),cos(vUv.x*13.+uTime*1.6));
      vec3 col=vec3(0.); for(int i=0;i<6;i++){ float f=1.-float(i)*.014*uSpeed; col+=texture2D(tDiffuse,.5+(uv-.5)*f).rgb; } col/=6.;
      float ca=uK*.012*length(c); col.r=mix(col.r,texture2D(tDiffuse,uv+c*ca).r,uK); col.b=mix(col.b,texture2D(tDiffuse,uv-c*ca).b,uK);
      vec3 q=mat3(.299,.596,.211,.587,-.274,-.523,.114,-.322,.312)*col; float a=uK*(sin(uTime*.4)*.5+length(c)*1.2); float cs=cos(a),sn=sin(a); q.yz=mat2(cs,-sn,sn,cs)*q.yz;
      col=mat3(1.,1.,1.,.956,-.272,-1.106,.621,-.647,1.703)*q;
      float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,1.+.65*uK); col=mix(col,(col-.5)*1.12+.5,uK);
      gl_FragColor=vec4(clamp(col,0.,1.),1.); }`};
const MBG=new THREE.Color();
const skyDome=new THREE.Mesh(new THREE.SphereGeometry(70,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{uK:{value:0},uT:{value:0},uNight:{value:0},uTop:{value:new THREE.Color(0x6FA2D6)},uHor:{value:new THREE.Color(0xF2C08A)}},
  vertexShader:'varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader:`uniform float uK,uT,uNight; uniform vec3 uTop,uHor; varying vec3 vDir;
    void main(){ vec3 d=normalize(vDir); float h=clamp(d.y,0.,1.); vec3 base=mix(uHor,uTop,pow(h,.55));
      float a=atan(d.z,d.x), rays=.5+.5*sin(a*14.+uT*.9+h*7.);
      vec3 psy=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+h*1.6-uT*.09+rays*.3));
      psy=mix(psy,psy.gbr,smoothstep(.45,.55,fract(h*7.-uT*.25))*.55);
      float sunD=max(0.,1.-length(d.xz)*1.2-abs(d.y-.25));
      gl_FragColor=vec4(mix(base,psy*(1.-.5*uNight)+sunD*.25,uK),1.); }`}));
skyDome.renderOrder=-10; skyDome.frustumCulled=false; skyDome.visible=false; scene.add(skyDome);
const SKY_TOP=new THREE.Color(0x6FA2D6), SKY_HOR=new THREE.Color(0xF2C08A), SKY_NT=new THREE.Color(0x0E1636), SKY_NH=new THREE.Color(0x3A3C7A);
function syncMirage(raw,t){
  const night=S.phase==='night', want=artStyle==='mirage'||S.fever>0?1:0;
  mirK+=(want-mirK)*Math.min(1,raw*(reduce?30:1.6)); if(mirK<.002) mirK=0;
  const chase=heroCam&&S.hero&&heroHere()&&!S.over;
  if(chase&&BW){ const h=S.hero, hx=W2(h.x), hz=W2(h.y);
    if(chHold>0) chHold-=raw; else if(h.moving||h.dash){ let d=h.dir-chYaw; d=Math.atan2(Math.sin(d),Math.cos(d)); chYaw+=d*Math.min(1,raw*(h.dash?6:2.4)); }
    const cx=Math.cos(chYaw), cz=Math.sin(chYaw), back=2.9+(S.fever>0?.5:0);
    chaseCam.aspect=BW/BH; chaseCam.fov=62+mirSpeed*10; chaseCam.updateProjectionMatrix();
    chaseCam.position.set(hx-cx*back,2.1,hz-cz*back); if(shake>0&&!reduce){ chaseCam.position.x+=(Math.random()-.5)*shake*.4; chaseCam.position.y+=(Math.random()-.5)*shake*.3; }
    chaseCam.lookAt(hx+cx*2.8,.1,hz+cz*2.8); camera=chaseCam; }
  else camera=orthoCam;
  const bend=(camera===chaseCam?.012:0)+mirK*(camera===chaseCam?.024:.006);
  const sp=S.hero&&(S.hero.dash?1.2:S.hero.moving?(camera===chaseCam?.55:.15):0)*(S.fever>0?1.6:1)||0; mirSpeed+=(sp*mirK-mirSpeed)*Math.min(1,raw*4);
  if(!mirOn&&(mirK>0||bend>0)) mirOn=true;
  if(mirOn){ mirPatchT-=raw; if(mirPatchT<=0){ mirPatchT=1; patchScene(); } }
  MIRU.uMir.value=mirK; MIRU.uMirT.value=reduce?0:t; MIRU.uBend.value=bend;
  if(camera===chaseCam) MIRU.uMirC.value.set(chaseCam.position.x,chaseCam.position.z); else MIRU.uMirC.value.set(camTarget.x,camTarget.z);
  if(mirK>0){ MBG.setHSL(((reduce?0:t)*.05)%1,.75,night?.28:.5); scene.background.lerp(MBG,mirK*.85); }
  skyDome.visible=camera===chaseCam;
  if(skyDome.visible){ const U=skyDome.material.uniforms; skyDome.position.copy(chaseCam.position); U.uK.value=mirK; U.uT.value=reduce?0:t; U.uNight.value=nightA;
    U.uTop.value.copy(SKY_TOP).lerp(SKY_NT,nightA); U.uHor.value.copy(S.kind==='mountain'?BGM:SKY_HOR).lerp(SKY_NH,nightA).lerp(DUSK,goldK*.4);
    if(mirK<.5) scene.background.copy(U.uHor.value); }
  scene.fog.color.copy(scene.background);
  if(camera===chaseCam){ scene.fog.near=7+(1-mirK)*4; scene.fog.far=24+(1-mirK)*8; } else { scene.fog.near=500; scene.fog.far=900; }
}
function setArtStyle(v){ artStyle=v; $('style').textContent=T(v==='mirage'?'Mirage':'Classic'); $('style').setAttribute('aria-pressed',v==='mirage'); savePrefs(); if(v==='mirage') showHudBanner(T('Mirage'),T('The canyon dreams in color'),'#F0BE4E'); }
function toggleHeroCam(){ heroCam=!heroCam; $('cam').setAttribute('aria-pressed',heroCam); $('cam').title=T(heroCam?'Top view ([)':'Hero view ([)'); if(heroCam&&S.hero){ chYaw=S.hero.dir??-Math.PI/2; if(!viewNear) toggleView(); camFree=null; } savePrefs(); }
function feverKill(){ if(S.fever>0) { S.fever=Math.min(14,S.fever+.35); return; }
  const fast=S.t-(S.lastKillT||-9)<3; S.lastKillT=S.t; S.streak=fast?(S.streak||0)+1:1;
  S.feverM=Math.min(1,(S.feverM||0)+(fast?.11:.06));
  if(S.feverM>=1){ S.fever=10; S.feverM=0; punchZoom(); if(S.hero){ S.hero.cdC=0; S.hero.cdR=0; } sfx('up'); shake=Math.max(shake,.25); showHudBanner(T('Fever!'),T('Your hero strikes twice as hard and runs faster'),'#F0BE4E'); bump('cFever','bump'); } }
function stepFever(dt){ if(S.phase!=='night'){ S.fever=0; S.feverM=0; return; } if(S.fever>0){ S.fever=Math.max(0,S.fever-dt); if(!S.fever) say(T('The fever fades.')); } else if(S.feverM>0) S.feverM=Math.max(0,S.feverM-dt*.025); }
// a giant wobbling score in the Mirage style
function drawBigScore(){
  if(mirK<.25||S.modal||S.over) return;
  if(clock-bigScore.t>.5){ bigScore.t=clock; const v=score(); if(v!==bigScore.v){ if(bigScore.v) bigScore.bump=1; bigScore.v=v; } }
  bigScore.shown+=(bigScore.v-bigScore.shown)*Math.min(1,FR*6); bigScore.bump=Math.max(0,bigScore.bump-FR*2.5);
  const u=Math.max(26,BW/16), txt=String(Math.round(bigScore.shown)), y=chipsBottom()+u*1.05, wob=reduce?0:Math.sin(clock*1.7)*.07, sc=1+bigScore.bump*.18;
  hctx.save(); hctx.globalAlpha=Math.min(1,(mirK-.25)*2); hctx.translate(BW/2,y); hctx.rotate(-.05+wob); hctx.scale(sc,sc);
  hctx.font=`italic 900 ${Math.round(u*1.25)}px "Bricolage Grotesque", system-ui, sans-serif`; hctx.textAlign='center'; hctx.textBaseline='middle';
  for(let i=6;i>0;i--){ hctx.fillStyle=`hsl(${(clock*60+i*28)%360},85%,${22+i*3}%)`; hctx.fillText(txt,i*1.4,i*1.6); }
  const g=hctx.createLinearGradient(-u*2,-u*.6,u*2,u*.6); for(let i=0;i<=4;i++) g.addColorStop(i/4,`hsl(${(clock*80+i*70)%360},95%,65%)`);
  hctx.fillStyle=g; hctx.fillText(txt,0,0); hctx.lineWidth=2; hctx.strokeStyle='rgba(255,255,255,.7)'; hctx.strokeText(txt,0,0);
  hctx.font=`700 ${Math.round(Math.max(10,u*.28))}px Inter, system-ui, sans-serif`; hctx.fillStyle='rgba(255,255,255,.85)'; hctx.fillText(T('Best {{n}}',{n:Math.max(bestScore,bigScore.v)}),0,u*.85);
  hctx.restore(); }
// ---------- kingdom side panel tabs ----------
const PANELS=[['throneD','Throne','<path d="M2 12.5V6l3 3 3-5.5 3 5.5 3-3v6.5z" fill="currentColor"/>','thronesum'],
  ['marketD','Market','<path d="M8 2v12M3 5h10M3 5l-2 5h4zM13 5l-2 5h4z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>','mktsum'],
  ['treasD','Treasury','<ellipse cx="8" cy="5" rx="5" ry="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3 5v6c0 1.1 2.2 2 5 2s5-.9 5-2V5M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" fill="none" stroke="currentColor" stroke-width="1.4"/>',''],
  ['upgD','Upgrades','<path d="M8 2l5 5h-3v6H6V7H3z" fill="currentColor"/>',''],
  ['heroD','Hero','<path d="M8 1.5l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.1l-3.9 2.2.9-4.3-3.2-3 4.3-.5z" fill="currentColor"/>','herosum'],
  ['edictD','Edicts','<path d="M4 2h7l2 2v10H4z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h5M6 8.5h5M6 11h3" stroke="currentColor" stroke-width="1.3"/>','edictsum'],
  ['chronD','Chronicle','<path d="M2 3.5C4 2.5 6 2.5 8 4c2-1.5 4-1.5 6-.5v9.5c-2-1-4-1-6 .5-2-1.5-4-1.5-6-.5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 4v9.5" stroke="currentColor" stroke-width="1.2"/>',''],
  ['achD','Awards','<path d="M4.5 2h7v3a3.5 3.5 0 0 1-7 0zM8 8.5V11M5 14h6M6 11h4v3H6z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>','achsum'],
  ['helpD','How to rule','<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11.6" r=".9" fill="currentColor"/>','']];
let sideTab='throneD', tabKey='';
try{ const v=localStorage.getItem('smallcrown-tab'); if(PANELS.some(p=>p[0]===v)) sideTab=v; }catch(e){}
function initTabs(){
  const side=$('side'); side.classList.add('tabbed');
  for(const [id,name] of PANELS){ const d=$(id); d.open=true; if(!d.querySelector('.panelhead')){ d.insertAdjacentHTML('afterbegin',`<div class="panelhead"><h2 data-t>${name}</h2><span data-pb="${id}"></span></div>`); } }
  $('tabs').innerHTML=PANELS.map(([id,name,ic])=>`<button class="tab" type="button" role="tab" id="tab-${id}" data-tab="${id}" aria-controls="${id}"><svg viewBox="0 0 16 16" aria-hidden="true">${ic}</svg><span class="tn">${T(name)}</span><span class="bd" hidden></span></button>`).join('');
  $('tabs').querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab,true)));
  $('tabs').addEventListener('keydown',e=>{ if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft') return; const i=PANELS.findIndex(p=>p[0]===sideTab), n=(i+(e.key==='ArrowRight'?1:-1)+PANELS.length)%PANELS.length; selectTab(PANELS[n][0],true); $('tab-'+PANELS[n][0]).focus(); e.preventDefault(); });
  selectTab(sideTab,false);
}
function selectTab(id,user){
  sideTab=id; for(const [pid] of PANELS){ const on=pid===id; $(pid).classList.toggle('on',on); $(pid).open=true; const t=$('tab-'+pid); if(t){ t.setAttribute('aria-selected',on); t.tabIndex=on?0:-1; } }
  if(user){ try{ localStorage.setItem('smallcrown-tab',id); }catch(e){} $('tab-'+id).scrollIntoView({block:'nearest',inline:'nearest'}); if(innerWidth<1180) $('side').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); else $('side').scrollTop=0; }
  if(user&&window.gsap&&!reduce) gsap.fromTo($(id),{opacity:0,y:8},{opacity:1,y:0,duration:.28,ease:'power2.out',clearProps:'transform,opacity'});
  if(id==='chronD'&&S) renderChron(); if(id==='treasD') chartKey=''; if(id==='throneD') throneKey=''; if(id==='marketD') mktKey=''; tabKey=''; if(S) ui();
}
function syncTabs(){
  if(!$('side').classList.contains('tabbed')) return;
  const badge={}; for(const [id,,,sum] of PANELS) badge[id]=sum&&$(sum)?$(sum).textContent.trim():'';
  const buy=UPGS.filter(u=>upgState(u)==='buy').length;
  const dots={heroD:S.perkPending>0||!!S.lootPending,upgD:false,throneD:!!S.petition};
  if(buy) badge.upgD=String(buy);
  const key=JSON.stringify([badge,dots,lang]); if(key===tabKey) return; tabKey=key;
  for(const [id,name] of PANELS){ const t=$('tab-'+id); if(!t) continue; const bd=t.querySelector('.bd'); bd.hidden=!badge[id]; bd.textContent=badge[id]; t.querySelector('.tn').textContent=T(name);
    let dt=t.querySelector('.dot'); if(dots[id]&&!dt){ dt=document.createElement('i'); dt.className='dot'; t.appendChild(dt); } else if(!dots[id]&&dt) dt.remove();
    const pb=document.querySelector(`[data-pb="${id}"]`); if(pb) pb.textContent=id==='upgD'&&buy?T('{{n}} you can buy',{n:buy}):badge[id]; }
}
// ---------- build tool groups ----------
const TGROUPS=[['all','All',null],['settle','Settle',['farm','house','lumber','mine','market','well','shrine','road','storehouse','tavern','harbor','counting','temple']],
  ['defend','Defend',['wall','trap','tower','cata','barr','range','lighthouse','smith','warcamp']],['craft','Craft',['pasture','brewery','weaver','saltpan','workshop','smith','harbor']]];
let toolGroup='all'; try{ const v=localStorage.getItem('smallcrown-tgroup'); if(TGROUPS.some(g=>g[0]===v)) toolGroup=v; }catch(e){}
function renderTcats(){
  const box=$('tcats'); if(!box.dataset.built){ box.innerHTML=TGROUPS.map(([id,n])=>`<button type="button" class="tcat" role="tab" data-g="${id}"><span class="gn"></span><span class="ct"></span></button>`).join(''); box.dataset.built=1;
    box.querySelectorAll('.tcat').forEach(b=>b.addEventListener('click',()=>{ toolGroup=b.dataset.g; try{ localStorage.setItem('smallcrown-tgroup',toolGroup); }catch(e){} renderTools(); if(window.gsap&&!reduce) gsap.fromTo([...$('tools').querySelectorAll('.tool:not(.hid)')],{opacity:0,y:6},{opacity:1,y:0,duration:.22,stagger:.018,clearProps:'transform,opacity'}); })); }
  const open=t=>{ const d=DEF[t]; return !!d&&!(d.unlock&&S.day<d.unlock)&&canPay(d.cost); };
  box.querySelectorAll('.tcat').forEach(b=>{ const g=TGROUPS.find(x=>x[0]===b.dataset.g); b.setAttribute('aria-selected',g[0]===toolGroup); b.querySelector('.gn').textContent=T(g[1]);
    b.querySelector('.ct').textContent=g[2]?g[2].filter(open).length||'':''; b.title=g[2]?T('{{n}} you can afford',{n:g[2].filter(open).length}):''; });
}
// ---------- GSAP: cinematic camera moves ----------
let cineBusy=false;
function cineTo(tx,ty,o={}){
  if(reduce||!window.gsap||!S||camera===chaseCam||!BW) return;
  const zoom=o.zoom||2.4, hold=o.hold??1.6, dur=o.dur||1.15, z0=zoomHH, c={x:camTarget.x,y:camTarget.z}, zp={v:zoomHH};
  if(!viewNear) toggleView(); gsap.killTweensOf(c); camFree=c; camVel=null; cineBusy=true;
  const tl=gsap.timeline({onComplete:()=>{ if(camFree===c) camFree=null; cineBusy=false; }});
  tl.to(c,{x:W2(tx),y:W2(ty)+.25,duration:dur,ease:'power3.inOut'},0)
    .to(zp,{v:zoom,duration:dur,ease:'power2.inOut',onUpdate:()=>{ zoomHH=Math.max(ZMIN,zp.v); }},0);
  if(o.orbit) tl.to(c,{x:'+=.35',duration:hold,ease:'sine.inOut',yoyo:true,repeat:1},dur);
  if(!S.over) tl.to(zp,{v:z0,duration:.9,ease:'power2.inOut',onUpdate:()=>{ zoomHH=Math.max(ZMIN,zp.v); }},dur+hold);
}
function punchZoom(){ if(reduce||!window.gsap) return; const zp={v:zoomHH}, z0=zoomHH; gsap.timeline().to(zp,{v:z0*.82,duration:.18,ease:'power2.out',onUpdate:()=>{ zoomHH=Math.max(ZMIN,zp.v); }}).to(zp,{v:z0,duration:.6,ease:'elastic.out(1,.5)',onUpdate:()=>{ zoomHH=Math.max(ZMIN,zp.v); }}); }
// ---------- cannon-es: tumbling debris ----------
const PHYS={world:null,items:[]};
function physInit(){ if(PHYS.world) return true; if(!window.CANNON) return false; const Cn=window.CANNON;
  const W=new Cn.World({gravity:new Cn.Vec3(0,-9.8,0)}); W.allowSleep=true; W.defaultContactMaterial.restitution=.25; W.defaultContactMaterial.friction=.5;
  const g=new Cn.Body({mass:0,shape:new Cn.Plane()}); g.quaternion.setFromEuler(-Math.PI/2,0,0); W.addBody(g); PHYS.world=W; return true; }
const UBOX=new THREE.BoxGeometry(1,1,1);
function debris(x,y,cols,n,power){
  if(reduce||!physInit()||!cols||!cols.length) return; const Cn=window.CANNON, max=quality==='high'?70:30;
  for(let i=0;i<n;i++){ const s=.05+Math.random()*.11, sz=[s,s*(.5+Math.random()*.9),s*(.6+Math.random()*.7)];
    const body=new Cn.Body({mass:s*10,shape:new Cn.Box(new Cn.Vec3(sz[0]/2,sz[1]/2,sz[2]/2)),linearDamping:.08,angularDamping:.15,sleepSpeedLimit:.15});
    body.position.set(W2(x)+(Math.random()-.5)*.55,.25+Math.random()*.55,W2(y)+(Math.random()-.5)*.55);
    const a=Math.random()*6.283, p=power*(.45+Math.random()*.8); body.velocity.set(Math.cos(a)*p,power*(.8+Math.random()*1.3),Math.sin(a)*p);
    body.angularVelocity.set((Math.random()-.5)*14,(Math.random()-.5)*14,(Math.random()-.5)*14); PHYS.world.addBody(body);
    const m=new THREE.Mesh(UBOX,M(cols[i%cols.length])); m.scale.set(...sz); m.castShadow=true; m.position.copy(body.position); scene.add(m);
    PHYS.items.push({body,m,life:4.5+Math.random()*2,sc:sz}); }
  while(PHYS.items.length>max) dropPhys(PHYS.items.shift());
}
function dropPhys(it){ scene.remove(it.m); PHYS.world&&PHYS.world.removeBody(it.body); }
function clearPhys(){ for(const it of PHYS.items) dropPhys(it); PHYS.items.length=0; }
function stepPhys(raw){ if(!PHYS.world||!PHYS.items.length) return; PHYS.world.step(1/60,raw,3);
  for(let i=PHYS.items.length-1;i>=0;i--){ const it=PHYS.items[i]; it.life-=raw; it.m.position.copy(it.body.position); it.m.quaternion.copy(it.body.quaternion);
    if(it.life<.8){ const k=Math.max(0,it.life/.8); it.m.scale.set(it.sc[0]*k,it.sc[1]*k,it.sc[2]*k); }
    if(it.life<=0){ dropPhys(it); PHYS.items.splice(i,1); } } }
function collapse(x,y,type){
  const e=bMeshes[idx(x,y)], cols=[]; if(e&&e.g) e.g.traverse(o=>{ if(o.material&&o.material.color&&cols.length<5){ const h=o.material.color.getHex(); if(!cols.includes(h)) cols.push(h); } });
  if(!cols.length) cols.push(COL.woodLight,COL.stone); debris(x,y,cols,type==='wall'?10:type==='tower'?18:14,type==='trap'?1.2:2.8); }
// ---------- uPlot: treasury charts ----------
const HIST_KEYS=['gold','food','wood','stone','iron'];
function recordHist(){ const h=S.hist||(S.hist={d:[],r:{},pop:[],mood:[],cr:{}}); h.d.push(S.day);
  for(const r of HIST_KEYS) (h.r[r]||(h.r[r]=[])).push(S.res[r]||0); h.pop.push(S.pop); h.mood.push(S.mood);
  let st=[]; try{ st=standings(); }catch(e){} for(const id of ['me',...Object.keys(KINGS)]){ const row=st.find(x=>x.id===id); (h.cr[id]||(h.cr[id]=[])).push(row?Math.round(row.p):null); }
  const cap=60; if(h.d.length>cap){ h.d.shift(); for(const r in h.r) h.r[r].shift(); h.pop.shift(); h.mood.shift(); for(const id in h.cr) h.cr[id].shift(); } }
let chartKey='', charts=[];
function renderCharts(){
  const box=$('charts'); if(!box||!$('treasD').classList.contains('on')&&$('side').classList.contains('tabbed')) return;
  const h=S.hist, w=Math.max(220,Math.floor(box.clientWidth-16)), key=[h&&h.d.length,w,lang,S.mtnUnlocked].join('|'); if(key===chartKey) return; chartKey=key;
  charts.forEach(c=>c.destroy()); charts=[];
  if(!window.uPlot||!h||h.d.length<2){ box.innerHTML=`<div class="chart"><h4>${T('The realm over time')}</h4><div class="empty">${T(window.uPlot?'Charts fill in after a couple of dawns.':'Charts are loading.')}</div></div>`; return; }
  const cs=getComputedStyle(document.documentElement), mut=cs.getPropertyValue('--muted').trim()||'#B5A795', grid='rgba(242,234,221,.07)';
  const axes=[{stroke:mut,grid:{stroke:grid},ticks:{stroke:grid},font:'11px Inter, system-ui',values:(u,v)=>v.map(x=>T('Day {{n}}',{n:x}))},{stroke:mut,grid:{stroke:grid},ticks:{stroke:grid},font:'11px Inter, system-ui',size:40}];
  const mk=(title,series,data,ht)=>{ const el=document.createElement('div'); el.className='chart'; el.innerHTML=`<h4>${title}</h4>`; box.appendChild(el);
    charts.push(new uPlot({width:w,height:ht||150,cursor:{drag:{x:false,y:false}},scales:{x:{time:false}},axes,series:[{label:T('Day')},...series],legend:{live:false}},data,el)); };
  box.innerHTML='';
  const res=HIST_KEYS.filter(r=>r!=='iron'||S.mtnUnlocked||(h.r.iron||[]).some(v=>v>0));
  mk(T('Stores at dawn'),res.map(r=>({label:T(cap1(r)),stroke:RCOL[r],width:2,points:{show:false}})),[h.d,...res.map(r=>h.r[r])]);
  mk(T('Villagers and mood'),[{label:T('Villagers'),stroke:RCOL.people,width:2,points:{show:false}},{label:T('Mood'),stroke:RCOL.mood,width:2,points:{show:false}}],[h.d,h.pop,h.mood],130);
  const ids=['me',...Object.keys(KINGS)].filter(id=>(h.cr[id]||[]).some(v=>v!=null));
  if(ids.length>1) mk(T('Race for the high crown'),ids.map(id=>({label:id==='me'?T('Your realm'):KINGS[id].short,stroke:id==='me'?'#F0BE4E':KINGS[id].color,width:id==='me'?3:2,points:{show:false}})),[h.d,...ids.map(id=>h.cr[id])],150);
}
// ---------- lz-string: kingdom share codes ----------
function shareKingdom(){
  if(!S||S.over){ say(T('Start or continue a kingdom first.')); return; } if(!window.LZString){ say(T('Share codes are still loading. Try again in a moment.')); return; }
  const code='SC1.'+LZString.compressToEncodedURIComponent(saveJSON()), link=`https://smallcrown.netlify.app/?k=${code}`;
  showOver(T('Share your kingdom'),T('Copy this code and send it to a friend. They can load it from Settings, Load a code, and play on from exactly where you are.'),[{label:T('Close'),primary:true,fn:()=>{ hideOver(); }}]);
  const card=$('over').querySelector('.card'), box=document.createElement('div'); box.className='sharebox';
  box.innerHTML=`<textarea readonly aria-label="${T('Kingdom code')}"></textarea><div class="sb"><button type="button" class="pri" data-c="code">${T('Copy code')}</button><button type="button" data-c="link">${T('Copy web link')}</button></div><small>${T('{{n}} characters. The web link opens the game on smallcrown.netlify.app with this kingdom loaded.',{n:code.length.toLocaleString()})}</small>`;
  card.insertBefore(box,card.querySelector('.opts')); const ta=box.querySelector('textarea'); ta.value=code;
  box.querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{ const v=b.dataset.c==='link'?link:code;
    const ok=()=>{ b.textContent=T('Copied'); setTimeout(()=>b.textContent=T(b.dataset.c==='link'?'Copy web link':'Copy code'),1500); };
    try{ navigator.clipboard.writeText(v).then(ok,()=>{ ta.value=v; ta.select(); }); }catch(e){ ta.value=v; ta.select(); } }));
}
function readCode(txt){ txt=(txt||'').trim(); const m=txt.match(/[?&]k=([^&#\s]+)/); if(m) txt=decodeURIComponent(m[1]); if(txt.startsWith('SC1.')) txt=txt.slice(4);
  try{ const j=LZString.decompressFromEncodedURIComponent(txt); if(!j) return null; const d=JSON.parse(j); return d&&d.grid?d:null; }catch(e){ return null; } }
function loadCodeDialog(prefill){
  if(!window.LZString){ say(T('Share codes are still loading. Try again in a moment.')); return; }
  const was=S&&S.modal;
  showOver(T('Load a kingdom code'),T('Paste a code a friend sent you. It replaces the kingdom in your current save slot.'),[{label:T('Cancel'),fn:()=>{ hideOver(); if(!S||S.over) newGame(); }}]);
  const card=$('over').querySelector('.card'), box=document.createElement('div'); box.className='sharebox';
  box.innerHTML=`<textarea aria-label="${T('Kingdom code')}" placeholder="SC1.…"></textarea><div class="sb"><button type="button" class="pri">${T('Load kingdom')}</button></div><small class="err" hidden></small>`;
  card.insertBefore(box,card.querySelector('.opts')); const ta=box.querySelector('textarea'); if(prefill) ta.value=prefill; setTimeout(()=>ta.focus(),50);
  box.querySelector('.pri').addEventListener('click',()=>{ const d=readCode(ta.value), er=box.querySelector('.err');
    if(!d){ er.hidden=false; er.textContent=T('That code could not be read. Check that it was copied in full.'); return; }
    if(load(d)){ saveOn=true; hideOver(); save(); ui(); forecast(); toast(T('Kingdom loaded'),T('Day {{n}}',{n:S.day}),'♛'); } });
}
// ---------- Tracery: generated chatter, ballads, warlord names, letters ----------
const TRX={en:{
  chatter:['#opener# #topic#','#topic.capitalize#','#opener# #wish#'],
  opener:['Heard the news?','Between you and me,','My cousin swears','Word in the market is','Honestly,','Mark my words:'],
  topic:['#beast# was seen out past the #place# again.','#rival# is building #thing#. As if that will help.','the well water tastes #taste# today.','someone stole #item# from the #building#.','the #building# needs a new roof before #season#.','#villager# is sweet on #villager2#. Everyone knows.','I saw the hero sharpen that sword three times this morning.','the caravans say the roads to #city# are full of bandits.'],
  wish:['I hope we get #thing# soon.','a #feast# would lift everyone.','I would trade #item# for one quiet night.'],
  beast:['a three-legged camel','a jackal pack','a giant sand lizard','the old white vulture','a goat the size of a horse'],
  place:['salt flats','red mesa','dry well','broken tower','canyon mouth'], city:['Qadir','Merrow','Hallowmere'],
  rival:['King Harun','Queen Ysolde','King Osric'], thing:['a bigger wall','a second market','a proper bathhouse','a bell tower','more wells'],
  taste:['of copper','of dust','sweeter than usual','of rain'], item:['a whole wheel of cheese','my best goat','three good spoons','the miller’s hat'],
  building:['tavern','granary','market','shrine','barracks'], season:['the rains','winter','harvest'], feast:['feast','festival','wedding'],
  villager:FOLK_NAMES, villager2:FOLK_NAMES,
  ballad:['The bards sing of how #deed#.','A new verse tells how #deed#.','In the tavern they already sing of how #deed#.'],
  deed:['the keep stood while the sky burned red','#villager# chased a raider off with a ladle','the walls drank the rain and did not fall','the hero held the gate alone','the arrows fell like a sandstorm on the raiders'],
  warlord:['#wfirst# the #wep#','#wfirst# #wep2#'], wfirst:['Kharzul','Mordak','Zerath','Ulgren','Sabra','Vesh','Grakka','Teshur','Ravka','Dun Morl','Azkar','Hessa'],
  wep:['Flayer','Red','Unbowed','Sand-Eater','Grinning','Twice-Hanged','Hollow','Ash-Born','Many-Scarred'], wep2:['Bonebreaker','Wellpoisoner','Gatecrusher','Skullhoarder'],
  letter:['A rider arrives in #wax# livery with a sealed letter.','The letter is sealed in #wax# wax and smells of #scent#.','A herald clears his throat and unrolls a long scroll.'],
  wax:['crimson','blue','green','black','gold'], scent:['incense','smoke','sea salt','roses']},
 es:{
  chatter:['#opener# #topic#','#topic.capitalize#','#opener# #wish#'],
  opener:['¿Te has enterado?','Entre tú y yo,','Mi primo jura que','En el mercado dicen que','Sinceramente,','Hazme caso:'],
  topic:['han vuelto a ver #beast# más allá de #place#.','#rival# está construyendo #thing#. Como si eso fuera a servir.','el agua del pozo sabe #taste# hoy.','alguien robó #item# de #building#.','#building# necesita un tejado nuevo antes de #season#.','#villager# está enamorado de #villager2#. Lo sabe todo el mundo.','vi al héroe afilar la espada tres veces esta mañana.','las caravanas dicen que los caminos a #city# están llenos de bandidos.'],
  wish:['ojalá tengamos #thing# pronto.','una #feast# nos animaría a todos.','cambiaría #item# por una noche tranquila.'],
  beast:['un camello de tres patas','una manada de chacales','un lagarto gigante','el viejo buitre blanco','una cabra del tamaño de un caballo'],
  place:['las salinas','la meseta roja','el pozo seco','la torre rota','la boca del cañón'], city:['Qadir','Merrow','Hallowmere'],
  rival:['el rey Harun','la reina Ysolde','el rey Osric'], thing:['una muralla más grande','un segundo mercado','unos baños como es debido','un campanario','más pozos'],
  taste:['a cobre','a polvo','más dulce que nunca','a lluvia'], item:['un queso entero','mi mejor cabra','tres cucharas buenas','el sombrero del molinero'],
  building:['la taberna','el granero','el mercado','el santuario','el cuartel'], season:['las lluvias','el invierno','la cosecha'], feast:['fiesta','feria','boda'],
  villager:FOLK_NAMES, villager2:FOLK_NAMES,
  ballad:['Los bardos cantan cómo #deed#.','Un verso nuevo cuenta cómo #deed#.','En la taberna ya cantan cómo #deed#.'],
  deed:['el castillo resistió mientras el cielo ardía','#villager# espantó a un asaltante con un cucharón','las murallas bebieron la lluvia y no cayeron','el héroe defendió la puerta solo','las flechas cayeron como una tormenta de arena'],
  warlord:['#wfirst# el #wep#','#wfirst# #wep2#'], wfirst:['Kharzul','Mordak','Zerath','Ulgren','Sabra','Vesh','Grakka','Teshur','Ravka','Dun Morl','Azkar','Hessa'],
  wep:['Desollador','Rojo','Indoblegable','Comearena','Sonriente','Dos Veces Ahorcado','Hueco','Nacido de Ceniza'], wep2:['Rompehuesos','Envenenapozos','Derribapuertas','Coleccionacráneos'],
  letter:['Llega un jinete con librea #wax# y una carta sellada.','La carta lleva lacre #wax# y huele a #scent#.','Un heraldo carraspea y desenrolla un largo pergamino.'],
  wax:['carmesí','azul','verde','negra','dorada'], scent:['incienso','humo','sal marina','rosas']}};
const TRG={};
function trace(sym){ try{ if(!window.tracery) return ''; const L=lang==='es'?'es':'en'; if(!TRG[L]){ TRG[L]=tracery.createGrammar(TRX[L]); TRG[L].addModifiers(tracery.baseEngModifiers); } return TRG[L].flatten('#'+sym+'#'); }catch(e){ return ''; } }
function letterOpener(id){ const t=trace('letter'), p=$('over').querySelector('.card p'); if(t&&p&&!p.previousElementSibling?.classList?.contains('letter')) p.insertAdjacentHTML('beforebegin',`<p class="letter" style="margin:0;font-size:12.5px;color:var(--muted);font-style:italic">${t}</p>`); }
// ---------- Rough.js: sketch the realm map ----------
function roughSvg(svg){ if(!svg||!window.rough||svg.dataset.rough) return; svg.dataset.rough=1; const rs=rough.svg(svg); let sd=1;
  svg.querySelectorAll('path,circle,line').forEach(el=>{ if(el.closest('defs')||el.closest('pattern')) return; const fill=el.getAttribute('fill'); if(fill&&fill.startsWith('url(')) return;
    const stroke=el.getAttribute('stroke')||'none', sw=+(el.getAttribute('stroke-width')||1), op={roughness:.9,bowing:.8,stroke:stroke==='none'?'none':stroke,strokeWidth:sw,seed:sd++};
    if(fill&&fill!=='none'){ op.fill=fill; op.fillStyle='solid'; }
    let n=null; try{ if(el.tagName==='path') n=rs.path(el.getAttribute('d'),op); else if(el.tagName==='circle') n=rs.circle(+el.getAttribute('cx'),+el.getAttribute('cy'),2*+el.getAttribute('r'),op); else n=rs.line(+el.getAttribute('x1'),+el.getAttribute('y1'),+el.getAttribute('x2'),+el.getAttribute('y2'),op); }catch(e){ return; }
    const opa=el.getAttribute('opacity'); if(opa) n.setAttribute('opacity',opa); el.replaceWith(n); }); }
// ---------- inkjs: court audiences written in Ink ----------
const INK=window.SC_INK||{};
const AUD=[{k:'bard',d:3},{k:'prophet',d:3},{k:'noble',d:4},{k:'orphans',d:4},{k:'smuggler',d:5},{k:'scholar',d:5},{k:'envoy',d:6}];
const AUD_RET={bard:'bard_return',noble:'noble_return',prophet:'prophet_return',smuggler:'smuggler_return',scholar:'scholar_return',orphans:'orphans_return',envoy:'envoy_return'};
// Court choices that keep paying (or costing) for several dawns. They show in the ledger with a countdown.
const lingers=()=>(S&&S.aud&&S.aud.linger)||[];
function planAudience(){ const A=S.aud||(S.aud={vars:{},seen:[],at:{},last:0,pend:null}); if(A.pend||S.over||S.day-A.last<3||Math.random()>.6) return;
  for(const k in AUD_RET){ const v=A.vars['m_'+k]; if(v>=1&&v<=3&&!A.seen.includes(AUD_RET[k])&&S.day-(A.at[k]||0)>=4){ A.pend=AUD_RET[k]; return; } }
  const c=AUD.filter(a=>!A.seen.includes(a.k)&&S.day>=a.d&&(a.k!=='envoy'||liveKings().length>=2)); if(c.length) A.pend=c[(Math.random()*c.length)|0].k; }
function audGain(w,n,fx){ n=Math.round(n); if(!n) return;
  if(w==='mood') S.mood=Math.max(0,Math.min(100,S.mood+n)); else if(w==='renown') addRenown(n); else if(w==='pop') S.pop=Math.max(1,S.pop+n); else S.res[w]=Math.max(0,(S.res[w]||0)+n);
  fx.push([w==='pop'?'villagers':w,n]); }
function openAudience(){
  const A=S.aud, knot=A.pend; if(!knot||!window.inkjs){ return; } let st;
  const IL=INK[lang]?lang:INK.en?'en':lang;
  if(!INK[IL]){ if(openAudience.loading) return; openAudience.loading=true; fetch(`data/court_${lang==='es'?'es':'en'}.json`).then(r=>r.json()).then(j=>{ INK[lang==='es'?'es':'en']=j; openAudience.loading=false; ui(); }).catch(()=>{ openAudience.loading=false; A.pend=null; }); return; }
  try{ st=new inkjs.Story(INK[IL]); }catch(e){ A.pend=null; return; }
  const kings=liveKings(), king=kings[(Math.random()*kings.length)|0]||'harun', rival=kings.find(k=>k!==king)||'osric', fx=[];
  for(const k in A.vars) try{ st.variablesState[k]=A.vars[k]; }catch(e){}
  try{ st.variablesState.king=T(KINGS[king].name); st.variablesState.rival=T(KINGS[rival].name); st.variablesState.day=S.day; }catch(e){}
  st.BindExternalFunction('gain',(w,n)=>{ audGain(w,n,fx); }); st.BindExternalFunction('can',(w,n)=>(w==='mood'?S.mood:(S.res[w]||0))>=n,true);
  st.BindExternalFunction('over',(w,n,d)=>{ n=Math.round(n); d=Math.max(1,Math.round(d)); if(!n) return; const A2=S.aud; (A2.linger=A2.linger||[]).push({w,n,left:d,src:step.who||T('The court')}); fx.push([w,n,null,d]); });
  st.BindExternalFunction('rel',(who,n)=>{ const ids=who==='all'?liveKings():[who==='king'?king:rival]; ids.forEach(id=>relShift(id,n)); fx.push([who==='all'?T('all crowns'):kn(who==='king'?king:rival),n,'rel']); });
  try{ st.ChoosePathString(knot); }catch(e){ A.pend=null; return; }
  const finish=()=>{ for(const k of ['m_bard','m_noble','m_prophet','m_smuggler','m_scholar','m_orphans','m_envoy']){ try{ A.vars[k]=st.variablesState[k]; }catch(e){} }
    A.seen.push(knot); A.at[knot.replace('_return','')]=S.day; A.pend=null; A.last=S.day; hideOver(); S.ver++; save(); ui(); };
  const step=()=>{ const lines=[]; let who='';
    while(st.canContinue){ const t=st.Continue().trim(); for(const tg of st.currentTags||[]){ const m=/^speaker:\s*(.+)$/.exec(tg); if(m) who=m[1].trim(); } if(t) lines.push(t); }
    who=who||step.who||T('A visitor at court'); step.who=who;
    const ch=st.currentChoices, opts=ch.length?ch.map(c=>({label:c.text,fn:()=>{ fx.length=0; st.ChooseChoiceIndex(c.index); step(); }})):[{label:T('End the audience'),primary:true,fn:finish}];
    showOver(who,'',opts); const card=$('over').querySelector('.card'); card.classList.add('aud');
    card.querySelector('h2').outerHTML=`<div class="who"><span class="av">${who.replace(/^(the|el|la|un|una|a|lady|dama|sister|hermana)\s+/i,'').charAt(0)}</span><div><small>${T('Court audience')}</small><h2 style="margin:0">${who}</h2></div></div>`;
    const p=card.querySelector('p'); p.outerHTML=`<div class="lines">${lines.map(l=>`<p class="${/^[“"]/.test(l)?'q':''}">${l.replace(/</g,'&lt;')}</p>`).join('')}</div>${fx.length?`<div class="fx">${fx.map(([w,n,r,d])=>`<span class="${n>0?'up':'dn'}">${d?T('{{n}} {{w}} a dawn for {{d}} dawns',{n:(n>0?'+':'')+n,w:T(w),d}):`${n>0?'+':''}${n} ${r?T('with {{k}}',{k:w}):T(w)}`}</span>`).join('')}</div>`:''}`;
    sfx('tap'); renderRes(); };
  step();
}
