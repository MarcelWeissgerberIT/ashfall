import * as THREE from 'three';
import { DEFAULT_ZOOM, clampZoom } from './camera-settings.mjs';
type Point = { x:number; y:number };
type Touch = Point & { startX:number; startY:number; moved:boolean };

export function createMapCameraControls(canvas:HTMLCanvasElement, camera:THREE.OrthographicCamera, target:THREE.Vector3, offset:THREE.Vector3, options:{
  onZoom:(zoom:number)=>void;
  onFollowChange?:(following:boolean)=>void;
  onTap:(event:PointerEvent)=>void;
  onHover:(event:PointerEvent)=>void;
  onClearHover:()=>void;
  bounds:()=>{x:number;z:number};
}) {
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
  const ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const touches=new Map<number,Touch>();
  let following=true,focusHold=0;const initialOffset=offset.clone();
  function setFollowing(value:boolean){following=value;focusHold=0;options.onFollowChange?.(value);}
  function rotate(direction:number){offset.applyAxisAngle(new THREE.Vector3(0,1,0),direction*Math.PI/4);updateCamera();options.onClearHover();}
  let multiTouch=false,drag:{id:number;point:Point}|null=null;
  const point=(event:PointerEvent):Point=>({x:event.clientX,y:event.clientY});
  function updateCamera(){
    const bounds=options.bounds();
    target.x=THREE.MathUtils.clamp(target.x,-bounds.x,bounds.x);
    target.z=THREE.MathUtils.clamp(target.z,-bounds.z,bounds.z);
    camera.position.copy(offset).add(target);camera.lookAt(target);camera.updateMatrixWorld(true);
  }
  function groundAt(screen:Point){
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    ndc.set((screen.x-rect.left)/rect.width*2-1,-(screen.y-rect.top)/rect.height*2+1);
    camera.updateMatrixWorld(true);ray.setFromCamera(ndc,camera);
    return ray.ray.intersectPlane(ground,new THREE.Vector3());
  }
  function transform(zoom:number,from?:Point,to=from){
    const before=from?groundAt(from):null;
    const next=clampZoom(zoom),changed=Math.abs(camera.zoom-next)>.00001;
    camera.zoom=next;camera.updateProjectionMatrix();
    const after=to?groundAt(to):null;
    if(before&&after)target.add(before.sub(after));
    updateCamera();options.onClearHover();
    if(changed)options.onZoom(next);
  }
  function cancelGestures(){
    const ids=[...touches.keys(),...(drag?[drag.id]:[])];
    touches.clear();drag=null;multiTouch=false;
    for(const id of ids)if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
    canvas.style.cursor='crosshair';options.onClearHover();
  }
  function reset(){cancelGestures();offset.copy(initialOffset);setFollowing(true);target.set(0,0,0);transform(DEFAULT_ZOOM);}
  function pair(){
    const [a,b]=[...touches.values()];
    return {center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.hypot(a.x-b.x,a.y-b.y)};
  }
  function down(event:PointerEvent){
    canvas.focus({preventScroll:true});
    if(event.pointerType==='touch'){
      touches.set(event.pointerId,{...point(event),startX:event.clientX,startY:event.clientY,moved:false});
      if(touches.size>1)multiTouch=true;
      canvas.setPointerCapture(event.pointerId);options.onClearHover();return;
    }
    if(event.button===1||event.button===2){
      event.preventDefault();drag={id:event.pointerId,point:point(event)};
      canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';options.onClearHover();
    }else if(event.button===0)options.onTap(event);
  }
  function move(event:PointerEvent){
    const touch=touches.get(event.pointerId);
    if(touch){
      const previous={x:touch.x,y:touch.y},before=touches.size>=2?pair():null;
      touch.x=event.clientX;touch.y=event.clientY;
      if(Math.hypot(touch.x-touch.startX,touch.y-touch.startY)>8)touch.moved=true;
      if(before){
        const after=pair();
        if(before.distance>2&&after.distance>2)transform(camera.zoom*after.distance/before.distance,before.center,after.center);
      }else if(touch.moved||multiTouch){setFollowing(false);transform(camera.zoom,previous,point(event));}
      return;
    }
    if(drag&&event.pointerId===drag.id){setFollowing(false);transform(camera.zoom,drag.point,point(event));drag.point=point(event);return;}
    if(event.pointerType!=='touch')options.onHover(event);
  }
  function up(event:PointerEvent){
    const touch=touches.get(event.pointerId);
    const tap=!!touch&&!multiTouch&&!touch.moved&&Math.hypot(event.clientX-touch.startX,event.clientY-touch.startY)<=8;
    touches.delete(event.pointerId);if(!touches.size)multiTouch=false;
    if(drag?.id===event.pointerId)drag=null;
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor='crosshair';
    if(tap)options.onTap(event);
  }
  function cancelPointer(event:PointerEvent){
    if(touches.has(event.pointerId)||drag?.id===event.pointerId)cancelGestures();
  }
  function wheel(event:WheelEvent){
    event.preventDefault();
    const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1);
    transform(camera.zoom*Math.exp(-THREE.MathUtils.clamp(pixels,-240,240)*.0018),{x:event.clientX,y:event.clientY});
  }
  function key(event:KeyboardEvent){
    if(event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key.toLowerCase()==='q'||event.key.toLowerCase()==='e'){event.preventDefault();if(!event.repeat)rotate(event.key.toLowerCase()==='q'?-1:1);return;}
    if(!['+','=','-','0'].includes(event.key))return;
    event.preventDefault();if(event.key==='0')reset();else transform(camera.zoom*(event.key==='-'?1/1.2:1.2));
  }
  const noMenu=(event:Event)=>event.preventDefault();
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);
  canvas.addEventListener('pointercancel',cancelPointer);canvas.addEventListener('lostpointercapture',cancelPointer);
  canvas.addEventListener('pointerleave',options.onClearHover);canvas.addEventListener('contextmenu',noMenu);
  canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);window.addEventListener('blur',cancelGestures);
  return {
    focus:(x:number,z:number,screen?:Point)=>{
      cancelGestures();focusHold=3;target.set(x,0,z);updateCamera();
      if(screen){const at=groundAt(screen);if(at){target.add(new THREE.Vector3(x,0,z).sub(at));updateCamera();}}
    },
    rotate,setFollowing,
    follow:(a:{x:number;z:number},b:{x:number;z:number},dt:number)=>{
      focusHold=Math.max(0,focusHold-dt);if(!following||focusHold>0||camera.zoom<=1.05||drag||touches.size)return;
      const desired=new THREE.Vector3((a.x+b.x)/2,0,(a.z+b.z)/2);
      target.lerp(desired,1-Math.exp(-dt*5));updateCamera();
      // Reserve space for character height and the lower HUD. Fit both companions
      // when Koda searches farther away, without overriding a closer user zoom otherwise.
      const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
      const delta=new THREE.Vector3(a.x-b.x,0,a.z-b.z);
      const width=Math.abs(delta.dot(right))+3.2,height=Math.abs(delta.dot(up))+4.4;
      const fit=clampZoom(Math.min((camera.right-camera.left)*.76/width,(camera.top-camera.bottom)*.58/height));
      if(camera.zoom>fit+.01){camera.zoom=fit;camera.updateProjectionMatrix();options.onZoom(fit);}
    },
    setZoom:(zoom:number)=>{if(Math.abs(zoom-camera.zoom)>.00001)transform(zoom);},reset,cancelGestures,
    dispose(){
      cancelGestures();
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);
      canvas.removeEventListener('pointercancel',cancelPointer);canvas.removeEventListener('lostpointercapture',cancelPointer);
      canvas.removeEventListener('pointerleave',options.onClearHover);canvas.removeEventListener('contextmenu',noMenu);
      canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);window.removeEventListener('blur',cancelGestures);
    },
  };
}
