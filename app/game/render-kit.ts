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
export function createCharacter(kit:RenderKit,zombie=false,variant=0){
  const {box,ellipsoid,limb,cylinder,contact,ring}=kit;
  const group=new THREE.Group(),body=new THREE.Group();body.position.y=.05;group.add(body);
  const coat=zombie?[0x637263,0x877661,0x9b9b8d][variant%3]:0xb77b47;
  const coatSurface:Surface=zombie?'canvas':'jacket';
  const trousers=zombie?0x424a44:0x2d4140,skin=zombie?0xa2ad8b:0xcfa883;
  contact(group,0,0,1.4,1.0);
  const halo=ring(group,0,0,zombie?.43:.53,zombie?0xb56d56:0xf4bd77,zombie?.3:.8);
  const hips=new THREE.Group();body.add(hips);
  box(hips,0,.72,0,.42,.18,.28,trousers,'denim',0,true);
  const leftLeg=limb(hips,-.14,.78,0,.105,.67,trousers,'denim');
  const rightLeg=limb(hips,.14,.78,0,.105,.67,trousers,'denim');
  box(leftLeg,0,-.83,.085,.21,.15,.37,0x535d56,'rubber',0,true);
  box(rightLeg,0,-.83,.085,.21,.15,.37,0x535d56,'rubber',0,true);
  const chest=new THREE.Group();chest.position.y=.92;body.add(chest);
  ellipsoid(chest,0,.15,0,.29,.36,.19,coat,coatSurface);
  box(chest,0,-.13,0,.51,.3,.3,coat,coatSurface,0,true);
  box(chest,0,-.07,.175,.022,.47,.016,0x494737);
  for(const x of [-.15,.15])box(chest,x,.02,.18,.16,.13,.06,zombie?0x596050:0x986740,coatSurface,0,true);
  const leftArm=limb(chest,-.33,.38,0,.092,.43,coat,coatSurface);
  const rightArm=limb(chest,.33,.38,0,.092,.43,coat,coatSurface);
  const lFore=limb(leftArm,0,-.37,0,.075,.34,zombie?skin:coat,zombie?undefined:coatSurface);
  const rFore=limb(rightArm,0,-.37,0,.075,.34,zombie?skin:coat,zombie?undefined:coatSurface);
  ellipsoid(lFore,0,-.31,.015,.077,.095,.07,zombie?skin:0x3a4235);
  ellipsoid(rFore,0,-.31,.015,.077,.095,.07,zombie?skin:0x3a4235);
  const head=new THREE.Group();head.position.set(0,.57,0);chest.add(head);
  cylinder(head,0,-.13,0,.077,.15,skin);
  ellipsoid(head,0,.11,.008,.167,.222,.157,skin);
  ellipsoid(head,0,.065,.149,.052,.069,.05,skin);
  for(const x of [-.155,.155])ellipsoid(head,x,.085,0,.036,.07,.037,skin);
  if(zombie){
    ellipsoid(head,0,.245,-.045,.169,.115,.146,0x455043);
    for(const x of [-.075,.075]){box(head,x,.105,.147,.063,.049,.029,0x394236);box(head,x,.115,.169,.027,.02,.01,0xeab688,undefined,0x613319)}
    box(head,.025,-.015,.145,.09,.04,.019,0x54473b);leftArm.rotation.x=-1;rightArm.rotation.x=-1.1;lFore.rotation.x=-.2;rFore.rotation.x=-.25;
    chest.rotation.x=.16;head.rotation.z=.1;box(chest,-.15,-.01,.211,.11,.16,.009,0x5a4133);
  }else{
    ellipsoid(head,0,.255,-.035,.175,.13,.15,0x273d38,'canvas');
    box(head,0,.243,.125,.34,.035,.15,0x30483f,'canvas',0,true);
    box(head,0,.09,.15,.29,.065,.025,0x30423c,undefined,0,true);
    box(chest,0,.42,.04,.32,.12,.37,0x626b4b,'canvas',0,true);
    box(chest,0,-.04,-.25,.43,.51,.22,0x4e6554,'canvas',0,true);
    box(chest,0,.34,-.26,.45,.09,.25,0x698064,'canvas',0,true);
    box(chest,0,-.01,-.39,.32,.23,.08,0x3a5343,'canvas',0,true);
    for(const x of [-.20,.2]){box(chest,x,-.11,-.39,.033,.56,.025,0x939477,'canvas');box(chest,x,.01,.183,.044,.42,.042,0x535b43,'canvas')}
    cylinder(chest,-.285,-.1,-.20,.066,.28,0x849b8b);
    box(rFore,0,-.37,.01,.041,.7,.041,0x87968c,undefined,0,true);
    const hook=box(rFore,0,.32,.05,.045,.045,.13,0xadb5a2,undefined,0,true);hook.rotation.x=-.2;
    lFore.rotation.x=-.13;rFore.rotation.x=-.35;
  }
  group.userData={body,chest,head,leftLeg,rightLeg,leftArm,rightArm,halo,zombie,lastX:0,lastY:0,walk:0};
  return group;
}
export function animateCharacter(group:THREE.Group,actor:any,dt:number,playing:boolean,time:number){
  const d=group.userData;
  const traveled=Math.hypot(actor.x-d.lastX,actor.y-d.lastY);
  d.lastX=actor.x;d.lastY=actor.y;
  group.position.set(actor.x,0,actor.y);group.rotation.y=actor.facing||0;
  if(actor.hp===0){d.body.rotation.z=-Math.PI/2;d.body.position.y=.24;d.halo.visible=false;return;}
  const moving=playing&&traveled>.0001&&traveled<.5;
  if(moving)d.walk+=traveled*(d.zombie?7:9);
  const swing=moving?Math.sin(d.walk):0;
  d.leftLeg.rotation.x=swing*(d.zombie?.25:.5);d.rightLeg.rotation.x=-swing*(d.zombie?.25:.5);
  d.body.position.y=.05+(moving?Math.abs(Math.cos(d.walk))*.035:0);
  d.body.rotation.z=d.zombie&&moving?swing*.045:0;
  d.leftArm.rotation.x=d.zombie?-1+swing*.13:-swing*.28;
  d.rightArm.rotation.x=d.zombie?-1.1-swing*.13:swing*.28-.15;
  if(playing&&actor.attack>.4)d.rightArm.rotation.x=-1.6+Math.sin((.7-actor.attack)*10)*1.1;
  if(!d.zombie){const s=.53*(1+Math.sin(time*2)*.035);d.halo.scale.setScalar(s);}
}
