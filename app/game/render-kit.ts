import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ART } from './art';
export type Surface = keyof typeof ART.surfaces;
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
      if(surface)tint.lerp(new THREE.Color(0xffffff),.42);
      materials.set(key,new THREE.MeshStandardMaterial({
        color:tint,map:surface?maps[surface]:null,bumpMap:surface?detailMaps[surface]:null,bumpScale:surface==='paving'?.085:surface?.025:0,roughness:surface==='steel'?.69:.9,
        metalness:surface==='steel'?.28:.025,emissive:glow,emissiveIntensity:glow?2.2:0,
      }));
    }
    return materials.get(key)!;
  };
  const geometry=(key:string,make:()=>THREE.BufferGeometry)=>{
    if(!geometries.has(key))geometries.set(key,make());return geometries.get(key)!;
  };
  const boxGeometry=(w:number,h:number,d:number,rounded=false)=>geometry(`box:${w}:${h}:${d}:${rounded}`,()=>{
    const g=rounded?new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.16):new THREE.BoxGeometry(w,h,d);
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){
      const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));
      uv.setXY(i,(nx>.75?p.getZ(i):p.getX(i))/2.5,(ny>.75?p.getZ(i):p.getY(i))/2.5);
    }
    return g;
  });
  function box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,color:number,surface?:Surface,glow=0,rounded=false){
    const mesh=new THREE.Mesh(boxGeometry(w,h,d,rounded),material(color,surface,glow));
    mesh.position.set(x,y+h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(parent:THREE.Object3D,x:number,y:number,z:number,r:number,h:number,color:number,top=r,surface?:Surface){
    const mesh=new THREE.Mesh(geometry(`cyl:${r}:${top}:${h}`,()=>new THREE.CylinderGeometry(top,r,h,12)),material(color,surface));
    mesh.position.set(x,y+h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function ellipsoid(parent:THREE.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number){
    const mesh=new THREE.Mesh(geometry('sphere',()=>new THREE.SphereGeometry(1,12,10)),material(color));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function limb(parent:THREE.Object3D,x:number,y:number,z:number,radius:number,length:number,color:number){
    const joint=new THREE.Group();joint.position.set(x,y,z);parent.add(joint);
    const shape=new THREE.Mesh(geometry(`capsule:${radius}:${length}`,()=>new THREE.CapsuleGeometry(radius,Math.max(.01,length-radius*2),4,8)),material(color));
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
  const trousers=zombie?0x424a44:0x2d4140,skin=zombie?0xa2ad8b:0xcfa883;
  contact(group,0,0,1.4,1.0);
  const halo=ring(group,0,0,zombie?.43:.53,zombie?0xb56d56:0xf4bd77,zombie?.3:.8);
  const hips=new THREE.Group();body.add(hips);
  box(hips,0,.72,0,.42,.18,.28,trousers,undefined,0,true);
  const leftLeg=limb(hips,-.14,.78,0,.105,.67,trousers);
  const rightLeg=limb(hips,.14,.78,0,.105,.67,trousers);
  box(leftLeg,0,-.83,.085,.21,.15,.37,0x202b29,undefined,0,true);
  box(rightLeg,0,-.83,.085,.21,.15,.37,0x202b29,undefined,0,true);
  const chest=new THREE.Group();chest.position.y=.92;body.add(chest);
  ellipsoid(chest,0,.15,0,.29,.36,.19,coat);
  box(chest,0,-.13,0,.51,.3,.3,coat,undefined,0,true);
  box(chest,0,-.07,.175,.022,.47,.016,0x494737);
  for(const x of [-.15,.15])box(chest,x,.02,.18,.16,.13,.06,zombie?0x596050:0x986740,undefined,0,true);
  const leftArm=limb(chest,-.33,.38,0,.092,.43,coat);
  const rightArm=limb(chest,.33,.38,0,.092,.43,coat);
  const lFore=limb(leftArm,0,-.37,0,.075,.34,zombie?skin:coat);
  const rFore=limb(rightArm,0,-.37,0,.075,.34,zombie?skin:coat);
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
    ellipsoid(head,0,.255,-.035,.175,.13,.15,0x273d38);
    box(head,0,.243,.125,.34,.035,.15,0x30483f,undefined,0,true);
    box(head,0,.09,.15,.29,.065,.025,0x30423c,undefined,0,true);
    box(chest,0,.42,.04,.32,.12,.37,0x626b4b,undefined,0,true);
    box(chest,0,-.04,-.25,.43,.51,.22,0x4e6554,undefined,0,true);
    box(chest,0,.34,-.26,.45,.09,.25,0x698064,undefined,0,true);
    box(chest,0,-.01,-.39,.32,.23,.08,0x3a5343,undefined,0,true);
    for(const x of [-.20,.2]){box(chest,x,-.11,-.39,.033,.56,.025,0x939477);box(chest,x,.01,.183,.044,.42,.042,0x535b43)}
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
