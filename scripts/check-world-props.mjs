import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildWall, buildBarrier, buildVehicle } from '../app/game/world-props.ts';
import { LEVELS } from '../app/game/engine.mjs';

// Geometry-only renderer adapter: no browser, texture loading or GPU required.
const geometries=new Map(),materials=new Map();
const kit={
  geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);},
  material(color,surface){const key=`${color}:${surface}`;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color}));return materials.get(key);},
  box(parent,x,y,z,w,h,d,color,surface){const mesh=new THREE.Mesh(kit.geometry(`box:${w}:${h}:${d}`,()=>new THREE.BoxGeometry(w,h,d)),kit.material(color,surface));mesh.position.set(x,y+h/2,z);parent.add(mesh);return mesh;},
  cylinder(parent,x,y,z,r,h,color,top=r,surface){const mesh=new THREE.Mesh(kit.geometry(`cylinder:${r}:${h}:${top}`,()=>new THREE.CylinderGeometry(top,r,h,12)),kit.material(color,surface));mesh.position.set(x,y+h/2,z);parent.add(mesh);return mesh;},
};
let objects=0,totalDraws=0;
for(const [level,data] of LEVELS.entries())for(const entity of data.entities){
  const build=entity.style==='wall'?buildWall:entity.style==='barrier'?buildBarrier:entity.style==='car'?buildVehicle:null;if(!build)continue;
  const root=new THREE.Group();build(kit,root,entity,level);root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root);
  assert.ok(bounds.min.x>=-.501&&bounds.max.x<=(entity.w||1)-.499,`${entity.id} X footprint ${bounds.min.x}..${bounds.max.x}`);
  assert.ok(bounds.min.z>=-.501&&bounds.max.z<=(entity.h||1)-.499,`${entity.id} Z footprint ${bounds.min.z}..${bounds.max.z}`);
  let draws=0;root.traverse(object=>{if(object.isMesh){draws++;for(const attribute of Object.values(object.geometry.attributes))assert.ok([...attribute.array].every(Number.isFinite),`${entity.id} has invalid geometry`);}});
  assert.ok(draws<=18,`${entity.id} is not batched: ${draws} draws`);totalDraws+=draws;objects++;
  const count=geometries.size;const rebuilt=new THREE.Group();build(kit,rebuilt,entity,level);assert.equal(geometries.size,count,`${entity.id} rebuild fails geometry reuse`);
}
for(const [key,g] of geometries){
  if(!key.startsWith('wall-panel:')&&key!=='jersey-barrier')continue;
  const uv=g.attributes.uv;
  for(let i=0;i<uv.count;i+=3){
    const area=(uv.getX(i+1)-uv.getX(i))*(uv.getY(i+2)-uv.getY(i))-(uv.getY(i+1)-uv.getY(i))*(uv.getX(i+2)-uv.getX(i));
    assert.ok(Math.abs(area)>1e-10,`${key} has collapsed surface UVs`);
  }
}
for(const g of geometries.values())g.dispose();for(const m of materials.values())m.dispose();
console.log(`${objects} wall, barrier and vehicle models passed: finite geometry, collision footprints, batching (${totalDraws} total draws), repeat builds reuse geometry.`);
