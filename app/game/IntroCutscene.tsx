'use client';
import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {useLanguage,LanguageSwitch} from './i18n';
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
 const {language}=useLanguage(),de=language==='de';const [playing,setPlaying]=useState(false),[elapsed,setElapsed]=useState(0),[muted,setMuted]=useState(false);const close=useRef(onClose);close.current=onClose;
 const [cast]=useState(()=>({equipment:{hand:null,body:null,head:null},companion:{care:null}}));
 useEffect(()=>{if(!playing)return;let last=performance.now();const timer=setInterval(()=>{const now=performance.now(),dt=(now-last)/1000;last=now;if(!document.hidden)setElapsed(v=>Math.min(40,v+Math.min(dt,.25)))},100);return()=>clearInterval(timer)},[playing]);
 useEffect(()=>{if(elapsed>=40)close.current()},[elapsed]);
 const index=Math.max(0,shots.findIndex(s=>elapsed<s.until)),shot=shots[index],copy=de?shot.de:shot.en;
 return <Dialog open onOpenChange={open=>{if(!open)onClose()}}><DialogContent className="ashfall-intro" showCloseButton={false} portalContainer={portalContainer}><DialogTitle className="sr-only">ASHFALL · Intro</DialogTitle><DialogDescription className="sr-only">{de?'Maras und Kodas Vorgeschichte. Überspringen jederzeit möglich.':'Mara and Koda’s story. You can skip at any time.'}</DialogDescription>
 <img key={index} className={'intro-landscape '+(playing?'moving':'')} src={ART.sectors[shot.image].src} alt=""/><div className="intro-shade"/>
 <header className="intro-controls">{!playing?<LanguageSwitch/>:<span>ASHFALL / PROLOGUE</span>}<button onClick={onClose}>{de?'Überspringen':'Skip'} <span>Esc</span></button></header>
 {!playing?<section className="intro-start"><span>DEAD SECTOR</span><h1>ASHFALL<span>.</span></h1><p>{de?'Eine Stadt ohne Hoffnung. Zwei, die nicht aufgeben.':'A city without hope. Two who refuse to give up.'}</p><button className="primary-btn" onClick={()=>{setPlaying(true);void onPlay().then(ok=>{if(!ok)setMuted(true)})}}>{de?'Intro starten · mit Ton':'Play intro · with sound'} →</button><small>{de?'40 Sekunden · jederzeit überspringbar':'40 seconds · skip at any time'}</small></section>:<>
 {index===1&&<div className="intro-cast"><CharacterPreview game={cast}/><KodaPreview game={cast}/></div>}
 <section className={'intro-story shot-'+index} key={index}><span>{copy[0]}</span><h2>{copy[1]}</h2><p>{copy[2]}</p></section><button className="intro-sound" onClick={()=>{onStop();setMuted(true)}} disabled={muted}>{muted?(de?'Ohne Ton':'Sound off'):(de?'Stimme aus':'Mute voice')}</button>
 </>}
 <div className="intro-progress" role="progressbar" aria-label={de?'Intro-Fortschritt':'Intro progress'} aria-valuenow={Math.round(elapsed)} aria-valuemin={0} aria-valuemax={40}><i style={{width:elapsed/40*100+'%'}}/></div>
 </DialogContent></Dialog>;
}
