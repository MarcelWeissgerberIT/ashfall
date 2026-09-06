'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const COLORS={orange:0xf3a14d,green:0xaac79e,concrete:0x535e58,rust:0x71543f};
export default function Scene({game,onHover,zoom}:{game:any;onHover:(v:any)=>void;zoom:number}){
 const host=useRef<HTMLDivElement>(null);const sceneRef=useRef<any>(null);const hoverRef=useRef(onHover);hoverRef.current=onHover;
 useEffect(()=>{if(sceneRef.current){sceneRef.current.camera.zoom=zoom;sceneRef.current.camera.updateProjectionMatrix()}},[zoom]);
 useEffect(()=>{
  if(!host.current)return;let disposed=false,frame=0,last=0,lastHover='';
  const hostNode=host.current;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  renderer.domElement.setAttribute('aria-label','Isometrische Spielkarte. Klicke auf den Boden zum Bewegen und auf Gegenstände zum Interagieren.');
  hostNode.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x111b1c);scene.fog=new THREE.FogExp2(0x111b1c,.017);
  const camera=new THREE.OrthographicCamera(-18,18,15,-15,.1,150);camera.position.set(28,31,28);camera.lookAt(0,0,0);camera.zoom=zoom;
  sceneRef.current={camera};
  scene.add(new THREE.HemisphereLight(0xc4e0d8,0x273229,2));
  const sun=new THREE.DirectionalLight(0xd3d9ba,3.3);sun.position.set(-10,23,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:.5,far:70});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;scene.add(sun);
  const cool=new THREE.DirectionalLight(0x77b9c8,1);cool.position.set(12,8,-15);scene.add(cool);
  const world=new THREE.Group();scene.add(world);
  let level=-1;let terrain=new THREE.Group();let objectGroup=new THREE.Group();let actors=new THREE.Group();let deco=new THREE.Group();let effectGroup=new THREE.Group();
  const meshes=new Map<string,THREE.Group>();let player:any;let pickables:THREE.Object3D[]=[];let tilePlane:THREE.Mesh;
  const geometries:THREE.BufferGeometry[]=[];const mats:THREE.Material[]=[];const materialCache=new Map<string,THREE.MeshStandardMaterial>();
  const mat=(color:number,emissive=0,transparent=false)=>{const key=`${color}-${emissive}-${transparent}`;if(!materialCache.has(key)){const m=new THREE.MeshStandardMaterial({color,roughness:.88,metalness:.06,emissive,emissiveIntensity:emissive?1.8:0,transparent,opacity:transparent?.55:1});materialCache.set(key,m);mats.push(m)}return materialCache.get(key)!};
  const box=(group:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,color:number,glow=0)=>{const geo=new THREE.BoxGeometry(w,h,d);geometries.push(geo);const m=new THREE.Mesh(geo,mat(color,glow));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m};
  const cylinder=(group:THREE.Group,x:number,y:number,z:number,r:number,h:number,color:number,top?:number)=>{const geo=new THREE.CylinderGeometry(top??r,r,h,8);geometries.push(geo);const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y+h/2,z);m.castShadow=true;group.add(m);return m};
  const label=(group:THREE.Object3D,text:string,x:number,y:number,z:number,size=1.3,color='#e6dec2',bg=false)=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d')!;if(bg){ctx.fillStyle='rgba(14,23,22,.88)';ctx.fillRect(0,0,512,128)}ctx.fillStyle=color;ctx.font='bold 54px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const tex=new THREE.CanvasTexture(canvas);const material=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});mats.push(material);const s=new THREE.Sprite(material);s.position.set(x,y,z);s.scale.set(size*4,size,1);group.add(s);return s};
  const groundText=(group:THREE.Group,text:string,x:number,z:number,w:number,h:number,color='#c0b58c')=>{const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.font='900 135px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128);const tex=new THREE.CanvasTexture(c);const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.58,depthWrite:false});mats.push(m);const geo=new THREE.PlaneGeometry(w,h);geometries.push(geo);const p=new THREE.Mesh(geo,m);p.rotation.x=-Math.PI/2;p.position.set(x,.025,z);group.add(p)};
  const ringGeo=new THREE.RingGeometry(.7,1,24);geometries.push(ringGeo);const ringMaterials=new Map<number,THREE.MeshBasicMaterial>();
  const dot=(group:THREE.Group,x:number,y:number,z:number,r:number,color:number)=>{if(!ringMaterials.has(color)){const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false});ringMaterials.set(color,material);mats.push(material)}const m=new THREE.Mesh(ringGeo,ringMaterials.get(color));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.scale.setScalar(r);m.userData.baseRadius=r;group.add(m);return m};
  const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
  function character(zombie=false){const g=new THREE.Group();const body=new THREE.Group();g.add(body);
   box(body,-.14,.08,0,.2,.55,.23,zombie?0x313e36:0x263738);box(body,.14,.08,0,.2,.55,.23,zombie?0x29332e:0x263738);
   box(body,-.14,.04,.07,.24,.15,.36,0x202825);box(body,.14,.04,.07,.24,.15,.36,0x202825);
   box(body,0,.6,0,.58,.57,.35,zombie?0x566b46:0xc1804c);box(body,0,.76,-.24,.39,.4,.25,zombie?0x403f2d:0x3e5149);
   const arm1=box(body,-.38,.63,zombie?.16:0,.18,.5,.2,zombie?0x59684d:0xa56f41);const arm2=box(body,.38,.63,zombie?.16:0,.18,.5,.2,zombie?0x637254:0xa56f41);
   if(zombie){arm1.rotation.x=-.9;arm2.rotation.x=-.8}else {box(body,.4,.45,.15,.065,.55,.065,0xa7aca3);box(body,.4,.97,.19,.065,.06,.16,0xc9cfc2)}
   box(body,0,1.17,0,.37,.35,.33,zombie?0x8c9b72:0xc7a784);if(!zombie){box(body,0,1.43,-.03,.43,.12,.37,0x344641);box(body,0,1.28,.18,.32,.11,.07,0x31413c)}else {box(body,-.11,1.36,.174,.06,.04,.016,0xe8a867,0xbc5530);box(body,.11,1.36,.174,.06,.04,.016,0xe8a867,0xbc5530)}
   dot(g,0,.035,0,zombie?.4:.52,zombie?0x935e4d:COLORS.orange);g.userData.body=body;return g;
  }
  function makeObject(e:any){const g=new THREE.Group();g.position.set(e.x,0,e.y);g.userData.entity=e;const w=e.w||1,h=e.h||1;
   if(e.type==='prop'){
    if(e.style==='wall'){
     for(let i=0;i<w;i++)for(let j=0;j<h;j++){const height=game.level===1?1.35:(e.y<2?2.6:1.75)+hash(e.x+i,e.y+j)*.55;box(g,i,0,j,.98,height,.98,hash(i,j)>.5?0x536059:0x5b655b);box(g,i,height,j,1.04,.1,1.04,0x677065);if((i+j)%3===0){box(g,i,.55,j+.502,.92,.05,.025,0x343e39)}}
    }else if(e.style==='barrier'){
     for(let i=0;i<w;i++)for(let j=0;j<h;j++){box(g,i,0,j,.96,.35,.9,0x6a7162);box(g,i,.35,j,.65,.55,.7,0x7f8270);const stripe=box(g,i,.42,j+.365,.19,.4,.014,(i+j)%2?0x333c34:0xbd954e);stripe.rotation.z=-.3;}
    }else if(e.style==='car'){
     box(g,.5,.28,1,1.65,.5,2.75,0x535e4c);box(g,.5,.78,1.1,1.4,.55,1.4,0x645f49);box(g,.5,.86,.37,1.22,.37,.045,0x263f3d);box(g,.5,.86,1.82,1.22,.35,.04,0x233432);box(g,.5,.28,-.4,1.7,.18,.1,0x383d33);for(const x of [-.32,1.32])for(const y of [.25,1.95]){const wheel=cylinder(g,x,.08,y,.33,.22,0x1c2625);wheel.rotation.z=Math.PI/2;wheel.position.y=.32}box(g,.05,.65,-.31,.26,.1,.02,0xb9b483);box(g,.95,.65,-.31,.26,.1,.02,0xb9b483);
    }else if(e.style==='vent'){
     box(g,(w-1)/2,0,(h-1)/2,w-.1,1.05,h-.1,0x596862);box(g,(w-1)/2,1.05,(h-1)/2,w+.02,.12,h+.02,0x78837a);for(let i=0;i<7;i++)box(g,(w-1)/2,.26+i*.095,-.505,w-.4,.04,.04,0x283b39);cylinder(g,(w-1)/2,1.18,(h-1)/2,.48,.13,0x334440);
    }else if(e.style==='tank'){
     cylinder(g,.5,.6,.5,.92,2.1,0x708076);cylinder(g,.5,2.7,.5,.95,.16,0x8b9687,.65);for(const x of [0,1])for(const z of [0,1])box(g,x,0,z,.12,.65,.12,0x354942);
    }else if(e.style==='bed'){
     box(g,0,.4,1,.87,.15,2.7,0x62746d);box(g,0,.55,1,.78,.23,2.5,0x969c86);box(g,0,.78,.15,.65,.13,.42,0xc0c4ad);for(const z of [0,2])box(g,0,0,z,.75,.45,.1,0x34463f);
    }else if(e.style==='desk'){
     box(g,(w-1)/2,.7,0,w-.1,.16,.92,0x88918a);box(g,0,0,0,.15,.7,.75,0x4b5f58);box(g,w-1,0,0,.15,.7,.75,0x4b5f58);box(g,.6,.86,0,.6,.5,.2,0x34463e);box(g,.6,.93,.115,.48,.32,.01,0x8cac8c,0x304c33);
    }else if(e.style==='tree'){
     cylinder(g,0,0,0,.15,3,0x454c3b,.055);const branch=cylinder(g,0,1.7,0,.09,1.2,0x454c3b,.025);branch.rotation.z=.85;branch.position.x=.35;
    }else {
     for(let i=0;i<8;i++){const geo=new THREE.DodecahedronGeometry(.24+hash(i,e.x)*.5,0);geometries.push(geo);const m=new THREE.Mesh(geo,mat(i%2?0x657066:0x48554b));m.position.set(hash(i,e.y)*(w-.3),.2+hash(i,33)*.25,hash(i,e.x)*(h-.3));m.rotation.set(i,.4,i*.7);m.castShadow=true;g.add(m)}
    }
   }else if(e.type==='container'){
    box(g,0,0,0,.86,.65,.8,0x686a4a);box(g,0,.65,0,.92,.12,.87,0x8b8b62);for(const x of [-.29,.29]){box(g,x,0,0,.07,.67,.82,0x35463b);box(g,x,.77,0,.07,.015,.88,0xb1a776)}box(g,0,.3,.415,.24,.18,.02,0xc7b577);
   }else if(e.type==='generator'){
    box(g,0,0,0,1,.18,1.1,0x273b35);box(g,0,.18,0,.86,.72,.86,0x8a8451);box(g,0,.4,.44,.55,.26,.025,0x263832);box(g,.18,.72,.46,.09,.07,.02,0xe3984c,0x74431b);cylinder(g,-.35,.9,-.2,.06,.75,0x31423c);
   }else if(e.type==='door'||e.type==='exit'&&game.level<2){
    box(g,-.66,0,0,.23,2.4,.48,0x7d8270);box(g,.66,0,0,.23,2.4,.48,0x7d8270);box(g,0,2.4,0,1.57,.2,.5,0x8c917b);
    const door=box(g,0,0,0,1.1,2.35,.2,0x465b52);door.userData.door=true;g.userData.door=door;
    for(let i=0;i<5;i++)box(g,-.48+i*.23,2.08,.11,.1,.22,.015,i%2?0xc7974c:0x202f28);
    box(g,.8,1.15,.27,.22,.3,.13,0x253a32);box(g,.8,1.27,.345,.1,.08,.015,0xf5af63,0xb16a25);
    label(g,e.type==='door'?'LAB / 02':game.level===0?'BUNKER / 04':'DACH / 07',0,2.96,0,.38,'#c8d3bd',true);
   }else if(e.type==='radio'){
    box(g,0,0,0,.86,.6,.65,0x667158);box(g,0,.6,0,.92,.1,.73,0xa6a07c);box(g,0,.15,.34,.64,.28,.025,0x233c32);box(g,.16,.26,.36,.11,.1,.01,0x89c394,0x34854d);cylinder(g,-.27,.7,-.2,.035,2.9,0x97a695);box(g,-.27,2.5,-.2,1.4,.045,.045,0x97a695);box(g,-.27,2,-.2,.8,.045,.045,0x97a695);
   }else if(e.type==='exit'){
    dot(g,0,.04,0,1.5,0x98bd93);groundText(g,'H',0,0,2,1.6,'#d3d6b7');
   }else if(e.type==='note'){
    box(g,0,.02,0,.5,.02,.4,0xc0b891);
   }else if(e.type==='item'){
    const type=e.item;
    if(type==='chair'){box(g,0,.45,0,.65,.1,.65,0x6b8166);box(g,0,.6,-.29,.65,.6,.08,0x60745d);for(const x of [-.27,.27])for(const z of [-.27,.27])box(g,x,0,z,.06,.45,.06,0x9ba18b)}
    else if(type==='tire'){const geo=new THREE.TorusGeometry(.33,.14,6,12);geometries.push(geo);const m=new THREE.Mesh(geo,mat(0x23302d));m.rotation.x=Math.PI/2;m.position.y=.16;g.add(m)}
    else if(type==='bottle'){cylinder(g,0,.02,0,.115,.34,0x76977b);cylinder(g,0,.36,0,.055,.16,0x96b093);}
    else if(type==='medkit'){box(g,0,.04,0,.45,.2,.4,0xc4c7a8);box(g,0,.245,0,.09,.015,.27,0xa6533a);box(g,0,.245,0,.27,.015,.09,0xa6533a)}
    else if(type==='sample'){cylinder(g,0,0,0,.2,.55,0x8bcbb3);cylinder(g,0,.55,0,.23,.1,0xc2d3bb);box(g,0,.1,.17,.2,.25,.05,0x7ae4b0,0x228451)}
    else if(type==='toolbox'){box(g,0,.02,0,.6,.4,.45,0x917c52);box(g,0,.42,0,.28,.09,.05,0x333f36)}
    else if(type==='scrap'){for(let i=0;i<4;i++){const b=box(g,(i-2)*.09,.02+i*.06,0,.2,.08,.6,0x90977d);b.rotation.y=i*.8}}
    else if(type==='ration'){cylinder(g,0,.02,0,.2,.33,0x8e9868)}
    else {box(g,0,.03,0,.35,.3,.32,type==='fuel'?0xa49455:0xa8b19a)}
   }
   if(e.type!=='prop'){const r=dot(g,0,.03,0,.53,['generator','exit','radio','door'].includes(e.type)?0xdbab60:0x9dba98);r.material=r.material.clone();mats.push(r.material);g.userData.ring=r;}
   g.traverse(o=>{if((o as THREE.Mesh).isMesh){o.userData.entity=e;pickables.push(o)}});objectGroup.add(g);meshes.set(e.id,g);return g;
  }
  function build(){
   for(const g of [terrain,objectGroup,actors,deco,effectGroup]){world.remove(g)}
   meshes.clear();pickables=[];terrain=new THREE.Group();objectGroup=new THREE.Group();actors=new THREE.Group();deco=new THREE.Group();effectGroup=new THREE.Group();world.add(terrain,objectGroup,actors,deco,effectGroup);
   level=game.level;const [w,h]=game.data.size;world.position.set(-(w-1)/2,0,-(h-1)/2);scene.background=new THREE.Color(level===1?0x111c1b:0x142021);scene.fog=new THREE.FogExp2(level===1?0x111c1b:0x142021,.014);
   box(terrain,(w-1)/2,-.95,(h-1)/2,w+.35,.9,h+.35,0x243630);box(terrain,(w-1)/2,-1.12,(h-1)/2,w+.1,.17,h+.1,0x172927);
   const geo=new THREE.BoxGeometry(.98,.065,.98);geometries.push(geo);const tile=new THREE.InstancedMesh(geo,mat(0xffffff),w*h);tile.receiveShadow=true;const m=new THREE.Matrix4();let idx=0;
   for(let x=0;x<w;x++)for(let y=0;y<h;y++){const n=hash(x,y);m.makeTranslation(x,-.045,y);tile.setMatrixAt(idx,m);const road=level===0&&x>7&&x<14;const col=new THREE.Color(level===1?(n>.8?0x60716a:0x4f6059):road?0x364942:level===2?0x56685e:n>.7?0x63705a:0x53644f);col.multiplyScalar(.91+n*.12);tile.setColorAt(idx++,col)}terrain.add(tile);
   const pgeo=new THREE.PlaneGeometry(w,h);geometries.push(pgeo);tilePlane=new THREE.Mesh(pgeo,new THREE.MeshBasicMaterial({visible:false}));mats.push(tilePlane.material as THREE.Material);tilePlane.rotation.x=-Math.PI/2;tilePlane.position.set((w-1)/2,0,(h-1)/2);terrain.add(tilePlane);
   if(level===0){for(let y=1;y<h;y+=3)box(deco,10.5,.005,y,.12,.013,1.25,0xc3b788);groundText(deco,'QUARANTINE',10.3,17,5.8,.8);groundText(deco,'04',10.3,4,2.2,1.3);for(let y=2;y<h;y+=4){box(deco,7.35,.01,y,.1,.03,2,0xa8a481);box(deco,13.55,.01,y,.1,.03,2,0xa8a481)}}
   if(level===1){groundText(deco,'STATION NULL',4,17,5.7,.8,'#c3c7ab');groundText(deco,'LAB / N–04',14,5,4.2,.8,'#a5c6ba');for(let y=2;y<18;y+=2)box(deco,10.4,.005,y,.08,.018,1.6,0xa59a63)}
   if(level===2){groundText(deco,'EVAC 07',15.5,12,4.3,.8);dot(deco,16,.026,10,2.75,0xb3b18d);for(const x of [13.5,18.5])for(const y of [7.5,12.5]){box(deco,x,0,y,.18,.12,.18,0xe6a558,0xa96721)}}
   // Environmental geometry is also part of the playable scene, rather than a background illustration.
   if(level!==1)for(let i=0;i<100;i++){const x=hash(i,12)*(w-1),y=hash(i,39)*(h-1);if(game.isBlocked(Math.round(x),Math.round(y))||level===0&&x>7&&x<14||level===2&&i>25)continue;const g=new THREE.Group();for(let j=0;j<3;j++){const b=box(g,x+(j-1)*.1,0,y,.035,.13+hash(i,j)*.3,.035,0x65764c);b.rotation.z=(j-1)*.3}deco.add(g)}
   for(const [x,y] of (level===0?[[6,6],[14,3],[18,16]]:level===1?[[1,5],[10,3],[19,12]]:[[2,7],[18,5]])){
    const g=new THREE.Group();box(g,x,0,y,.09,3.2,.09,0x354942);box(g,x+.35,3.13,y,.8,.08,.11,0x4e6356);box(g,x+.7,3.04,y,.3,.06,.23,0xf2b474,0xa97034);const light=new THREE.PointLight(level===1?0xa3dbbe:0xffb661,level===1?14:18,6,2);light.position.set(x+.7,2.7,y);g.add(light);deco.add(g);
   }
   for(const e of game.entities)makeObject(e);
   player=character();actors.add(player);for(const z of game.zombies){const g=character(true);g.userData.entity=z;g.traverse(o=>{if((o as THREE.Mesh).isMesh){o.userData.entity=z;pickables.push(o)}});meshes.set(z.id,g);actors.add(g)}
   label(deco,level===0?'SEKTOR 04':level===1?'STATION NULL':'DACH 07',w/2,-.9,h+.1,.46,'#a0b4a4');
  }
  build();
  const marker=dot(world,game.player.x,.065,game.player.y,.49,COLORS.orange);marker.visible=false;
  const targetLabel=label(scene,'',0,0,0,.45,'#f0e6c9',true);targetLabel.visible=false;
  const pathGroup=new THREE.Group();world.add(pathGroup);let lastPath='';
  const rainCount=260, rainArray=new Float32Array(rainCount*6);for(let i=0;i<rainCount;i++){const x=hash(i,3)*38-19,y=hash(i,12)*18,z=hash(i,8)*38-19;rainArray.set([x,y,z,x-.08,y-.5,z+.03],i*6)}const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArray,3));geometries.push(rainGeo);const rainMat=new THREE.LineBasicMaterial({color:0xa7c6bb,transparent:true,opacity:.13});mats.push(rainMat);const rain=new THREE.LineSegments(rainGeo,rainMat);scene.add(rain);
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let hoverEntity:any=null;let hoverPoint:any=null;
  const pick=(ev:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((ev.clientX-rect.left)/rect.width*2-1,-(ev.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables,false).filter(h=>{const e=h.object.userData.entity;return e&&!e.removed&&e.hp!==0&&h.object.visible});const floor=raycaster.intersectObject(tilePlane);hoverEntity=hits[0]?.object.userData.entity??null;hoverPoint=floor[0]?world.worldToLocal(floor[0].point.clone()):null;return {entity:hoverEntity,point:hoverPoint}};
  const move=(ev:PointerEvent)=>{pick(ev);const id=hoverEntity?.id||'';if(id!==lastHover){lastHover=id;hoverRef.current(hoverEntity)}hostNode.style.cursor=game.throwing?'crosshair':hoverEntity?'pointer':'crosshair';if(hoverPoint){marker.position.set(Math.round(hoverPoint.x),.05,Math.round(hoverPoint.z));marker.visible=!game.isBlocked(Math.round(hoverPoint.x),Math.round(hoverPoint.z))}else marker.visible=false;};
  const click=(ev:PointerEvent)=>{if(ev.button!==0)return;const {entity,point}=pick(ev);if(game.throwing&&point)game.throwBottle(Math.round(point.x),Math.round(point.z));else if(entity)game.select(entity.id);else if(point)game.move(Math.round(point.x),Math.round(point.z));};
  const leave=()=>{marker.visible=false;hoverEntity=null;hoverRef.current(null);lastHover=''};
  renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerdown',click);renderer.domElement.addEventListener('pointerleave',leave);
  const resize=()=>{const width=hostNode.clientWidth,height=hostNode.clientHeight;if(!width||!height)return;renderer.setSize(width,height);const aspect=width/height;const half=Math.max(15,17.2/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(hostNode);resize();
  let levelEntities=game.entities;
  const loop=(now:number)=>{if(disposed)return;const dt=last?Math.min((now-last)/1000,.06):0;last=now;game.tick(dt);if(levelEntities!==game.entities){levelEntities=game.entities;build();lastPath='';}
   player.position.set(game.player.x,0,game.player.y);player.rotation.y=game.player.facing;player.userData.body.position.y=game.path.length&&game.mode==='playing'?Math.sin(now*.016)*.035:0;player.userData.body.rotation.z=game.player.attack>.45?Math.sin((.7-game.player.attack)*14)*.13:0;
   for(const e of game.entities){let g=meshes.get(e.id);if(!g)g=makeObject(e);g.visible=!e.removed;if(g.userData.door)g.userData.door.scale.x=(e.open||e.type==='exit'&&game.generatorOn)?.12:1;if(g.userData.ring){const active=e.type==='exit'&&(game.level===0?game.generatorOn:game.level===1?game.has('sample'):game.signal===0);(g.userData.ring.material as THREE.MeshBasicMaterial).color.setHex(active?0x9ce3ae:hoverEntity?.id===e.id||game.selected?.id===e.id?0xf7c077:0x8ca890);g.userData.ring.scale.setScalar(g.userData.ring.userData.baseRadius*(active?1+Math.sin(now*.004)*.1:1));}
   }
   for(const z of game.zombies){let g=meshes.get(z.id);if(!g){g=character(true);g.traverse(o=>{if((o as THREE.Mesh).isMesh){o.userData.entity=z;pickables.push(o)}});meshes.set(z.id,g);actors.add(g)}g.position.set(z.x,z.hp<=0?.12:0,z.y);g.rotation.y=z.facing||0;g.rotation.z=z.hp<=0?Math.PI/2:Math.sin(now*.004+z.home.x)*.035;g.scale.setScalar(z.hp<=0?.65:1);}
   const pathKey=game.path.map((p:any)=>`${p.x}:${p.y}`).join('|');if(pathKey!==lastPath){lastPath=pathKey;pathGroup.clear();for(const p of game.path){dot(pathGroup,p.x,.048,p.y,.065,0xd9b780)}}
   effectGroup.clear();for(const e of game.effects){const r=dot(effectGroup,e.x,.055,e.y,e.type==='bottle'?.7+Math.sin(now*.005)*.1:e.type==='hit'?.65:.8,e.type==='heal'?0x9cc99b:e.type==='hit'?0xdc7651:0xdfb274);(r.material as THREE.MeshBasicMaterial).opacity=Math.min(.8,e.life)}
   if(hoverEntity&&!hoverEntity.removed&&hoverEntity.hp!==0){const p=world.localToWorld(new THREE.Vector3(hoverEntity.x,hoverEntity.type==='prop'?3:2.2,hoverEntity.y));targetLabel.position.copy(p);const material=targetLabel.material as THREE.SpriteMaterial;const canvas=(material.map!.image as HTMLCanvasElement);const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,512,128);ctx.fillStyle='rgba(11,21,19,.92)';ctx.fillRect(0,0,512,128);ctx.fillStyle=hoverEntity.type==='zombie'?'#eda887':'#f1e4c6';ctx.font='bold 38px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(hoverEntity.name,256,64,488);material.map!.needsUpdate=true;targetLabel.visible=true;}else targetLabel.visible=false;
   rain.visible=game.level!==1;if(game.mode==='playing'&&rain.visible){for(let i=0;i<rainCount;i++){rainArray[i*6+1]-=dt*10;rainArray[i*6+4]-=dt*10;if(rainArray[i*6+1]<-.5){rainArray[i*6+1]=18;rainArray[i*6+4]=17.5}}rainGeo.attributes.position.needsUpdate=true}
   renderer.render(scene,camera);frame=requestAnimationFrame(loop);
  };frame=requestAnimationFrame(loop);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerdown',click);renderer.domElement.removeEventListener('pointerleave',leave);geometries.forEach(g=>g.dispose());mats.forEach(m=>{if((m as THREE.SpriteMaterial).map)(m as THREE.SpriteMaterial).map!.dispose();m.dispose()});renderer.dispose();renderer.domElement.remove();sceneRef.current=null;};
 },[game]);
 return <div className="scene-canvas" ref={host}/>;
}
