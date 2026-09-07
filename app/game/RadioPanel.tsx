'use client';
import {useEffect,useRef} from 'react';
import { Localized } from './i18n';
import { Radio, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { RADIO } from './radio.mjs';
import type { AudioStatus, RadioCue } from './GameAudio';

export default function RadioPanel({game,cue,status,enabled,music,voice,onReplay,onStop,onToggle,onLevels}:{game:any;cue:RadioCue;status:AudioStatus;enabled:boolean;music:number;voice:number;onReplay:(cue:RadioCue)=>void;onStop:()=>void;onToggle:()=>void;onLevels:(music:number,voice:number)=>void}){
  const feed=useRef<HTMLDivElement>(null);useEffect(()=>{if(feed.current)feed.current.scrollTop=feed.current.scrollHeight},[game.messages.length]);
  const current=status.playing&&status.cue?status.cue:cue,call=RADIO[current];
  return <Localized><section className={`radio-panel ${status.playing?'transmitting':''}`} aria-label="Radio and ambient audio">
    <div className="messenger-header"><strong>ASH / LINK</strong><span>Control / Mara / Koda</span></div><div className="chat-mission"><strong>{game.data.name}</strong>{game.data.goals.map((goal:string,i:number)=><p key={goal}>{game.objectives()[i]?'✓':'○'} {goal}</p>)}</div><div className="message-feed" ref={feed} role="log" aria-label="Mission conversation">{game.messages.map((m:any)=><article key={m.id} className={'chat-bubble '+(m.sender==='Mara'?'outgoing':m.sender==='Field log'?'event':'incoming')}><header><strong>{m.sender}</strong><small>{'CHAPTER '+(m.level+1)}</small></header>{m.voiceId&&<b>{RADIO[m.voiceId as RadioCue].title}</b>}<p>{m.text}</p>{m.voiceId&&<button className="chat-voice" onClick={()=>status.playing&&status.cue===m.voiceId?onStop():onReplay(m.voiceId)}>{status.playing&&status.cue===m.voiceId?<Square size={14}/>:<Play size={14}/>}<span>{status.playing&&status.cue===m.voiceId?'Stop playback':'Listen to message'}</span><span aria-hidden="true">||||||||</span></button>}<footer>{Math.floor(m.time/60).toString().padStart(2,'0')}:{Math.floor(m.time%60).toString().padStart(2,'0')}</footer></article>)}</div><details className="messenger-settings"><summary>Music &amp; voice levels</summary><div className="panel-label"><span><Radio size={14}/> CONTROL / 104.8</span><button onClick={onToggle} aria-label={enabled?'Mute all audio':'Enable music and radio'}>{enabled?<Volume2 size={15}/>:<VolumeX size={15}/>}</button></div>
    <div className="radio-call"><div className="radio-wave" aria-hidden="true">{[.35,.7,.45,1,.55,.8,.4,.65,.95,.5,.75,.3].map((n,i)=><i key={i} style={{height:`${n*24}px`,animationDelay:`${i*.09}s`}}/>)}</div><div><small>{status.loading?'TUNING IN':status.playing?'INCOMING TRANSMISSION':'LAST TRANSMISSION'}</small><h3>{call.title}</h3></div></div>
    <div className="radio-controls"><button onClick={()=>onReplay(current)}><Play size={13}/> {status.playing?'Replay call':'Play radio call'}</button>{(status.playing||status.loading)&&<button onClick={onStop} aria-label="Stop radio call"><Square size={12}/></button>}</div>
    <details className="radio-transcript" open={status.playing||undefined}><summary>Read transmission</summary><p>{call.text}</p></details>
    {status.error&&<p className="audio-error" role="status">{status.error}</p>}
    <details className="audio-settings"><summary>Music & voice levels <span>{enabled?'ON':'MUTED'}</span></summary><label>Ambient music <output>{Math.round(music*100)}%</output><input type="range" min="0" max="1" step=".01" value={music} onChange={e=>onLevels(Number(e.target.value),voice)}/></label><label>Radio voice <output>{Math.round(voice*100)}%</output><input type="range" min="0" max="1" step=".01" value={voice} onChange={e=>onLevels(music,Number(e.target.value))}/></label></details>
  </details></section></Localized>;
}
