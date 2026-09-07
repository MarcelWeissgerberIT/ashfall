import * as THREE from 'three';
import type { RenderKit } from './render-kit';
export function createPuppy(kit:RenderKit){
 const root=new THREE.Group(),body=new THREE.Group();root.name='Koda';root.add(body);
 const fur=0xb88751,dark=0x39372f,cream=0xd8b681;
 const E=(g:THREE.Object3D,x:number,y:number,z:number,a:number,b:number,c:number,color:number)=>kit.ellipsoid(g,x,y,z,a,b,c,color);
 E(body,0,.38,0,.155,.19,.32,fur);E(body,0,.48,-.06,.15,.115,.24,dark);E(body,0,.30,.10,.13,.12,.23,cream);
 const head=new THREE.Group();head.position.set(0,.59,.24);body.add(head);
 E(head,0,.025,.025,.15,.155,.155,fur);E(head,0,.07,.01,.117,.104,.132,dark);
 for(const side of [-1,1]){E(head,side*.075,.006,.116,.065,.081,.08,fur);E(head,side*.071,.055,.139,.032,.037,.021,0x252c29);E(head,side*.073,.055,.155,.019,.026,.009,0x32291f);E(head,side*.077,.065,.161,.007,.008,.003,0xffedca);E(head,side*.067,.099,.119,.032,.015,.012,cream);}
 E(head,0,-.035,.161,.082,.06,.107,cream);E(head,0,-.014,.249,.059,.033,.028,0x242b28);
 const jaw=new THREE.Group();jaw.position.set(0,-.065,.12);head.add(jaw);E(jaw,0,0,.055,.068,.023,.08,0x996e45);E(jaw,0,.015,.095,.024,.008,.028,0xb47b6b);
 const ears=[];for(const side of [-1,1]){const ear=new THREE.Group();ear.position.set(side*.095,.12,-.005);head.add(ear);const geo=kit.geometry('puppy-ear',()=>{const shape=new THREE.Shape();shape.moveTo(-.065,0);shape.quadraticCurveTo(-.04,.18,0,.22);shape.quadraticCurveTo(.055,.14,.065,0);const g=new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSegments:2,bevelSize:.012,bevelThickness:.012,steps:1});return g});const mesh=new THREE.Mesh(geo,kit.material(dark));ear.add(mesh);E(ear,0,.086,.037,.035,.082,.012,0xad8261);ear.rotation.z=-side*.18;ear.rotation.x=side===1?.22:-.06;ears.push(ear);}
 const legs=[];for(const z of [-.20,.20])for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.115,.31,z);body.add(leg);E(leg,0,-.095,0,.051,.125,.055,fur);const paw=new THREE.Group();paw.position.set(0,-.23,.025);leg.add(paw);E(paw,0,0,.025,.065,.046,.088,cream);for(const x of [-.03,0,.03])E(paw,x,-.006,.09,.012,.012,.02,dark);legs.push(leg);}
 const tail=new THREE.Group();tail.position.set(0,.44,-.27);body.add(tail);const tailMid=new THREE.Group();tailMid.position.set(0,-.04,-.12);tail.add(tailMid);E(tail,0,-.025,-.075,.06,.063,.12,fur);E(tailMid,0,-.026,-.085,.05,.05,.12,dark);
 const collar=kit.cylinder(body,0,.51,.19,.131,.046,0x8c5144,.132);collar.rotation.x=Math.PI/2;E(body,0,.43,.296,.025,.033,.009,0xd7b972);
 kit.contact(root,0,0,.66,.9);root.userData={body,head,jaw,ears,legs,tail,tailMid,lastX:0,lastY:0,phase:0,started:false};return root;
}
export function animatePuppy(root:THREE.Group,dog:any,dt:number,playing:boolean,time:number){
 const d=root.userData,dist=d.started?Math.hypot(dog.x-d.lastX,dog.y-d.lastY):0;d.started=true;d.lastX=dog.x;d.lastY=dog.y;
 root.position.set(dog.x,0,dog.y);root.rotation.y=dog.facing||0;
 if(!playing)return;
 const moving=dist>.0001&&dist<1;d.phase+=moving?dist*11:dt*1.5;
 const stride=moving?Math.sin(d.phase):0,bite=dog.action>0?Math.sin((.5-dog.action)/.5*Math.PI):0;
 d.body.position.y=moving?Math.abs(stride)*.025:Math.sin(time*2.5)*.004;
 d.body.rotation.x=-bite*.14;
 d.legs.forEach((leg:THREE.Group,i:number)=>{leg.rotation.x=moving?Math.sin(d.phase+(i===0||i===3?0:Math.PI))*.53:0;});
 d.head.rotation.x=(moving?Math.sin(d.phase)*.045:Math.sin(time*1.7)*.055)-bite*.2;
 d.head.rotation.y=moving?0:Math.sin(time*.8)*.16;
 d.jaw.rotation.x=dog.mode==='defend'?.12+bite*.35:.045+Math.max(0,Math.sin(time*2))*.06;
 d.tail.rotation.y=Math.sin(time*(dog.mode==='defend'?11:7))*(moving?.35:.55);d.tail.rotation.x=-.25+(moving?.1:0);d.tailMid.rotation.y=Math.sin(time*7-.5)*.2;
 d.ears.forEach((ear:THREE.Group,i:number)=>{ear.rotation.x=(i?.22:-.06)+(moving?Math.sin(d.phase+.4)*.12:Math.sin(time*2+i)*.035)});
}
