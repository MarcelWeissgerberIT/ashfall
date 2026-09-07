'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, RotateCw, ScanFace, PersonStanding } from 'lucide-react';
import { createRenderKit, createCharacter, animateCharacter } from './render-kit';

export default function CharacterPreview({game}:{game:any}) {
  const host=useRef<HTMLDivElement>(null),angle=useRef(-.35),focus=useRef(false);
  const [closeUp,setCloseUp]=useState(false);
  useEffect(()=>{focus.current=closeUp},[closeUp]);
  useEffect(()=>{
    if(!host.current)return;const element=host.current;
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;element.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,30);camera.position.set(0,1.35,4.6);camera.lookAt(0,1.05,0);
    scene.add(new THREE.HemisphereLight(0xe5ecda,0x28372b,1.7));const key=new THREE.DirectionalLight(0xffd8ad,3.2);key.position.set(-2,4,3);scene.add(key);const rim=new THREE.DirectionalLight(0x87b7c0,2);rim.position.set(2,2,-2);scene.add(rim);
    const kit=createRenderKit(renderer),character=createCharacter(kit);scene.add(character);character.userData.halo.visible=false;
    let aim=1.05;
    const resize=()=>{const {width,height}=element.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;const halfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),distance=Math.max(2.15/(2*halfFov),1.45/(2*halfFov*camera.aspect))*1.12;camera.position.set(0,1.3,distance);camera.far=Math.max(30,distance+10);camera.lookAt(0,1.05,0);camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(element);resize();
    let frame=0,last=0,elapsed=0;const loop=(now:number)=>{const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed+=dt;animateCharacter(character,{x:0,y:0,hp:100,facing:angle.current,equipment:game.equipment},dt,true,elapsed);character.userData.halo.visible=false;
      const halfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),targetDistance=Math.max((focus.current?.65:2.15)/(2*halfFov),(focus.current?.63:1.45)/(2*halfFov*camera.aspect))*1.12;
      aim=THREE.MathUtils.damp(aim,focus.current?1.59:1.05,9,dt);camera.position.z=THREE.MathUtils.damp(camera.position.z,targetDistance,9,dt);camera.position.y=aim+.12;camera.lookAt(0,aim,0);camera.far=Math.max(30,targetDistance+10);camera.updateProjectionMatrix();
      renderer.render(scene,camera);frame=requestAnimationFrame(loop)};frame=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();kit.disposeLocal(character);kit.dispose();renderer.dispose();renderer.domElement.remove()};
  },[game]);
  return <div className="character-display"><div className="character-preview" ref={host} role="img" aria-label="Live 3D preview of Mara wearing your selected equipment"/><div className="character-turn"><button aria-label="Rotate character left" onClick={()=>angle.current-=Math.PI/4}><RotateCcw size={14}/></button><button className="character-focus" aria-label={closeUp?"Show full outfit":"Inspect Mara’s face"} title={closeUp?"Full outfit":"Face close-up"} onClick={()=>setCloseUp(v=>!v)}>{closeUp?<PersonStanding size={15}/>:<ScanFace size={15}/>}<span>{closeUp?"OUTFIT":"DETAIL"}</span></button><button aria-label="Rotate character right" onClick={()=>angle.current+=Math.PI/4}><RotateCw size={14}/></button></div></div>;
}
