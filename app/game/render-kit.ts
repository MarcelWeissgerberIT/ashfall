import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ART } from './art';
export type Surface = keyof typeof ART.surfaces;
// Metres per repeat keep planks, tile joints and fabric grain at a consistent scale.
const SURFACES:Record<Surface,{metres:number;roughness:number;metalness:number;bump:number;tint:number}>={
  concrete:{metres:2.5,roughness:.94,metalness:.025,bump:.025,tint:.42},
  asphalt:{metres:2.5,roughness:.91,metalness:.025,bump:.025,tint:.42},
  steel:{metres:2.5,roughness:.69,metalness:.28,bump:.025,tint:.42},
  paving:{metres:2.5,roughness:.91,metalness:.025,bump:.085,tint:.42},
  wood:{metres:1.1,roughness:.98,metalness:0,bump:.038,tint:.78},
  carPaint:{metres:1.8,roughness:.58,metalness:.25,bump:.018,tint:.88},
  rubber:{metres:.55,roughness:.96,metalness:0,bump:.018,tint:.82},
  brushedSteel:{metres:1.1,roughness:.42,metalness:.8,bump:.006,tint:.8},
  tiles:{metres:3.2,roughness:.72,metalness:.05,bump:.016,tint:.86},
  vinyl:{metres:1.4,roughness:.83,metalness:0,bump:.02,tint:.9},
  corrugated:{metres:1.5,roughness:.72,metalness:.35,bump:.055,tint:.78},
  glass:{metres:1.2,roughness:.22,metalness:.2,bump:.002,tint:.88},
  canvas:{metres:.6,roughness:1,metalness:0,bump:.012,tint:.62},
  jacket:{metres:.65,roughness:1,metalness:0,bump:.011,tint:.68},
  denim:{metres:.5,roughness:1,metalness:0,bump:.008,tint:.62},
  bark:{metres:.8,roughness:.98,metalness:0,bump:.055,tint:.8},
};
export function createRenderKit(renderer: THREE.WebGLRenderer) {
  const geometries=new Map<string,THREE.BufferGeometry>();
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  const textures=new Set<THREE.Texture>();
  const maps={} as Record<Surface,THREE.Texture>;
  const detailMaps={} as Record<Surface,THREE.Texture>;
  let disposed=false;
  for(const [name,url] of Object.entries(ART.surfaces)) {
    const texture=new THREE.TextureLoader().load(url,loaded=>{if(disposed)loaded.dispose()});
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    textures.add(texture);maps[name as Surface]=texture;
    const detail=new THREE.TextureLoader().load(url.replace('.webp','-detail.webp'),loaded=>{if(disposed)loaded.dispose()});
    detail.wrapS=detail.wrapT=THREE.MirroredRepeatWrapping;detail.anisotropy=texture.anisotropy;textures.add(detail);detailMaps[name as Surface]=detail;
  }
  const material=(color:number,surface?:Surface,glow=0)=>{
    const key=`${color}:${surface}:${glow}`;
    if(!materials.has(key)){
      const tint=new THREE.Color(color);
      const profile=surface?SURFACES[surface]:undefined;
      if(profile)tint.lerp(new THREE.Color(0xffffff),profile.tint);
      materials.set(key,new THREE.MeshStandardMaterial({
        color:tint,map:surface?maps[surface]:null,bumpMap:surface?detailMaps[surface]:null,bumpScale:profile?.bump??0,roughness:profile?.roughness??.9,
        metalness:profile?.metalness??.025,emissive:glow,emissiveIntensity:glow?2.2:0,
      }));
    }
    return materials.get(key)!;
  };
  const geometry=(key:string,make:()=>THREE.BufferGeometry)=>{
    if(!geometries.has(key))geometries.set(key,make());return geometries.get(key)!;
  };
  const boxGeometry=(w:number,h:number,d:number,rounded=false,metres=2.5)=>geometry(`box:${w}:${h}:${d}:${rounded}:${metres}`,()=>{
    const g=rounded?new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.16):new THREE.BoxGeometry(w,h,d);
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){
      const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));
      // All albedo crops are 4:3. Preserve square tile joints and fabric weave in world space.
      uv.setXY(i,(nx>.75?p.getZ(i):p.getX(i))/metres,(ny>.75?p.getZ(i):p.getY(i))/(metres*.75));
    }
    return g;
  });
  function box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,color:number,surface?:Surface,glow=0,rounded=false){
    const mesh=new THREE.Mesh(boxGeometry(w,h,d,rounded,surface?SURFACES[surface].metres:2.5),material(color,surface,glow));
    mesh.position.set(x,y+h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(parent:THREE.Object3D,x:number,y:number,z:number,r:number,h:number,color:number,top=r,surface?:Surface){
    const metres=surface?SURFACES[surface].metres:2.5;
    const mesh=new THREE.Mesh(geometry(`cyl:${r}:${top}:${h}:${metres}`,()=>{
      const g=new THREE.CylinderGeometry(top,r,h,12),uv=g.attributes.uv,n=g.attributes.normal,p=g.attributes.position;
      for(let i=0;i<uv.count;i++){
        if(Math.abs(n.getY(i))>.75)uv.setXY(i,p.getX(i)/metres,p.getZ(i)/(metres*.75));
        else uv.setXY(i,uv.getX(i)*2*Math.PI*Math.max(r,top)/metres,uv.getY(i)*h/(metres*.75));
      }
      return g;
    }),material(color,surface));
    mesh.position.set(x,y+h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function ellipsoid(parent:THREE.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,surface?:Surface){
    const metres=surface?SURFACES[surface].metres:0;
    const mesh=new THREE.Mesh(geometry(metres?`ellipsoid:${sx}:${sy}:${sz}:${metres}`:'sphere',()=>{
      const g=new THREE.SphereGeometry(1,12,10);
      if(metres){
        const uv=g.attributes.uv,p=g.attributes.position;
        const circumference=2*Math.PI*Math.sqrt((sx*sx+sz*sz)/2);
        for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*circumference/metres,p.getY(i)*sy/(metres*.75));
      }
      return g;
    }),material(color,surface));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function limb(parent:THREE.Object3D,x:number,y:number,z:number,radius:number,length:number,color:number,surface?:Surface){
    const joint=new THREE.Group();joint.position.set(x,y,z);parent.add(joint);
    const metres=surface?SURFACES[surface].metres:0;
    const shape=new THREE.Mesh(geometry(`capsule:${radius}:${length}:${metres}`,()=>{
      const g=new THREE.CapsuleGeometry(radius,Math.max(.01,length-radius*2),4,8);
      if(metres){const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*radius/metres,p.getY(i)/(metres*.75));}
      return g;
    }),material(color,surface));
    shape.position.y=-length/2;shape.castShadow=true;shape.receiveShadow=true;joint.add(shape);return joint;
  }
  const contactCanvas=document.createElement('canvas');contactCanvas.width=128;contactCanvas.height=128;
  const ctx=contactCanvas.getContext('2d')!;const gradient=ctx.createRadialGradient(64,64,5,64,64,63);
  gradient.addColorStop(0,'rgba(0,0,0,.75)');gradient.addColorStop(.35,'rgba(0,0,0,.48)');gradient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const contactMap=new THREE.CanvasTexture(contactCanvas);textures.add(contactMap);
  const contactMaterial=new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const extras=new Set<THREE.Material>();
  function contact(parent:THREE.Object3D,x:number,z:number,w:number,d:number){const shadow=new THREE.Mesh(geometry('plane',()=>new THREE.PlaneGeometry(1,1)),contactMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.018,z);shadow.scale.set(w,d,1);shadow.userData.noPick=true;parent.add(shadow);return shadow;}
  const ringGeometry=geometry('ring',()=>new THREE.RingGeometry(.91,1,40));
  function ring(parent:THREE.Object3D,x:number,z:number,r:number,color:number,opacity=.6){
    const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false});extras.add(m);
    const mesh=new THREE.Mesh(ringGeometry,m);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.029,z);mesh.scale.setScalar(r);mesh.userData.baseRadius=r;mesh.userData.noPick=true;parent.add(mesh);return mesh;
  }
  function disposeLocal(root:THREE.Object3D){root.traverse(o=>{
    if(o instanceof THREE.Sprite){o.material.map?.dispose();o.material.dispose()}
    if(o instanceof THREE.Mesh){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms)if(extras.delete(m)){(m as THREE.MeshBasicMaterial).map?.dispose();m.dispose();}}
  });root.clear();}
  return {box,cylinder,ellipsoid,limb,contact,ring,material,geometry,maps,extras,disposeLocal,
    dispose(){disposed=true;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());extras.forEach(m=>m.dispose());contactMaterial.dispose();},
  };
}
export type RenderKit = ReturnType<typeof createRenderKit>;
const CHAR_DOWN = new THREE.Vector3(0,-1,0);
const charClamp=(n:number)=>THREE.MathUtils.clamp(n,0,1);
const charSmooth=(n:number)=>{const t=charClamp(n);return t*t*(3-2*t)};
const charMix=(a:number,b:number,t:number)=>a+(b-a)*t;
const charDamp=(a:number,b:number,rate:number,dt:number)=>charMix(a,b,1-Math.exp(-rate*dt));
function charJoint(parent:THREE.Object3D,name:string,x=0,y=0,z=0){
  const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;
}
function charRod(kit:RenderKit,parent:THREE.Object3D,a:number[],b:number[],r:number,c:number,surface?:Surface){
  const start=new THREE.Vector3(...a as [number,number,number]);
  const end=new THREE.Vector3(...b as [number,number,number]);
  const direction=end.clone().sub(start),length=direction.length();
  const m=kit.cylinder(parent,0,-length/2,0,r,length,c,r,surface);
  m.position.copy(start.add(end).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return m;
}

export function createCharacter(kit:RenderKit,zombie=false,variant=0){
  const {box,ellipsoid,limb}=kit;
  const v=((variant%3)+3)%3,skin=zombie?0xa2ad8b:0xcfa883;
  const shirt=zombie?[0x637263,0x877661,0x9b9b8d][v]:0x747d68;
  const group=new THREE.Group();group.name=zombie?'infected':'survivor';
  const body=charJoint(group,'body');
  const contact=kit.contact(group,0,0,1.4,1.12);
  const halo=kit.ring(group,0,0,zombie?.43:.53,zombie?0xb56d56:0xf4bd77,zombie?.3:.8);
  const hips=charJoint(body,'hips');
  box(hips,0,.75,0,.43,.18,.29,0x34423b,'denim',0,true);
  box(hips,0,.87,.005,.445,.045,.31,0x434c36,'canvas');
  box(hips,0,.87,.164,.08,.053,.027,0xa1a38b,'brushedSteel');
  const legs=[-1,1].map((side,i)=>{
    const hip=limb(hips,side*.145,.85,0,.105,.41,0x34443d,'denim');hip.name=i?'right-hip':'left-hip';
    const knee=limb(hip,0,-.41,0,.086,.42,zombie?0x455048:0x34443d,'denim');knee.name=i?'right-knee':'left-knee';
    ellipsoid(hip,0,-.40,.026,.095,.092,.1,0x495648,'denim');
    const foot=charJoint(knee,i?'right-ankle':'left-ankle',0,-.42,0);
    box(foot,0,-.095,.075,.225,.15,.365,0x4d584e,'rubber',0,true);
    box(foot,0,-.102,.075,.234,.037,.376,0x25332e,'rubber',0,true);
    box(foot,0,.015,-.016,.16,.12,.19,0x485548,'canvas',0,true);
    return {hip,knee,foot,side,plant:new THREE.Vector3(),planted:false,stance:false};
  });
  const chest=charJoint(body,'chest',0,1.01,0);
  ellipsoid(chest,0,.135,0,.274,.33,.178,shirt,'canvas');
  box(chest,0,-.15,0,.475,.25,.285,shirt,'canvas',0,true);
  const arms=[-1,1].map((side,i)=>{
    const upper=limb(chest,side*.324,.29,0,.086,.35,shirt,'canvas');upper.name=i?'right-shoulder':'left-shoulder';
    const elbow=limb(upper,0,-.35,0,.07,.32,skin);elbow.name=i?'right-elbow':'left-elbow';
    ellipsoid(upper,0,-.345,0,.075,.077,.074,skin);
    const hand=charJoint(elbow,i?'right-hand':'left-hand',0,-.32,0);
    ellipsoid(hand,0,-.017,.014,.073,.09,.07,zombie?skin:0x394638);
    box(hand,0,-.07,.051,.11,.038,.041,zombie?skin:0x4a5640,undefined,0,true);
    return {upper,elbow,hand};
  });
  const head=charJoint(chest,'head',0,.49,0);
  kit.cylinder(head,0,-.09,0,.075,.14,skin);
  ellipsoid(head,0,.13,.006,.164,.215,.155,skin);
  ellipsoid(head,0,.08,.15,.046,.065,.047,skin);
  for(const x of [-.16,.16])ellipsoid(head,x,.11,0,.034,.064,.033,skin);
  ellipsoid(head,0,.274,-.041,.17,.107,.147,zombie?0x455043:0x333f32);
  for(const x of [-.068,.068]){
    box(head,x,.14,.151,.058,.037,.02,zombie?0x46503b:0x655b45);
    box(head,x,.148,.166,.025,.016,.009,zombie?0xe4b27a:0x283e34,undefined,zombie?0x4f301b:0);
  }
  box(head,.012,.018,.146,.084,.019,.015,zombie?0x645342:0x8e6e52);
  if(zombie){box(chest,-.15,.02,.18,.095,.18,.013,0x644a37);head.rotation.z=.055*(v-1);}
  const wear={jacket:[] as THREE.Group[],vest:[] as THREE.Group[],helmet:[] as THREE.Group[]};
  const hands:Record<string,THREE.Group>={};
  let backpack:THREE.Group|undefined,bandage:THREE.Group|undefined;
  if(!zombie){
    const jacket=charJoint(chest,'equipment:body:jacket');wear.jacket.push(jacket);
    ellipsoid(jacket,0,.135,-.005,.294,.343,.195,0xb77b47,'jacket');
    box(jacket,0,-.155,0,.514,.27,.317,0xa87345,'jacket',0,true);
    box(jacket,0,-.10,.198,.021,.48,.014,0x494936);
    for(const x of [-.152,.152])box(jacket,x,.04,.192,.16,.128,.05,0x986d45,'jacket',0,true);
    for(const arm of arms){
      const upper=charJoint(arm.upper,'equipment:body:jacket-sleeve');wear.jacket.push(upper);
      ellipsoid(upper,0,-.17,0,.099,.199,.099,0xaf7645,'jacket');
      const fore=charJoint(arm.elbow,'equipment:body:jacket-cuff');wear.jacket.push(fore);
      ellipsoid(fore,0,-.145,0,.081,.167,.082,0xaf7645,'jacket');
      box(fore,0,-.31,0,.16,.055,.16,0x646246,'canvas',0,true);
    }
    const vest=charJoint(chest,'equipment:body:vest');wear.vest.push(vest);
    box(vest,0,-.125,.063,.535,.45,.348,0x4c6454,'canvas',0,true);
    box(vest,0,.05,.255,.39,.26,.045,0x384e42,undefined,0,true);
    for(const x of [-.18,0,.18])box(vest,x,-.09,.272,.143,.18,.076,0x5d7257,'canvas',0,true);
    for(const x of [-.198,.198])box(vest,x,.275,.035,.078,.07,.36,0x718164,'canvas',0,true);
    const helmet=charJoint(head,'equipment:head:helmet');wear.helmet.push(helmet);
    ellipsoid(helmet,0,.28,-.028,.208,.144,.192,0x506854,'carPaint');
    box(helmet,0,.211,.02,.409,.04,.389,0x3d5345,'rubber',0,true);
    box(helmet,0,.226,.177,.378,.035,.092,0x596f56,'brushedSteel',0,true);
    for(const side of [-1,1])box(helmet,side*.183,.083,-.035,.043,.155,.248,0x4b6252,'carPaint',0,true);
    charRod(kit,helmet,[-.16,.08,.055],[-.11,-.027,.102],.013,0x807c56,'canvas');
    charRod(kit,helmet,[.16,.08,.055],[.11,-.027,.102],.013,0x807c56,'canvas');
    backpack=charJoint(chest,'backpack');
    box(backpack,0,-.105,-.275,.425,.48,.235,0x4e6554,'canvas',0,true);
    box(backpack,0,.334,-.278,.45,.085,.254,0x6a7d5c,'canvas',0,true);
    box(backpack,0,-.068,-.416,.313,.224,.075,0x405a46,'canvas',0,true);
    for(const x of [-.188,.188]){
      box(backpack,x,-.089,-.46,.036,.52,.02,0x949577,'canvas');
      charRod(kit,chest,[x,.345,-.15],[x,.03,.19],.022,0x5d6548,'canvas');
    }
    kit.cylinder(backpack,-.278,-.095,-.257,.068,.29,0x7d9480,.068,'brushedSteel');
    const crowbar=charJoint(arms[1].hand,'equipment:hand:crowbar');hands.crowbar=crowbar;
    charRod(kit,crowbar,[0,.045,0],[0,-.59,0],.021,0x879b8b,'brushedSteel');
    charRod(kit,crowbar,[0,-.59,0],[.07,-.655,.015],.026,0xaab5a2,'brushedSteel');
    charRod(kit,crowbar,[.07,-.655,.015],[.15,-.642,.015],.023,0xaab5a2,'brushedSteel');
    box(crowbar,0,-.15,0,.054,.19,.054,0x39493b,'rubber',0,true);
    const axe=charJoint(arms[1].hand,'equipment:hand:axe');hands.axe=axe;
    charRod(kit,axe,[0,.055,0],[0,-.635,0],.026,0x947958,'wood');
    box(axe,0,-.18,0,.061,.2,.058,0x46533e,'rubber',0,true);
    const axeGeo=kit.geometry('actor:axe-blade:v1',()=>{
      const shape=new THREE.Shape();shape.moveTo(-.06,-.44);shape.lineTo(.14,-.435);shape.lineTo(.305,-.40);shape.lineTo(.335,-.62);shape.lineTo(.17,-.60);shape.lineTo(-.065,-.555);shape.closePath();
      const geo=new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelThickness:.008,bevelSize:.01,bevelSegments:1,steps:1});geo.translate(0,0,-.0325);return geo;
    });
    const blade=new THREE.Mesh(axeGeo,kit.material(0xa4b3a0,'brushedSteel'));blade.castShadow=true;blade.receiveShadow=true;axe.add(blade);
    const bottle=charJoint(arms[1].hand,'equipment:hand:bottle');hands.bottle=bottle;
    kit.cylinder(bottle,0,-.16,0,.066,.25,0x90b297,.066,'glass');
    kit.cylinder(bottle,0,.09,0,.033,.12,0xb0c7a8,.033,'glass');
    kit.cylinder(bottle,0,.205,0,.038,.028,0xc4b287,.038,'brushedSteel');
    box(bottle,0,-.095,.063,.094,.11,.012,0xc0bea0,'vinyl');
    bandage=charJoint(arms[0].hand,'action:bandage');
    box(bandage,0,-.01,.063,.16,.09,.1,0xd4d8bd,'vinyl',0,true);
    box(bandage,0,.081,.063,.034,.008,.076,0x9b5341);
  }
  for(const pieces of Object.values(wear))for(const piece of pieces)piece.visible=false;
  for(const hand of Object.values(hands))hand.visible=false;if(bandage)bandage.visible=false;
  const d={body,chest,head,hips,legs,arms,halo,contact,wear,hands,backpack,bandage,zombie,variant:v,
    leftLeg:legs[0].hip,rightLeg:legs[1].hip,leftArm:arms[0].upper,rightArm:arms[1].upper,
    started:false,lastX:0,lastY:0,phase:0,motion:0,speed:0,sneak:0,sprint:0,death:0,dead:false,wasMoving:false,
    workA:new THREE.Vector3(),workB:new THREE.Vector3(),workC:new THREE.Vector3(),workQ:new THREE.Quaternion()};
  group.userData=d;
  return group;
}

// A sagittal knee pole plus a full 3D target preserves planted feet during turns.
// The upper/lower lengths match createCharacter; no shared geometry is changed.
function charSolveLeg(d:any,leg:any,target:THREE.Vector3,toePitch:number){
  const upper=.41,lower=.42,hip=leg.hip.position;
  const direction=d.workA.copy(target).sub(hip),distance=THREE.MathUtils.clamp(direction.length(),.08,upper+lower-.003);
  direction.normalize();
  const pole=d.workB.set(0,0,1).addScaledVector(direction,-direction.z).normalize();
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
  const bend=Math.sqrt(Math.max(0,upper*upper-along*along));
  const upperDirection=d.workC.copy(direction).multiplyScalar(along).addScaledVector(pole,bend).normalize();
  leg.hip.quaternion.setFromUnitVectors(CHAR_DOWN,upperDirection);
  const lowerDirection=d.workB.copy(direction).multiplyScalar(distance).addScaledVector(upperDirection,-upper);
  d.workQ.copy(leg.hip.quaternion).invert();lowerDirection.applyQuaternion(d.workQ).normalize();
  leg.knee.quaternion.setFromUnitVectors(CHAR_DOWN,lowerDirection);
  leg.foot.quaternion.copy(leg.hip.quaternion).multiply(leg.knee.quaternion).invert();
  leg.foot.rotation.x+=toePitch;
}

export function animateCharacter(group:THREE.Group,actor:any,dt:number,playing:boolean,time:number){
  const d=group.userData;
  const stepDt=playing?THREE.MathUtils.clamp(dt,0,.06):0;
  const initial=!d.started;
  const distance=initial?0:Math.hypot(actor.x-d.lastX,actor.y-d.lastY);
  const teleported=distance>.85;
  d.started=true;d.lastX=actor.x;d.lastY=actor.y;
  group.position.set(actor.x,0,actor.y);group.rotation.y=Number.isFinite(actor.facing)?actor.facing:0;
  const dead=typeof actor.hp==='number'&&actor.hp<=0;
  if(dead){
    if(initial)d.death=1;
    // Finish this cosmetic fall even if game-over has stopped actor simulation.
    else d.death=Math.min(1,d.death+THREE.MathUtils.clamp(dt,0,.06)/.85);
    const fall=charSmooth(d.death);
    d.body.rotation.set(.09*fall,0,(d.variant%2?-1:1)*Math.PI/2*fall);
    d.body.position.set(0,.48*fall,-.09*fall);
    d.chest.rotation.x=.2+.3*fall;
    d.arms[0].upper.rotation.x=charMix(-.8,.23,fall);d.arms[1].upper.rotation.x=charMix(-1.2,-.18,fall);
    d.arms[0].elbow.rotation.x=-.45;d.arms[1].elbow.rotation.x=-.8;
    d.head.rotation.z=.15*fall;d.halo.visible=false;d.dead=true;
    d.contact.scale.set(1.4+fall*.4,1.12+fall*.55,1);
    return;
  }
  if(d.dead){d.dead=false;d.death=0;d.halo.visible=true;d.contact.scale.set(1.4,1.12,1);for(const leg of d.legs)leg.planted=false;}
  const moving=playing&&!teleported&&distance>.0001;
  // Leave enough reach for the first planted foot when starting from rest.
  if(moving&&!d.wasMoving)d.phase=.30;
  if(playing)d.wasMoving=moving;
  const speed=moving&&dt>0?distance/dt:0;
  d.speed=charDamp(d.speed,speed,10,stepDt);
  d.motion=charDamp(d.motion,moving?1:0,moving?12:9,stepDt);
  d.sneak=charDamp(d.sneak,actor.sneak?1:0,9,stepDt);
  // The engine's normal 3.1 m/s movement reads as a run; slow/sneak stays low.
  d.sprint=charDamp(d.sprint,!d.zombie&&!actor.sneak&&moving&&(actor.sprint||d.speed>2.65)?1:0,7,stepDt);
  if(initial){d.sneak=actor.sneak?1:0;d.motion=0;}
  const cycle=d.zombie?.84:charMix(charMix(1.03,.76,d.sneak),1.25,d.sprint);
  if(moving)d.phase=(d.phase+distance/cycle)%1;
  const phase=d.phase*Math.PI*2,breath=Math.sin(time*(d.zombie?1.45:2.1)+d.variant*1.8);
  const hurt=charClamp(Number(actor.hurt)||0);
  const action=actor.action;
  const active=action&&action.remaining>0&&action.duration>0;
  const type=active?action.type:null;
  const p=active?charClamp(1-action.remaining/action.duration):0;
  const envelope=active?charSmooth(p/.10)*(1-charSmooth((p-.82)/.18)):0;
  const attack=type==='attack'?envelope:0;
  const throwWeight=type==='throw'?envelope:0;
  const heal=type==='heal'?envelope:0;
  const interact=type==='interact'?envelope:0;
  const sway=Math.sin(phase)*d.motion;
  d.body.position.set(0,-.10*d.sneak-.035*d.sprint+Math.abs(Math.sin(phase))*d.motion*.014,-hurt*.065);
  d.body.rotation.set(0,0,0);
  d.hips.rotation.set(0,0,0);
  d.chest.position.set(d.zombie?sway*.012:0,1.01+breath*.006,.012*d.sneak);
  d.chest.scale.set(1,1+breath*.008,1);
  d.chest.rotation.set(.13*d.sneak+.16*d.sprint+(d.zombie?.15+sway*.055:0)-hurt*.17,-sway*.055, d.zombie?Math.sin(phase*.5+d.variant)*.035:sway*.012);
  d.head.rotation.set(-.08*d.sneak-.07*d.sprint-hurt*.13,Math.sin(time*.56+d.variant)*.065*(1-d.motion),d.zombie?.055*(d.variant-1):0);
  if(d.backpack){d.backpack.rotation.x=-Math.abs(sway)*.025;d.backpack.rotation.z=-sway*.027;}
  const facing=group.rotation.y,sin=Math.sin(facing),cos=Math.cos(facing);
  for(let i=0;i<d.legs.length;i++){
    const leg=d.legs[i],phase01=(d.phase+i*.5)%1,stance=phase01<.62;
    const span=cycle*.62*(d.zombie&&i===1?.87:1);
    let z:number,lift=0,toe=0;
    if(stance)z=span*.5-span*phase01/.62;
    else {const swing=(phase01-.62)/.38;z=charMix(-span*.5,span*.5,charSmooth(swing));lift=Math.sin(swing*Math.PI)*(d.zombie&&i===1?.035:charMix(.12,.20,d.sprint))*(1-d.sneak*.35);toe=-Math.sin(swing*Math.PI)*.16;}
    const x=leg.side*(.145+d.sneak*.024),localZ=z*d.motion;
    const desired=d.workC.set(actor.x+cos*x+sin*localZ,.102+lift*d.motion,actor.y-sin*x+cos*localZ);
    if(initial||teleported||!leg.planted){leg.plant.copy(desired);leg.planted=true;}
    else if(moving){if(!stance||!leg.stance)leg.plant.copy(desired);}
    else if(stepDt>0){const neutral=d.workB.set(actor.x+cos*x,.102,actor.y-sin*x);leg.plant.lerp(neutral,1-Math.exp(-10*stepDt));}
    leg.stance=stance;
    // A teleport/very sharp reversal may exceed reach; reset only that foot.
    if(Math.hypot(leg.plant.x-actor.x,leg.plant.z-actor.y)>.66)leg.plant.copy(desired);
    const dx=leg.plant.x-actor.x,dz=leg.plant.z-actor.y;
    const footTarget=d.workC.set(cos*dx-sin*dz-d.body.position.x,leg.plant.y-d.body.position.y,sin*dx+cos*dz-d.body.position.z);
    // A sudden speed/posture change can exhaust the old plant's reach. Release
    // that plant along the ground instead of letting the IK raise the boot.
    const hx=footTarget.x-leg.hip.position.x,hz=footTarget.z-leg.hip.position.z;
    const vertical=footTarget.y-leg.hip.position.y;
    const reach=Math.sqrt(Math.max(.002,.825*.825-vertical*vertical)),horizontal=Math.hypot(hx,hz);
    if(horizontal>reach){
      footTarget.x=leg.hip.position.x+hx*reach/horizontal;
      footTarget.z=leg.hip.position.z+hz*reach/horizontal;
      const lx=footTarget.x+d.body.position.x,lz=footTarget.z+d.body.position.z;
      leg.plant.x=actor.x+cos*lx+sin*lz;leg.plant.z=actor.y-sin*lx+cos*lz;
    }
    charSolveLeg(d,leg,footTarget,toe*d.motion);
  }
  for(let i=0;i<2;i++){
    const arm=d.arms[i],side=i?1:-1;
    arm.upper.rotation.set(d.zombie?-1.02+side*sway*.16:-.14+side*sway*(.29+.25*d.sprint),0,side*(-.035-.12*d.sprint));
    arm.elbow.rotation.set(d.zombie?-.3-side*sway*.07:-.22-.5*d.sprint-.23*d.sneak,0,0);
    arm.hand.rotation.set(0,0,0);
    if(hurt){arm.upper.rotation.x-=hurt*.35;arm.elbow.rotation.x-=hurt*.4;}
  }
  // A carrying pose keeps long tools above the ground throughout the gait.
  if(!d.zombie&&actor.equipment?.hand){
    d.arms[1].upper.rotation.x-=.08;
    d.arms[1].elbow.rotation.x-=actor.equipment.hand==='bottle'?.35:.24+.12*d.sneak;
  }
  if(attack){
    const wind=charSmooth(p/.28),strike=charSmooth((p-.28)/.25),recover=charSmooth((p-.60)/.4);
    if(d.zombie){
      const lunge=Math.sin(charClamp((p-.2)/.65)*Math.PI)*attack;
      d.chest.rotation.x+=lunge*.26;d.chest.position.z+=lunge*.13;
      d.arms[0].upper.rotation.x=charMix(d.arms[0].upper.rotation.x,charMix(-1.25,-1.7,lunge),attack);
      d.arms[1].upper.rotation.x=charMix(d.arms[1].upper.rotation.x,charMix(-1.05,-1.55,lunge),attack);
      d.arms[0].elbow.rotation.x=charMix(d.arms[0].elbow.rotation.x,charMix(-.5,-.08,lunge),attack);
      d.arms[1].elbow.rotation.x=charMix(d.arms[1].elbow.rotation.x,charMix(-.65,-.12,lunge),attack);
    }else{
      const shoulder=charMix(charMix(-.15,-2.23,wind),-.1,strike);
      d.arms[1].upper.rotation.x=charMix(d.arms[1].upper.rotation.x,charMix(shoulder,-.14,recover),attack);
      d.arms[1].upper.rotation.z=charMix(d.arms[1].upper.rotation.z,charMix(.12,-.27,strike),attack);
      d.arms[1].elbow.rotation.x=charMix(d.arms[1].elbow.rotation.x,charMix(-1.04,-.27,strike),attack);
      d.chest.rotation.y+=charMix(-.34,.38,strike)*attack;
      d.chest.rotation.x+=(.04+.15*strike)*attack;
      d.arms[0].upper.rotation.x-=attack*.58;d.arms[0].elbow.rotation.x-=attack*.45;
    }
  }
  if(throwWeight){
    const toss=charSmooth((p-.3)/.25),recover=charSmooth((p-.65)/.35);
    d.arms[1].upper.rotation.x=charMix(d.arms[1].upper.rotation.x,charMix(charMix(-2.22,-1.2,toss),-.14,recover),throwWeight);
    d.arms[1].elbow.rotation.x=charMix(d.arms[1].elbow.rotation.x,charMix(charMix(-1.0,-.08,toss),-.22,recover),throwWeight);
    d.chest.rotation.y+=charMix(-.3,.22,toss)*throwWeight;
    d.arms[0].upper.rotation.x-=.5*throwWeight;
  }
  if(heal){
    for(const arm of d.arms){arm.upper.rotation.x=charMix(arm.upper.rotation.x,-1.05,heal);arm.elbow.rotation.x=charMix(arm.elbow.rotation.x,-1.7,heal);}
    d.arms[0].upper.rotation.z=heal*.32;d.arms[1].upper.rotation.z=-heal*.32;
    d.arms[0].hand.rotation.z=Math.sin(time*15)*.2*heal;d.head.rotation.x+=heal*.27;
  }
  if(interact){
    d.arms[1].upper.rotation.x=charMix(d.arms[1].upper.rotation.x,-1.10,interact);
    d.arms[1].elbow.rotation.x=charMix(d.arms[1].elbow.rotation.x,-.32,interact);
    d.arms[1].hand.rotation.z=Math.sin(time*11)*.17*interact;d.chest.rotation.x+=interact*.09;
  }
  if(!d.zombie){
    const equipment=actor.equipment||{hand:null,body:null,head:null};
    for(const [id,pieces] of Object.entries(d.wear) as [string,THREE.Group[]][]){
      const visible=id==='helmet'?equipment.head===id:equipment.body===id;
      for(const piece of pieces)piece.visible=visible;
    }
    for(const [id,object] of Object.entries(d.hands) as [string,THREE.Group][]){
      object.visible=type==='throw'?id==='bottle'&&p<.52:type==='heal'||type==='interact'?false:equipment.hand===id;
    }
    if(d.bandage)d.bandage.visible=type==='heal';
    d.halo.visible=true;d.halo.scale.setScalar(.53*(1+Math.sin(time*2)*.025));
  }
}
