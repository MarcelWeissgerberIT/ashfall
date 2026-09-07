import * as THREE from 'three';
import type {RenderKit} from './render-kit';

// Distinct silhouettes for the actual task; visual geometry never changes navigation.
export function buildMissionStation(kit:RenderKit,g:THREE.Group,e:any){
 const metal=0x657d76,dark=0x243633;
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,c=metal,s:any='brushedSteel')=>kit.box(g,x,y,z,w,h,d,c,s);
 const pipe=(x:number,y:number,z:number,r:number,h:number,c=metal)=>kit.cylinder(g,x,y,z,r,h,c,r,'brushedSteel');
 if(e.duration){
  box(0,0,0,.82,.12,.8,dark);box(0,.12,0,.74,.64,.62);box(0,.41,.325,.42,.2,.025,0x588178,'glass');
  for(let x=-.18;x<=.2;x+=.12)box(x,.24,.335,.07,.05,.025,0x242d2a,'rubber');
  pipe(-.3,.76,-.2,.025,1.25);box(-.3,1.76,-.2,.36,.025,.025);box(-.3,1.4,-.2,.27,.025,.025);
  pipe(.26,.76,-.18,.02,.66);box(.17,.15,.34,.09,.06,.02,0xce9452);
 }else if(e.requires==='samplecase'){
  for(const x of [-.36,.36])for(const z of [-.27,.27])box(x,0,z,.06,.75,.06);
  box(0,.75,0,.93,.07,.73);box(0,.83,-.21,.75,.46,.08,0x8aa398,'tiles');
  for(const x of [-.27,0,.27]){kit.cylinder(g,x,.84,.08,.065,.23,0x789d90,.065,'glass');box(x,1.07,.08,.13,.04,.13,0xa6b9a1,'rubber');}
  box(0,.35,0,.61,.18,.48,0x425b51,'carPaint');
 }else if(e.requires==='toolbox'){
  box(0,0,0,.86,.1,.8,dark);pipe(0,.1,0,.26,.78);box(-.3,.21,0,.17,.45,.28);
  pipe(.29,.1,.15,.055,1);box(.15,1.02,.15,.32,.1,.11);pipe(-.29,.66,0,.06,.5);
  box(-.29,1.13,0,.26,.05,.26,0x9b6345,'carPaint');box(0,.5,.275,.16,.19,.02,0xceb994,'glass');
 }else if(e.requires==='axe'){
  for(const x of [-.31,.31])box(x,0,0,.12,.95,.16,0x73674c,'wood');
  for(let y=.15;y<.95;y+=.24){const plank=box(0,y,.09,.93,.14,.08,0x6a5c43,'wood');plank.rotation.z=(y>.4?1:-1)*.12;}
  box(0,.31,-.16,.58,.34,.28,0x516052,'corrugated');
 }else{
  box(0,0,0,.91,.13,.85,dark);box(0,.13,0,.77,.66,.66,0x72816a,'carPaint');
  for(let y=.25;y<.67;y+=.095)box(-.13,y,.345,.36,.027,.025,dark,'rubber');
  box(.22,.47,.35,.14,.2,.026,0x98baa7,'glass');pipe(-.28,.79,-.2,.05,.63);
  box(.12,.79,0,.31,.065,.19,0x8c7050,'rubber');
 }
 const light=kit.box(g,.28,.83,.25,.045,.04,.04,0xedbb6d,undefined,0x93612b);
 light.userData.noPick=true;
}
