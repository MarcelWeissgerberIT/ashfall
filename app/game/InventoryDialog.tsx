'use client';
import { useState } from 'react';
import { Backpack, ArrowDownToLine, ArrowUpRight, ShieldCheck, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ITEMS, CAPACITY } from './engine.mjs';
import ItemIcon from './ItemIcon';

const kinds:Record<string,string>={weapon:'Weapon',armor:'Protection',heal:'Supplies',food:'Supplies',throw:'Distraction',quest:'Quest item',salvage:'Salvage'};
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
      <header className="pack-header"><div><span className="pack-eyebrow">MARA VOSS · FIELD EQUIPMENT</span><DialogTitle><Backpack size={27}/> Your backpack</DialogTitle><DialogDescription>Everything you can carry. Select an item to use or drop.</DialogDescription></div><button className="pack-close" aria-label="Close inventory" title="Close inventory (I / Esc)" onClick={close}><X size={22}/></button></header>
      <div className="pack-capacity"><div><span>CARRY WEIGHT</span><strong>{game.weight.toFixed(1)} <small>/ {CAPACITY} kg</small></strong></div><Progress locale="en-US" value={game.weight/CAPACITY*100} aria-label="Carry weight"/><p>{(CAPACITY-game.weight).toFixed(1)} kg remaining <span>·</span> Items: {game.inventory.length} <span>·</span> Mission paused</p></div>
      <section className="loadout" aria-label="Equipped items"><div className="loadout-heading"><span>YOUR LOADOUT</span><strong><ShieldCheck size={14}/> {Math.round(game.protection*100)}% protection</strong></div><div className="loadout-slots">{(['hand','body','head'] as const).map(slot=>{const id=game.equipment[slot],def=id?(ITEMS as any)[id]:null;return <div className={`loadout-slot ${id?'occupied':''}`} key={slot}><span>{slot==='hand'?'IN HAND':slot==='body'?'BODY':'HEAD'}</span><button disabled={!id} onClick={()=>id&&setSelected(id)} aria-label={`${slot}: ${def?.name||'empty'}`}><ItemIcon id={id||(slot==='hand'?'fists':slot==='head'?'helmet':'jacket')} size={29}/><strong>{def?.name||(slot==='hand'?'Bare hands':'No protection')}</strong></button>{id&&<button className="loadout-remove" onClick={()=>game.unequip(slot)} disabled={!game.canManageInventory} aria-label={`Unequip ${def.name}`}><X size={12}/></button>}</div>})}</div><p>Held attack: <strong>{game.meleeDamage} damage</strong> / {game.meleeCooldown.toFixed(1)}s. Armor protects only when worn; equipped items still count toward carry weight.</p></section><div className="pack-body"><div className="pack-items" aria-label="Items in your backpack">
        {ids.map(id=>{const def=(ITEMS as any)[id];return <button key={id} className={`pack-item ${active===id?'selected':''} ${def.kind==='quest'?'quest':''}`} onClick={()=>setSelected(id)} aria-pressed={active===id} aria-label={`${def.name}, quantity: ${game.count(id)}`}><span className="pack-count">×{game.count(id)}</span><ItemIcon id={id} size={54}/>{def.slot&&game.equipment[def.slot]===id&&<span className="pack-equipped">EQUIPPED</span>}<strong>{def.name}</strong><small>{(def.weight*game.count(id)).toFixed(1)} kg</small>{def.kind==='quest'&&<ShieldCheck className="pack-quest" size={15}/>}</button>})}
        {!ids.length&&<div className="pack-empty"><Backpack size={40}/><strong>Your backpack is empty.</strong><p>Search containers and collect items around the map.</p></div>}
      </div><aside className="pack-detail" aria-live="polite">{item?<>
        <span className="pack-eyebrow">{kinds[item.kind]}</span><div className="pack-preview"><ItemIcon id={active} size={104}/></div><h3>{item.name}</h3><p>{item.desc}</p>
        <dl><div><dt>Unit weight</dt><dd>{item.weight.toFixed(1)} kg</dd></div><div><dt>In backpack</dt><dd>{game.count(active)}</dd></div></dl>
        {item.kind==='quest'&&<p className="pack-note"><ShieldCheck size={17}/>Used automatically when you interact with the matching door or device.</p>}
        <div className="pack-actions">{item.slot&&<button className="primary-btn" disabled={!game.canManageInventory} onClick={()=>game.equip(active)}>{game.equipment[item.slot]===active?'UNEQUIP':item.slot==='hand'?'EQUIP IN HAND':'WEAR '+(item.slot==='head'?'ON HEAD':'ON BODY')}<ShieldCheck size={17}/></button>}{canUse&&<button className="primary-btn" disabled={!game.canManageInventory||fullHealth} onClick={()=>game.use(active)}>{fullHealth?'FULL HEALTH':item.kind==='throw'?'READY THROW':item.kind==='food'?'EAT':'USE BANDAGE'}<ArrowUpRight size={17}/></button>}<button className="pack-drop" disabled={!game.canManageInventory} onClick={()=>game.drop(active)}><ArrowDownToLine size={17}/> Drop one</button></div>
        {!game.canManageInventory&&<p className="pack-note">You can use and drop equipment during a mission.</p>}
      </>:<p>Equipment details appear here.</p>}</aside></div>
      <footer className="pack-footer"><span><kbd>I</kbd> or <kbd>Esc</kbd> to close</span><button onClick={close}>{game.inventoryReturnMode==='playing'?'BACK TO GAME':'CLOSE INVENTORY'}<ArrowUpRight size={16}/></button></footer>
    </DialogContent>
  </Dialog>;
}
