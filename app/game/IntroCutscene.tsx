'use client';
import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogPortal,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Dialog as DialogPrimitive} from '@base-ui/react/dialog';
import {useLanguage} from './i18n';
import {ART} from './art';
import CharacterPreview from './CharacterPreview';
import KodaPreview from './KodaPreview';
const shots=[
 {until:7,image:0,en:['DAY 1,247','Before the silence','I used to repair the emergency radios in this district. Then the voices disappeared.'],de:['TAG 1.247','Vor der Stille','Früher reparierte ich die Notfunkgeräte dieses Viertels. Dann verstummten die Stimmen.']},
 {until:21,image:0,en:['THREE NIGHTS AGO','A promise to Koda','A sound inside an abandoned ambulance. A puppy beneath the seat. I promised him we would leave this city together.'],de:['VOR DREI NÄCHTEN','Ein Versprechen an Koda','Ein Geräusch in einem verlassenen Rettungswagen. Ein Welpe unter dem Sitz. Ich versprach ihm, dass wir diese Stadt gemeinsam verlassen.']},
 {until:32,image:1,en:['104.8 MHz · SIGNAL FOUND','One voice remains','Station Zero. A sealed sample. A way through the bunker. Somewhere beyond these walls, someone is still listening.'],de:['104,8 MHz · SIGNAL EMPFANGEN','Eine Stimme bleibt','Station Zero. Eine versiegelte Probe. Ein Weg durch den Bunker. Irgendwo hinter diesen Mauern hört uns noch jemand zu.']},
 {until:40,image:2,en:['MARA VOSS & KODA','ASHFALL','The last way out.'],de:['MARA VOSS & KODA','ASHFALL','Der letzte Ausweg.']}
];
export default function IntroCutscene({game,onClose,onPlay,onStop,portalContainer}:{game:any;onClose:()=>void;onPlay:()=>Promise<boolean>;onStop:()=>void;portalContainer?:HTMLElement|null}){
 const {language}=useLanguage(),de=language==='de';const [elapsed,setElapsed]=useState(0),[sound,setSound]=useState(false),[starting,setStarting]=useState(false);const close=useRef(onClose);close.current=onClose;
 const [cast]=useState(()=>({equipment:{hand:null,body:null,head:null},companion:{care:null}}));
 useEffect(()=>{let last=performance.now();const timer=setInterval(()=>{const now=performance.now(),dt=(now-last)/1000;last=now;if(!document.hidden)setElapsed(v=>Math.min(40,v+dt))},100);return()=>clearInterval(timer)},[]);
 useEffect(()=>{if(elapsed>=40)close.current()},[elapsed]);
 const index=Math.max(0,shots.findIndex(s=>elapsed<s.until)),shot=shots[index],copy=de?shot.de:shot.en;
 return <Dialog open onOpenChange={open=>{if(!open)onClose()}}><DialogPortal container={portalContainer}><DialogPrimitive.Popup className="ashfall-intro" style={{position:'fixed',inset:0,zIndex:1000,margin:0,translate:'none',transform:'none',width:'100vw',maxWidth:'none',height:'100dvh'}}><DialogTitle className="sr-only">ASHFALL · Intro</DialogTitle><DialogDescription className="sr-only">{de?'Maras und Kodas Vorgeschichte. Überspringen jederzeit möglich.':'Mara and Koda’s story. You can skip at any time.'}</DialogDescription>
 <img key={index} className="intro-landscape moving" src={ART.sectors[shot.image].src} alt=""/><div className="intro-shade"/>
 <header className="intro-controls"><span>ASHFALL / {de?'PROLOG':'PROLOGUE'}</span><button onClick={onClose}>{de?'Überspringen':'Skip'} <span>Esc</span></button></header>
 {index===1&&<div className="intro-cast"><CharacterPreview game={cast}/><KodaPreview game={cast}/></div>}
 <section className={'intro-story shot-'+index} key={index}><span>{copy[0]}</span><h2>{copy[1]}</h2><p>{copy[2]}</p></section>
 <button className="intro-sound" disabled={starting} onClick={async()=>{
  if(sound){onStop();setSound(false);return}
  setStarting(true);
  // Restart the captions with the narration after the required audio gesture.
  setElapsed(0);
  try{setSound(await onPlay())}catch{setSound(false)}finally{setStarting(false)}
 }}>{starting?(de?'Ton wird geladen …':'Loading sound …'):sound?(de?'Stimme ausschalten':'Mute voice'):(de?'Ton einschalten · Intro neu starten':'Enable sound · restart intro')}</button>
 <div className="intro-progress" role="progressbar" aria-label={de?'Intro-Fortschritt':'Intro progress'} aria-valuenow={Math.round(elapsed)} aria-valuemin={0} aria-valuemax={40}><i style={{width:elapsed/40*100+'%'}}/></div>
 </DialogPrimitive.Popup></DialogPortal></Dialog>;
}
