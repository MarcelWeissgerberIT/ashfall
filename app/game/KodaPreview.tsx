'use client';
import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createRenderKit} from './render-kit';
import {createPuppy,animatePuppy} from './puppy';
export default function KodaPreview({game}:{game:any}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!host.current)return;const el=host.current,renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));el.appendChild(renderer.domElement);const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,20);camera.position.set(1.2,1,2.2);camera.lookAt(0,.4,0);scene.add(new THREE.HemisphereLight(0xffedcf,0x34493c,3));const light=new THREE.DirectionalLight(0xffd8ac,3);light.position.set(-2,3,3);scene.add(light);const kit=createRenderKit(renderer),puppy=createPuppy(kit);scene.add(puppy);
 const resize=()=>{const {width,height}=el.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(el);resize();let frame=0,last=0;const loop=(now:number)=>{const dt=last?Math.min(.05,(now-last)/1000):0;last=now;const care=game.companion.care,age=care?(Date.now()-care.at)/1000:99,playing=care?.kind==='play'&&age<3,feeding=care?.kind==='feed'&&age<3;animatePuppy(puppy,{x:0,y:0,facing:playing?Math.sin(age*4)*.6:0,action:0,mode:feeding?'sniff':'idle'},dt,true,now/1000);puppy.position.y=playing?Math.abs(Math.sin(age*6))*.16:0;renderer.render(scene,camera);frame=requestAnimationFrame(loop)};frame=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(frame);observer.disconnect();kit.disposeLocal(puppy);kit.dispose();renderer.dispose();renderer.domElement.remove()};},[game]);
 return <div className="koda-preview" ref={host} role="img" aria-label="Koda"/>;
}
