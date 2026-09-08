'use client';
import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogPortal,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Dialog as DialogPrimitive} from '@base-ui/react/dialog';
import {CINEMATICS} from './cinematic-library.mjs';
import {ART} from './art';

// The opening film has its own English soundtrack, independent of game language.
export default function IntroCutscene({onClose,portalContainer,kind='intro',audible=false,replay=false}:{replay?:boolean;audible?:boolean;kind?:string;onClose:()=>void;portalContainer?:HTMLElement|null}){
 const film=CINEMATICS.find(f=>f.id===kind)||CINEMATICS[0];
 const video=useRef<HTMLVideoElement>(null);
 const [sound,setSound]=useState(audible),[progress,setProgress]=useState(0),[error,setError]=useState(false),[paused,setPaused]=useState(false),[loading,setLoading]=useState(true);
 useEffect(()=>{const p=video.current;if(!p)return;void p.play().catch(()=>{p.muted=true;setSound(false);void p.play().catch(()=>setPaused(true))})},[]);
 const play=async(withSound:boolean)=>{
  const player=video.current;if(!player)return;
  setError(false);player.muted=!withSound;
  if(withSound&&!sound)player.currentTime=0;
  setSound(withSound);
  try{await player.play();setPaused(false)}catch{setPaused(true)}
 };
 return <Dialog open onOpenChange={open=>{if(!open)onClose()}}><DialogPortal container={portalContainer}>
 <DialogPrimitive.Popup className="ashfall-intro" lang="en" style={{position:'fixed',inset:0,zIndex:1000,margin:0,translate:'none',transform:'none',width:'100vw',maxWidth:'none',height:'100dvh'}}>
 <DialogTitle className="sr-only">{'ASHFALL — '+film.title}</DialogTitle>
 <DialogDescription className="sr-only">An English story cinematic. Enable sound to hear Mara. Skip at any time.</DialogDescription>
 <video ref={video} className="intro-film" src={film.src} poster={film.poster||ART.sectors[0].src} autoPlay muted={!sound} playsInline preload="auto"
 onEnded={onClose} onError={()=>setError(true)} onPause={()=>setPaused(true)} onWaiting={()=>setLoading(true)} onPlaying={()=>{setPaused(false);setLoading(false)}}
 onTimeUpdate={event=>{const p=event.currentTarget;setProgress(p.duration?p.currentTime/p.duration*100:0)}}/>
 <header className="intro-controls"><span>{'ASHFALL / '+film.title.toUpperCase()}</span><button onClick={onClose}>{replay?'Back to cinematics':kind==='intro'?'Skip intro':kind==='finale'?'Finish story':'Continue journey'} <span>Esc</span></button></header>
 {error?<section className="intro-film-message"><h2>The film could not load.</h2><button onClick={()=>{video.current?.load();void play(sound)}}>Retry</button><button onClick={onClose}>{replay?'Back to cinematics →':'Continue to game →'}</button></section>:
 paused?<section className="intro-film-message"><button onClick={()=>void play(sound)}>{'Play film →'}</button></section>:loading?<p className="intro-film-loading" role="status">Loading film …</p>:null}
 <button className="intro-sound" onClick={()=>{if(sound){if(video.current)video.current.muted=true;setSound(false)}else void play(true)}}>{sound?'Mute sound':'Play with sound ↺'}</button>
 <div className="intro-progress" role="progressbar" aria-label="Intro progress" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><i style={{width:progress+'%'}}/></div>
 </DialogPrimitive.Popup></DialogPortal></Dialog>;
}
