import * as THREE from 'three';
import type {RenderKit} from './render-kit';
const hash=(n:number,s:number)=>{const v=Math.sin(n*127.1+s*311.7)*43758.5453;return v-Math.floor(v)};
// Cosmetic only: no entity, pathfinding or inventory state is changed here.
export function createAtmosphere(kit:RenderKit,parent:THREE.Group,level:number,entities:any[],blocked:(x:number,y:number)=>boolean){
 const root=new THREE.Group();root.name='Sector atmosphere';parent.add(root);
 const ownedGeometry:THREE.BufferGeometry[]=[],ownedMaterial:THREE.Material[]=[];
 const ownG=<T extends THREE.BufferGeometry>(g:T)=>{ownedGeometry.push(g);return g};
 const ownM=<T extends THREE.Material>(m:T)=>{ownedMaterial.push(m);return m};
 const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),scale=new THREE.Vector3(),pos=new THREE.Vector3();
 // Small chips, discarded paper and glass catch side light without becoming obstacles.
 const litter=new THREE.InstancedMesh(ownG(new THREE.BoxGeometry(1,1,1)),ownM(new THREE.MeshStandardMaterial({roughness:.84})),160);let count=0;
 for(let i=0;i<160;i++){const x=hash(i,1)*20,z=hash(i,2)*18;if(blocked(Math.round(x),Math.round(z))||entities.some(e=>e.type!=='prop'&&Math.hypot(e.x-x,e.y-z)<.75))continue;
  pos.set(x,.027,z);q.setFromAxisAngle(new THREE.Vector3(0,1,0),hash(i,3)*6.28);scale.set(.025+hash(i,4)*.16,.012,.035+hash(i,5)*.2);matrix.compose(pos,q,scale);litter.setMatrixAt(count,matrix);litter.setColorAt(count,new THREE.Color([0x899285,0x4a625e,0xa0a38b,0x64564a][i%4]));count++;
 }litter.count=count;litter.receiveShadow=true;root.add(litter);
 // Fine drifting dust in the bunker; wind-driven ash outdoors. One draw call.
 const n=level===1?90:150,positions=new Float32Array(n*3),origins=new Float32Array(n*3);
 for(let i=0;i<n;i++){origins[i*3]=hash(i,12)*21;origins[i*3+1]=.3+hash(i,13)*4;origins[i*3+2]=hash(i,14)*19;}positions.set(origins);
 const dustGeo=ownG(new THREE.BufferGeometry());dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const dustMat=ownM(new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{tint:{value:new THREE.Color(level===1?0xb3dbca:0xc8c3a6)}},vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=2.5;}',fragmentShader:'uniform vec3 tint;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(tint,(1.-smoothstep(.15,.5,d))*.32);}'}));const dust=new THREE.Points(dustGeo,dustMat);dust.frustumCulled=false;root.add(dust);
 // Low, translucent steam plumes remain below faces and interaction labels.
 const mistMat=ownM(new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},tint:{value:new THREE.Color(level===1?0x91bdb3:0x91a4a0)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv;uniform float time;uniform vec3 tint;void main(){vec2 p=vUv-.5;float edge=1.-smoothstep(.1,.5,length(p*vec2(1.,1.3)));float wisps=.55+.25*sin(vUv.x*18.+time*.7+sin(vUv.y*12.-time));gl_FragColor=vec4(tint,edge*wisps*.115);}'}));
 const mistGeo=ownG(new THREE.PlaneGeometry(3.2,1.3)),mist:THREE.Mesh[]=[];
 const vents=level===0?[[6.7,5.8],[14.6,13.8],[3,8]]:level===1?[[3,6.5],[14,8.5],[18,11.5]]:[[2,7],[18,5],[6,14]];
 for(const [x,z] of vents){const m=new THREE.Mesh(mistGeo,mistMat);m.position.set(x,.55,z);m.rotation.y=Math.PI/4;m.userData.baseX=x;root.add(m);mist.push(m);}
 // Water rings spread over exposed surfaces; dust and steam have no collision.
 const rippleGeo=ownG(new THREE.RingGeometry(.88,1,24)),rippleMat=ownM(new THREE.MeshBasicMaterial({color:0xa3c1bd,transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide}));
 const ripples=new THREE.InstancedMesh(rippleGeo,rippleMat,level===1?8:28);root.add(ripples);
 const flat=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
 // Small emergency indicators on actual structures and leaking pipe collars.
 const lamps:{light:THREE.PointLight;base:number;phase:number}[]=[];
 const structures=entities.filter(e=>e.style==='wall'||e.type==='generator'||e.type==='radio').slice(0,5);
 structures.forEach((e,i)=>{const x=e.x+(e.w||1)*.5-.5,z=e.y+(e.h||1)*.5-.5;
  const color=level===1?0xdf7753:0xd6aa69;kit.box(root,x,1.05,z+.48,.18,.12,.045,0x394c43,'steel');kit.box(root,x,1.07,z+.51,.11,.07,.026,color,undefined,color);
  if(i<2){const light=new THREE.PointLight(color,2.8,3,2);light.position.set(x,1.2,z+.7);root.add(light);lamps.push({light,base:2.8,phase:i*2.4});}
 });
 // Sagging utility cables sit against the perimeter rather than across walkways.
 for(let i=0;i<3;i++){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(1+i*6,1.8,.5),new THREE.Vector3(3+i*6,1.48,.52),new THREE.Vector3(5+i*6,1.8,.5)]);const wire=new THREE.Mesh(ownG(new THREE.TubeGeometry(curve,18,.016,5,false)),ownM(new THREE.MeshStandardMaterial({color:0x283a34,roughness:.9})));root.add(wire);}
 let disposed=false;
 function update(time:number){if(disposed)return;mistMat.uniforms.time.value=time;
  for(let i=0;i<n;i++){positions[i*3]=(origins[i*3]+time*(level===1?.035:.19))%21;positions[i*3+1]=.2+(origins[i*3+1]+Math.sin(time*.35+i)*.12)%4.4;positions[i*3+2]=(origins[i*3+2]+time*.055)%19;}dustGeo.attributes.position.needsUpdate=true;
  mist.forEach((m,i)=>{m.position.x=m.userData.baseX+Math.sin(time*.22+i)*.35;m.scale.x=1+Math.sin(time*.3+i)*.14;});
  for(let i=0;i<ripples.count;i++){const age=(time*(level===1?.4:.8)+hash(i,27))%1,x=hash(i+Math.floor(time*.13),23)*20,z=hash(i,24)*18;const r=blocked(Math.round(x),Math.round(z))?0:Math.sin(age*Math.PI)*.15;matrix.compose(new THREE.Vector3(x,.035,z),flat,new THREE.Vector3(r,r,r));ripples.setMatrixAt(i,matrix);}ripples.instanceMatrix.needsUpdate=true;
  lamps.forEach(({light,base,phase})=>{light.intensity=base*(.8+.15*Math.sin(time*2+phase)+.05*Math.sin(time*13+phase));});
 }
 update(0);
 return {update,root,dispose(){if(disposed)return;disposed=true;litter.dispose();ripples.dispose();ownedGeometry.forEach(g=>g.dispose());ownedMaterial.forEach(m=>m.dispose());parent.remove(root);kit.disposeLocal(root);}};
}
