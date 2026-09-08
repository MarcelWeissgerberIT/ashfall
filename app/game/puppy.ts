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
 const legs=[];for(const z of [-.20,.20])for(const side of [-1,1]){
  const leg=new THREE.Group();leg.name=z<0?'hind-hip':'fore-shoulder';leg.position.set(side*.115,.35,z);body.add(leg);
  E(leg,0,-.065,0,z<0?.065:.046,.085,.055,fur);
  const knee=new THREE.Group();knee.name=z<0?'hock':'elbow';knee.position.y=-.145;leg.add(knee);
  E(knee,0,-.071,0,.035,.086,.04,fur);
  const paw=new THREE.Group();paw.name='paw';paw.position.set(0,-.16,.02);knee.add(paw);
  E(paw,0,0,.025,.054,.038,.074,cream);for(const x of [-.026,0,.026])E(paw,x,-.005,.081,.009,.011,.016,dark);
  leg.userData={knee,paw,hind:z<0};legs.push(leg);
 }
 // Layered cheek ruffs and shoulder fur give the shepherd a distinct outline.
 for(const side of [-1,1])for(let i=0;i<3;i++){
  const tuft=E(head,side*(.115+i*.009),-.035-i*.022,.008,.029,.045,.049,i===2?cream:fur);tuft.rotation.z=side*.45;
 }
 const tail=new THREE.Group();tail.position.set(0,.44,-.27);body.add(tail);const tailMid=new THREE.Group();tailMid.position.set(0,-.04,-.12);tail.add(tailMid);E(tail,0,-.025,-.075,.06,.063,.12,fur);E(tailMid,0,-.026,-.085,.05,.05,.12,dark);
 const collar=kit.cylinder(body,0,.51,.19,.131,.046,0x8c5144,.132);collar.rotation.x=Math.PI/2;E(body,0,.43,.296,.025,.033,.009,0xd7b972);
 kit.contact(root,0,0,.66,.9);root.userData={body,head,jaw,ears,legs,tail,tailMid,lastX:0,lastY:0,phase:0,started:false,speed:0,motion:0,sniff:0,play:0,feed:0,heading:0,clock:0};return root;
}
export function animatePuppy(root:THREE.Group,dog:any,dt:number,playing:boolean,time:number){
 const d=root.userData,step=Math.max(0,Math.min(.05,dt)),dist=d.started?Math.hypot(dog.x-d.lastX,dog.y-d.lastY):0;
 d.lastX=dog.x;d.lastY=dog.y;root.position.set(dog.x,0,dog.y);
 if(!d.started){d.heading=dog.facing||0;d.started=true;}
 if(!playing)return;
 d.clock+=step;const t=d.clock;
 const damp=(a:number,b:number,k=9)=>THREE.MathUtils.lerp(a,b,1-Math.exp(-k*step));
 d.heading+=Math.atan2(Math.sin((dog.facing||0)-d.heading),Math.cos((dog.facing||0)-d.heading))*(1-Math.exp(-12*step));root.rotation.y=d.heading;
 d.speed=damp(d.speed,step>0&&dist<1?dist/step:0);d.motion=damp(d.motion,Math.min(1,d.speed/.7));
 const age=dog.care?(Date.now()-dog.care.at)/1000:99;
 d.play=damp(d.play,dog.care?.kind==='play'&&age<3?1:0,6);d.feed=damp(d.feed,dog.care?.kind==='feed'&&age<3?1:0,6);
 d.sniff=damp(d.sniff,['sniff','found'].includes(dog.mode)||d.feed>.2?1:0,6);
 const run=THREE.MathUtils.smoothstep(d.speed,3.2,4.5),bite=dog.action>0?Math.sin(Math.PI*THREE.MathUtils.clamp(1-dog.action/.5,0,1)):0;
 d.phase+=dist<1?dist*(9-run*2):0;
 const bounce=Math.sin(d.phase),bow=d.play*(.5+.5*Math.sin(t*5));
 d.body.position.y=d.motion*Math.abs(bounce)*(.018+run*.035)+Math.sin(t*2.6)*.003-bow*.045;
 d.body.position.z=bite*.09;d.body.rotation.x=-bite*.15+bow*.18+d.sniff*.045;d.body.rotation.z=Math.sin(d.phase*.5)*.02*d.motion;
 d.legs.forEach((leg:THREE.Group,i:number)=>{
  const {knee,paw,hind}=leg.userData;
  const offset=THREE.MathUtils.lerp(i===0||i===3?0:Math.PI,i<2?0:Math.PI*.85,run),phase=d.phase+offset;
  // Two-bone solution: stance sweeps backward, swing lifts the paw clear.
  const swing=Math.max(0,Math.sin(phase)),z=Math.cos(phase)*(.075+run*.03)*d.motion;
  const y=-.295+swing*(.045+run*.035)*d.motion+bow*(hind?.01:.035);
  const length=THREE.MathUtils.clamp(Math.hypot(y,z),.03,.304),upper=.145,lower=.16;
  const bend=Math.acos(THREE.MathUtils.clamp((upper*upper+lower*lower-length*length)/(2*upper*lower),-1,1));
  const sign=hind?-1:1,k=sign*(Math.PI-bend),a=Math.atan2(-z,-y)-Math.atan2(lower*Math.sin(k),upper+lower*Math.cos(k));
  leg.rotation.x=a;knee.rotation.x=k;paw.rotation.x=-a-k;
 });
 d.head.rotation.x=d.sniff*.63-bite*.24+bow*.25+Math.sin(t*7)*.035*d.feed;
 d.head.rotation.y=d.sniff?Math.sin(t*4)*.14:Math.sin(t*.9)*.12*(1-d.motion);
 d.head.rotation.z=Math.sin(t*1.2)*.05*(1-d.motion);
 d.jaw.rotation.x=.035+bite*.5+d.feed*(.06+Math.sin(t*9)*.04)+d.motion*.07;
 d.tail.rotation.y=Math.sin(t*(d.play>.2?11:7))*(.34+d.play*.3);d.tail.rotation.x=-.25+run*.14-d.sniff*.1;d.tailMid.rotation.y=Math.sin(t*7-.6)*.22;
 d.ears.forEach((ear:THREE.Group,i:number)=>{ear.rotation.x=(i?.22:-.06)+Math.sin(d.phase+.5-i*.3)*.13*d.motion+d.sniff*.13-bite*.18;});
}
