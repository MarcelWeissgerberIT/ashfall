import * as THREE from 'three';
import type {RenderKit} from './render-kit';

/** Chapter landmarks stay inside the existing solid footprint, preserving routes. */
export function buildChapterLandmark(kit:RenderKit,root:THREE.Group,e:any,theme:string,chapter:number){
 const w=e.w||1,h=e.h||1,cx=(w-1)/2,cz=(h-1)/2;
 const g=new THREE.Group();g.name='chapter-landmark:'+theme;root.add(g);
 const B=(x:number,y:number,z:number,a:number,b:number,c:number,color:number,surface:Parameters<RenderKit['box']>[8]='concrete')=>kit.box(g,x,y,z,a,b,c,color,surface);
 const metal=0x56696a,stone=0x697873,light=0xe8bd7d;
 B(cx,0,cz,w-.12,.12,h-.12,stone);
 // Open front and broken low walls keep nearby actors readable from all angles.
 B(cx,.12,h-.57,w-.18,1.05,.13,stone);
 for(const x of [-.4,w-.6])B(x,.12,cz,.13,.75,h-.2,stone);
 if(theme==='hospital'){
  B(cx,.12,cz,w*.62,.55,h*.58,0xa2b5ac,'tiles');
  B(cx,.67,cz,w*.66,.12,h*.62,0xc2c6b5,'brushedSteel');
  B(cx,1.23,h-.66,.48,.13,.04,0x9e473d,'carPaint');B(cx,1.06,h-.66,.13,.47,.04,0x9e473d,'carPaint');
  for(const x of [-.25,w-.75]){B(x,.14,cz,.16,.78,.22,metal,'brushedSteel');B(x,.89,cz,.24,.035,.34,light,'vinyl');}
 }else if(theme==='rooftop'){
  const radius=Math.min(w,h)*.29;
  kit.cylinder(g,cx,.12,cz,radius,.62,metal,radius,'brushedSteel');
  const dome=new THREE.Mesh(kit.geometry('observatory-dome',()=>new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2)),kit.material(0x80999a,'brushedSteel'));
  dome.scale.set(radius,.62,radius);dome.position.set(cx,.74,cz);dome.castShadow=true;g.add(dome);
  B(cx,1.13,cz,.12,.13,Math.min(h-.2,radius*2),0x253d40,'rubber');
  const scope=kit.cylinder(g,cx,.84,cz,.11,.65,0xc0bda0,.15,'brushedSteel');scope.rotation.x=.8;
 }else if(theme==='industrial'||theme==='canal'){
  for(const x of [cx-w*.22,cx+w*.22]){
   kit.cylinder(g,x,.12,cz,Math.min(w*.17,h*.26),.9,metal,Math.min(w*.17,h*.26),'brushedSteel');
   B(x,.63,cz+.12,.15,.18,.12,0xba8c48,'carPaint');
  }
  B(cx,1.05,cz,w*.62,.12,.12,0xab8c56,'brushedSteel');
  for(let i=0;i<4;i++)B(cx-w*.29+i*w*.18,1.19,h-.65,w*.1,.08,.05,i%2?0xcfaa5d:0x303e38,'carPaint');
 }else if(theme==='safe'||theme==='garden'){
  for(const x of [-.28,w-.72])B(x,.12,cz,.075,1.12,.075,0x857658,'wood');
  const roof=B(cx,1.24,cz,w-.3,.065,h*.68,theme==='safe'?0xb29d72:0x5d7d67,'canvas');roof.rotation.x=.07;
  B(cx,.14,cz,w*.63,.3,h*.48,0x6c7955,'wood');
  for(let i=0;i<5;i++)kit.ellipsoid(g,cx-w*.24+i*w*.12,.57,cz,.08,.15,.09,0x7f985d);
  for(const x of [-.28,w-.72])B(x,1.10,cz,.13,.16,.12,light,'glass');
 }else if(theme==='rail'){
  B(cx,.2,cz,w*.75,.6,h*.64,0x697e77,'carPaint');
  B(cx,.81,cz,w*.78,.08,h*.68,metal,'brushedSteel');
  for(let i=0;i<3;i++)B(cx-w*.24+i*w*.24,.47,cz+h*.325,w*.18,.23,.035,0x203d43,'glass');
  B(cx,.28,cz+h*.33,w*.69,.08,.04,0xba9864,'carPaint');
 }else{
  B(cx,.12,cz,w*.65,.65,h*.55,0x857b6c,'concrete');
  for(let i=0;i<3;i++)B(cx-w*.24+i*w*.24,.35,cz+h*.28,w*.15,.28,.045,0x263c40,'glass');
  const awning=B(cx,.89,cz+h*.13,w*.78,.08,h*.46,chapter%2?0x82574c:0x687e75,'corrugated');awning.rotation.x=.15;
  B(cx,1.02,h-.66,w*.52,.16,.04,0xb79d73,'wood');
 }
}
