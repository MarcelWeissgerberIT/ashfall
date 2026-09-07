import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createAtmosphere} from '../app/game/atmosphere.ts';
import {Game} from '../app/game/engine.mjs';
for(let level=0;level<3;level++){
 const g=new Game();g.loadLevel(level);const before=JSON.stringify(g.entities),parent=new THREE.Group(),shared=[];
 const kit={box(parent,x,y,z,w,h,d,color){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color}));mesh.position.set(x,y+h/2,z);parent.add(mesh);shared.push(mesh);return mesh;},disposeLocal(root){root.clear()}};
 const a=createAtmosphere(kit,parent,level,g.entities,(x,y)=>g.isBlocked(x,y));let draws=0,disposed=0;const resources=new Set();a.root.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material);if(o.isMesh||o.isPoints)draws++});resources.forEach(r=>r.addEventListener('dispose',()=>disposed++));
 assert(draws<=20,'Bounded extra draw calls');for(let t=0;t<300;t+=.25)a.update(t);
 const snapshot=()=>{const result=[];a.root.traverse(o=>{result.push(...o.position.toArray(),...o.scale.toArray());if(o.instanceMatrix)result.push(...o.instanceMatrix.array);if(o.geometry?.attributes.position)result.push(...o.geometry.attributes.position.array)});return result};
 a.update(80);const paused=snapshot();assert(paused.every(Number.isFinite));a.update(80);assert.deepEqual(snapshot(),paused,'Unchanged game time freezes atmosphere');assert.equal(JSON.stringify(g.entities),before,'No gameplay mutation');a.dispose();assert.equal(parent.children.length,0);const count=disposed;a.dispose();assert.equal(disposed,count,'Idempotent cleanup');assert(disposed>=10);shared.forEach(m=>{m.geometry.dispose();m.material.dispose()});console.log('Sector '+(level+1)+': '+draws+' atmospheric draws; finite animation, pause and cleanup verified');
}
