'use client';
import React,{createContext,useContext,useEffect,useState} from 'react';
import dictionary from './de.json';
export function translate(text:string,language='en'):string {
 if(language!=='de')return text;const key=text.trim(),dict=dictionary as Record<string,string>;
 if(dict[key])return text.replace(key,dict[key]);
 const dynamic:[RegExp,(...parts:string[])=>string][]=[
 [/^Picked up (.+)\.$/,(_,a)=>translate(a,'de')+' aufgehoben.'],
 [/^Searching (.+)\. Choose what to take\.$/,(_,a)=>translate(a,'de')+' durchsuchen. Wähle deine Beute.'],
 [/^Too heavy: (.+)\. Drop something from your backpack\.$/,(_,a)=>'Zu schwer: '+translate(a,'de')+'. Lege etwas aus dem Rucksack ab.'],
 [/^Dropped (.+)\. You can pick it up again\.$/,(_,a)=>translate(a,'de')+' abgelegt. Du kannst es wieder aufheben.'],
 [/^(.+) unequipped\.$/,(_,a)=>translate(a,'de')+' abgelegt.'],
 [/^(.+) equipped\.$/,(_,a)=>translate(a,'de')+' angelegt.'],
 [/^Stored (.+) in (.+)\.$/,(_,a,b)=>translate(a,'de')+' in '+translate(b,'de')+' verstaut.'],
 [/^CHAPTER (\d+)$/,(_,a)=>'KAPITEL '+a],
 [/^Missing: (.+)\.$/,(_,a)=>'Fehlt: '+a.split(' and ').map(v=>translate(v,'de')).join(' und ')+'.']
 ];
 for(const [pattern,replace] of dynamic)if(pattern.test(key))return key.replace(pattern,replace);
 return text;
}
const Locale=createContext({language:'en',setLanguage:(_value:string)=>{}});
export function LanguageProvider({children}:{children:React.ReactNode}){
 const [language,set]=useState('en');
 useEffect(()=>{let saved='de';try{saved=localStorage.getItem('ashfall-language')||'de'}catch{}set(saved==='de'?'de':'en')},[]);
 useEffect(()=>{document.documentElement.lang=language},[language]);
 const setLanguage=(v:string)=>{set(v);try{localStorage.setItem('ashfall-language',v)}catch{}};
 return <Locale.Provider value={{language,setLanguage}}>{children}</Locale.Provider>;
}
export const useLanguage=()=>useContext(Locale);
export function Localized({children}:{children:React.ReactNode}){
 const {language}=useLanguage();
 const walk=(node:React.ReactNode):React.ReactNode=>{
  if(typeof node==='string')return translate(node,language);
  if(Array.isArray(node))return node.map(walk);
  if(!React.isValidElement(node))return node;
  const props=node.props as Record<string,unknown>,next:Record<string,unknown>={};
  for(const key of ['title','aria-label','alt'])if(typeof props[key]==='string')next[key]=translate(props[key],language);
  if(props.children!==undefined)next.children=walk(props.children as React.ReactNode);
  return React.cloneElement(node,next);
 };
 return <>{walk(children)}</>;
}
export function LanguageSwitch(){const {language,setLanguage}=useLanguage();return <button className="language-toggle" type="button" onClick={()=>setLanguage(language==='de'?'en':'de')} aria-label={language==='de'?'Switch to English':'Auf Deutsch wechseln'}>{language==='de'?'DE / EN':'EN / DE'}</button>}
