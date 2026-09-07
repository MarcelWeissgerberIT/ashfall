'use client';
import { Localized } from './i18n';
import { Radio, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { RADIO } from './radio.mjs';
import type { AudioStatus, RadioCue } from './GameAudio';

export default function RadioPanel({cue,status,enabled,music,voice,onReplay,onStop,onToggle,onLevels}:{cue:RadioCue;status:AudioStatus;enabled:boolean;music:number;voice:number;onReplay:(cue:RadioCue)=>void;onStop:()=>void;onToggle:()=>void;onLevels:(music:number,voice:number)=>void}){
  const current=status.playing&&status.cue?status.cue:cue,call=RADIO[current];
  return <Localized><section className={`radio-panel ${status.playing?'transmitting':''}`} aria-label="Radio and ambient audio">
    <div className="panel-label"><span><Radio size={14}/> CONTROL / 104.8</span><button onClick={onToggle} aria-label={enabled?'Mute all audio':'Enable music and radio'}>{enabled?<Volume2 size={15}/>:<VolumeX size={15}/>}</button></div>
    <div className="radio-call"><div className="radio-wave" aria-hidden="true">{[.35,.7,.45,1,.55,.8,.4,.65,.95,.5,.75,.3].map((n,i)=><i key={i} style={{height:`${n*24}px`,animationDelay:`${i*.09}s`}}/>)}</div><div><small>{status.loading?'TUNING IN':status.playing?'INCOMING TRANSMISSION':'LAST TRANSMISSION'}</small><h3>{call.title}</h3></div></div>
    <div className="radio-controls"><button onClick={()=>onReplay(current)}><Play size={13}/> {status.playing?'Replay call':'Play radio call'}</button>{(status.playing||status.loading)&&<button onClick={onStop} aria-label="Stop radio call"><Square size={12}/></button>}</div>
    <details className="radio-transcript" open={status.playing||undefined}><summary>Read transmission</summary><p>{call.text}</p></details>
    {status.error&&<p className="audio-error" role="status">{status.error}</p>}
    <details className="audio-settings"><summary>Music & voice levels <span>{enabled?'ON':'MUTED'}</span></summary><label>Ambient music <output>{Math.round(music*100)}%</output><input type="range" min="0" max="1" step=".01" value={music} onChange={e=>onLevels(Number(e.target.value),voice)}/></label><label>Radio voice <output>{Math.round(voice*100)}%</output><input type="range" min="0" max="1" step=".01" value={voice} onChange={e=>onLevels(music,Number(e.target.value))}/></label></details>
  </section></Localized>;
}
