'use client';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ITEMS, CAPACITY } from './engine.mjs';
type Drag={id:string;from:string;x:number;y:number;over:string|null;valid:boolean};

export function useItemDrag(game:any) {
  const [drag,setDrag]=useState<Drag|null>(null),session=useRef<any>(null),suppressClick=useRef(false);
  const valid=(id:string,from:string,to:string|null)=>{
    if(!to)return false;
    if(from==='loot'&&to!=='loot'&&game.weight+(ITEMS as any)[id].weight>CAPACITY+.00001)return false;
    if(['hand','head','body'].includes(to))return game.itemSlot(id)===to;
    if(to==='loot')return from!=='loot'&&!!game.lootContainer;
    return to==='bag'||to==='ground'&&from!=='loot';
  };
  const begin=(e:ReactPointerEvent,id:string,from:string,handle=false)=>{
    if(!game.canManageInventory||e.button!==0||e.pointerType==='touch'&&!handle)return;
    if(handle||e.pointerType==='touch')e.preventDefault();suppressClick.current=false;e.currentTarget.setPointerCapture(e.pointerId);session.current={id,from,pointer:e.pointerId,x:e.clientX,y:e.clientY,latestX:e.clientX,latestY:e.clientY,moved:false};
  };
  useEffect(()=>{
    if(!game.inventoryOpen&&!game.lootOpen)return;
    const move=(e:PointerEvent)=>{const s=session.current;if(!s||e.pointerId!==s.pointer)return;s.latestX=e.clientX;s.latestY=e.clientY;if(!s.moved&&Math.hypot(e.clientX-s.x,e.clientY-s.y)<7)return;s.moved=true;
      const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-dropzone]')?.dataset.dropzone||null;
      setDrag({id:s.id,from:s.from,x:e.clientX,y:e.clientY,over:zone,valid:valid(s.id,s.from,zone)});
    };
    const finish=(e:PointerEvent)=>{const s=session.current;if(!s||e.pointerId!==s.pointer)return;session.current=null;
      if(s.moved){suppressClick.current=true;const to=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-dropzone]')?.dataset.dropzone;if(to&&valid(s.id,s.from,to))game.transferItem(s.id,s.from,to);else game.log('Drop onto a matching slot, your backpack, or a storage area.','warn');}
      setDrag(null);
    };
    const cancel=()=>{session.current=null;setDrag(null)};
    let frame=0,last=0;
    const scroll=(now:number)=>{
      const dt=last?Math.min((now-last)/1000,.05):0;last=now;const s=session.current;
      if(s?.moved){
        const under=document.elementFromPoint(s.latestX,s.latestY),viewport=under?.closest('.modal-scroll-frame')?.querySelector<HTMLElement>('.modal-scroll');
        if(viewport){const rect=viewport.getBoundingClientRect(),edge=Math.min(40,rect.height/4),speed=s.latestY<rect.top+edge?-340:s.latestY>rect.bottom-edge?340:0;if(speed)viewport.scrollTop+=speed*dt;}
        const over=document.elementFromPoint(s.latestX,s.latestY)?.closest<HTMLElement>('[data-dropzone]')?.dataset.dropzone||null;
        setDrag(previous=>previous&&previous.over!==over?{...previous,over,valid:valid(s.id,s.from,over)}:previous);
      }
      frame=requestAnimationFrame(scroll);
    };frame=requestAnimationFrame(scroll);
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',cancel);window.addEventListener('blur',cancel);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',cancel);window.removeEventListener('blur',cancel)};
  },[game,game.inventoryOpen,game.lootOpen]);
  useEffect(()=>{if(!game.inventoryOpen&&!game.lootOpen){session.current=null;setDrag(null)}},[game.inventoryOpen,game.lootOpen]);
  const clicked=()=>{if(suppressClick.current){suppressClick.current=false;return false}return true};
  const zoneClass=(zone:string)=>drag?.over===zone?(drag.valid?'drop-active':'drop-invalid'):drag&&valid(drag.id,drag.from,zone)?'drop-possible':'';
  return {drag,begin,clicked,zoneClass};
}
