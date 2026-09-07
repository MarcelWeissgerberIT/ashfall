'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Backpack, ArrowDownToLine, ArrowUpRight, ShieldCheck, X, GripVertical, PackageOpen, ArrowRight, Check, Shirt } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ITEMS, CAPACITY } from './engine.mjs';
import ItemIcon from './ItemIcon';
import CharacterPreview from './CharacterPreview';
import ScrollRegion from './ScrollRegion';
import { useItemDrag } from './useItemDrag';

const kinds:Record<string,string>={weapon:'Weapon',armor:'Protection',heal:'Medical supply',food:'Food',throw:'Distraction',quest:'Mission item',salvage:'Salvage'};
export default function InventoryDialog({game,portalContainer}:{game:any;portalContainer?:HTMLElement|null}){
 const [selection,setSelection]=useState<{id:string;from:string}|null>(null);
 const {drag,begin,clicked,zoneClass}=useItemDrag(game),container=game.lootContainer;
 const ids=[...new Set<string>(game.inventory)],lootIds=[...new Set<string>(container?.contents||[])];
 const selected=selection&&(selection.from==='loot'?container?.contents.includes(selection.id):game.has(selection.id))?selection:lootIds.length?{id:lootIds[0],from:'loot'}:ids.length?{id:ids[0],from:'bag'}:null;
 const item=selected?(ITEMS as any)[selected.id]:null,canUse=item&&['heal','food','throw'].includes(item.kind),fullHealth=item&&['heal','food'].includes(item.kind)&&game.health>=100;
 const open=game.inventoryOpen||game.lootOpen;
 const card=(id:string,from:string)=>{const def=(ITEMS as any)[id],count=from==='loot'?container.contents.filter((v:string)=>v===id).length:game.count(id),equipped=from==='bag'&&def.slot&&game.equipment[def.slot]===id;return <div className={`supply-card ${selected?.id===id&&selected.from===from?'selected':''} ${equipped?'is-equipped':''} ${def.kind==='quest'?'quest':''}`} key={id}>
   <button className="supply-select" onPointerDown={e=>begin(e,id,from)} onClick={()=>{if(clicked())setSelection({id,from})}} aria-pressed={selected?.id===id&&selected.from===from}><ItemIcon id={id} size={40}/><strong>{def.name}</strong><small>{def.weight.toFixed(1)} kg {count>1?`· ×${count}`:''}</small>{equipped&&<span className="equipped-label"><Check size={10}/> WORN / HELD</span>}</button>
   <button className="item-drag-handle" title="Drag item" aria-label={`Drag ${def.name}`} onPointerDown={e=>begin(e,id,from,true)}><GripVertical size={17}/></button>
   {from==='loot'&&<button className="loot-take" disabled={!game.canManageInventory||game.weight+def.weight>CAPACITY+.00001} onClick={()=>game.takeLoot(id)}>Take <ArrowRight size={12}/></button>}
  </div>};
 return <Dialog open={open} onOpenChange={v=>{if(!v)game.closeInventory()}}>
  <DialogContent className="inventory-dialog workbench-dialog" showCloseButton={false} portalContainer={portalContainer}>
   <header className="workbench-header"><div><span className="pack-eyebrow">FIELD EQUIPMENT · WORLD PAUSED</span><DialogTitle>{container?<PackageOpen size={25}/>:<Backpack size={25}/>} {container?container.name:'Mara’s equipment'}</DialogTitle><DialogDescription>{!game.canManageInventory?'Preview only. Enter the sector to change equipment.':container?'Choose what to take. Drag with the corner grip; leftovers stay here.':'Drag gear by its corner grip onto a slot, or select an item and choose Equip.'}</DialogDescription></div><button className="pack-close" aria-label="Close inventory and return to game" onClick={()=>game.closeInventory()}><X size={21}/></button></header>
   <div className="workbench-capacity"><span>{game.weight.toFixed(1)} / {CAPACITY} kg</span><Progress locale="en-US" value={game.weight/CAPACITY*100} aria-label="Backpack carry weight"/><strong>{(CAPACITY-game.weight).toFixed(1)} kg free</strong></div>
   <div className="workbench-body">
    <section className="equipment-bay" aria-label="Character and equipment slots">
     {open&&<CharacterPreview game={game}/>}
     <div className="equipment-summary"><ShieldCheck size={15}/><strong>{Math.round(game.protection*100)}% protection</strong><span>{game.meleeDamage} damage</span></div>
     <div className="equipment-slots">{(['hand','body','head'] as const).map(slot=>{const id=game.equipment[slot],def=id?(ITEMS as any)[id]:null;return <div data-dropzone={slot} className={`gear-slot ${zoneClass(slot)}`} key={slot}><button onPointerDown={e=>id&&begin(e,id,slot)} onClick={()=>{if(clicked()&&id)setSelection({id,from:'bag'})}} aria-label={`${slot} slot: ${def?.name||'empty'}`}><ItemIcon id={id||(slot==='hand'?'fists':slot==='body'?'jacket':'helmet')} size={23}/><span><small>{slot==='hand'?'IN HAND':slot.toUpperCase()}</small><strong>{def?.name||'Drop gear here'}</strong></span></button>{id&&<><button className="gear-drag" onPointerDown={e=>begin(e,id,slot,true)} aria-label={`Drag equipped ${def.name}`}><GripVertical size={15}/></button><button className="gear-remove" disabled={!game.canManageInventory} onClick={()=>game.unequip(slot)} aria-label={`Unequip ${def.name}`}><X size={14}/></button></>}</div>})}</div>
     <p className="drag-instruction"><GripVertical size={14}/> Use the grip to drag on touchscreens. Slots light up when gear fits.</p>
    </section>
    <ScrollRegion label="Storage and backpack items" className="supplies-bay">
     {item&&<div className="compact-item-details"><strong>{item.name}</strong><p>{item.desc}</p></div>}
     {container&&<section className={`loot-shelf ${zoneClass('loot')}`} data-dropzone="loot"><div className="shelf-title"><span><PackageOpen size={17}/> CONTAINER <small>{container.contents.length} items</small></span><button onClick={()=>game.takeAllLoot()} disabled={!container.contents.some((id:string)=>game.weight+(ITEMS as any)[id].weight<=CAPACITY+.00001)}>Take all that fits <ArrowDownToLine size={14}/></button></div><p>{container.desc}</p><div className="supply-grid">{lootIds.map(id=>card(id,'loot'))}</div>{!lootIds.length&&<div className="storage-empty"><PackageOpen size={32}/><strong>Compartment empty</strong><span>You collected everything here. You can store items here by dragging them back.</span></div>}</section>}
     <section className={`bag-shelf ${zoneClass('bag')}`} data-dropzone="bag"><div className="shelf-title"><span><Backpack size={17}/> YOUR BACKPACK <small>{game.inventory.length} items</small></span></div><p>{container?'Drag loot here to collect it.':'Drag equipped gear here to remove it without dropping it.'}</p><div className="supply-grid">{ids.map(id=>card(id,'bag'))}</div>{!ids.length&&<div className="storage-empty"><Backpack size={30}/><strong>Your backpack is empty</strong><span>Pick up supplies or take something from a container.</span></div>}</section>
     <div className={`ground-drop ${zoneClass('ground')}`} data-dropzone="ground"><ArrowDownToLine size={19}/><div><strong>Drop on the ground</strong><span>Drag carried items here. You can collect them again.</span></div></div>
    </ScrollRegion>
   </div>
   <footer className="item-inspector">{item&&selected?<><ItemIcon id={selected.id} size={30}/><div className="inspector-copy"><small>{kinds[item.kind]} · {item.weight.toFixed(1)} kg</small><strong>{item.name}</strong><p>{item.desc}</p></div><div className="inspector-actions">
    {selected.from==='loot'?<button className="primary-btn" disabled={game.weight+item.weight>CAPACITY+.00001} onClick={()=>game.takeLoot(selected.id)}>TAKE <ArrowRight size={15}/></button>:<>
     {item.slot&&<button className="primary-btn" disabled={!game.canManageInventory} onClick={()=>game.equip(selected.id)}>{game.equipment[item.slot]===selected.id?'UNEQUIP':'EQUIP'}<Shirt size={15}/></button>}
     {canUse&&<button className="secondary-btn" disabled={!game.canManageInventory||fullHealth} onClick={()=>game.use(selected.id)}>{fullHealth?'FULL HEALTH':item.kind==='throw'?'READY THROW':item.kind==='food'?'EAT':'HEAL'}<ArrowUpRight size={14}/></button>}
     {container&&<button className="secondary-btn" disabled={!game.canManageInventory} onClick={()=>game.storeLoot(selected.id)}>STORE</button>}
     <button className="secondary-btn" disabled={!game.canManageInventory} onClick={()=>game.drop(selected.id)}>DROP</button>
    </>}
   </div></>:<p>Select an item to inspect it.</p>}</footer>
   {game.history[0]?.tone==='warn'&&<p className="inventory-warning" role="status">{game.history[0].text}</p>}
   <div className="workbench-footer"><span><kbd>I</kbd> / <kbd>Esc</kbd> to close</span><button onClick={()=>game.closeInventory()}>BACK TO GAME <ArrowRight size={14}/></button></div>
   {drag&&createPortal(<div className={`drag-ghost ${drag.valid?'valid':''}`} aria-hidden="true" style={{left:drag.x+12,top:drag.y+12}}><ItemIcon id={drag.id} size={27}/><span>{(ITEMS as any)[drag.id].name}</span></div>,portalContainer||document.body)}
  </DialogContent>
 </Dialog>;
}
