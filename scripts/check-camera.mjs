import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createMapCameraControls } from '../app/game/camera-controls.ts';
import { MIN_ZOOM, MAX_ZOOM } from '../app/game/camera-settings.mjs';

// Exercise actual event handlers and Three camera projection without a browser or GPU.
globalThis.window=new EventTarget();
class Canvas extends EventTarget {
  style={};clientHeight=700;captures=new Set();
  getBoundingClientRect(){return {left:0,top:0,width:1000,height:700};}
  focus(){}
  setPointerCapture(id){this.captures.add(id);}
  hasPointerCapture(id){return this.captures.has(id);}
  releasePointerCapture(id){this.captures.delete(id);fire('lostpointercapture',{pointerId:id});}
}
const canvas=new Canvas(),camera=new THREE.OrthographicCamera(-20,20,14,-14,.1,200);
const target=new THREE.Vector3(),offset=new THREE.Vector3(28,33,28);
camera.position.copy(offset);camera.lookAt(target);camera.updateMatrixWorld(true);
let taps=0,hovers=0,clears=0,reportedZoom=1;
const controls=createMapCameraControls(canvas,camera,target,offset,{
  onZoom:z=>reportedZoom=z,onTap:()=>taps++,onHover:()=>hovers++,onClearHover:()=>clears++,bounds:()=>({x:10,z:9}),
});
function fire(type,properties={}){
  const event=new Event(type,{cancelable:true});
  Object.assign(event,{pointerId:1,pointerType:'mouse',button:0,clientX:500,clientY:350,deltaY:0,deltaMode:0,...properties});
  canvas.dispatchEvent(event);return event;
}
const touch=(type,id,x,y)=>fire(type,{pointerType:'touch',pointerId:id,clientX:x,clientY:y});
function ground(x,y){
  const ray=new THREE.Raycaster();camera.updateMatrixWorld(true);ray.setFromCamera(new THREE.Vector2(x/500-1,1-y/350),camera);
  return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const anchor=ground(620,300);
const wheel=fire('wheel',{clientX:620,clientY:300,deltaY:-120});
assert.ok(wheel.defaultPrevented);assert.ok(camera.zoom>1);near(camera.zoom,reportedZoom);
assert.ok(anchor.distanceTo(ground(620,300))<1e-7,'Wheel keeps the ground point under the cursor');
controls.setZoom(100);near(camera.zoom,MAX_ZOOM);controls.setZoom(.001);near(camera.zoom,MIN_ZOOM);
controls.reset();near(camera.zoom,1);near(target.length(),0);
fire('wheel',{deltaY:-3,deltaMode:1});const lineZoom=camera.zoom;
controls.reset();fire('wheel',{deltaY:-48,deltaMode:0});near(camera.zoom,lineZoom);
controls.reset();fire('pointerdown');assert.equal(taps,1,'Mouse click acts immediately');
touch('pointerdown',10,400,350);assert.equal(taps,1,'First touch waits for release');
touch('pointerup',10,400,350);assert.equal(taps,2,'A single tap acts once');
touch('pointerdown',11,400,350);touch('pointermove',11,450,350);touch('pointerup',11,450,350);
assert.equal(taps,2,'One-finger drag does not issue a game command');assert.ok(target.length()>0);
controls.reset();touch('pointerdown',20,400,350);touch('pointerdown',21,600,350);
const pinchAnchor=ground(500,350);touch('pointermove',21,800,350);
near(camera.zoom,2);assert.ok(pinchAnchor.distanceTo(ground(600,350))<1e-7,'Pinch keeps its anchor while the midpoint moves');
touch('pointerup',20,400,350);touch('pointermove',21,810,350);touch('pointerup',21,810,350);
assert.equal(taps,2,'Lifting both pinch fingers never becomes a tap');
for(const cancel of ['pointercancel','lostpointercapture']){
  touch('pointerdown',30,400,350);touch(cancel,30,400,350);touch('pointerup',30,400,350);assert.equal(taps,2);
}
touch('pointerdown',31,400,350);window.dispatchEvent(new Event('blur'));touch('pointerup',31,400,350);assert.equal(taps,2);
controls.reset();fire('pointerdown',{button:2});fire('pointermove',{clientX:550});fire('pointerup',{button:2,clientX:550});
assert.equal(taps,2);assert.ok(target.length()>0,'Right drag pans');
controls.reset();near(target.length(),0);near(camera.zoom,1);
fire('keydown',{key:'+'});assert.ok(camera.zoom>1);fire('keydown',{key:'0'});near(camera.zoom,1);
const browserZoom=fire('keydown',{key:'+',metaKey:true});assert.ok(!browserZoom.defaultPrevented);near(camera.zoom,1);
controls.focus(2,1,{x:700,y:350});
assert.ok(ground(700,350).distanceTo(new THREE.Vector3(2,0,1))<1e-7,'Tutorial focus puts the target in the unobscured map area');
controls.focus(0,0,{x:500,y:430});
assert.ok(ground(500,430).length()<1e-7,'Tutorial focus can reserve space above a mobile map target');
controls.reset();
fire('pointermove');assert.ok(hovers>0);
controls.dispose();const beforeDispose={taps,clears,zoom:camera.zoom};
assert.ok(!fire('wheel',{deltaY:-120}).defaultPrevented);fire('pointerdown');window.dispatchEvent(new Event('blur'));
assert.equal(taps,beforeDispose.taps);assert.equal(clears,beforeDispose.clears);near(camera.zoom,beforeDispose.zoom);
assert.equal(canvas.captures.size,0);
console.log('Camera controls passed: cursor anchor, 65–320% limits, wheel units, tap, pan, pinch, cancellation, reset, keyboard and cleanup.');
