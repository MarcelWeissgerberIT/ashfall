'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRenderKit, createCharacter, animateCharacter, type Surface } from './render-kit';
const COLORS={orange:0xf3bb78};
export default function Scene({game,onHover,zoom}:{game:any;onHover:(v:any)=>void;zoom:number}){
 const host=useRef<HTMLDivElement>(null),sceneRef=useRef<any>(null),hoverRef=useRef(onHover);hoverRef.current=onHover;
 useEffect(()=>{if(sceneRef.current){sceneRef.current.camera.zoom=zoom;sceneRef.current.camera.updateProjectionMatrix()}},[zoom]);
 useEffect(()=>{
  if(!host.current)return;
  let disposed=false,frame=0,last=0,lastHover='',lastPath='',currentSurface:Surface|undefined;
  const hostNode=host.current;
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.domElement.setAttribute('aria-label','Isometrische Spielkarte. Klicken zum Bewegen oder Interagieren; rechte Maustaste ziehen zum Verschieben der Ansicht.');
  hostNode.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x172c30);scene.fog=new THREE.FogExp2(0x172c30,.021);
  const camera=new THREE.OrthographicCamera(-18,18,14,-14,.1,160);const cameraOffset=new THREE.Vector3(28,33,28);const cameraTarget=new THREE.Vector3(0,0,0);
  camera.position.copy(cameraOffset);camera.lookAt(cameraTarget);camera.zoom=zoom;sceneRef.current={camera};
  const kit=createRenderKit(renderer);
  const ambient=new THREE.HemisphereLight(0xb4d9df,0x31433a,1.4);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xffdcb3,3.0);sun.position.set(-11,22,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:.5,far:75});sun.shadow.bias=-.0002;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x78becb,1.25);fill.position.set(15,8,-12);scene.add(fill);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.35;room.dispose();pmrem.dispose();
  const renderTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType});renderTarget.samples=Math.min(4,renderer.capabilities.maxSamples);
  const composer=new EffectComposer(renderer,renderTarget);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.27,.5,1.35);composer.addPass(bloom);const output=new OutputPass();composer.addPass(output);
  const world=new THREE.Group();scene.add(world);
  let level=-1,terrain=new THREE.Group(),objectGroup=new THREE.Group(),actors=new THREE.Group(),deco=new THREE.Group(),skyline=new THREE.Group();
  const meshes=new Map<string,THREE.Group>(),pickables:THREE.Object3D[]=[];
  let player:THREE.Group,tilePlane:THREE.Mesh,marker:THREE.Mesh|undefined,hoverEntity:any=null,hoverPoint:THREE.Vector3|null=null;
  let pathDots:THREE.InstancedMesh|undefined;const effects=new Map<any,THREE.Mesh>();const effectRoot=new THREE.Group();world.add(effectRoot);
  const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
  const mat=(color:number,glow=0)=>kit.material(color,currentSurface,glow);
  const box=(g:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,c:number,glow=0)=>kit.box(g,x,y,z,w,h,d,c,currentSurface,glow);
  const cylinder=(g:THREE.Object3D,x:number,y:number,z:number,r:number,h:number,c:number,top?:number)=>kit.cylinder(g,x,y,z,r,h,c,top??r,currentSurface);
  const dot=(g:THREE.Object3D,x:number,y:number,z:number,r:number,c:number)=>{const m=kit.ring(g,x,z,r,c);m.position.y=y;return m};
  const label=(g:THREE.Object3D,text:string,x:number,y:number,z:number,size=1.3,color='#e6dec2',bg=false)=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
    const ctx=canvas.getContext('2d')!;if(bg){ctx.fillStyle='rgba(12,24,22,.9)';ctx.fillRect(0,0,512,96)}ctx.fillStyle=color;ctx.font='500 40px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,48,490);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});const s=new THREE.Sprite(material);s.position.set(x,y,z);s.scale.set(size*4,size*.75,1);g.add(s);return s;
  };
  const groundText=(g:THREE.Object3D,text:string,x:number,z:number,w:number,h:number,color='#c0b58c')=>{
    const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.font='900 135px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128,990);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.5,depthWrite:false});kit.extras.add(m);
    const p=new THREE.Mesh(kit.geometry('unit-plane',()=>new THREE.PlaneGeometry(1,1)),m);p.scale.set(w,h,1);p.rotation.x=-Math.PI/2;p.position.set(x,.017,z);p.userData.noPick=true;g.add(p);
  };
  function makeObject(e:any){const g=new THREE.Group();g.position.set(e.x,0,e.y);g.userData.entity=e;const w=e.w||1,h=e.h||1;
   currentSurface=e.type==='prop'?(['wall','barrier','rubble'].includes(e.style)?'concrete':e.style==='car'?'carPaint':e.style==='tree'?'bark':['vent','tank','desk','bed'].includes(e.style)?'brushedSteel':undefined):['generator','door','radio','exit'].includes(e.type)?'brushedSteel':undefined;
   if(e.type==='prop'&&e.style!=='tree')kit.contact(g,(w-1)/2,(h-1)/2,w+.65,h+.6);
   else if(!['exit','note'].includes(e.type))kit.contact(g,0,0,1.25,1.1);
   if(e.type==='prop'){
    if(e.style==='wall'){
     const height=game.level===1?1.38:e.y<2?2.5:1.65;
     box(g,(w-1)/2,0,(h-1)/2,w-.025,height,h-.025,0x87978f);
     box(g,(w-1)/2,height,(h-1)/2,w+.08,.13,h+.08,0x9aa798);
     for(let i=0;i<w;i+=2){box(g,i,.12,-.513,.05,height-.2,.032,0x586d62);box(g,i,.12,h-.487,.05,height-.2,.032,0x586d62);}
     if(game.level!==1)for(let i=0;i<w;i++){if(hash(e.x+i,e.y)>.4){box(g,i,height+.13,0,.09,.17+hash(i,e.x)*.22,.08,0x605b47);const rod=cylinder(g,i+.15,height+.12,0,.024,.43,0x746b4c);rod.rotation.z=.2;}}
     if(game.level===1){
       // Tile cladding follows both faces of the bunker partitions.
       for(const z of [-.503,h-.497])kit.box(g,(w-1)/2,.08,z,w-.03,1.03,.012,0xc3c9af,'tiles');
       for(const x of [-.503,w-.497])kit.box(g,x,.08,(h-1)/2,.012,1.03,h-.03,0xc3c9af,'tiles');
       for(const z of [-.516,h-.484])kit.box(g,(w-1)/2,1.11,z,w-.025,.055,.03,0x70897e,'brushedSteel');
     }

    }else if(e.style==='barrier'){
     for(let i=0;i<w;i++)for(let j=0;j<h;j++){box(g,i,0,j,.96,.35,.9,0x6a7162);box(g,i,.35,j,.65,.55,.7,0x7f8270);const stripe=box(g,i,.42,j+.365,.19,.4,.014,(i+j)%2?0x333c34:0xbd954e);stripe.rotation.z=-.3;}
    }else if(e.style==='car'){
     const paint=e.id==='car1'?0xa0b5b0:0xc1b08b;
     box(g,.5,.28,1,1.65,.5,2.75,paint);box(g,.5,.78,1.1,1.4,.55,1.4,paint);
     kit.box(g,.5,.86,.37,1.22,.37,.045,0x99bfc0,'glass');kit.box(g,.5,.86,1.82,1.22,.35,.04,0x83a5a2,'glass');
     for(const x of [-.211,1.211]){kit.box(g,x,.86,1.1,.025,.35,1.14,0x9ab5ac,'glass');kit.box(g,x,1.22,1.1,.035,.055,1.35,0xaab2a1,'brushedSteel');kit.box(g,x,.67,1.32,.035,.055,.21,0xaab2a1,'brushedSteel');}
     kit.box(g,.5,.28,-.4,1.7,.18,.1,0x9ea99f,'brushedSteel');
     for(const x of [-.32,1.32])for(const y of [.25,1.95]){const wheel=kit.cylinder(g,x,.08,y,.33,.22,0x929a91,.33,'rubber');wheel.rotation.z=Math.PI/2;wheel.position.y=.32;const hub=kit.cylinder(g,x+(x<0?-.12:.12),.08,y,.145,.024,0x8d998b,.145,'brushedSteel');hub.rotation.z=Math.PI/2;hub.position.y=.32;}
     kit.box(g,.05,.65,-.31,.26,.1,.02,0xb9b483,'glass');kit.box(g,.95,.65,-.31,.26,.1,.02,0xb9b483,'glass');
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
   }else if(e.type==='container'){
    const shell:Surface=e.id==='wreck'?'carPaint':['locker','medical','roof-aid'].includes(e.id)?'brushedSteel':'wood';
    const color=e.id==='medical'||e.id==='roof-aid'?0xcbd3c5:0x9ca28d;
    kit.box(g,0,0,0,.86,.65,.8,color,shell);const lid=new THREE.Group();lid.position.set(0,.65,-.4);g.add(lid);kit.box(lid,0,0,.4,.92,.12,.87,color,shell);g.userData.lid=lid;
    for(const x of [-.29,.29]){kit.box(g,x,0,0,.07,.65,.82,0x626c58,'brushedSteel');kit.box(lid,x,.12,.4,.07,.015,.88,0x9b9b76,'brushedSteel')}
    kit.box(g,0,.3,.415,.24,.18,.02,0xc7b577,'brushedSteel');
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
    label(g,e.type==='door'?'LAB / 02':game.level===0?'BUNKER / 04':'DACH / 07',0,2.96,0,.38,'#c8d3bd',true);
   }else if(e.type==='radio'){
    kit.box(g,0,0,0,.86,.6,.65,0x9da880,'carPaint');box(g,0,.6,0,.92,.1,.73,0xc3bea0);kit.box(g,0,.15,.34,.64,.28,.025,0x819481,'rubber');kit.box(g,.16,.26,.36,.11,.1,.01,0x89c394,undefined,0x34854d);cylinder(g,-.27,.7,-.2,.035,2.9,0x97a695);box(g,-.27,2.5,-.2,1.4,.045,.045,0x97a695);box(g,-.27,2,-.2,.8,.045,.045,0x97a695);
   }else if(e.type==='exit'){
    dot(g,0,.04,0,1.5,0x98bd93);groundText(g,'H',0,0,2,1.6,'#d3d6b7');
   }else if(e.type==='note'){
    box(g,0,.02,0,.5,.02,.4,0xc0b891);
   }else if(e.type==='item'){
    const type=e.item;
    if(type==='chair'){kit.box(g,0,.45,0,.65,.1,.65,0x9bac91,'canvas');kit.box(g,0,.6,-.29,.65,.6,.08,0x849b7e,'canvas');for(const x of [-.27,.27])for(const z of [-.27,.27])kit.box(g,x,0,z,.06,.45,.06,0x9ba18b,'brushedSteel')}
    else if(type==='tire'){const geo=kit.geometry('tire',()=>new THREE.TorusGeometry(.33,.14,8,16));const m=new THREE.Mesh(geo,kit.material(0x889487,'rubber'));m.rotation.x=Math.PI/2;m.position.y=.16;g.add(m)}
    else if(type==='bottle'){kit.cylinder(g,0,.02,0,.115,.34,0xb0c9b4,.115,'glass');kit.cylinder(g,0,.36,0,.055,.16,0x96b093,.055,'glass');}
    else if(type==='medkit'){kit.box(g,0,.04,0,.45,.2,.4,0xd8dcc6,'vinyl');box(g,0,.245,0,.09,.015,.27,0xa6533a);box(g,0,.245,0,.27,.015,.09,0xa6533a)}
    else if(type==='sample'){cylinder(g,0,0,0,.2,.55,0x8bcbb3);cylinder(g,0,.55,0,.23,.1,0xc2d3bb);box(g,0,.1,.17,.2,.25,.05,0x7ae4b0,0x228451)}
    else if(type==='toolbox'){kit.box(g,0,.02,0,.6,.4,.45,0xb59968,'carPaint');kit.box(g,0,.42,0,.28,.09,.05,0x8c9889,'rubber')}
    else if(type==='scrap'){for(let i=0;i<4;i++){const b=kit.box(g,(i-2)*.09,.02+i*.06,0,.2,.08,.6,0x90977d,i%2?'corrugated':'brushedSteel');b.rotation.y=i*.8}}
    else if(type==='ration'){kit.cylinder(g,0,.02,0,.2,.33,0x9eab86,.2,'brushedSteel')}
    else {kit.box(g,0,.03,0,.35,.3,.32,type==='fuel'?0xcdbd80:0xa8b19a,type==='fuel'?'carPaint':'brushedSteel')}
   }
   if(e.type!=='prop'){const r=dot(g,0,.03,0,.53,['generator','exit','radio','door'].includes(e.type)?0xdbab60:0x9dba98);g.userData.ring=r;}
   if(e.type!=='prop'){
     // Art and halos do not intercept clicks. A deliberate footprint keeps small loot and the helipad selectable.
     const hitMaterial=new THREE.MeshBasicMaterial({visible:false});kit.extras.add(hitMaterial);
     const hit=new THREE.Mesh(kit.geometry('hit-plane',()=>new THREE.PlaneGeometry(1,1)),hitMaterial);
     hit.rotation.x=-Math.PI/2;hit.position.y=.028;const size=e.type==='exit'&&game.level===2?3:.85;hit.scale.set(size,size,1);g.add(hit);
   }
   g.traverse(o=>{if((o as THREE.Mesh).isMesh&&!o.userData.noPick){o.userData.entity=e;pickables.push(o)}});objectGroup.add(g);meshes.set(e.id,g);currentSurface=undefined;return g;
  }
  function puddle(x:number,y:number,rx:number,ry:number,index:number){
    const geom=kit.geometry('puddle:'+index,()=>{const shape=new THREE.Shape();for(let i=0;i<25;i++){const a=i/24*Math.PI*2,r=.78+hash(index,i)*.22;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?shape.lineTo(px,py):shape.moveTo(px,py)}return new THREE.ShapeGeometry(shape)});
    const material=new THREE.MeshPhysicalMaterial({color:0x77979a,roughness:.14,metalness:.62,clearcoat:1,clearcoatRoughness:.05,transparent:true,opacity:.45,depthWrite:false});kit.extras.add(material);
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
    for(const group of [terrain,objectGroup,actors,deco,skyline]){world.remove(group);kit.disposeLocal(group)}
    kit.disposeLocal(effectRoot);effects.clear();meshes.clear();pickables.length=0;
    if(pathDots)pathDots.count=0;if(marker)marker.visible=false;lastPath='';lastHover='';hoverEntity=null;hoverPoint=null;hoverRef.current(null);
    terrain=new THREE.Group();objectGroup=new THREE.Group();actors=new THREE.Group();deco=new THREE.Group();skyline=new THREE.Group();world.add(terrain,objectGroup,actors,deco,skyline);
    level=game.level;const [w,h]=game.data.size;world.position.set(-(w-1)/2,0,-(h-1)/2);cameraTarget.set(0,0,0);camera.position.copy(cameraOffset);camera.lookAt(cameraTarget);
    const fogColor=level===0?0x213c40:level===1?0x11282b:0x3e4440;scene.background=new THREE.Color(fogColor);scene.fog=new THREE.FogExp2(fogColor,level===1?.026:.018);
    ambient.color.setHex(level===2?0xb1c9cc:0xb0dce0);ambient.groundColor.setHex(level===1?0x2f413c:0x465040);ambient.intensity=level===1?1.5:1.35;
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
    if(level===1){groundText(deco,'STATION NULL',4,17,5.7,.8,'#b8ccc0');groundText(deco,'LAB / N–04',14,5,4.2,.8,'#b0dad2');for(let y=2;y<18;y+=2)kit.box(deco,10.4,.009,y,.07,.009,1.6,0xb7a877);}
    if(level===2){groundText(deco,'EVAC 07',15.5,12,4.3,.8);dot(deco,16,.026,10,2.75,0xc5bc93);for(const x of [13.5,18.5])for(const y of [7.5,12.5])kit.box(deco,x,0,y,.18,.12,.18,0xe6a558,undefined,0xe29e46);}
    environmentDetails();
    for(const [x,y] of (level===0?[[6,6],[14,3],[18,16]]:level===1?[[1,5],[10,3],[19,12]]:[[2,7],[18,5]])){
      kit.box(deco,x,0,y,.09,3.2,.09,0x576960,'steel');kit.box(deco,x+.35,3.13,y,.8,.08,.11,0x788e78,'steel');
      const lightColor=level===1?0x82ecde:0xffbc74;
      kit.box(deco,x+.7,3.04,y,.34,.07,.23,lightColor,undefined,lightColor);
      const light=new THREE.PointLight(lightColor,level===1?14:21,7,2);light.position.set(x+.7,2.7,y);deco.add(light);
    }
    for(const e of game.entities)makeObject(e);
    player=createCharacter(kit);actors.add(player);
    for(const [i,z] of game.zombies.entries())addZombie(z,i);
    label(deco,level===0?'SEKTOR 04':level===1?'STATION NULL':'DACH 07',w/2,-.73,h+.08,.42,'#98b4a6');
  }
  function addZombie(z:any,variant=0){const g=createCharacter(kit,true,variant);g.userData.entity=z;
    g.traverse(o=>{if(o instanceof THREE.Mesh&&!o.userData.noPick){o.userData.entity=z;pickables.push(o)}});meshes.set(z.id,g);actors.add(g);return g;
  }
  build();
  marker=dot(world,game.player.x,.04,game.player.y,.49,COLORS.orange);marker.visible=false;
  const targetLabel=label(scene,'',0,0,0,.7,'#f0e6c9',true);targetLabel.visible=false;let lastLabel='';
  const pathMaterial=new THREE.MeshBasicMaterial({color:0xe2c29a,transparent:true,opacity:.75,depthWrite:false});kit.extras.add(pathMaterial);
  pathDots=new THREE.InstancedMesh(kit.geometry('path-circle',()=>new THREE.CircleGeometry(.055,8)),pathMaterial,500);pathDots.count=0;pathDots.frustumCulled=false;world.add(pathDots);
  const rainCount=300,rainArray=new Float32Array(rainCount*6);for(let i=0;i<rainCount;i++){const x=hash(i,3)*42-21,y=hash(i,12)*18,z=hash(i,8)*42-21;rainArray.set([x,y,z,x-.075,y-.45,z+.04],i*6)}
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArray,3));const rainMat=new THREE.LineBasicMaterial({color:0xa9c9c7,transparent:true,opacity:.16});const rain=new THREE.LineSegments(rainGeo,rainMat);scene.add(rain);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let dragging=false,dragX=0,dragY=0;
  const pick=(ev:PointerEvent)=>{
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((ev.clientX-rect.left)/rect.width*2-1,-(ev.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(pickables,false).filter(hit=>{
      const e=hit.object.userData.entity;if(!e||e.removed||e.hp===0)return false;
      let o:THREE.Object3D|null=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return true;
    });
    const floor=raycaster.intersectObject(tilePlane);hoverEntity=hits[0]?.object.userData.entity??null;hoverPoint=floor[0]?world.worldToLocal(floor[0].point.clone()):null;return {entity:hoverEntity,point:hoverPoint};
  };
  const pan=(dx:number,dy:number)=>{const scale=(camera.top-camera.bottom)/camera.zoom/hostNode.clientHeight;
    const right=new THREE.Vector3(1,0,-1).normalize(),down=new THREE.Vector3(1,0,1).normalize();
    cameraTarget.addScaledVector(right,-dx*scale).addScaledVector(down,-dy*scale*1.4);cameraTarget.x=THREE.MathUtils.clamp(cameraTarget.x,-9,9);cameraTarget.z=THREE.MathUtils.clamp(cameraTarget.z,-9,9);camera.position.copy(cameraOffset).add(cameraTarget);camera.lookAt(cameraTarget);
  };
  const move=(ev:PointerEvent)=>{
    if(dragging){pan(ev.clientX-dragX,ev.clientY-dragY);dragX=ev.clientX;dragY=ev.clientY;return}
    pick(ev);const id=hoverEntity?.id||'';if(id!==lastHover){lastHover=id;hoverRef.current(hoverEntity)}hostNode.style.cursor=game.throwing?'crosshair':hoverEntity?'pointer':'crosshair';
    if(hoverPoint&&marker){marker.position.set(Math.round(hoverPoint.x),.037,Math.round(hoverPoint.z));marker.visible=!game.isBlocked(Math.round(hoverPoint.x),Math.round(hoverPoint.z))}else if(marker)marker.visible=false;
  };
  const click=(ev:PointerEvent)=>{
    if(ev.button===2||ev.button===1){dragging=true;dragX=ev.clientX;dragY=ev.clientY;renderer.domElement.setPointerCapture(ev.pointerId);hostNode.style.cursor='grabbing';return}
    if(ev.button!==0)return;const {entity,point}=pick(ev);if(game.throwing&&point)game.throwBottle(Math.round(point.x),Math.round(point.z));else if(entity)game.select(entity.id);else if(point)game.move(Math.round(point.x),Math.round(point.z));
  };
  const stopDrag=(ev:PointerEvent)=>{dragging=false;if(renderer.domElement.hasPointerCapture(ev.pointerId))renderer.domElement.releasePointerCapture(ev.pointerId);hostNode.style.cursor='crosshair'};
  const leave=()=>{if(marker)marker.visible=false;hoverEntity=null;hoverRef.current(null);lastHover=''};
  const noMenu=(e:MouseEvent)=>e.preventDefault();
  const resize=()=>{const width=hostNode.clientWidth,height=hostNode.clientHeight;if(!width||!height)return;renderer.setSize(width,height);composer.setSize(width,height);
    const aspect=width/height,half=Math.max(13.7,15.65/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
  };
  renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerdown',click);renderer.domElement.addEventListener('pointerup',stopDrag);renderer.domElement.addEventListener('pointercancel',stopDrag);renderer.domElement.addEventListener('pointerleave',leave);renderer.domElement.addEventListener('contextmenu',noMenu);
  const observer=new ResizeObserver(resize);observer.observe(hostNode);resize();let levelEntities=game.entities;
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
  const loop=(now:number)=>{
    if(disposed)return;const dt=last?Math.min((now-last)/1000,.06):0;last=now;game.tick(dt);
    if(levelEntities!==game.entities){levelEntities=game.entities;build();lastLabel='';}
    const playing=game.mode==='playing';animateCharacter(player,game.player,dt,playing,game.time);
    for(const e of game.entities){let g=meshes.get(e.id);if(!g)g=makeObject(e);g.visible=!e.removed;
      if(g.userData.door)g.userData.door.scale.x=(e.open||e.type==='exit'&&game.generatorOn)?.09:1;
      if(g.userData.lid)g.userData.lid.rotation.x=e.open?-1.1:0;
      if(g.userData.ring){const active=e.type==='exit'&&(level===0?game.generatorOn:level===1?game.has('sample'):game.signal===0),hover=hoverEntity?.id===e.id||game.selected?.id===e.id;
        const m=g.userData.ring.material as THREE.MeshBasicMaterial;m.color.setHex(active?0x9ee2c0:hover?0xf7c991:0xa5b49b);m.opacity=hover||active?.9:e.type==='item'?.35:e.type==='container'&&e.open?.12:.25;
        g.userData.ring.scale.setScalar(g.userData.ring.userData.baseRadius*(active?1+Math.sin(game.time*3)*.08:1));
      }
    }
    for(const [i,z] of game.zombies.entries()){const g=meshes.get(z.id)||addZombie(z,i);animateCharacter(g,z,dt,playing,game.time);}
    const pathKey=game.path.map((p:any)=>`${p.x}:${p.y}`).join('|');if(pathKey!==lastPath&&pathDots){lastPath=pathKey;pathDots.count=Math.min(500,game.path.length);game.path.slice(0,500).forEach((p:any,i:number)=>{matrix.compose(new THREE.Vector3(p.x,.035,p.y),rotation,new THREE.Vector3(1,1,1));pathDots!.setMatrixAt(i,matrix)});pathDots.instanceMatrix.needsUpdate=true;}
    const liveEffects=new Set(game.effects);for(const [e,m] of effects){if(!liveEffects.has(e)){effectRoot.remove(m);kit.extras.delete(m.material as THREE.Material);(m.material as THREE.Material).dispose();effects.delete(e)}}
    for(const e of game.effects){let m=effects.get(e);if(!m){m=kit.ring(effectRoot,e.x,e.y,e.type==='bottle'?.7:e.type==='hit'?.55:.8,e.type==='heal'?0x9ce3be:e.type==='hit'?0xeeb477:0xeac28c);effects.set(e,m)}(m.material as THREE.MeshBasicMaterial).opacity=Math.min(.8,e.life);m.scale.setScalar(e.type==='bottle'?.85+Math.sin(game.time*5)*.15:e.type==='hit'?.5+(.3-e.life):.8+(1-e.life)*.4);}
    if(hoverEntity&&!hoverEntity.removed&&hoverEntity.hp!==0){targetLabel.position.copy(world.localToWorld(new THREE.Vector3(hoverEntity.x,hoverEntity.type==='prop'?3:2.25,hoverEntity.y)));targetLabel.visible=true;
      const text=hoverEntity.name;if(text!==lastLabel){lastLabel=text;const material=targetLabel.material as THREE.SpriteMaterial,canvas=material.map!.image as HTMLCanvasElement,ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,512,96);ctx.fillStyle='rgba(11,23,22,.94)';ctx.fillRect(0,0,512,96);ctx.fillStyle=hoverEntity.type==='zombie'?'#edb291':'#f1e4c6';ctx.font='500 40px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,48,488);material.map!.needsUpdate=true;}
    }else targetLabel.visible=false;
    rain.visible=level===0;rainMat.opacity=level===0?.14:.06;
    if(playing&&rain.visible){for(let i=0;i<rainCount;i++){rainArray[i*6+1]-=dt*11;rainArray[i*6+4]-=dt*11;if(rainArray[i*6+1]<-.5){rainArray[i*6+1]=18;rainArray[i*6+4]=17.55}}rainGeo.attributes.position.needsUpdate=true;}
    composer.render();frame=requestAnimationFrame(loop);
  };
  frame=requestAnimationFrame(loop);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerdown',click);renderer.domElement.removeEventListener('pointerup',stopDrag);renderer.domElement.removeEventListener('pointercancel',stopDrag);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('contextmenu',noMenu);
    for(const g of [terrain,objectGroup,actors,deco,skyline,effectRoot])kit.disposeLocal(g);targetLabel.material.map?.dispose();targetLabel.material.dispose();kit.dispose();pathDots?.dispose();sun.shadow.dispose();rainGeo.dispose();rainMat.dispose();bloom.dispose();output.dispose();composer.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null;
  };
 },[game]);
 return <div className="scene-canvas" ref={host}/>;
}
