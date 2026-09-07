import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { RenderKit, Surface } from './render-kit';
type Entity={id:string;x:number;y:number;w?:number;h?:number;style?:string};
const hash=(a:number,b:number)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)};

/** Architectural dressing has no collision or loot identity. All resources use the scene pool. */
export function buildSectorDetails(kit:RenderKit,parent:THREE.Group,level:number,entities:Entity[],blocked:(x:number,y:number)=>boolean){
 const root=new THREE.Group();root.name='sector-architectural-details';parent.add(root);
 const B=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,s?:Surface)=>kit.box(root,x,y,z,w,h,d,c,s);
 const rod=(points:number[][],radius:number,color:number,surface:Surface='brushedSteel',name='cable')=>{
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
  const key=`sector-detail:${name}:${level}:${points.flat().join(',')}`;
  const m=new THREE.Mesh(kit.geometry(key,()=>new THREE.TubeGeometry(curve,14,radius,5,false)),kit.material(color,surface));root.add(m);return m;
 };
 const drain=(x:number,z:number,wide=false)=>{
  const w=wide?.9:.48;B(x,.015,z,w,.026,.38,0x35453f,'brushedSteel');
  for(let i=0;i<7;i++)B(x-w*.41+i*w*.137,.042,z,.027,.015,.30,0x8a9680,'brushedSteel');
  for(const xx of [-w*.46,w*.46])for(const zz of [-.15,.15])B(x+xx,.048,z+zz,.035,.008,.035,0xaaa88a,'brushedSteel');
 };
 // Patched slabs and hairline fractures add scale without obstructing walkable tiles.
 for(let i=0;i<24;i++){
  const x=1+hash(i,44)*(18),z=1+hash(i,63)*16;
  if(blocked(Math.round(x),Math.round(z)))continue;
  const a=hash(i,82)*Math.PI,dx=Math.cos(a),dz=Math.sin(a);
  rod([[x-dx*.3,.017,z-dz*.3],[x,.018,z],[x+dx*.18-dz*.12,.018,z+dz*.18+dx*.12],[x+dx*.43,.017,z+dz*.43]],.008,level===1?0x53615a:0x46564d,'concrete','fracture');
  if(i%3===0){const slab=B(x,.005,z,.33,.009,.22,level===1?0x96a79b:0x7c8b7c,'concrete');slab.rotation.y=a;}
 }
 for(const e of entities){
  if(e.style!=='wall'&&e.style!=='barrier')continue;
  const w=e.w||1,h=e.h||1,front=e.y+h-.49;
  // Repair anchors, rain streaks, footing mortar, and broken rebar are tied to existing walls.
  for(let i=0;i<w;i++){
   const x=e.x+i;
   B(x,.025,front,.91,.085,.035,0x596d5c,'concrete');
   if(i%2===0){B(x,.35,front+.015,.13,.15,.028,0x6a7765,'brushedSteel');for(const d of [-.04,.04])B(x+d,.39,front+.034,.023,.023,.01,0xb1ae8d,'brushedSteel');}
   if(level===0&&i%3===1){
    rod([[x,.04,front+.026],[x+.09,.30,front+.027],[x-.015,.53,front+.025],[x+.12,.83,front+.025]],.015,0x536d48,'bark','creeper');
    for(let j=0;j<5;j++){const leaf=kit.ellipsoid(root,x+(j%2?.15:-.035),.14+j*.12,front+.055,.075,.031,.025,j%2?0x697f51:0x4c6b47);leaf.rotation.z=(j%2?1:-1)*.5;}
   }
   if(i%3===0){B(x+.23,.1,front+.009,.09,.52,.006,0x667961,'concrete');rod([[x-.27,.75,front-.06],[x-.27,1.12,front-.06],[x-.17,1.22,front-.10]],.017,0x89664a,'brushedSteel','rebar');}
  }
 }
 if(level===0){
  for(const z of [2,6,10,15]){drain(7.48,z,true);drain(13.68,z,true);}
  // Bolted inspection hatch and embedded road studs.
  B(10.5,.014,7,.82,.023,.82,0x566456,'brushedSteel');
  for(let i=0;i<6;i++)for(let j=0;j<6;j++)B(10.18+i*.128,.039,6.68+j*.128,.065,.008,.025,0x87907c,'brushedSteel');
  for(let z=1;z<18;z+=2)for(const x of [7.75,13.3])B(x,.018,z,.07,.025,.13,0xbcaa73,'vinyl');
  // Rain gutters and abandoned checkpoint fencing stay inside existing ruined footprints.
  for(const e of entities.filter(e=>e.style==='car')){
   const x=e.x+.5,z=e.y+1;
   rod([[x-.43,.02,z+1.1],[x-.68,.023,z+.84],[x-.57,.023,z+.5]],.015,0x33483e,'rubber','hose');
   B(x,.014,z+.42,.74,.006,.84,0x3e5147,'asphalt');
  }
  for(const x of [3.2,5.2,7.2]){
   B(x,1.1,.10,.038,1.08,.038,0x798b76,'brushedSteel');
   for(let i=0;i<5;i++)rod([[x-.3,1.15+i*.16,.10],[x+.3,1.38+i*.16,.10]],.008,0x718471,'brushedSteel','fence');
  }
 }
 if(level===1){
  // Routed utility pipes, insulated brackets, junction boxes and wall vents.
  for(const x of [1.2,10.4,19.4]){
   rod([[x,.23,1.05],[x,1.55,1.05],[x+.22,1.73,1.05],[x+.22,1.73,5.5]],.038,0x8a9b86,'brushedSteel','utility');
   for(const z of [2,3.4,4.8])B(x+.22,1.66,z,.15,.15,.035,0x485e51,'brushedSteel');
   B(x,.75,1.02,.27,.39,.10,0x85947c,'carPaint');B(x,.84,1.079,.18,.21,.013,0x435a4b,'rubber');
   B(x+.04,.9,1.09,.023,.032,.008,0xc7a568);
  }
  for(const e of entities.filter(e=>e.style==='bed')){
   for(const side of [-1,1]){rod([[e.x+side*.39,.58,e.y+.3],[e.x+side*.39,.92,e.y+.3],[e.x+side*.39,.92,e.y+1.7],[e.x+side*.39,.58,e.y+1.7]],.024,0x9ea994,'brushedSteel','bedrail');}
  }
  for(const [x,z] of [[4,5],[12,10],[17,15]])drain(x,z,true);
  for(const x of [4,14]){B(x,.18,.55,.82,.68,.055,0x7d8e7b,'brushedSteel');for(let i=0;i<7;i++)B(x,.22+i*.075,.59,.68,.028,.038,0x334a40,'rubber');}
 }
 if(level===2){
  // Cable trays service the rooftop equipment; gutters follow the parapets.
  for(const z of [3,4,5,6,7,8,9,10,11,12,13,14,15]){
   B(1.35,.022,z,.19,.06,.95,0x596e60,'brushedSteel');
   for(const x of [1.3,1.4])B(x,.084,z,.025,.025,.94,0x2d4239,'rubber');
  }
  for(const e of entities.filter(e=>e.style==='vent')){
   const x=e.x+((e.w||1)-1)/2,z=e.y+((e.h||1)-1)/2;
   B(x,1.17,z,.65,.02,.55,0x8b9b80,'brushedSteel');
   for(let i=0;i<6;i++)B(x-.25+i*.1,1.20,z,.035,.02,.48,0x314c41,'rubber');
  }
  for(const [x,z] of [[2,2],[18,16],[2,16]])drain(x,z);
  for(const z of [3,7,11,15]){B(19.55,.13,z,.09,.13,.42,0x7f927b,'brushedSteel');rod([[19.55,.25,z],[19.55,.30,z+.1],[19.55,.02,z+.3]],.025,0x778871,'brushedSteel','gutter');}
 }
 // One draw per material for static architecture, with reusable pooled geometry.
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map<THREE.Material,THREE.Mesh[]>();
 root.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)){const list=buckets.get(o.material)||[];list.push(o);buckets.set(o.material,list)}});
 const merged:THREE.Mesh[]=[];let index=0;
 for(const [material,meshes] of buckets){const g=kit.geometry(`sector-dressing:v1:${level}:${index++}`,()=>{const copies=meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));return g});const combined=mergeGeometries(copies,false)!;copies.forEach(g=>g.dispose());return combined});const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;m.userData.noPick=true;merged.push(m)}
 root.clear();root.add(...merged);return root;
}
