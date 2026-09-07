'use client';
import { Localized } from './i18n';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
export default function ScrollRegion({children,label,className=''}:{children:ReactNode;label:string;className?:string}) {
  const viewport=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null),[edges,setEdges]=useState({up:false,down:false});
  const update=()=>{const e=viewport.current;if(e)setEdges({up:e.scrollTop>8,down:e.scrollHeight-e.clientHeight-e.scrollTop>8})};
  useEffect(()=>{const observer=new ResizeObserver(update);if(viewport.current)observer.observe(viewport.current);if(content.current)observer.observe(content.current);update();return()=>observer.disconnect()},[]);
  return <Localized><div className={`modal-scroll-frame ${className}`}>
    {edges.up&&<button className="scroll-cue above" onClick={()=>viewport.current?.scrollBy({top:-240,behavior:'smooth'})}><ChevronUp size={14}/> More above</button>}
    <div className="modal-scroll" ref={viewport} onScroll={update} tabIndex={0} role="region" aria-label={label}><div ref={content}>{children}</div></div>
    {edges.down&&<button className="scroll-cue below" onClick={()=>viewport.current?.scrollBy({top:240,behavior:'smooth'})}>Scroll for more <ChevronDown size={14}/></button>}
  </div></Localized>;
}
