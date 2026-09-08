'use client';
import {useState} from 'react';
import {RECIPES,recipeState,craft,prepareRecipe} from './crafting.mjs';
import {ITEMS,CAPACITY} from './engine.mjs';
import {Localized,useLanguage} from './i18n';
import ItemIcon from './ItemIcon';

export default function CraftingPanel({game,onInventory}:{game:any;onInventory:()=>void}){
 const {language}=useLanguage(),de=language==='de',t=(en:string,ger:string)=>de?ger:en;
 const current=game.data.recipe||(game.level===0?'fuse':game.level===1?'samplecase':null);
 const missionIds=new Set(['fuse','samplecase',...(current?[current]:[])]);
 const [category,setCategory]=useState<'mission'|'gear'>(current?'mission':'gear');
 const [selected,setSelected]=useState(current||'bandages'),[done,setDone]=useState<string|null>(null);
 const recipes=RECIPES.filter(r=>category==='mission'?missionIds.has(r.id):!missionIds.has(r.id));
 const state=recipeState(game,selected)!,r=state.recipe;
 const missing=state.ingredients.filter(i=>i.have<i.need);
 const names=(id:string)=>{const item=(ITEMS as any)[id];return item.name};
 const hint=selected==='samplecase'?t('Metal makes the protective shell. The bottle provides the sealed glass liner. Both are consumed.','Metall bildet die Schutzhülle, die Flasche den gläsernen Innenbehälter. Beide werden verbraucht.'):null;
 const switchCategory=(next:'mission'|'gear')=>{setCategory(next);const list=RECIPES.filter(r=>next==='mission'?missionIds.has(r.id):!missionIds.has(r.id));setSelected(next==='mission'&&current?current:list[0].id);setDone(null)};
 return <Localized><div className="craft-simple">
  <div className="craft-simple-top"><button className="secondary-btn" onClick={onInventory}>{t('Back to inventory','Zurück zum Inventar')}</button><span>{t('Materials are taken from your inventory automatically.','Materialien werden automatisch aus deinem Inventar genommen.')}</span></div>
  <div className="craft-categories" role="group" aria-label={t('Recipe categories','Rezeptkategorien')}><button aria-pressed={category==='mission'} onClick={()=>switchCategory('mission')}>{t('Mission recipes','Missionsrezepte')}</button><button aria-pressed={category==='gear'} onClick={()=>switchCategory('gear')}>{t('Equipment & supplies','Ausrüstung & Vorräte')}</button></div>
  <div className="craft-simple-layout"><nav className="craft-simple-list" aria-label={t('Recipes','Rezepte')}>{recipes.map(recipe=>{const info=recipeState(game,recipe.id)!;return <button key={recipe.id} aria-pressed={selected===recipe.id} onClick={()=>{setSelected(recipe.id);setDone(null)}}><ItemIcon id={recipe.output} size={25}/><span><strong>{recipe.name}</strong><small>{recipe.id===current?t('Current mission','Aktuelle Mission'):t('Recipe','Rezept')}</small><small>{info.ready?t('Ready to craft','Herstellbar'):t('Materials missing','Material fehlt')}</small></span></button>})}</nav>
  <section className="craft-simple-detail"><header><ItemIcon id={r.output} size={45}/><div><small>{t('RESULT','ERGEBNIS')} · ×{r.quantity}</small><h3>{names(r.output)}</h3></div></header>
   {selected===current&&<p className="craft-mission-note">{game.data.goals.find((goal:string)=>/craft|herstell|bauen|assemble/i.test(goal))||game.data.hint}</p>}
   {hint&&<p>{hint}</p>}
   <h4>{t('Collect these materials','Diese Materialien sammeln')}</h4>
   <div className="craft-ingredient-cards">{state.ingredients.map(i=><div key={i.item} className={i.have>=i.need?'available':'missing'}><ItemIcon id={i.item} size={26}/><span><strong>{names(i.item)}</strong><small>{t('Consumed when crafting','Wird beim Herstellen verbraucht')}</small></span><b>{Math.min(i.have,i.need)} / {i.need}</b></div>)}</div>
   {r.tool&&<div className="craft-tool-note"><ItemIcon id={r.tool} size={20}/><span><strong>{names(r.tool)}</strong><small>{t('Tool only · stays in your inventory','Nur Werkzeug · bleibt im Inventar')}</small></span><b>{state.hasTool?'✓':t('Missing','Fehlt')}</b></div>}
   {selected==='samplecase'&&missing.length>0&&<p>{t('Search the maintenance locker and laboratory for metal scrap and a glass bottle.','Durchsuche Wartungsschrank und Labor nach Metallschrott und einer Glasflasche.')}</p>}
   {state.ingredients.some(i=>Object.values(game.equipment).includes(i.item))&&<p className="craft-equipped-warning">{t('Equipped ingredients will also be consumed.','Angelegte Zutaten werden ebenfalls verbraucht.')}</p>}
   <button className="primary-btn" disabled={!state.ready} onClick={()=>{if(craft(game,selected,prepareRecipe(game,selected)))setDone(selected)}}>{t('Craft','Herstellen')} · {names(r.output)}</button>
   <p className="craft-feedback" role="status">{done===selected?t('Created! You will find it in your inventory.','Fertig! Du findest den Gegenstand im Inventar.'):!state.active?t('Enter the sector to craft.','Betritt den Sektor zum Herstellen.'):missing.length?t('Collect the missing materials first.','Sammle zuerst die fehlenden Materialien.'):!state.hasTool?t('You still need the toolbox. It is not a building material.','Du brauchst noch den Werkzeugkasten. Er ist kein Baumaterial.'):state.weight>CAPACITY?t('Free up some carrying capacity.','Schaffe etwas Platz beim Tragegewicht.'):t('All materials ready. Nothing is consumed until you craft.','Alles bereit. Erst beim Herstellen werden Materialien verbraucht.')}</p>
  </section></div>
 </div></Localized>;
}
