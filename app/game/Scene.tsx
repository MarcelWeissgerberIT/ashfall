'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRenderKit, createCharacter, animateCharacter, type Surface } from './render-kit';
import { tutorialTarget } from './tutorial.mjs';
import { createMapCameraControls } from './camera-controls';
import { buildWall, buildBarrier, buildVehicle } from './world-props';
import { buildPickup } from './loot-assets';
import { translate } from './i18n';
import { createAtmosphere } from './atmosphere';
import { createPuppy, animatePuppy } from './puppy';
import { buildSectorDetails } from './sector-details';
import {createHelicopter,animateHelicopter} from './helicopter';
const COLORS={orange:0xf3bb78};
export default function Scene({game,onHover,zoom,onZoomChange,viewReset,rotation,following,onFollowChange}:{game:any;onHover:(v:any)=>void;zoom:number;onZoomChange:(zoom:number)=>void;viewReset:number;rotation:number;following:boolean;onFollowChange:(v:boolean)=>void}){
 const host=useRef<HTMLDivElement>(null),sceneRef=useRef<ReturnType<typeof createMapCameraControls>|null>(null),hoverRef=useRef(onHover),zoomRef=useRef(onZoomChange);hoverRef.current=onHover;zoomRef.current=onZoomChange;
 const followRef=useRef(onFollowChange);followRef.current=onFollowChange;const rotationRef=useRef(rotation);
 useEffect(()=>{sceneRef.current?.rotate(rotation-rotationRef.current);rotationRef.current=rotation},[rotation]);
 useEffect(()=>{sceneRef.current?.setFollowing(following)},[following]);
 useEffect(()=>{sceneRef.current?.setZoom(zoom)},[zoom]);
 useEffect(()=>{sceneRef.current?.reset()},[viewReset]);
 useEffect(()=>{
  if(!host.current)return;
  let disposed=false,frame=0,last=0,lastHover='',lastPath='',currentSurface:Surface|undefined;
  const hostNode=host.current;
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','Isometric game map. Click to move or interact. Use the mouse wheel or pinch with two fingers to zoom. Drag with the right mouse button or one finger to pan. Plus and minus zoom; 0 shows the whole map.');
  hostNode.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x172c30);scene.fog=new THREE.FogExp2(0x172c30,.021);
  const camera=new THREE.OrthographicCamera(-18,18,14,-14,.1,160);const cameraOffset=new THREE.Vector3(28,33,28);const cameraTarget=new THREE.Vector3(0,0,0);
  camera.position.copy(cameraOffset);camera.lookAt(cameraTarget);camera.zoom=zoom;
  const kit=createRenderKit(renderer);
  const ambient=new THREE.HemisphereLight(0xb4d9df,0x31433a,1.4);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xffdcb3,3.0);sun.position.set(-11,22,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:.5,far:75});sun.shadow.bias=-.0002;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x78becb,1.25);fill.position.set(15,8,-12);scene.add(fill);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.35;room.dispose();pmrem.dispose();
  const renderTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType});renderTarget.samples=Math.min(4,renderer.capabilities.maxSamples);
  const composer=new EffectComposer(renderer,renderTarget);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.27,.5,1.35);composer.addPass(bloom);const output=new OutputPass();composer.addPass(output);
  const world=new THREE.Group();scene.add(world);
  let atmosphere:ReturnType<typeof createAtmosphere>|undefined;
  let renderedLanguage='',level=-1,terrain=new THREE.Group(),objectGroup=new THREE.Group(),actors=new THREE.Group(),deco=new THREE.Group(),skyline=new THREE.Group();
  let helicopter:THREE.Group|undefined;
  const meshes=new Map<string,THREE.Group>(),pickables:THREE.Object3D[]=[];
  let puppy:THREE.Group,player:THREE.Group,tilePlane:THREE.Mesh,marker:THREE.Mesh|undefined,hoverEntity:any=null,hoverPoint:THREE.Vector3|null=null;
  let pathDots:THREE.InstancedMesh|undefined;const effects=new Map<any,THREE.Mesh>();const effectRoot=new THREE.Group();world.add(effectRoot);
  const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
  const mat=(color:number,glow=0)=>kit.material(color,currentSurface,glow);
  const box=(g:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,c:number,glow=0)=>kit.box(g,x,y,z,w,h,d,c,currentSurface,glow);
  const cylinder=(g:THREE.Object3D,x:number,y:number,z:number,r:number,h:number,c:number,top?:number)=>kit.cylinder(g,x,y,z,r,h,c,top??r,currentSurface);
  const dot=(g:THREE.Object3D,x:number,y:number,z:number,r:number,c:number)=>{const m=kit.ring(g,x,z,r,c);m.position.y=y;return m};
  const label=(g:THREE.Object3D,text:string,x:number,y:number,z:number,size=1.3,color='#e6dec2',bg=false)=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
    const ctx=canvas.getContext('2d')!;if(bg){ctx.fillStyle='rgba(12,24,22,.9)';ctx.fillRect(0,0,512,96)}ctx.fillStyle=color;ctx.font='500 40px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(translate(text,game.language),256,48,490);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});const s=new THREE.Sprite(material);s.position.set(x,y,z);s.scale.set(size*4,size*.75,1);g.add(s);return s;
  };
  const groundText=(g:THREE.Object3D,text:string,x:number,z:number,w:number,h:number,color='#c0b58c')=>{
    const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.font='900 135px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(translate(text,game.language),512,128,990);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.5,depthWrite:false});kit.extras.add(m);
    const p=new THREE.Mesh(kit.geometry('unit-plane',()=>new THREE.PlaneGeometry(1,1)),m);p.scale.set(w,h,1);p.rotation.x=-Math.PI/2;p.position.set(x,.017,z);p.userData.noPick=true;g.add(p);
  };
  function makeObject(e:any){const g=new THREE.Group();g.position.set(e.x,0,e.y);g.userData.entity=e;const w=e.w||1,h=e.h||1;
   currentSurface=e.style?(['wall','barrier','rubble'].includes(e.style)?'concrete':e.style==='car'?'carPaint':e.style==='tree'?'bark':['vent','tank','desk','bed'].includes(e.style)?'brushedSteel':undefined):['generator','door','radio','exit'].includes(e.type)?'brushedSteel':undefined;
   if(e.style&&e.style!=='tree')kit.contact(g,(w-1)/2,(h-1)/2,w+.65,h+.6);
   else if(!['exit','note'].includes(e.type))kit.contact(g,0,0,1.25,1.1);
   if(e.style){
    if(e.style==='wall'){
     buildWall(kit,g,e,game.level);
    }else if(e.style==='barrier'){
     buildBarrier(kit,g,e);
    }else if(e.style==='car'){
     buildVehicle(kit,g,e);
    }else if(e.style==='vent'){
     kit.box(g,(w-1)/2,0,(h-1)/2,w-.1,1.05,h-.1,game.level===1?0x879d9a:0xb19875,game.level===1?'brushedSteel':'corrugated');box(g,(w-1)/2,1.05,(h-1)/2,w+.02,.12,h+.02,0xb6b9a8);for(let i=0;i<7;i++)kit.box(g,(w-1)/2,.26+i*.095,-.505,w-.4,.04,.04,0x283b39);cylinder(g,(w-1)/2,1.18,(h-1)/2,.48,.13,0x334440);
    }else if(e.style==='tank'){
     cylinder(g,.5,.6,.5,.92,2.1,0x708076);cylinder(g,.5,2.7,.5,.95,.16,0x8b9687,.65);for(const x of [0,1])for(const z of [0,1])box(g,x,0,z,.12,.65,.12,0x354942);
    }else if(e.style==='bed'){
     box(g,0,.4,1,.87,.15,2.7,0x879d94);kit.box(g,0,.55,1,.78,.23,2.5,0xb8b9a4,'vinyl',0,true);kit.box(g,0,.78,.15,.65,.13,.42,0xe0dfc7,'vinyl',0,true);kit.box(g,0,.786,1.6,.79,.025,1.1,0x8d9d85,'canvas');for(const z of [0,2])box(g,0,0,z,.75,.45,.1,0x6f8075);
    }else if(e.style==='desk'){
     box(g,(w-1)/2,.7,0,w-.1,.16,.92,0xb7c1b6);box(g,0,0,0,.15,.7,.75,0x7f9388);box(g,w-1,0,0,.15,.7,.75,0x7f9388);kit.box(g,.6,.86,0,.6,.5,.2,0x44564d,'carPaint');kit.box(g,.6,.93,.115,.48,.32,.01,0x8cac8c,undefined,0x304c33);kit.box(g,.65,.869,.3,.58,.014,.2,0x707d6c,'rubber');
    }else if(e.style==='tree'){
     cylinder(g,0,0,0,.15,3,0x454c3b,.055);const branch=cylinder(g,0,1.7,0,.09,1.2,0x454c3b,.025);branch.rotation.z=.85;branch.position.x=.35;
    }else {
     for(let i=0;i<8;i++){const geo=kit.geometry(`rubble:${i}:${e.x}`,()=>new THREE.DodecahedronGeometry(.24+hash(i,e.x)*.5,0));const m=new THREE.Mesh(geo,mat(i%2?0x657066:0x48554b));m.position.set(hash(i,e.y)*(w-.3),.2+hash(i,33)*.25,hash(i,e.x)*(h-.3));m.rotation.set(i,.4,i*.7);m.castShadow=true;g.add(m)}
    }
    if(e.type==='container'&&e.style!=='car'){
     const drawer=new THREE.Group();drawer.position.set(e.style==='desk'?.25:0,e.style==='desk'?.25:.06,e.style==='desk'?.25:1.75);g.add(drawer);g.userData.drawer=drawer;g.userData.drawerClosedZ=drawer.position.z;
     kit.box(drawer,0,0,0,.64,.05,.65,0x5b6b51,'wood');for(const x of [-.31,.31])kit.box(drawer,x,.04,0,.04,.19,.65,0x8e9a79,'brushedSteel');kit.box(drawer,0,.04,.31,.64,.22,.045,0x96a187,'brushedSteel');kit.box(drawer,0,.12,.35,.22,.035,.04,0xc3bd9e,'brushedSteel');
     const cargo=new THREE.Group();cargo.position.set(0,.06,0);drawer.add(cargo);g.userData.cargo=cargo;g.userData.cargoScale=.4;
    }
   }else if(e.type==='container'){
    const shell:Surface=e.id==='wreck'?'carPaint':['locker','medical','roof-aid'].includes(e.id)?'brushedSteel':'wood';
    const color=e.id==='medical'||e.id==='roof-aid'?0xcbd3c5:0x9ca28d;
    kit.box(g,0,0,0,.86,.1,.8,0x384d3e,shell);
    for(const x of [-.405,.405])kit.box(g,x,.1,0,.05,.55,.8,color,shell);
    for(const z of [-.375,.375])kit.box(g,0,.1,z,.76,.55,.05,color,shell);
    const cargo=new THREE.Group();cargo.position.y=.36;g.add(cargo);g.userData.cargo=cargo;g.userData.cargoScale=.48;
    const lid=new THREE.Group();lid.position.set(0,.65,-.4);g.add(lid);kit.box(lid,0,0,.4,.92,.12,.87,color,shell);g.userData.lid=lid;
    if(e.id==='wreck'){
      kit.box(g,0,.08,.415,.94,.12,.11,0xa1aa97,'brushedSteel');
      for(const x of [-.3,.3]){kit.box(g,x,.4,.415,.21,.13,.03,0x9f503b);kit.box(g,x,.41,.435,.09,.09,.012,0xd49d59);}
      kit.box(g,0,.23,.417,.29,.09,.023,0xb9c0a7);kit.box(lid,0,.125,.72,.25,.02,.035,0x879581,'brushedSteel');
    }else{
      for(const x of [-.29,.29]){kit.box(g,x,0,0,.07,.65,.82,0x626c58,'brushedSteel');kit.box(lid,x,.12,.4,.07,.015,.88,0x9b9b76,'brushedSteel')}
      kit.box(g,0,.3,.415,.24,.18,.02,0xc7b577,'brushedSteel');
    }
    if(e.id==='roof-store')kit.box(lid,0,.136,.4,.48,.035,.76,0x63745d,'canvas');
    if(e.id==='medical'||e.id==='roof-aid'){kit.box(lid,0,.137,.4,.06,.014,.25,0x984c37);kit.box(lid,0,.137,.4,.25,.014,.06,0x984c37);}
   }else if(e.type==='generator'){
    box(g,0,0,0,1,.18,1.1,0x6b7f6d);kit.box(g,0,.18,0,.86,.72,.86,0xc3b276,'carPaint');kit.box(g,0,.4,.44,.55,.26,.025,0x616d5e,'rubber');kit.box(g,.18,.72,.46,.09,.07,.02,0xe3984c,undefined,0x74431b);cylinder(g,-.35,.9,-.2,.06,.75,0x829489);
   }else if(e.type==='door'||e.type==='exit'&&game.level<2){
    box(g,-.66,0,0,.23,2.4,.48,0x7d8270);box(g,.66,0,0,.23,2.4,.48,0x7d8270);box(g,0,2.4,0,1.57,.2,.5,0x8c917b);
    const door=new THREE.Group();g.add(door);door.userData.door=true;g.userData.door=door;
    kit.box(door,0,0,0,1.1,2.35,.2,0xafb3a0,e.type==='door'?'brushedSteel':'corrugated');
    for(const z of [-.112,.112]){kit.box(door,0,.14,z,.97,.06,.025,0x7f9488,'brushedSteel');kit.box(door,0,2.13,z,.97,.06,.025,0x7f9488,'brushedSteel');kit.box(door,.33,.97,z,.07,.35,.07,0xb4baa4,'brushedSteel');if(e.type==='door')kit.box(door,0,1.55,z,.58,.36,.025,0xabc5bc,'glass');}
    for(let i=0;i<5;i++)box(g,-.48+i*.23,2.42,.26,.1,.22,.015,i%2?0xc7974c:0x202f28);
    box(g,.8,1.15,.27,.22,.3,.13,0x253a32);box(g,.8,1.27,.345,.1,.08,.015,0xf5af63,0xb16a25);
    g.userData.sign=label(g,e.type==='door'?'LAB / 02':game.level===0?'BUNKER / 04':'ROOF / 07',0,2.96,0,.38,'#c8d3bd',true);
   }else if(e.type==='npc'){const person=createCharacter(kit,false,0);person.scale.setScalar(.9);g.userData.resident=person;g.add(person);label(g,e.name,0,2.7,0,.48,'#e9d6a8',true);
   }else if(e.type==='mission'){kit.box(g,0,0,0,1,.9,.8,0x637c72,'brushedSteel');kit.box(g,0,.5,.42,.6,.2,.04,0xa6d8b8);cylinder(g,-.35,.9,0,.08,1,0xabb6a0);
   }else if(e.type==='radio'){
    kit.box(g,0,0,0,.86,.6,.65,0x9da880,'carPaint');box(g,0,.6,0,.92,.1,.73,0xc3bea0);kit.box(g,0,.15,.34,.64,.28,.025,0x819481,'rubber');kit.box(g,.16,.26,.36,.11,.1,.01,0x89c394,undefined,0x34854d);cylinder(g,-.27,.7,-.2,.035,2.9,0x97a695);box(g,-.27,2.5,-.2,1.4,.045,.045,0x97a695);box(g,-.27,2,-.2,.8,.045,.045,0x97a695);
   }else if(e.type==='exit'){
    dot(g,0,.04,0,1.5,0x98bd93);groundText(g,game.level===2?'H':'→',0,0,2,1.6,'#d3d6b7');if(game.level>2)label(g,e.name,0,1.5,0,.5,'#d3d6b7',true);
   }else if(e.type==='note'){
    box(g,0,.02,0,.5,.02,.4,0xc0b891);
   }else if(e.type==='item'){
    buildPickup(kit,g,e.item);
   }
   if(e.type!=='prop'){const r=dot(g,0,.03,0,.53,['generator','exit','radio','door'].includes(e.type)?0xdbab60:0x9dba98);g.userData.ring=r;}
   if(e.type!=='prop'){
     // Art and halos do not intercept clicks. A deliberate footprint keeps small loot and the helipad selectable.
     const hitMaterial=new THREE.MeshBasicMaterial({visible:false});kit.extras.add(hitMaterial);
     const hit=new THREE.Mesh(kit.geometry('hit-plane',()=>new THREE.PlaneGeometry(1,1)),hitMaterial);
     hit.rotation.x=-Math.PI/2;hit.position.y=.028;const size=e.type==='exit'&&game.level===2?3:.85;hit.scale.set(e.w||size,e.h||size,1);hit.position.x=(w-1)/2;hit.position.z=(h-1)/2;g.add(hit);
   }
   g.traverse(o=>{if((o as THREE.Mesh).isMesh&&!o.userData.noPick){o.userData.entity=e;pickables.push(o)}});objectGroup.add(g);meshes.set(e.id,g);currentSurface=undefined;return g;
  }
  function puddle(x:number,y:number,rx:number,ry:number,index:number){
    const geom=kit.geometry('puddle:'+index,()=>{const shape=new THREE.Shape();for(let i=0;i<25;i++){const a=i/24*Math.PI*2,r=.78+hash(index,i)*.22;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?shape.lineTo(px,py):shape.moveTo(px,py)}return new THREE.ShapeGeometry(shape)});
    const material=new THREE.MeshPhysicalMaterial({color:0x77979a,roughness:.14,metalness:.62,clearcoat:1,clearcoatRoughness:.05,transparent:true,opacity:.25,depthWrite:false});kit.extras.add(material);
    const mesh=new THREE.Mesh(geom,material);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.013,y);mesh.scale.set(rx,ry,1);deco.add(mesh);
  }
  function environmentDetails(){
    const [w,h]=game.data.size;
    // Extra city geometry remains outside the playable footprint.
    if(level!==1){
      for(let i=0;i<18;i++){
        const x=i<9?-5-hash(i,4)*7:(i-9)*4-5;
        const z=i<9?i*4-5:-6-hash(i,7)*7;
        const height=3+hash(i,9)*9,ww=2+hash(i,10)*2,dd=2+hash(i,2)*2;
        kit.box(skyline,x,-3,z,ww,height,dd,level===2?0x394c4a:0x365259,'concrete');
        for(let k=0;k<5;k++)if(hash(i,k)>.28)kit.box(skyline,x-ww*.38+k*ww*.18,height-3,z,ww*.12,.6+hash(k,i)*.8,dd,0x384d4e,'concrete');
        for(let floor=1;floor<height-1;floor+=1.3)for(let col=0;col<3;col++){const lit=hash(i+floor,col)>.94;
          kit.box(skyline,x-ww*.27+col*ww*.27,floor-2,z+dd*.503,.2,.42,.025,lit?0xdfac6b:0x182c2d,undefined,lit?0x71502b:0);
        }
      }
    }
    // Curbs and slab seams make the outside edge feel like a place, rather than a grid of cubes.
    if(level===0){for(let y=0;y<h;y++){kit.box(deco,7.1,-.01,y,.24,.12,.96,0x91998b,'concrete');kit.box(deco,14.1,-.01,y,.24,.12,.96,0x91998b,'concrete');}
      for(let i=0;i<12;i++){const x=hash(i,29)*19,y=hash(i,35)*17;if(game.isBlocked(Math.round(x),Math.round(y)))continue;puddle(x,y,.45+hash(i,3)*1.1,.25+hash(i,8)*.7,i);}
    }
    if(level===1){
      for(let i=0;i<3;i++){const pipe=kit.cylinder(deco,3+i*5.8,1.6,.6,.065,4.3,0x647971,.065,'steel');pipe.rotation.z=Math.PI/2;}
      for(const [x,z] of [[3,6.5],[14,8.5],[18,11.5]])kit.box(deco,x,.004,z,1.4,.006,.85,0x8c9d8d,'rubber');
      for(const [x,z] of [[12,1.1],[17,1.1],[1.1,12]]){kit.box(deco,x,.2,z,.28,.13,.08,0xe48764,undefined,0xd5562d);const light=new THREE.PointLight(0xf57c52,3.5,3.5,2);light.position.set(x,1,z);deco.add(light);}
      puddle(13,11,.9,.45,20);puddle(5,7,.55,.35,21);
    }
    if(level===2){
      for(let i=0;i<9;i++){const x=hash(i,24)*18+1,z=hash(i,42)*17+1;if(!game.isBlocked(Math.round(x),Math.round(z)))puddle(x,z,.6+hash(i,3),.3+hash(i,8)*.4,i+30);}
      for(const x of [2,19]){kit.box(deco,x,0,1,.09,4.8,.09,0x6e8171,'steel');kit.box(deco,x,4.6,1,1.3,.04,.04,0x8da38b);kit.box(deco,x,4.1,1,.7,.04,.04,0x8da38b);}
    }
    if(level!==1)for(let i=0;i<110;i++){
      const x=hash(i,12)*(w-1),y=hash(i,39)*(h-1);
      if(game.isBlocked(Math.round(x),Math.round(y))||level===0&&x>7&&x<14||level===2&&i>25)continue;
      for(let j=0;j<3;j++){
        const geo=kit.geometry(`blade:${j}`,()=>new THREE.ConeGeometry(.035,.34+j*.1,3));
        const m=new THREE.Mesh(geo,kit.material(j===1?0x71815a:0x596d50));m.position.set(x+(j-1)*.075,.15,y);m.rotation.set(j*.1,hash(i,j)*Math.PI,(j-1)*.25);m.castShadow=true;deco.add(m);
      }
    }
  }
  function build(){
    atmosphere?.dispose();helicopter=undefined;
    for(const group of [terrain,objectGroup,actors,deco,skyline]){world.remove(group);kit.disposeLocal(group)}
    kit.disposeLocal(effectRoot);effects.clear();meshes.clear();pickables.length=0;
    if(pathDots)pathDots.count=0;if(marker)marker.visible=false;lastPath='';lastHover='';hoverEntity=null;hoverPoint=null;hoverRef.current(null);
    terrain=new THREE.Group();objectGroup=new THREE.Group();actors=new THREE.Group();deco=new THREE.Group();skyline=new THREE.Group();world.add(terrain,objectGroup,actors,deco,skyline);
    renderedLanguage=game.language;level=game.level;const [w,h]=game.data.size;world.position.set(-(w-1)/2,0,-(h-1)/2);cameraTarget.set(0,0,0);camera.position.copy(cameraOffset);camera.lookAt(cameraTarget);
    const fogColor=level===0?0x213c40:level===1?0x11282b:0x3e4440;scene.background=new THREE.Color(fogColor);scene.fog=new THREE.FogExp2(fogColor,level===1?.020:.012);
    ambient.color.setHex(level===2?0xb1c9cc:0xb0dce0);ambient.groundColor.setHex(level===1?0x2f413c:0x465040);ambient.intensity=level===1?1.3:1.12;
    sun.color.setHex(level===2?0xffb96a:level===1?0xadd6d0:0xeee3c0);sun.intensity=level===2?4:level===1?2.1:3;
    sun.position.set(level===2?-18:-11,level===2?13:22,3);fill.color.setHex(level===2?0x87b7c0:0x75b8c7);fill.intensity=level===1?1.1:1.3;
    renderer.toneMappingExposure=level===1?1.13:1.08;
    kit.box(terrain,(w-1)/2,-1,(h-1)/2,w+.4,.89,h+.4,0x6d7e74,'concrete');
    kit.box(terrain,(w-1)/2,-1.12,(h-1)/2,w+.15,.13,h+.15,0x293e37);
    kit.box(terrain,(w-1)/2,-.11,(h-1)/2,w,.11,h,level===0?0xa1ada0:0xb0b8aa,level===0?'paving':level===1?'tiles':'concrete');
    if(level===0)kit.box(terrain,10.55,.001,(h-1)/2,6.85,.007,h,0x89988c,'asphalt');
    // Invisible collision plane is deliberately separate from decoration and textures.
    const planeMaterial=new THREE.MeshBasicMaterial({visible:false});kit.extras.add(planeMaterial);
    tilePlane=new THREE.Mesh(kit.geometry('map-plane',()=>new THREE.PlaneGeometry(w,h)),planeMaterial);tilePlane.rotation.x=-Math.PI/2;tilePlane.position.set((w-1)/2,.012,(h-1)/2);terrain.add(tilePlane);
    if(level===0){for(let y=1;y<h;y+=3)kit.box(deco,10.5,.01,y,.10,.009,1.25,0xc9c39b);groundText(deco,'QUARANTINE',10.3,17,5.8,.8);groundText(deco,'04',10.3,4,2.2,1.3);}
    if(level===1){groundText(deco,'STATION ZERO',4,17,5.7,.8,'#b8ccc0');groundText(deco,'LAB / N-04',14,5,4.2,.8,'#b0dad2');for(let y=2;y<18;y+=2)kit.box(deco,10.4,.009,y,.07,.009,1.6,0xb7a877);}
    if(level===2){helicopter=createHelicopter(kit);deco.add(helicopter);groundText(deco,'EVAC 07',15.5,12,4.3,.8);dot(deco,16,.026,10,2.75,0xc5bc93);for(const x of [13.5,18.5])for(const y of [7.5,12.5])kit.box(deco,x,0,y,.18,.12,.18,0xe6a558,undefined,0xe29e46);}
    environmentDetails();
    buildSectorDetails(kit,deco,level,game.entities,(x,y)=>game.isBlocked(x,y));
    for(const [x,y] of (level===0?[[6,6],[14,3],[18,16]]:level===1?[[1,5],[10,3],[19,12]]:[[2,7],[18,5]])){
      kit.box(deco,x,0,y,.09,3.2,.09,0x576960,'steel');kit.box(deco,x+.35,3.13,y,.8,.08,.11,0x788e78,'steel');
      const lightColor=level===1?0x82ecde:0xffbc74;
      kit.box(deco,x+.7,3.04,y,.34,.07,.23,lightColor,undefined,lightColor);
      const light=new THREE.PointLight(lightColor,level===1?14:21,7,2);light.position.set(x+.7,2.7,y);deco.add(light);
    }
    for(const e of game.entities)makeObject(e);
    atmosphere=createAtmosphere(kit,deco,level,game.entities,(x,y)=>game.isBlocked(x,y));
    player=createCharacter(kit);actors.add(player);puppy=createPuppy(kit);actors.add(puppy);puppy.traverse(o=>{if(o instanceof THREE.Mesh&&!o.userData.noPick){o.userData.entity=game.companion;pickables.push(o)}});label(puppy,'KODA',0,.97,0,.17,'#e1cb95');
    for(const [i,z] of game.zombies.entries())addZombie(z,i);
    if(level===5){for(const x of [10,11]){kit.box(deco,x,.015,9,.07,.04,17,0x73807b,'brushedSteel');}for(let z=1;z<18;z++)kit.box(deco,10.5,.001,z,1.8,.025,.16,0x71674e,'wood');}
    if(level===3||level===6){sun.color.setHex(0xffd4a2);ambient.intensity=1.5;groundText(deco,'HAVEN',10,13,5,1);for(let x=9;x<16;x++){kit.box(deco,x,.05,3,.6,.12,3,0x665e3b);for(let z=2;z<5;z++)kit.box(deco,x,.17,z,.3,.4,.25,0x70955a);}}
    label(deco,level>2?game.data.place:level===0?'SECTOR 04':level===1?'STATION ZERO':'ROOF 07',w/2,-.73,h+.08,.42,'#98b4a6');
  }
  function addZombie(z:any,variant=0){const g=createCharacter(kit,true,z.kind==='runner'?1:z.kind==='stalker'?2:z.kind==='shambler'?0:variant%3);g.userData.entity=z;
    g.traverse(o=>{if(o instanceof THREE.Mesh&&!o.userData.noPick){o.userData.entity=z;pickables.push(o)}});meshes.set(z.id,g);actors.add(g);return g;
  }
  build();
  marker=dot(world,game.player.x,.04,game.player.y,.49,COLORS.orange);marker.visible=false;
  const guideRing=dot(world,0,.06,0,.75,0xffc477);guideRing.visible=false;guideRing.renderOrder=20;(guideRing.material as THREE.MeshBasicMaterial).depthTest=false;
  const guideArrow=new THREE.Mesh(kit.geometry('guide-arrow',()=>new THREE.ConeGeometry(.19,.44,4)),new THREE.MeshBasicMaterial({color:0xffd599,depthTest:false}));guideArrow.rotation.z=Math.PI;guideArrow.renderOrder=21;guideArrow.userData.noPick=true;guideArrow.visible=false;world.add(guideArrow);kit.extras.add(guideArrow.material);
  let lastGuideFocus=game.tutorialFocus;
  const targetLabel=label(scene,'',0,0,0,.7,'#f0e6c9',true);targetLabel.visible=false;targetLabel.material.depthTest=false;targetLabel.material.depthWrite=false;targetLabel.renderOrder=1000;let lastLabel='';
  const pathMaterial=new THREE.MeshBasicMaterial({color:0xe2c29a,transparent:true,opacity:.75,depthWrite:false});kit.extras.add(pathMaterial);
  pathDots=new THREE.InstancedMesh(kit.geometry('path-circle',()=>new THREE.CircleGeometry(.055,8)),pathMaterial,500);pathDots.count=0;pathDots.frustumCulled=false;world.add(pathDots);
  const rainCount=300,rainArray=new Float32Array(rainCount*6);for(let i=0;i<rainCount;i++){const x=hash(i,3)*42-21,y=hash(i,12)*18,z=hash(i,8)*42-21;rainArray.set([x,y,z,x-.075,y-.45,z+.04],i*6)}
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArray,3));const rainMat=new THREE.LineBasicMaterial({color:0xa9c9c7,transparent:true,opacity:.16});const rain=new THREE.LineSegments(rainGeo,rainMat);scene.add(rain);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const pick=(ev:PointerEvent)=>{
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((ev.clientX-rect.left)/rect.width*2-1,-(ev.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(pickables,false).filter(hit=>{
      const e=hit.object.userData.entity;if(!e||e.removed||e.hp===0)return false;
      let o:THREE.Object3D|null=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return true;
    });
    const floor=raycaster.intersectObject(tilePlane);hoverEntity=hits[0]?.object.userData.entity??null;hoverPoint=floor[0]?world.worldToLocal(floor[0].point.clone()):null;return {entity:hoverEntity,point:hoverPoint};
  };
  const move=(ev:PointerEvent)=>{
    pick(ev);const id=hoverEntity?.id||'';if(id!==lastHover){lastHover=id;hoverRef.current(hoverEntity)}renderer.domElement.style.cursor=game.throwing?'crosshair':hoverEntity?'pointer':'crosshair';
    if(hoverPoint&&marker){marker.position.set(Math.round(hoverPoint.x),.037,Math.round(hoverPoint.z));marker.visible=!game.isBlocked(Math.round(hoverPoint.x),Math.round(hoverPoint.z))}else if(marker)marker.visible=false;
  };
  const click=(ev:PointerEvent)=>{
    const {entity,point}=pick(ev);if(game.throwing&&point)game.throwBottle(Math.round(point.x),Math.round(point.z));else if(entity?.type==='companion')game.openCompanion();else if(entity)game.select(entity.id);else if(point)game.move(Math.round(point.x),Math.round(point.z));
  };
  const leave=()=>{if(marker)marker.visible=false;hoverEntity=null;hoverRef.current(null);lastHover=''};
  const resize=()=>{const width=hostNode.clientWidth,height=hostNode.clientHeight;if(!width||!height)return;renderer.setSize(width,height);composer.setSize(width,height);
    const aspect=width/height,half=Math.max(13.7,15.65/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
  };
  const optionsBounds=()=>({x:(game.data.size[0]-1)/2,z:(game.data.size[1]-1)/2});
  const controls=createMapCameraControls(renderer.domElement,camera,cameraTarget,cameraOffset,{
    onFollowChange:value=>followRef.current(value),onZoom:value=>zoomRef.current(value),onTap:click,onHover:move,onClearHover:leave,
    bounds:()=>({x:(game.data.size[0]-1)/2,z:(game.data.size[1]-1)/2}),
  });sceneRef.current=controls;
  const observer=new ResizeObserver(resize);observer.observe(hostNode);resize();let levelEntities=game.entities;
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
  const loop=(now:number)=>{
    if(disposed)return;const dt=last?Math.min((now-last)/1000,.06):0;last=now;game.tick(dt);
    if(levelEntities!==game.entities||renderedLanguage!==game.language){levelEntities=game.entities;build();controls.reset();lastLabel='';}
    const guide=tutorialTarget(game);guideRing.visible=guideArrow.visible=!!guide&&game.mode==='playing';
    if(guide){guideRing.position.set(guide.x,.065,guide.y);guideRing.scale.setScalar(.75*(1+Math.sin(now*.003)*.08));guideArrow.position.set(guide.x,2.1+Math.sin(now*.003)*.13,guide.y);}
    if(lastGuideFocus!==game.tutorialFocus){
      lastGuideFocus=game.tutorialFocus;
      if(guide){
        const rect=renderer.domElement.getBoundingClientRect(),card=hostNode.parentElement?.querySelector('.tutorial-card')?.getBoundingClientRect();
        const screen={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
        if(card){
          if(rect.right-card.right>200)screen.x=(card.right+24+rect.right-24)/2;
          else screen.y=(Math.max(card.bottom+60,rect.top+140)+rect.bottom-210)/2;
        }
        controls.focus(guide.x-(game.data.size[0]-1)/2,guide.y-(game.data.size[1]-1)/2,screen);
      }
    }
    if(helicopter){helicopter.visible=level===2;if(level===2)animateHelicopter(helicopter,game.signal,game.mode==='complete'?-1:game.evacuation||0,game.time)}
    game.player.equipment=game.equipment;game.player.sneak=game.sneak;game.player.hp=game.health;
    const playing=game.canAct;if(playing){const b=optionsBounds();controls.follow({x:game.player.x-b.x,z:game.player.y-b.z},{x:game.companion.x-b.x,z:game.companion.y-b.z},dt);}
    player.visible=!(game.evacuation>0&&game.evacuation<=3);puppy.visible=!(game.evacuation>0&&game.evacuation<=3);animateCharacter(player,game.player,dt,playing,game.time);animatePuppy(puppy,game.companion,dt,playing,game.time);
    for(const e of game.entities){let g=meshes.get(e.id);if(!g)g=makeObject(e);g.visible=!e.removed;if(g.userData.resident)animateCharacter(g.userData.resident,{x:0,y:0,facing:e.id==='imani'?.2:-.4,hp:100,attack:0,hurt:0},dt,playing,game.time);if(g.userData.sign)g.userData.sign.visible=hoverEntity?.id!==e.id;
      if(g.userData.door)g.userData.door.scale.x=(e.open||e.type==='exit'&&game.generatorOn)?.09:1;
      if(g.userData.lid)g.userData.lid.rotation.x=THREE.MathUtils.damp(g.userData.lid.rotation.x,e.open?-1.1:0,9,dt);
      if(g.userData.hatch)g.userData.hatch.rotation.x=THREE.MathUtils.damp(g.userData.hatch.rotation.x,e.open?g.userData.hatchAngle:0,9,dt);
      if(g.userData.drawer)g.userData.drawer.position.z=THREE.MathUtils.damp(g.userData.drawer.position.z,g.userData.drawerClosedZ+(e.open?.48:0),9,dt);
      if(g.userData.cargo){
        const cargo=g.userData.cargo as THREE.Group,signature=e.contents.join('|');cargo.visible=!!e.open;
        if(g.userData.cargoSignature!==signature){
          g.userData.cargoSignature=signature;for(const child of [...cargo.children]){kit.disposeLocal(child);cargo.remove(child)}
          const items=e.contents.slice(0,6),columns=items.length>1?2:1,scale=g.userData.cargoScale||.45;
          items.forEach((id:string,i:number)=>{const model=buildPickup(kit,cargo,id,{scale:scale*(items.length>1?.65:1),detail:'compact',decorative:true,yaw:i*.65});model.position.x=columns===1?0:(i%2-.5)*scale*.6;model.position.z=(Math.floor(i/columns)-(Math.ceil(items.length/columns)-1)/2)*scale*.6;});
        }
      }
      if(g.userData.ring){const active=e.type==='exit'&&(level===0?game.generatorOn:level===1?game.has('sample'):game.signal===0),hover=hoverEntity?.id===e.id||game.selected?.id===e.id||game.companion.foundId===e.id;
        const m=g.userData.ring.material as THREE.MeshBasicMaterial;m.color.setHex(active?0x9ee2c0:hover?0xf7c991:0xa5b49b);m.opacity=hover||active?.9:e.type==='item'?.35:e.type==='container'&&e.open?.12:.25;
        g.userData.ring.scale.setScalar(g.userData.ring.userData.baseRadius*(active?1+Math.sin(game.time*3)*.08:1));
      }
    }
    for(const [i,z] of game.zombies.entries()){const g=meshes.get(z.id)||addZombie(z,i);animateCharacter(g,z,dt,playing,game.time);}
    const pathKey=game.path.map((p:any)=>`${p.x}:${p.y}`).join('|');if(pathKey!==lastPath&&pathDots){lastPath=pathKey;pathDots.count=Math.min(500,game.path.length);game.path.slice(0,500).forEach((p:any,i:number)=>{matrix.compose(new THREE.Vector3(p.x,.035,p.y),rotation,new THREE.Vector3(1,1,1));pathDots!.setMatrixAt(i,matrix)});pathDots.instanceMatrix.needsUpdate=true;}
    const liveEffects=new Set(game.effects);for(const [e,m] of effects){if(!liveEffects.has(e)){effectRoot.remove(m);kit.extras.delete(m.material as THREE.Material);(m.material as THREE.Material).dispose();effects.delete(e)}}
    for(const e of game.effects){let m=effects.get(e);if(!m){m=kit.ring(effectRoot,e.x,e.y,e.type==='bottle'?.7:e.type==='hit'?.55:.8,e.type==='heal'?0x9ce3be:e.type==='hit'?0xeeb477:0xeac28c);effects.set(e,m)}(m.material as THREE.MeshBasicMaterial).opacity=Math.min(.8,e.life);m.scale.setScalar(e.type==='bottle'?.85+Math.sin(game.time*5)*.15:e.type==='hit'?.5+(.3-e.life):.8+(1-e.life)*.4);}
    if(hoverEntity&&!hoverEntity.removed&&hoverEntity.hp!==0){targetLabel.position.copy(world.localToWorld(new THREE.Vector3(hoverEntity.x,hoverEntity.type==='door'||hoverEntity.type==='exit'?3.35:hoverEntity.type==='prop'?3:2.25,hoverEntity.y)));targetLabel.visible=true;
      const text=translate(hoverEntity.name,game.language);if(text!==lastLabel){lastLabel=text;const material=targetLabel.material as THREE.SpriteMaterial,canvas=material.map!.image as HTMLCanvasElement,ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,512,96);ctx.fillStyle='rgba(11,23,22,.94)';ctx.fillRect(0,0,512,96);ctx.fillStyle=hoverEntity.type==='zombie'?'#edb291':'#f1e4c6';ctx.font='500 40px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,48,488);material.map!.needsUpdate=true;}
    }else targetLabel.visible=false;
    rain.visible=level===0;rainMat.opacity=level===0?.14:.06;
    if(playing&&rain.visible){for(let i=0;i<rainCount;i++){rainArray[i*6+1]-=dt*11;rainArray[i*6+4]-=dt*11;if(rainArray[i*6+1]<-.5){rainArray[i*6+1]=18;rainArray[i*6+4]=17.55}}rainGeo.attributes.position.needsUpdate=true;}
    atmosphere?.update(game.time);composer.render();frame=requestAnimationFrame(loop);
  };
  frame=requestAnimationFrame(loop);
  return()=>{disposed=true;atmosphere?.dispose();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();
    for(const g of [terrain,objectGroup,actors,deco,skyline,effectRoot])kit.disposeLocal(g);targetLabel.material.map?.dispose();targetLabel.material.dispose();kit.dispose();pathDots?.dispose();sun.shadow.dispose();rainGeo.dispose();rainMat.dispose();bloom.dispose();output.dispose();composer.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null;
  };
 },[game]);
 return <div className="scene-canvas" ref={host}/>;
}
