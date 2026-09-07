'use client';
import {useEffect,useState} from 'react';
import {readSave,restoreSave} from './savegame.mjs';
import {chapterSave} from './preset-saves.mjs';
import {LEVELS} from './engine.mjs';
import {listSaves,writeSave} from './save-library.mjs';
import {Localized,useLanguage} from './i18n';
export default function SavePanel({game,onLoaded}:{game:any;onLoaded:()=>void}){
 const [saves,setSaves]=useState<{id:string;name:string;raw:string}[]>([]),[name,setName]=useState(''),[status,setStatus]=useState('');const {language}=useLanguage();
 useEffect(()=>{try{setSaves(listSaves(localStorage))}catch{setStatus('The saved game could not be read.')}},[]);
 const save=(id?:string,existingName?:string)=>{try{setSaves(writeSave(localStorage,game,existingName||name,id));setName('');setStatus('Game saved on this device.')}catch{setStatus('Saving failed. Check the name, available slots and browser storage.')}};
 const load=(raw:string)=>{try{restoreSave(game,raw);onLoaded()}catch{setStatus('The saved game could not be loaded. Your current game is unchanged.')}};
 return <Localized><div className="save-panel"><section className="chapter-presets"><h3>Ready-to-play chapter saves</h3><p>Start a chapter with Mara, Koda and suitable equipment. Your named saves remain available below.</p>{LEVELS.slice(0,3).map((level:any,index:number)=><button className="secondary-btn" key={index} onClick={()=>load(chapterSave(index))}>{"CHAPTER "+(index+1)} · {level.name} →</button>)}</section><p>Named saves on this device. Create a new slot or explicitly overwrite an existing one.</p><label>Save name<input maxLength={48} value={name} onChange={e=>setName(e.target.value)} placeholder={language==='de'?'Zum Beispiel: Vor dem Labor':'For example: Before the lab'}/></label><button className="primary-btn" disabled={!name.trim()||saves.length>=20} onClick={()=>save()}>Create new save</button><p role="status">{status}</p><div className="save-slots">{saves.map(s=>{const meta=readSave(s.raw);return <article key={s.id}><strong>{s.name==='Original save'?'Original save':s.name}</strong><small>{'CHAPTER '+(meta.state.level+1)} · {new Date(meta.savedAt).toLocaleString(language==='de'?'de-DE':'en-GB')}</small><div><button className="secondary-btn" onClick={()=>load(s.raw)}>Load saved game</button><button className="secondary-btn" onClick={()=>save(s.id,s.name)}>Overwrite with current game</button></div></article>})}</div>{!saves.length&&<p>No saved game yet.</p>}<p>{saves.length} / 20</p></div></Localized>;
}
