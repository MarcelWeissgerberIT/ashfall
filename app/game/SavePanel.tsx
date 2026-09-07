'use client';
import {useEffect,useState} from 'react';
import {createSave,readSave,restoreSave,SAVE_KEY} from './savegame.mjs';
import {Localized,useLanguage} from './i18n';
export default function SavePanel({game,onLoaded}:{game:any;onLoaded:()=>void}){
 const [saved,setSaved]=useState<string|null>(null),[status,setStatus]=useState('');const {language}=useLanguage();
 useEffect(()=>{try{const raw=localStorage.getItem(SAVE_KEY);if(raw)setSaved(readSave(raw).savedAt)}catch{setStatus('The saved game could not be read.')}},[]);
 const save=()=>{try{const raw=createSave(game);localStorage.setItem(SAVE_KEY,raw);setSaved(readSave(raw).savedAt);setStatus('Game saved on this device.')}catch{setStatus('Saving failed. Your browser may have blocked storage.')}};
 const load=()=>{try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)throw Error();restoreSave(game,raw);onLoaded()}catch{setStatus('The saved game could not be loaded. Your current game is unchanged.')}};
 return <Localized><div className="save-panel"><p>One save slot on this device. Saving replaces the previous save. Loading replaces your current progress.</p><p>{saved?new Date(saved).toLocaleString(language==='de'?'de-DE':'en-GB'):'No saved game yet.'}</p><button className="primary-btn" onClick={save}>Save game</button><button className="secondary-btn" disabled={!saved} onClick={load}>Load saved game</button><p role="status">{status}</p><p>Includes all three sectors, inventory, equipment, Koda and your message history.</p></div></Localized>;
}
