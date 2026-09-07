'use client';
import {useEffect,useRef,useState} from 'react';
import {Video,Square,Download} from 'lucide-react';
import {recordGame} from './recording.mjs';
import {useLanguage,translate} from './i18n';
export default function RecordingControl({getCanvas,getAudio,enableAudio,canStart}:{getCanvas:()=>HTMLCanvasElement|null;getAudio:()=>MediaStream|null;enableAudio:()=>Promise<boolean>;canStart:boolean}){
 const {language}=useLanguage(),t=(s:string)=>translate(s,language);
 const [active,setActive]=useState(false),[busy,setBusy]=useState(false),[seconds,setSeconds]=useState(0),[download,setDownload]=useState<{url:string;name:string}|null>(null),[error,setError]=useState('');
 const session=useRef<ReturnType<typeof recordGame>|null>(null),url=useRef(''),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;session.current?.dispose();if(url.current)URL.revokeObjectURL(url.current)}},[]);
 useEffect(()=>{if(!active)return;const started=Date.now(),timer=setInterval(()=>{const elapsed=Math.floor((Date.now()-started)/1000);setSeconds(elapsed);if(elapsed>=120)session.current?.stop()},250);return()=>clearInterval(timer)},[active]);
 async function start(){setBusy(true);setError('');try{if(!await enableAudio())throw Error('Enable audio before recording.');if(!mounted.current)return;const audio=getAudio();if(!audio)throw Error('Enable audio before recording.');session.current=recordGame(getCanvas(),audio,(blob:Blob)=>{if(!mounted.current)return;setActive(false);if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(blob);setDownload({url:url.current,name:'ashfall-'+new Date().toISOString().replace(/[:.]/g,'-')+(blob.type.includes('mp4')?'.mp4':'.webm')});},()=>{if(mounted.current){setActive(false);setError('Recording failed. Please try again.')}});setSeconds(0);setActive(true);}catch(e){setError((e as Error).message||'Recording failed. Please try again.')}finally{if(mounted.current)setBusy(false)}}
 return <div className="recording-control"><button className={'hud-nav '+(active?'recording-active':'')} disabled={busy||(!active&&!canStart)} onClick={()=>active?session.current?.stop():void start()} title={t('Record the game view with sound · Up to 2 minutes')} aria-label={t(active?'Stop recording':'Record video')}>{active?<Square size={16}/>:<Video size={17}/>}<span>{active?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:t('Record')}</span></button>{download&&!active&&<a href={download.url} download={download.name} title={t('Download video')} aria-label={t('Download video')}><Download size={17}/><span>{t('Video')}</span></a>}{error&&<span className="recording-error" role="alert" onClick={()=>setError('')}>{t(error)}</span>}</div>;
}
