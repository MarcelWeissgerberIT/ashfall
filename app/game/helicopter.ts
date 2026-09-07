import * as THREE from 'three';
import type {createRenderKit} from './render-kit';
export function createHelicopter(kit:ReturnType<typeof createRenderKit>){
 const g=new THREE.Group(),rotor=new THREE.Group();
 kit.box(g,0,.65,0,1.45,1.25,2.5,0x687363,'carPaint');
 kit.box(g,0,.85,1.32,1.26,.75,.45,0x354d51,'glass');
 kit.box(g,0,.82,-2,.28,.4,2.4,0x687363,'carPaint');
 kit.box(g,0,1.05,-3,.12,1.15,.55,0x9caa90,'brushedSteel');
 kit.box(g,0,1,-2.8,1.8,.09,.35,0x697968,'brushedSteel');
 for(const x of [-.83,.83]){kit.box(g,x,.1,0,.12,.12,3.4,0x273c3e,'brushedSteel');for(const z of [-.8,.8])kit.box(g,x,.2,z,.1,.55,.12,0x8d9d92,'brushedSteel');kit.box(g,x*.9,1,0,.025,.65,1.05,0x243c40,'glass');kit.box(g,x*.93,.82,-.55,.05,.55,.08,0xcebb83,'brushedSteel');}
 kit.cylinder(g,0,1.9,0,.12,.45,0x34433f);rotor.position.y=2.3;g.add(rotor);
 for(let i=0;i<4;i++){const blade=new THREE.Group();blade.rotation.y=i*Math.PI/2;kit.box(blade,1.7,0,0,3.2,.045,.17,0x273b38,'brushedSteel');kit.box(blade,3.1,.002,0,.35,.05,.17,0xd7b679);rotor.add(blade);}
 const lamp=new THREE.PointLight(0xf8d29b,16,9);lamp.position.set(0,.8,1.7);g.add(lamp);g.userData.rotor=rotor;return g;
}
export function animateHelicopter(g:THREE.Group,signal:number,boarding:number,time:number){
 g.visible=signal>=0&&signal<=8;if(!g.visible)return;
 const arrival=Math.max(0,signal)/8,depart=boarding<0?1:boarding>0?Math.max(0,1-boarding/3):0;
 g.position.set(16+arrival*9+depart*5,.05+arrival*7+depart*8,10-arrival*5);g.rotation.y=-.45;g.userData.rotor.rotation.y=time*25;
}
