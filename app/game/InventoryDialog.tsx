'use client';
import { useState } from 'react';
import { Backpack, ArrowDownToLine, ArrowUpRight, ShieldCheck, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ITEMS, CAPACITY } from './engine.mjs';
import { ART } from './art';

const kinds:Record<string,string>={weapon:'Ausrüstung',heal:'Versorgung',food:'Versorgung',throw:'Ablenkung',quest:'Auftragsgegenstand',salvage:'Bergungsgut'};
export default function InventoryDialog({game,portalContainer}:{game:any;portalContainer?:HTMLElement|null}){
  const [selected,setSelected]=useState<string|null>(null);
  const ids=[...new Set<string>(game.inventory)];
  const active=selected&&game.has(selected)?selected:ids[0];
  const item=active?(ITEMS as any)[active]:null;
  const canUse=item&&['heal','food','throw'].includes(item.kind);
  const fullHealth=item&&['heal','food'].includes(item.kind)&&game.health>=100;
  const close=()=>game.closeInventory();
  return <Dialog open={game.inventoryOpen} onOpenChange={open=>{if(!open)close()}}>
    <DialogContent className="inventory-dialog" showCloseButton={false} portalContainer={portalContainer}>
      <header className="pack-header"><div><span className="pack-eyebrow">MARA VOSS · FELDAUSRÜSTUNG</span><DialogTitle><Backpack size={27}/> Dein Rucksack</DialogTitle><DialogDescription>Alles, was du tragen kannst. Wähle einen Gegenstand zum Benutzen oder Ablegen.</DialogDescription></div><button className="pack-close" aria-label="Inventar schließen" title="Inventar schließen (I / Esc)" onClick={close}><X size={22}/></button></header>
      <div className="pack-capacity"><div><span>TRAGLAST</span><strong>{game.weight.toFixed(1)} <small>/ {CAPACITY} kg</small></strong></div><Progress locale="de-DE" value={game.weight/CAPACITY*100} aria-label="Traglast"/><p>{(CAPACITY-game.weight).toFixed(1)} kg frei <span>·</span> {game.inventory.length} Gegenstände <span>·</span> Einsatz pausiert</p></div>
      <div className="pack-body"><div className="pack-items" aria-label="Gegenstände im Rucksack">
        {ids.map(id=>{const def=(ITEMS as any)[id];return <button key={id} className={`pack-item ${active===id?'selected':''} ${def.kind==='quest'?'quest':''}`} onClick={()=>setSelected(id)} aria-pressed={active===id} aria-label={`${def.name}, ${game.count(id)} Stück`}><span className="pack-count">×{game.count(id)}</span><img src={`${ART.icons}${id}.webp`} alt="" draggable={false}/><strong>{def.name}</strong><small>{(def.weight*game.count(id)).toFixed(1)} kg</small>{def.kind==='quest'&&<ShieldCheck className="pack-quest" size={15}/>}</button>})}
        {!ids.length&&<div className="pack-empty"><Backpack size={40}/><strong>Dein Rucksack ist leer.</strong><p>Untersuche Kisten und sammle Gegenstände auf der Karte.</p></div>}
      </div><aside className="pack-detail" aria-live="polite">{item?<>
        <span className="pack-eyebrow">{kinds[item.kind]}</span><div className="pack-preview"><img src={`${ART.icons}${active}.webp`} alt=""/></div><h3>{item.name}</h3><p>{item.desc}</p>
        <dl><div><dt>Einzelgewicht</dt><dd>{item.weight.toFixed(1)} kg</dd></div><div><dt>Im Rucksack</dt><dd>{game.count(active)} Stück</dd></div></dl>
        {item.kind==='quest'&&<p className="pack-note"><ShieldCheck size={17}/>Wird an der passenden Tür oder am Gerät automatisch eingesetzt.</p>}
        <div className="pack-actions">{canUse&&<button className="primary-btn" disabled={!game.canManageInventory||fullHealth} onClick={()=>game.use(active)}>{fullHealth?'GESUNDHEIT VOLL':item.kind==='throw'?'WURF VORBEREITEN':item.kind==='food'?'ESSEN':'VERBAND BENUTZEN'}<ArrowUpRight size={17}/></button>}<button className="pack-drop" disabled={!game.canManageInventory} onClick={()=>game.drop(active)}><ArrowDownToLine size={17}/> Ein Stück ablegen</button></div>
        {!game.canManageInventory&&<p className="pack-note">Im laufenden Einsatz kannst du deine Ausrüstung benutzen und ablegen.</p>}
      </>:<p>Hier erscheinen die Details deiner Ausrüstung.</p>}</aside></div>
      <footer className="pack-footer"><span><kbd>I</kbd> oder <kbd>Esc</kbd> zum Schließen</span><button onClick={close}>{game.inventoryReturnMode==='playing'?'ZURÜCK INS SPIEL':'INVENTAR SCHLIESSEN'}<ArrowUpRight size={16}/></button></footer>
    </DialogContent>
  </Dialog>;
}
