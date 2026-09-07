import {configureInfected,infectedRules,clearSight} from './infected.mjs';
import { createCompanion, updateCompanion, commandCompanion } from './companion.mjs';
import { RADIO } from './radio.mjs';
import { createTutorial, updateTutorial } from './tutorial.mjs';
export const CAPACITY = 14;
export const ITEMS = {
 axe:{name:'Fire axe',weight:2.8,kind:'weapon',slot:'hand',damage:54,cooldown:1,desc:'A heavy, two-handed strike. Equip in hand: 54 damage, one strike per second.'},
 jacket:{name:'Reinforced jacket',weight:1.1,kind:'armor',slot:'body',protection:.15,desc:'Thick canvas and leather panels. Wear on your body for 15% damage reduction.'},
 vest:{name:'Protective vest',weight:2.3,kind:'armor',slot:'body',protection:.30,desc:'Scavenged security armor. Wear on your body for 30% damage reduction.'},
 helmet:{name:'Patrol helmet',weight:.8,kind:'armor',slot:'head',protection:.15,desc:'A battered steel helmet. Wear on your head for 15% damage reduction. Combines with body armor.'},
 crowbar:{name:'Crowbar',weight:1.8,kind:'weapon',slot:'hand',damage:38,cooldown:.7,desc:'Sturdy and quiet. Deals 38 damage per hit.'},
 medkit:{name:'Bandage',weight:0.3,kind:'heal',desc:'Restores 40 health.'},
 bottle:{name:'Glass bottle',weight:0.4,kind:'throw',slot:'hand',desc:'Throw onto the map. Distracts Infected for 8 seconds.'},
 fuse:{name:'Fuse',weight:0.2,kind:'quest',desc:'Fits the generator at the bunker entrance.'},
 fuel:{name:'Fuel',weight:2,kind:'quest',desc:'A small can of diesel for the generator.'},
 keycard:{name:'Keycard',weight:0.1,kind:'quest',desc:'Unlocks the laboratory and rooftop access.'},
 sample:{name:'Sample N-04',weight:0.6,kind:'quest',desc:'The sealed sample must reach the evacuation point.'},
 battery:{name:'Battery',weight:1.5,kind:'quest',desc:'Powers the transmitter on the roof.'},
 scrap:{name:'Metal scrap',weight:1.2,kind:'salvage',desc:'Salvage. Can be dropped at any time.'},
 chair:{name:'Folding chair',weight:2.4,kind:'salvage',desc:'Still usable. But every item adds weight.'},
 tire:{name:'Car tire',weight:4,kind:'salvage',desc:'Portable, but heavy. Might be best to leave it behind.'},
 toolbox:{name:'Toolbox',weight:2.2,kind:'salvage',desc:'Old tools. A small collection from another time.'},
 ration:{name:'Canned food',weight:0.5,kind:'food',desc:'A comforting memory. Restores 18 health.'},
};
const item=(id,x,y,itemId)=>({id,x,y,type:'item',item:itemId,name:ITEMS[itemId].name,desc:ITEMS[itemId].desc});
const prop=(id,x,y,style,w=1,h=1)=>{
 const searchable=['car','desk','bed'].includes(style);
 const contents=style==='car'?(id==='car2'?['toolbox','medkit','jacket']:['scrap','bottle','ration']):style==='desk'?(id==='desk1'?['bottle','ration']:['scrap','medkit']):['medkit'];
 return {id,x,y,type:searchable?'container':'prop',style,w,h,name:({car:id==='car2'?'Abandoned utility van':'Abandoned sedan',wall:'Concrete wall',barrier:'Concrete barrier',tank:'Water tank',vent:'Ventilation unit',bed:'Hospital bed storage',desk:'Lab desk drawers',tree:'Dead tree'})[style]||'Rubble',desc:searchable?'Click to approach and search. Open compartments reveal their remaining contents.':'Too heavy to carry. You will have to walk around it.',solid:true,...(searchable?{contents}: {})};
};
const crate=(id,x,y,name,contents,desc)=>({id,x,y,type:'container',name,contents,desc,solid:true});
const zombie=(id,x,y)=>({id,x,y,hp:76,maxHp:76,type:'zombie',name:'Infected',desc:'Reacts to proximity and noise. Click to attack.',attack:0,hurt:0,action:null,repath:0,path:[],home:{x,y},alert:false});
export const LEVELS=[
 {name:'Ashes at the gate',place:'CHECKPOINT 04',tag:'OUTSKIRTS',weather:'RAIN · 8 °C',intro:'The city is lost. Station Zero lies beneath it. Find a way through the bunker gate.',hint:'Search the guard crate and the car trunk. The generator needs a fuse and fuel.',size:[21,19],start:{x:3,y:15},goals:['Find a Fuse and Fuel','Start the generator','Enter the bunker'],
 entities:[
  prop('north-wall',3,0,'wall',8,1),prop('side-wall',0,1,'wall',1,8),prop('ruin',1,5,'wall',2,1),prop('ruin2',5,1,'wall',1,5),
  prop('bunker-shell',15,0,'wall',6,2),prop('bunker-left',14,2,'wall',2,2),prop('bunker-right',19,2,'wall',2,2),
  prop('barrier1',7,8,'barrier',3,1),prop('barrier2',13,9,'barrier',4,1),prop('car1',10,12,'car',2,3),prop('car2',4,9,'car',2,3),
  prop('rubble1',2,2,'rubble',2,2),prop('rubble2',19,13,'rubble',2,2),prop('tree1',2,7,'tree'),prop('tree2',18,8,'tree'),
  crate('guard',3,4,'Guard crate',['fuse','medkit'],'A toolbox belonging to the guards. The lid reads: “Spare fuses”.'),
  crate('wreck',13,14,'Car trunk',['fuel','bottle'],'The trunk is ajar. It smells of diesel.'),
  crate('supply',8,3,'Supply crate',['ration','bottle'],'Someone packed this for the coming winter.'),
  item('jacket1',5,16,'jacket'),item('helmet1',6,15,'helmet'),item('bottle1',4,14,'bottle'),item('scrap1',7,13,'scrap'),item('chair1',3,6,'chair'),item('tire1',6,11,'tire'),item('tools1',15,11,'toolbox'),item('medkit1',9,6,'medkit'),
  {id:'generator',x:15,y:5,type:'generator',name:'Emergency generator',desc:'The bunker gate stays sealed without power. Requires a fuse and fuel.',solid:true},
  {id:'bunker',x:17,y:3,type:'exit',name:'Bunker gate',desc:'Leads deep beneath the city. The generator must be running.',solid:true},
  {id:'note1',x:7,y:16,type:'note',name:'Last radio message',desc:'“If anyone can hear this: Station Zero. Bring the sample to the roof. We will keep the frequency clear.”'}
 ],zombies:[zombie('z1',11,7),zombie('z2',17,12),zombie('z3',8,1)]},
 {name:'Station Zero',place:'BUNKER / LEVEL −02',tag:'UNDERGROUND',weather:'INDOORS · 14 °C',intro:'The emergency lights are on. Find a keycard, open the laboratory and bring Sample N-04 to the roof.',hint:'The keycard is in the maintenance locker in the western room. The laboratory is behind the security door.',size:[21,19],start:{x:3,y:15},goals:['Find the Keycard','Open the laboratory and recover the sample','Reach the rooftop access'],
 entities:[
  prop('nw',0,0,'wall',21,1),prop('ww',0,1,'wall',1,17),prop('ew',20,1,'wall',1,17),
  prop('divide1',9,1,'wall',1,6),prop('divide2',9,10,'wall',1,8),prop('lab1',10,7,'wall',4,1),prop('lab2',15,7,'wall',5,1),
  prop('bed1',2,8,'bed',1,3),prop('bed2',5,9,'bed',1,3),prop('desk1',12,2,'desk',3,1),prop('desk2',17,4,'desk',2,1),prop('vent1',2,1,'vent',3,2),
  crate('locker',3,4,'Maintenance locker',['keycard','medkit'],'A bent locker. A keycard hangs inside.'),
  crate('medical',6,13,'Medical crate',['medkit','ration'],'Sterile bandages and a single can of food.'),
  item('vest1',4,12,'vest'),item('axe1',6,12,'axe'),item('lab-bottle',11,11,'bottle'),item('lab-chair',6,5,'chair'),item('lab-scrap',17,14,'scrap'),item('lab-tools',12,15,'toolbox'),
  {id:'lab-door',x:14,y:7,type:'door',name:'Laboratory door',desc:'Security level 2. Requires a keycard.',solid:true,open:false},
  item('sample',16,2,'sample'),
  {id:'roof',x:18,y:10,type:'exit',name:'Rooftop access',desc:'The elevator works. Requires the keycard and Sample N-04.',solid:true},
  {id:'terminal',x:7,y:2,type:'note',name:'Laboratory log',desc:'“N-04 shows no symptoms. The final evacuation leaves from the roof. Do not leave the sample behind.”'}
 ],zombies:[zombie('b1',7,8),zombie('b2',15,12),zombie('b3',16,4),zombie('b4',12,17)]},
 {name:'The last frequency',place:'EVACUATION / ROOF 07',tag:'LAST CONTACT',weather:'FOG · 6 °C',intro:'A light circles above the rooftops. Power the transmitter and hold out until evacuation arrives.',hint:'The battery is in rooftop storage. Activate the transmitter and survive for 35 seconds. Then reach the marked landing zone.',size:[21,19],start:{x:3,y:15},goals:['Find the transmitter battery','Send a radio call · Survive for 35 seconds','Reach the Landing zone with the sample'],
 entities:[
  prop('rw1',0,0,'barrier',21,1),prop('rw2',0,1,'barrier',1,17),prop('rw3',20,1,'barrier',1,17),
  prop('v1',7,5,'vent',3,2),prop('v2',12,12,'vent',3,2),prop('water',17,3,'tank',2,2),prop('rubble',2,2,'rubble',2,2),
  prop('smallwall',5,11,'barrier',4,1),prop('smallwall2',13,7,'barrier',4,1),
  crate('roof-store',4,5,'Rooftop storage',['battery','medkit'],'A spare battery, kept dry beneath a tarp.'),
  crate('roof-aid',16,15,'Emergency crate',['medkit','bottle','bottle'],'Set aside for the evacuation. Finally, a bit of luck.'),
  item('roof-ration',6,14,'ration'),item('roof-chair',10,3,'chair'),item('roof-scrap',18,8,'scrap'),item('roof-bottle',11,16,'bottle'),
  {id:'radio',x:10,y:7,type:'radio',name:'Longwave transmitter',desc:'The frequency is set. Only the battery is missing.',solid:true},
  {id:'evac',x:16,y:10,type:'exit',name:'Landing zone',desc:'Activate the transmitter and hold out for 35 seconds.',solid:false},
  {id:'roof-note',x:3,y:11,type:'note',name:'Evacuation plan',desc:'“35 seconds after the signal. Keep moving. We are only coming once.”'}
 ],zombies:[zombie('r1',11,3),zombie('r2',18,13)]},
 {name:'Haven',place:'HAVEN / SAFE COLONY',tag:'A NEW BEGINNING',weather:'DAWN · 12 °C',intro:'Beyond the walls, people still live. Doctor Imani needs the sample. Engineer Levin needs your help restoring clean water. Koda finally has somewhere safe to rest.',hint:'Speak to Imani at the clinic, then Levin by the water tank. Collect supplies before leaving through the east gate.',size:[21,19],start:{x:4,y:14},goals:['Deliver the sample to Doctor Imani','Accept Levin’s water mission','Leave for the waterworks'],entities:[
 prop('haven-n',0,0,'wall',21,1),prop('haven-w',0,1,'wall',1,17),prop('clinic',2,3,'vent',4,3),prop('garden',11,3,'tank',2,2),prop('bench',4,9,'desk',2,1),
 {id:'imani',x:6,y:7,type:'npc',name:'Doctor Imani',desc:'Mara, your sample could save this colony. Koda can stay beside you. You are both welcome here.',requires:'sample'},
 {id:'levin',x:13,y:7,type:'npc',name:'Engineer Levin',desc:'Our water filter has failed. Find the toolbox at the waterworks and repair the pump. Then recover a battery from the rail depot. We need both systems to survive.',prerequisite:'imani'},
 crate('haven-aid',3,8,'Colony supplies',['medkit','medkit','ration','ration','bottle'],'Supplies for Mara and Koda. Take what you need.'),
 {id:'departure',x:18,y:13,type:'exit',name:'Waterworks trail',desc:'Leave the colony after speaking to Imani and Levin.',solid:false}
 ],zombies:[]},
 {name:'Clean water',place:'OLD WATERWORKS',tag:'COLONY MISSION',weather:'MIST · 9 °C',intro:'Haven’s taps are running dry. Search the maintenance shed, repair the pump and open a route to the rail depot.',hint:'The western storage box contains tools. Reach the pump in the northeast. Barriers break enemy sightlines.',size:[21,19],start:{x:2,y:16},goals:['Recover a toolbox','Repair the colony water pump','Reach the rail depot trail'],entities:[
 prop('water-n',0,0,'wall',21,1),prop('water-tank1',7,4,'tank',3,3),prop('water-tank2',13,3,'tank',3,3),prop('water-cover',8,11,'barrier',5,1),prop('water-car',4,10,'car',2,3),
 crate('water-tools',3,4,'Maintenance supplies',['toolbox','medkit'],'The tools needed to repair the pump.'),crate('water-aid',15,14,'Worker supplies',['medkit','bottle','ration'],'A worker left a bag here.'),
 {id:'pump',x:17,y:5,type:'mission',name:'Water pump',desc:'Repair the pump with a toolbox. The tools are consumed by the repair.',requires:'toolbox'},
 {id:'water-exit',x:18,y:16,type:'exit',name:'Rail depot trail',desc:'Repair the pump before leaving.',solid:false}
 ],zombies:[zombie('w1',6,6),zombie('w2',12,12),zombie('w3',17,9),zombie('w4',10,2)]},
 {name:'Light for Haven',place:'ABANDONED RAIL DEPOT',tag:'COLONY MISSION',weather:'DUSK · 7 °C',intro:'The water is flowing. Now Haven needs power. Recover a battery from the depot, activate the relay and get back to the colony with Koda.',hint:'Search the eastern freight crate. The relay is in the northwest. Use the freight barriers to escape fast Infected.',size:[21,19],start:{x:3,y:16},goals:['Recover the relay battery','Activate the power relay','Return to Haven'],entities:[
 prop('rail-n',0,0,'wall',21,1),prop('freight1',6,4,'vent',3,5),prop('freight2',12,9,'vent',3,5),prop('rail-cover',3,11,'barrier',3,1),prop('rail-car',16,3,'car',2,3),
 crate('rail-battery',18,9,'Freight crate',['battery','medkit'],'An intact industrial battery.'),crate('rail-aid',4,7,'Signal crew supplies',['medkit','medkit','bottle','ration'],'Emergency supplies.'),
 {id:'relay',x:3,y:3,type:'mission',name:'Power relay',desc:'Install a battery to restore power to Haven.',requires:'battery'},
 {id:'home',x:18,y:16,type:'exit',name:'Return to Haven',desc:'Restore power before returning to the colony.',solid:false}
 ],zombies:[zombie('d1',10,5),zombie('d2',17,12),zombie('d3',4,4),zombie('d4',10,16),zombie('d5',18,2)]}

];
LEVELS.push({...JSON.parse(JSON.stringify(LEVELS[3])),name:'A home for two',intro:'The colony lights are on. Imani has news about the sample, and Levin has kept a place for Mara and Koda. Speak to them, then rest.',hint:'Talk to Imani and Levin. Reach the resting place to finish this chapter of your journey.',goals:['Hear Imani’s findings','Meet Levin again','Rest with Koda'],entities:JSON.parse(JSON.stringify(LEVELS[3].entities)).map(e=>e.id==='imani'?{...e,requires:null,desc:'N-04 slows the infection in our first tests. You gave us time, Mara. Koda is welcome in the clinic, too.'}:e.id==='levin'?{...e,desc:'Clean water. Warm rooms. You made it happen. There is a bed for you and a blanket for Koda.'}:e.id==='departure'?{...e,name:'Rest with Koda',desc:'A safe place at last. Speak to your new friends, then rest.'}:e)});
const clone=o=>JSON.parse(JSON.stringify(o));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const key=(x,y)=>`${x},${y}`;
export class Game {
 constructor({tutorial=false}={}){this.equipment={hand:'crowbar',body:null,head:null};this.tutorialDefault=tutorial;this.tutorialFocus=0;this.listeners=new Set();this.level=0;this.unlocked=0;this.inventory=['crowbar','medkit','bottle'];this.health=100;this.kills=0;this.totalTime=0;this.messages=[];this.history=[];this.entries=[];this.effects=[];this.mode='briefing';this.sneak=false;this.muted=true;this.loadLevel(0);}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 emit(){updateTutorial(this);for(const fn of this.listeners)fn()}
 itemSlot(id){return ITEMS[id]?.slot}
 get protection(){return 1-['body','head'].reduce((remaining,slot)=>remaining*(1-(ITEMS[this.equipment[slot]]?.protection||0)),1)}
 get meleeDamage(){return ITEMS[this.equipment.hand]?.damage||19}
 get meleeCooldown(){return ITEMS[this.equipment.hand]?.cooldown||.7}
 equip(id){if(!this.canManageInventory||!this.has(id)||!ITEMS[id]?.slot)return;const slot=ITEMS[id].slot;this.equipment[slot]=this.equipment[slot]===id?null:id;this.log(`${ITEMS[id].name} ${this.equipment[slot]?'equipped':'unequipped'}.`);}
 unequip(slot){if(!this.canManageInventory||!['hand','body','head'].includes(slot))return;this.equipment[slot]=null;this.emit()}
 action(type,duration){this.player.action={type,remaining:duration,duration}}
 get weight(){return this.inventory.reduce((s,id)=>s+ITEMS[id].weight,0)}
 count(id){return this.inventory.filter(i=>i===id).length}
 has(id){return this.inventory.includes(id)}
 loadLevel(index,restart=false){
  if(restart){const e=this.entries[index];this.equipment={...e.equipment};this.inventory=[...e.inventory];this.health=e.health;this.kills=e.kills;this.totalTime=e.totalTime;}
  this.level=index;this.unlocked=Math.max(this.unlocked,index);this.data=LEVELS[index];this.entities=clone(this.data.entities);this.zombies=clone(this.data.zombies).map((z,i)=>configureInfected(z,i+index));this.player={...this.data.start,facing:0,attack:0,hurt:0,action:null};this.path=[];this.target=null;this.selected=null;this.time=0;this.evacuation=0;this.signal=-1;this.spawned=0;this.generatorOn=false;this.effects=[];this.mode='briefing';this.throwing=false;this.sneak=false;this.noise=0;this.flash=0;this.health=Math.max(85,this.health);this.pulse=0;
  const bond=this.companion?.bond;this.companionOpen=false;this.companion=createCompanion(this.player);if(bond!==undefined)this.companion.bond=bond;const dogStart=[[-1,0],[0,1],[1,0],[0,-1]].map(([dx,dy])=>({x:this.player.x+dx,y:this.player.y+dy})).find(p=>!this.isBlocked(p.x,p.y));if(dogStart)Object.assign(this.companion,dogStart);this.inventoryOpen=false;this.inventoryReturnMode=null;this.lootOpen=false;this.lootContainerId=null;this.tutorialEnabled=this.level===0&&this.tutorialDefault;this.tutorial=createTutorial(this.tutorialEnabled);
  if(!restart)this.entries[index]={equipment:{...this.equipment},inventory:[...this.inventory],health:this.health,kills:this.kills,totalTime:this.totalTime};
  this.history=[];const memory=['memory-checkpoint','memory-bunker','memory-rooftop'][index];if(memory&&!this.messages.some(m=>m.voiceId===memory))this.messages.push({id:'memory-'+index,text:RADIO[memory].text,voiceId:memory,sender:'Mara',level:index,time:this.totalTime});this.log(this.data.intro,'story',['checkpoint','bunker','rooftop'][index]);this.emit();
 }
 start(guided=this.tutorialEnabled){if(this.companionOpen)return;if(this.inventoryOpen||this.lootOpen)return;if(this.mode==='briefing'&&this.level===0){this.tutorialEnabled=guided;this.tutorial=createTutorial(guided)}if(this.mode==='briefing'||this.mode==='paused')this.mode='playing';this.emit()}
 commandCompanion(command){return commandCompanion(this,command)}
 openCompanion(){if(!this.canAct||this.inventoryOpen||this.lootOpen)return;this.companionOpen=true;this.mode='paused';this.throwing=false;this.emit()}
 closeCompanion(){if(!this.companionOpen)return;this.companionOpen=false;this.mode='playing';this.emit()}
 careCompanion(kind){if(!this.companionOpen||!['feed','play'].includes(kind))return false;if(kind==='feed'&&!this.consume('ration'))return false;this.companion.care={kind,at:Date.now()};this.companion.bond=Math.min(100,this.companion.bond+(kind==='feed'?10:5));this.emit();return true}
 get canAct(){return this.mode==='playing'&&!this.tutorial.reading}
 acknowledgeTutorial(){if(!this.tutorial.active||this.mode!=='playing'||this.inventoryOpen)return;this.tutorial.reading=false;this.tutorialFocus++;this.emit()}
 skipTutorial(){this.tutorial.active=false;this.tutorial.reading=false;this.tutorialEnabled=false;this.log('Tutorial skipped. Complete the checkpoint objectives at your own pace.')}
 focusTutorial(){this.tutorialFocus++;this.emit()}
 toggleSneak(){if(!this.canAct)return;this.sneak=!this.sneak;this.emit()}
 pause(){if(this.companionOpen)return;if(this.inventoryOpen||this.lootOpen)return;if(this.mode==='playing')this.mode='paused';else if(this.mode==='paused')this.mode='playing';this.emit()}
 openInventory(){if(this.companionOpen)return;if(this.inventoryOpen||this.lootOpen)return;if(['playing','paused'].includes(this.mode)&&this.tutorial.active)this.tutorial.facts.inventoryViewed=true;this.inventoryReturnMode=this.mode;this.inventoryOpen=true;this.mode='paused';this.throwing=false;this.emit()}
 closeInventory(){if(!this.inventoryOpen&&!this.lootOpen)return;this.mode=this.inventoryReturnMode||'paused';this.inventoryReturnMode=null;this.inventoryOpen=false;this.lootOpen=false;this.lootContainerId=null;this.emit()}
 get canManageInventory(){return this.canAct||this.mode==='paused'&&(this.inventoryOpen||this.lootOpen)&&['playing','paused'].includes(this.inventoryReturnMode)}
 get backpack(){const bag=[...this.inventory];for(const id of Object.values(this.equipment)){const i=bag.indexOf(id);if(i>=0)bag.splice(i,1)}return bag}
 get lootContainer(){return this.lootOpen?this.entities.find(e=>e.id===this.lootContainerId&&!e.removed):null}
 entityDistance(e){return Math.hypot(this.player.x-Math.max(e.x,Math.min(this.player.x,e.x+(e.w||1)-1)),this.player.y-Math.max(e.y,Math.min(this.player.y,e.y+(e.h||1)-1)))}
 openLoot(e){if(!this.canAct||this.inventoryOpen||this.lootOpen||e.type!=='container'||this.entityDistance(e)>1.5)return;this.inventoryReturnMode=this.mode;this.lootContainerId=e.id;this.lootOpen=true;e.open=true;this.mode='paused';this.path=[];this.target=null;this.throwing=false;this.log(e.contents.length?`Searching ${e.name}. Choose what to take.`:'Searched. This compartment is empty.');}
 takeLoot(id){const e=this.lootContainer;if(!e||!this.canManageInventory)return false;const index=e.contents.indexOf(id);if(index<0)return false;if(!this.addItem(id))return false;e.contents.splice(index,1);this.emit();return true}
 takeAllLoot(){const e=this.lootContainer;if(!e||!this.canManageInventory)return;for(const id of [...e.contents])this.takeLoot(id)}
 storeLoot(id){const e=this.lootContainer;if(!e||!this.canManageInventory||!this.has(id))return false;this.consume(id);e.contents.push(id);this.log(`Stored ${ITEMS[id].name} in ${e.name}.`);return true}
 transferItem(id,from,to){
  if(!this.canManageInventory||!ITEMS[id])return false;
  const slot=ITEMS[id].slot,fromLoot=from==='loot';
  if(from==='bag'&&!this.backpack.includes(id))return false;
  if(fromLoot?!this.lootContainer?.contents.includes(id):!this.has(id))return false;
  if(['hand','body','head'].includes(from)&&this.equipment[from]!==id)return false;
  if(!['bag','loot','hand','body','head'].includes(from))return false;
  if(['hand','body','head'].includes(to)){
   if(slot!==to)return false;if(fromLoot&&!this.takeLoot(id))return false;
   this.equipment[to]=id;this.log(`${ITEMS[id].name} equipped.`);return true;
  }
  if(to==='bag'){if(fromLoot)return this.takeLoot(id);if(['hand','body','head'].includes(from)){this.unequip(from);return true}return true}
  if(to==='loot'&&!fromLoot){if(!this.lootContainer)return false;if(['hand','body','head'].includes(from))this.equipment[from]=null;return this.storeLoot(id);}
  if(to==='ground'&&!fromLoot){if(['hand','body','head'].includes(from))this.equipment[from]=null;this.drop(id);return true}return false;
 }
 next(){if(this.mode==='complete'&&this.level<LEVELS.length-1)this.loadLevel(this.level+1)}
 restart(){this.loadLevel(this.level,true)}
 newGame(){this.equipment={hand:'crowbar',body:null,head:null};this.inventory=['crowbar','medkit','bottle'];this.health=100;this.kills=0;this.totalTime=0;this.messages=[];this.entries=[];this.unlocked=0;this.companion=undefined;this.loadLevel(0)}
 log(text,tone='info',voiceId=null){this.messages.push({id:'message-'+this.messages.length,text:voiceId?RADIO[voiceId].text:text,tone,voiceId,sender:voiceId?'Control':'Field log',level:this.level,time:this.totalTime});if(voiceId)this.lastRadio={id:'call-'+Math.random(),voiceId,text:RADIO[voiceId].text};this.history.unshift({text,tone,id:Math.random()});this.history=this.history.slice(0,5);this.emit()}
 isBlocked(x,y,ignore){if(x<0||y<0||x>=this.data.size[0]||y>=this.data.size[1])return true;return this.entities.some(e=>e.id!==ignore&&!e.removed&&e.solid&&!(e.type==='door'&&e.open)&&x>=e.x&&x<e.x+(e.w||1)&&y>=e.y&&y<e.y+(e.h||1))}
 pathTo(from,to){
  const sx=Math.round(from.x),sy=Math.round(from.y),tx=Math.round(to.x),ty=Math.round(to.y);
  if(this.isBlocked(tx,ty))return null;if(sx===tx&&sy===ty)return distance(from,{x:tx,y:ty})>.01?[{x:tx,y:ty}]:[];
  const queue=[{x:sx,y:sy}],prev=new Map([[key(sx,sy),null]]);let found=false;
  for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x===tx&&p.y===ty){found=true;break}for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(!prev.has(k)&&!this.isBlocked(x,y)){prev.set(k,p);queue.push({x,y})}}}
  if(!found)return null;const path=[];let p={x:tx,y:ty};while(p){path.unshift(p);p=prev.get(key(p.x,p.y))}path.shift();return path;
 }
 nearestPath(e){const options=[];for(let dx=-1;dx<=(e.w||1);dx++)for(let dy=-1;dy<=(e.h||1);dy++){if(dx>=0&&dx<(e.w||1)&&dy>=0&&dy<(e.h||1)&&e.solid)continue;const t={x:e.x+dx,y:e.y+dy};if(distance(t,e)>1.45&&(!e.w&&!e.h))continue;const path=this.pathTo(this.player,t);if(path)options.push(path)}options.sort((a,b)=>a.length-b.length);return options[0]??null}
 move(x,y){if(this.evacuation>0)return;if(!this.canAct)return;this.throwing=false;const path=this.pathTo(this.player,{x,y});if(path===null){this.log('The path is blocked there.','warn');return}this.target=null;this.selected=null;this.path=path;this.emit()}
 select(id){if(this.evacuation>0)return;if(!this.canAct)return;const e=[...this.entities,...this.zombies].find(e=>e.id===id&&!e.removed&&e.hp!==0);if(!e)return;this.selected=e;this.throwing=false;
  if(e.type==='prop'){this.log(e.desc);this.emit();return}
  if(e.type==='zombie'){this.target=e;this.path=this.nearestPath(e)||[];this.emit();return}
  this.target=e;const path=this.nearestPath(e);if(path===null){this.target=null;this.log('No clear path. Open the door first.','warn');return}this.path=path;this.emit();
 }
 addItem(id){if(this.weight+ITEMS[id].weight>CAPACITY+0.00001){this.log(`Too heavy: ${ITEMS[id].name}. Drop something from your backpack.`,'warn');return false}this.inventory.push(id);this.log(`Picked up ${ITEMS[id].name}.`,ITEMS[id].kind==='quest'?'success':'info');return true}
 consume(id){const i=this.inventory.indexOf(id);if(i<0)return false;this.inventory.splice(i,1);if(!this.has(id))for(const slot of ['hand','body','head'])if(this.equipment[slot]===id)this.equipment[slot]=null;return true}
 drop(id){if(!this.canManageInventory||!this.has(id))return;this.consume(id);let tile={x:Math.round(this.player.x),y:Math.round(this.player.y)};const offsets=[[0,0],[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[2,0]];for(const [dx,dy] of offsets){const p={x:tile.x+dx,y:tile.y+dy};if(!this.isBlocked(p.x,p.y)&&!this.entities.some(e=>!e.removed&&e.x===p.x&&e.y===p.y&&e.type==='item')){tile=p;break}}this.entities.push(item('drop-'+Math.random(),tile.x,tile.y,id));this.log(`Dropped ${ITEMS[id].name}. You can pick it up again.`);this.emit()}
 use(id){if(!this.canManageInventory)return;if(!this.has(id)){this.log('You do not have any of that.','warn');return}const def=ITEMS[id];if(['weapon','armor'].includes(def.kind)){this.equip(id);return}if(def.kind==='heal'||def.kind==='food'){if(this.health>=100){this.log('You are already at full health.');return}this.consume(id);this.health=Math.min(100,this.health+(def.kind==='heal'?40:18));this.action('heal',1.2);this.effects.push({type:'heal',x:this.player.x,y:this.player.y,life:1});this.log(def.kind==='heal'?'Bandage applied. +40 health.':'Ate canned food. +18 health.','success')}else if(def.kind==='throw'){if(this.inventoryOpen||this.lootOpen){this.throwing=true;this.closeInventory()}else this.throwing=!this.throwing;this.log(this.throwing?'Click an empty tile within throwing range.':'Throw canceled.')}else this.log(def.desc);this.emit()}
 throwBottle(x,y){if(!this.canAct||!this.throwing)return;const p={x,y};if(distance(this.player,p)>9){this.log('Too far. Bottles can travel up to 9 tiles.','warn');return}if(this.isBlocked(x,y)){this.log('Choose an empty tile for the distraction.','warn');return}if(!this.consume('bottle')){this.throwing=false;this.log('No bottles left in your backpack.','warn');return}this.throwing=false;for(const z of this.zombies){if(z.hp>0&&distance(z,p)<12){z.lure={x,y,until:this.time+8};z.repath=0;z.alert=true}}this.action('throw',.7);this.tutorial.facts.threw=true;this.effects.push({type:'bottle',x,y,life:8});this.noise=1;this.log('Glass shatters. The Infected follow the sound.');this.emit()}
 interact(e){
  if(e.removed)return;this.action('interact',.7);
  if(e.type==='item'){if(this.addItem(e.item)){e.removed=true;this.selected=null;this.tutorial.facts.pickups++;}}
  else if(e.type==='container'){this.openLoot(e);return;}
  else if(e.type==='npc'||e.type==='mission'){if(e.done){this.log(e.desc,'story');return}if(e.prerequisite&&!this.entities.find(n=>n.id===e.prerequisite)?.done){this.log('Speak to Doctor Imani first.','warn');return}if(e.requires&&!this.has(e.requires)){this.log('Missing: '+ITEMS[e.requires].name+'.','warn');return}if(e.requires)this.consume(e.requires);e.done=true;this.log(e.desc,'story');}
  else if(e.type==='note')this.log(e.desc,'story');
  else if(e.type==='generator'){if(this.generatorOn){this.log('The generator is running. The bunker gate has power.','success');return}const missing=['fuse','fuel'].filter(id=>!this.has(id));if(missing.length){this.log('Missing: '+missing.map(id=>ITEMS[id].name).join(' and ')+'.','warn');return}this.consume('fuse');this.consume('fuel');this.generatorOn=true;this.noise=1;this.log('The generator starts. The bunker gate is unlocked.','success','generator');}
  else if(e.type==='door'){if(!this.has('keycard')){this.log('Locked. Find the keycard in the maintenance locker.','warn');return}e.open=!e.open;this.log(e.open?'The laboratory door is open.':'The laboratory door is closed.','success');}
  else if(e.type==='radio'){if(this.signal>=0){this.log('Signal sent. Keep moving!');return}if(!this.has('battery')){this.log('No power. Find the battery in rooftop storage.','warn');return}this.consume('battery');this.signal=35;this.noise=1;this.log('Radio call received. Evacuation in 35 seconds. They heard you.','warn','signal');}
  else if(e.type==='exit'){
   if(this.level===0&&!this.generatorOn){this.log('No power. Repair the generator first.','warn');return}
   if(this.level===1&&(!this.has('keycard')||!this.has('sample'))){this.log('You need the keycard and Sample N-04.','warn');return}
   if(this.level===2&&(this.signal!==0||!this.has('sample'))){this.log(this.signal!==0?'Evacuation has not arrived yet. Activate the transmitter and hold out.':'Retrieve the dropped Sample N-04. You cannot leave without it.','warn');return}
   if(this.level>=3&&!this.entities.filter(n=>n.type==='npc'||n.type==='mission').every(n=>n.done)){this.log('Complete the colony mission before leaving.','warn');return}
   if(this.level===2){this.evacuation=5;this.path=[];this.target=null;this.log('Mara and Koda are boarding. Next stop: Haven.','success','rescue');return}
   this.mode=this.level===LEVELS.length-1?'won':'complete';this.path=[];this.target=null;this.log(this.level===2?'You survived. The sample is safe.':'Sector secured. The way is clear.','success',this.level===2?'rescue':null);
  }this.emit();
 }
 objectives(){if(this.level===3||this.level===6)return [!!this.entities.find(e=>e.id==='imani')?.done,!!this.entities.find(e=>e.id==='levin')?.done,['complete','won'].includes(this.mode)];if(this.level>=4){const mission=this.entities.find(e=>e.type==='mission');return [this.has(mission.requires)||!!mission.done,!!mission.done,['complete','won'].includes(this.mode)]}if(this.level===0)return [this.generatorOn||(this.has('fuse')&&this.has('fuel')),this.generatorOn,this.mode==='complete'];if(this.level===1)return [this.has('keycard'),this.has('sample'),this.mode==='complete'];return [this.has('battery')||this.signal>=0,this.signal===0,this.mode==='complete']}
 advanceActor(actor,path,speed,dt){if(!path.length)return;const p=path[0],dx=p.x-actor.x,dy=p.y-actor.y,dist=Math.hypot(dx,dy);actor.facing=Math.atan2(dx,dy);if(dist<speed*dt){actor.x=p.x;actor.y=p.y;path.shift()}else {actor.x+=dx/dist*speed*dt;actor.y+=dy/dist*speed*dt;}}
 tick(dt){
  if(!this.canAct)return;dt=Math.min(dt,.06);if(this.evacuation>0){this.evacuation=Math.max(0,this.evacuation-dt);this.time+=dt;if(this.evacuation>3){for(const actor of [this.player,this.companion]){actor.x+=(16-actor.x)*Math.min(1,dt*3);actor.y+=(10.8-actor.y)*Math.min(1,dt*3);actor.facing=0;}}if(!this.evacuation){this.mode='complete';this.emit()}return;}this.time+=dt;this.totalTime+=dt;this.pulse+=dt;this.player.attack=Math.max(0,this.player.attack-dt);this.noise=Math.max(0,this.noise-dt*.15);this.flash=Math.max(0,this.flash-dt*2);this.effects=this.effects.filter(e=>(e.life-=dt)>0);
  for(const actor of [this.player,...this.zombies]){actor.hurt=Math.max(0,(actor.hurt||0)-dt);if(actor.action)actor.action.remaining=Math.max(0,actor.action.remaining-dt);}
  const target=this.target;
  if(target?.type==='zombie'&&target.hp>0){if(distance(this.player,target)>1.3){if(!this.path.length||distance(this.path[this.path.length-1],target)>1.5)this.path=this.nearestPath(target)||[]}else this.path=[];}
  if(this.path.length){const before={x:this.player.x,y:this.player.y};this.advanceActor(this.player,this.path,this.sneak?1.8:3.1,dt);const moved=distance(before,this.player);this.tutorial.facts.distance+=moved;if(this.sneak)this.tutorial.facts.sneakDistance+=moved;const step=this.tutorial.index;updateTutorial(this);if(this.tutorial.index!==step)this.emit();}
  if(!this.canAct)return;
  if(target&&!this.path.length){if(target.type==='zombie'){if(target.hp<=0){this.target=null;this.selected=null}else if(distance(this.player,target)<=1.45&&this.player.attack<=0)this.hit(target);}else if(this.entityDistance(target)<=1.5){this.target=null;this.interact(target);}}
  if(!this.canAct)return;
  // A held melee weapon automatically defends at close range; click to actively pursue.
  if(this.player.attack<=0){const close=this.zombies.find(z=>z.hp>0&&distance(this.player,z)<1.12);if(close)this.hit(close)}
  if(!this.canAct)return;
  updateCompanion(this,dt);
  for(const z of this.zombies){if(z.hp<=0||this.tutorial.active&&this.tutorial.index<3)continue;z.attack=Math.max(0,z.attack-dt);z.repath-=dt;const d=distance(z,this.player);const rules=infectedRules(z);const lured=z.lure&&z.lure.until>this.time&&(z.kind!=='stalker'||z.lure.until-this.time>5.5);
   if(d<(this.sneak?2.3:rules.sight)&&clearSight(this,z,this.player)||this.noise>.5&&d<8)z.alert=true;if(d>10&&this.noise<.2&&!lured)z.alert=false;
   let dest=lured?z.lure:z.alert?this.player:{x:z.home.x+Math.sin(this.time*.2+z.home.x)*1.5,y:z.home.y+Math.cos(this.time*.2+z.home.y)*1.5};
   if(!lured&&z.alert&&z.kind==='stalker'&&d>2.5&&this.path.length)dest=this.path[Math.min(2,this.path.length-1)];
   if(z.repath<=0){z.path=this.pathTo(z,dest)||[];z.repath=z.kind==='stalker'?.4:.65}
   if(d>1||lured)this.advanceActor(z,z.path,lured?.9:z.alert?rules.speed:.35,dt);
   if(d<1.3&&!lured&&z.attack<=0&&clearSight(this,z,this.player)){this.health=Math.max(0,this.health-Math.max(1,Math.round(rules.damage*(1-this.protection))));z.attack=rules.cooldown;z.action={type:'attack',remaining:.75,duration:.75};this.player.hurt=.45;this.flash=1;if(this.health===0){this.mode='dead';this.log('You were overwhelmed. Try the sector again.','warn');break}}
  }
  if(this.level===2&&this.signal>0){this.signal=Math.max(0,this.signal-dt);const elapsed=35-this.signal;const thresholds=[1,14,25];while(this.spawned<3&&elapsed>=thresholds[this.spawned]){const points=[[2,16],[18,16],[2,4]];const p=points[this.spawned];const z=configureInfected(zombie('wave'+this.spawned,p[0],p[1]),this.spawned);z.alert=true;this.zombies.push(z);this.spawned++;this.log('Movement at the stairwell. Keep moving!','warn')}if(this.signal===0)this.log('Evacuation ready! Reach the glowing landing zone with the sample.','success','evac-ready');}
  if(this.pulse>.12){this.pulse=0;this.emit()}
 }
 hit(z){this.action('attack',this.meleeCooldown);z.hurt=.4;this.tutorial.facts.hit=true;this.player.attack=this.meleeCooldown;this.player.facing=Math.atan2(z.x-this.player.x,z.y-this.player.y);z.hp=Math.max(0,z.hp-this.meleeDamage);this.noise=.65;this.effects.push({type:'hit',x:z.x,y:z.y,life:.3});z.alert=true;if(z.hp===0){this.kills++;this.log('Infected eliminated.');if(this.target?.id===z.id){this.target=null;this.selected=null;this.path=[]}}this.emit()}
}
