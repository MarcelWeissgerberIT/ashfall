import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { RenderKit, Surface } from './render-kit';

const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
function mesh(kit:RenderKit,parent:THREE.Group,key:string,make:()=>THREE.BufferGeometry,color:number,surface?:Surface){
  const object=new THREE.Mesh(kit.geometry(key,make),kit.material(color,surface));object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
}
function extrude(points:number[][],depth:number){
  const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1});g.translate(0,0,-depth/2);
  const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++){
    const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
    const top=ny>=nx&&ny>=nz,side=!top&&nx>=nz;
    uv.setXY(i,(side?p.getZ(i):p.getX(i))/2.5,(top?p.getZ(i):p.getY(i))/1.875);
  }
  return g;
}
function beam(kit:RenderKit,parent:THREE.Group,a:number[],b:number[],radius:number,color:number,surface?:Surface){
  const start=new THREE.Vector3(a[0],a[1],a[2]),end=new THREE.Vector3(b[0],b[1],b[2]),direction=end.clone().sub(start),length=direction.length();
  const m=kit.cylinder(parent,0,-length/2,0,radius,length,color,radius,surface);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return m;
}
function pane(kit:RenderKit,parent:THREE.Group,key:string,points:number[][],color:number){
  return mesh(kit,parent,key,()=>{
    const positions:number[]=[],uv:number[]=[];
    for(let i=1;i<points.length-1;i++)for(const indices of [[0,i,i+1],[i+1,i,0]])for(const index of indices){const p=points[index];positions.push(...p);uv.push((p[0]+p[2]+2)/3,p[1]/1.5);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
  },color,'glass');
}
// Collapse the static detail pieces by material. Picking remains attached to the parent entity.
function batch(kit:RenderKit,root:THREE.Group,key:string){
  root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
  const groups=new Map<THREE.Material,THREE.Mesh[]>();
  root.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)){const list=groups.get(o.material)||[];list.push(o);groups.set(o.material,list);}});
  const combined:THREE.Mesh[]=[];let index=0;
  for(const [material,objects] of groups){
    const geometry=kit.geometry(`${key}:batch:${index++}`,()=>{
      const copies=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));return g;});
      const merged=mergeGeometries(copies,false)!;copies.forEach(g=>g.dispose());return merged;
    });
    const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;combined.push(m);
  }
  root.clear();root.add(...combined);
}

export function buildWall(kit:RenderKit,parent:THREE.Group,e:any,level:number){
  const w=e.w||1,d=e.h||1,length=Math.max(w,d),depth=Math.min(w,d),bunker=level===1;
  const signature=`${e.id}:${e.x}:${e.y}:${w}:${d}:${level}`;
  const g=new THREE.Group();g.position.set((w-1)/2,0,(d-1)/2);if(d>w)g.rotation.y=Math.PI/2;parent.add(g);
  const height=bunker?1.38:e.y<2?2.5:1.65;
  const thick=depth-.12;
  kit.box(g,0,0,0,length-.04,.24,depth-.04,0x65756b,'concrete');
  if(bunker){
    kit.box(g,0,.24,0,length-.08,height-.24,thick,0x929f92,'concrete');
    for(const side of [-1,1]){
      const z=side*(thick/2+.012);
      kit.box(g,0,.24,z,length-.1,.88,.024,0xc5cbb5,'tiles');
      kit.box(g,0,.17,z,length-.08,.13,.036,0x657970,'brushedSteel');
      kit.box(g,0,1.12,z,length-.07,.07,.035,0x7a9185,'brushedSteel');
      beam(kit,g,[-length/2+.12,1.27,z],[length/2-.12,1.27,z],.021,0x7b8f81,'steel');
      for(let i=0;i<length;i+=2){const x=-length/2+i+.16;kit.box(g,x,.27,z,.075,.89,.044,0x667a6b,'brushedSteel');kit.box(g,x,1.22,z,.065,.095,.057,0xa5b29b,'brushedSteel');}
    }
    kit.box(g,0,height,0,length-.04,.09,depth-.02,0xa7b1a1,'concrete');
    for(const x of [-length/2+.1,length/2-.1])kit.box(g,x,.24,0,.16,height-.2,depth-.045,0x919f8c,'concrete');
  }else{
    const count=Math.ceil(length/1.45),span=(length-.06)/count;
    for(let i=0;i<count;i++){
      const x=-length/2+.03+span*(i+.5),damage=hash(e.x+i,e.y)>.4;
      const top=height-(damage?.12+hash(i,e.x)*.22:0),width=span-.035;
      const profile=damage?[[-width/2,.2],[width/2,.2],[width/2,top-.04],[width*.25,top],[width*.1,top-.35],[-width*.13,top-.22],[-width*.3,top+.04],[-width/2,top-.02]]:[[-width/2,.2],[width/2,.2],[width/2,top],[-width/2,top]];
      const panel=mesh(kit,g,`wall-panel:${signature}:${i}`,()=>extrude(profile,thick),i%2?0x8f9b8b:0x9ca695,'concrete');panel.position.x=x;
      if(!damage)kit.box(g,x,top,0,width+.015,.09,thick+.07,0xb2b9a3,'concrete');
      if(damage){
        for(const t of [-.11,.13]){const rod=beam(kit,g,[x+t,top-.26,0],[x+t+.06,top+.28+hash(i,t)*.2,.035],.018,0x7b6950,'steel');rod.rotation.x=.1;}
        for(const side of [-1,1]){const chip=mesh(kit,g,`wall-chip:${signature}:${i}:${side}`,()=>extrude([[-.19,0],[.16,.025],[.13,.22],[-.08,.33],[-.23,.15]],.024),0x575f50,'concrete');chip.position.set(x+.12,top-.46,side*(thick/2+.013));}
      }
      for(const side of [-1,1]){
        const z=side*(thick/2+.017),cx=x-width*.2;
        beam(kit,g,[cx,.3,z],[cx+.08,.58,z],.009,0x455447);
        beam(kit,g,[cx+.08,.58,z],[cx-.025,.82,z],.008,0x455447);
        for(const y of [.55,Math.min(1.4,top-.3)]){const tie=kit.cylinder(g,x+width*.27,y,z,.025,.012,0x445449);tie.rotation.x=Math.PI/2;}
      }
    }
  }
  batch(kit,g,`wall:${signature}`);
}

export function buildBarrier(kit:RenderKit,parent:THREE.Group,e:any){
  const g=new THREE.Group();parent.add(g);
  for(let x=0;x<(e.w||1);x++)for(let z=0;z<(e.h||1);z++){
    const block=mesh(kit,g,'jersey-barrier',()=>extrude([[-.44,0],[.44,0],[.44,.21],[.22,.68],[.22,.96],[-.22,.96],[-.22,.68],[-.44,.21]],.94),0x929984,'concrete');block.rotation.y=Math.PI/2;block.position.set(x,0,z);
    for(const side of [-1,1])for(let i=0;i<3;i++){const stripe=kit.box(g,x-.31+i*.3,.73,z+side*.226,.14,.19,.016,i%2?0x354137:0xc6a154);stripe.rotation.z=-.32;}
    for(const sx of [-.31,.31])kit.box(g,x+sx,.14,z,.07,.04,.9,0x58654e,'steel');
  }
  batch(kit,g,`barrier:${e.id}:${e.w||1}:${e.h||1}`);
}

export function buildVehicle(kit:RenderKit,parent:THREE.Group,e:any){
  const hatch=new THREE.Group(),cargo=new THREE.Group();
  const van=e.id==='car2',g=new THREE.Group();g.position.set(.5,0,1);parent.add(g);
  const paint=van?0xb9b7a0:0x9aada1,surface:Surface=van?'steel':'carPaint';
  kit.box(g,0,.23,0,1.22,.18,2.45,0x69745f,'steel');kit.box(g,0,.48,0,1.4,.08,2.58,0x69745f,'steel');
  for(const z of [-.91,.91]){
    beam(kit,g,[-.82,.3,z],[.82,.3,z],.05,0x9fac98,'brushedSteel');
    for(const side of [-1,1]){
      const wheel=kit.cylinder(g,side*.82,0,z,.32,.22,0x8c9788,.32,'rubber');wheel.rotation.z=Math.PI/2;wheel.position.y=.32;
      const rim=kit.cylinder(g,side*.943,0,z,.19,.02,0x9fac98,.19,'brushedSteel');rim.rotation.z=Math.PI/2;rim.position.y=.32;
      const hub=kit.cylinder(g,side*.959,0,z,.065,.021,0x69745f,.065,'steel');hub.rotation.z=Math.PI/2;hub.position.y=.32;
    }
  }
  for(const side of [-1,1]){
    const panel=mesh(kit,g,`vehicle-sill:${van}`,()=>{
      const s=new THREE.Shape();s.moveTo(-1.4,.26);s.lineTo(-1.27,.26);s.absarc(-.91,.26,.36,Math.PI,0,true);s.lineTo(.55,.26);s.absarc(.91,.26,.36,Math.PI,0,true);s.lineTo(1.4,.26);s.lineTo(1.4,.69);s.lineTo(.8,.78);s.lineTo(-.85,.78);s.lineTo(-1.4,.64);s.closePath();
      const geo=new THREE.ExtrudeGeometry(s,{depth:.065,bevelEnabled:false,curveSegments:10});geo.translate(0,0,-.0325);return geo;
    },paint,surface);panel.rotation.y=Math.PI/2;panel.position.x=side*.737;
    kit.box(g,side*.746,.69,0,.024,.045,1.34,0x9fac98,'brushedSteel');
    for(const z of [-.04,.56])kit.box(g,side*.777,.69,z,.03,.05,.17,0x9fac98,'brushedSteel');
  }
  for(const z of [-1.41,1.41])kit.box(g,0,.28,z,1.58,.13,.075,0x9fac98,'brushedSteel');
  kit.box(g,0,.44,-1.399,.79,.2,.035,0x202d28);for(let i=0;i<5;i++)kit.box(g,-.32+i*.16,.45,-1.427,.022,.16,.019,0x9fac98,'brushedSteel');
  for(const x of [-.56,.56]){kit.box(g,x,.5,-1.414,.25,.13,.029,0x92ada1,'glass');kit.box(g,x,.51,1.421,.2,.13,.025,0xa76549);}
  // The windscreen is fractured geometry; the missing pieces reveal actual seats.
  const roofY=van?1.68:1.38,roofFront=van?-.51:-.29;
  for(const side of [-1,1]){
    beam(kit,g,[side*.69,.78,-.67],[side*.6,roofY,roofFront],.038,paint,surface);
    beam(kit,g,[side*.68,.78,van?1.27:.88],[side*.6,roofY,van?1.21:.54],.043,paint,surface);
    beam(kit,g,[side*.7,.77,.18],[side*.61,roofY,.18],.033,paint,surface);
    pane(kit,g,`side-shard:${e.id}:${side}`,[[side*.698,.82,-.55],[side*.65,roofY-.14,roofFront+.03],[side*.68,.98,-.15]],0x92ada1);
    kit.box(g,side*.55,.53,0,.37,.18,.46,0x6f7b62,'vinyl',0,true);const seat=kit.box(g,side*.55,.62,.19,.39,.48,.12,0x6f7b62,'vinyl',0,true);seat.rotation.x=-.13;
  }
  pane(kit,g,`windscreen:${e.id}`,[[-.61,roofY-.07,roofFront-.025],[-.68,.84,-.65],[-.1,.87,-.62],[-.26,roofY-.15,roofFront-.045]],0x92ada1);
  pane(kit,g,`windscreen2:${e.id}`,[[.59,roofY-.09,roofFront-.02],[.32,roofY-.12,roofFront-.035],[.67,.86,-.65]],0x92ada1);
  kit.box(g,0,.73,-.5,1.27,.14,.23,0x8c9788,'rubber');
  for(const side of [-1,1])kit.box(g,side*.861,1.04,-.53,.17,.105,.14,paint,surface,0,true);
  const steering=mesh(kit,g,'vehicle-steering',()=>new THREE.TorusGeometry(.13,.021,6,16),0x8c9788,'rubber');steering.position.set(-.34,1,-.35);steering.rotation.x=-.5;
  if(van){
    const roof=kit.box(g,0,roofY,-.2,1.37,.1,.76,0x9fac98,'brushedSteel',0,true);roof.rotation.z=.032;
    for(const side of [-1,1]){kit.box(g,side*.728,.8,.75,.06,.76,1.19,paint,surface);kit.box(g,side*.765,.96,.75,.02,.09,1.08,0x9d5f41);kit.box(g,side*.765,.8,.33,.018,.77,.027,0x69745f,'steel');}
    hatch.position.set(0,1.62,1.375);kit.box(hatch,0,-1.2,0,1.43,1.2,.065,paint,surface);kit.box(hatch,0,-1.15,.043,.032,1.13,.02,0x69745f,'steel');
    for(const x of [-.36,.36])kit.box(hatch,x,-.5,.043,.51,.38,.023,0x92ada1,'glass');
    kit.box(g,0,.56,.84,1.35,.06,1.08,0x3d493e,'rubber');cargo.position.set(0,.63,.83);
    kit.box(g,0,.75,-1.02,1.4,.08,.7,paint,surface,0,true);
  }else{
    const roof=kit.box(g,0,roofY,.12,1.24,.08,.88,paint,surface,0,true);roof.rotation.z=-.055;
    hatch.position.set(0,.8,.79);kit.box(hatch,0,0,.30,1.41,.08,.6,paint,surface,0,true);kit.box(g,0,.51,1.1,1.3,.05,.53,0x364638,'rubber');cargo.position.set(0,.57,1.09);
    // A raised hood stays inside the original 2 × 3 collision footprint.
    kit.box(g,0,.55,-.98,.64,.23,.58,0x9fac98,'brushedSteel');
    for(const x of [-.22,0,.22])kit.cylinder(g,x,.76,-.93,.075,.13,0x69745f,.075,'steel');
    const hood=new THREE.Group();hood.position.set(0,.86,-.55);hood.rotation.x=.48;g.add(hood);kit.box(hood,0,0,-.39,1.42,.05,.78,paint,surface,0,true);
    pane(kit,g,'sedan-rear-glass',[[-.58,roofY-.02,.56],[.58,roofY-.02,.56],[.66,.83,.87],[-.66,.83,.87]],0x92ada1);
  }
  batch(kit,g,`vehicle-v2:${e.id}`);g.add(hatch,cargo);parent.userData.hatch=hatch;parent.userData.hatchAngle=van?-1.4:-1.3;parent.userData.cargo=cargo;parent.userData.cargoScale=van?.7:.52;
}
