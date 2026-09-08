import * as THREE from 'three';
import type {RenderKit} from './render-kit';
export function buildGlassShards(kit:RenderKit,g:THREE.Group){
 g.name='shattered-glass';
 const geo=kit.geometry('glass:shard',()=>{const shape=new THREE.Shape();shape.moveTo(-.04,-.065);shape.lineTo(.055,-.025);shape.lineTo(.017,.095);shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:false,steps:1})});
 // Merge static fragments by tint: three draws rather than eleven tiny meshes.
 for(let tint=0;tint<3;tint++){
  const merged=kit.geometry('glass:cluster:'+tint,()=>{
   const positions:number[]=[],normals:number[]=[],uvs:number[]=[],pose=new THREE.Object3D(),v=new THREE.Vector3(),normal=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
   for(let i=tint;i<11;i+=3){const angle=i*2.399,r=.09+Math.sqrt(i/11)*.31;
    pose.position.set(Math.sin(angle)*r,.035+(i%3)*.006,Math.cos(angle)*r);pose.rotation.set(-Math.PI/2+(i%3)*.12,0,angle);pose.scale.setScalar(.65+(i%4)*.22);pose.updateMatrix();normalMatrix.getNormalMatrix(pose.matrix);
    for(let j=0;j<geo.attributes.position.count;j++){v.fromBufferAttribute(geo.attributes.position,j).applyMatrix4(pose.matrix);positions.push(v.x,v.y,v.z);normal.fromBufferAttribute(geo.attributes.normal,j).applyMatrix3(normalMatrix).normalize();normals.push(normal.x,normal.y,normal.z);uvs.push(geo.attributes.uv.getX(j),geo.attributes.uv.getY(j));}
   }
   const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));result.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));result.computeBoundingBox();return result;
  });
  const fragments=new THREE.Mesh(merged,kit.material([0xcce7d7,0x79ad91,0x497e66][tint],'glass'));fragments.userData.noPick=true;g.add(fragments);
 }
 const neck=new THREE.Mesh(kit.geometry('glass:broken-neck',()=>new THREE.CylinderGeometry(.042,.05,.12,12,1,true,0,Math.PI*1.35)),kit.material(0xa4cdb1,'glass'));neck.position.set(.07,.085,-.08);neck.rotation.z=1.3;neck.userData.noPick=true;g.add(neck);
}
