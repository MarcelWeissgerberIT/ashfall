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
 kit.contact(root,0,0,.66,.9);root.userData={body,head,jaw,ears,legs,tail,tailMid,lastX:0,lastY:0,phase:0,started:false,speed:0,motion:0,sniff:0,play:0,feed:0,heading:0,clock:0,wag:0,careTime:99,careAt:null,poseInverse:new THREE.Quaternion(),footTarget:new THREE.Vector3()};return root;
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
 // Start every interaction on its own timeline, independent of the idle cycle.
 if(dog.care?.at!==d.careAt||dog.care?.kind!==d.careKind){d.careAt=dog.care?.at;d.careKind=dog.care?.kind;d.careTime=dog.care?Math.max(0,(Date.now()-dog.care.at)/1000):99;}
 else d.careTime+=step;
 const age=d.careTime;
 d.play=damp(d.play,dog.care?.kind==='play'&&age<4.5?1:0,8);d.feed=damp(d.feed,dog.care?.kind==='feed'&&age<3?1:0,6);
 d.sniff=damp(d.sniff,['sniff','found'].includes(dog.mode)||d.feed>.2?1:0,6);
 const run=THREE.MathUtils.smoothstep(d.speed,3.2,4.5),bite=dog.action>0?Math.sin(Math.PI*THREE.MathUtils.clamp(1-dog.action/.5,0,1)):0;
 // Speed is damped: legs finish a step when stopping instead of freezing mid-stride.
 d.phase+=d.speed*step*(9-run*2);
 const smooth=(a:number,b:number,x:number)=>THREE.MathUtils.smoothstep(x,a,b);
 const bow=d.play*smooth(.15,.75,age)*(1-smooth(1.2,1.75,age));
 const hop=d.play*.075*Math.sin(Math.PI*smooth(1.85,2.4,age));
 const tilt=d.play*smooth(2.6,2.95,age)*(1-smooth(3.55,4.15,age));
 d.body.position.y=d.motion*(1-Math.cos(d.phase*2))*.009+Math.sin(t*2.6)*.002-bow*.06+hop;
 d.body.position.z=bite*.07;d.body.rotation.x=-bite*.12+bow*.23+d.sniff*.035;d.body.rotation.z=Math.sin(d.phase*.5)*.012*d.motion;
 d.poseInverse.copy(d.body.quaternion).invert();
 d.legs.forEach((leg:THREE.Group,i:number)=>{
  const {knee,paw,hind}=leg.userData;
  const offset=THREE.MathUtils.lerp(i===0||i===3?0:Math.PI,i<2?0:Math.PI*.85,run),phase=d.phase+offset;
  // Ground-space paw targets compensate torso pitch during the play bow.
  const cycle=(phase/(Math.PI*2)%1+1)%1,stance=.62;
  const swing=cycle<stance?0:Math.sin(Math.PI*(cycle-stance)/(1-stance))**2;
  const travel=cycle<stance?1-2*cycle/stance:-1+2*smooth(0,1,(cycle-stance)/(1-stance));
  const stride=.07+run*.025;
  const lift=swing*(.045+run*.025)*d.motion;
  d.footTarget.set(leg.position.x,.053+lift+hop,leg.position.z+travel*stride*d.motion+(hind?0:bow*.075));
  d.footTarget.sub(d.body.position).applyQuaternion(d.poseInverse).sub(leg.position);
  const y=d.footTarget.y,z=d.footTarget.z;
  const length=THREE.MathUtils.clamp(Math.hypot(y,z),.03,.304),upper=.145,lower=.16;
  const bend=Math.acos(THREE.MathUtils.clamp((upper*upper+lower*lower-length*length)/(2*upper*lower),-1,1));
  const sign=hind?-1:1,k=sign*(Math.PI-bend),a=Math.atan2(-z,-y)-Math.atan2(lower*Math.sin(k),upper+lower*Math.cos(k));
  leg.rotation.x=a;knee.rotation.x=k;paw.rotation.x=-a-k-d.body.rotation.x;
 });
 d.head.rotation.x=d.sniff*.63-bite*.24+bow*.25+Math.sin(t*7)*.035*d.feed;
 d.head.rotation.y=THREE.MathUtils.lerp(Math.sin(t*.9)*.12*(1-d.motion),Math.sin(t*4)*.14,d.sniff);
 d.head.rotation.z=Math.sin(t*1.2)*.035*(1-d.motion)+tilt*.24;
 d.jaw.rotation.x=.035+bite*.5+d.feed*(.06+Math.sin(t*9)*.04)+d.motion*.07;
 d.wag+=step*(7+d.play*3);d.tail.rotation.y=Math.sin(d.wag)*(.34+d.play*.23);d.tail.rotation.x=-.25+run*.14-d.sniff*.1;d.tailMid.rotation.y=Math.sin(d.wag-.6)*.22;
 d.ears.forEach((ear:THREE.Group,i:number)=>{ear.rotation.x=(i?.22:-.06)+Math.sin(d.phase+.5-i*.3)*.13*d.motion+d.sniff*.13-bite*.18;});
}
