export const CAPACITY = 14;
export const ITEMS = {
 crowbar:{name:'Brecheisen',weight:1.8,kind:'weapon',desc:'Robust und leise. 38 Schaden pro Treffer.'},
 medkit:{name:'Verband',weight:0.3,kind:'heal',desc:'Stellt 40 Gesundheit wieder her.'},
 bottle:{name:'Glasflasche',weight:0.4,kind:'throw',desc:'Auf die Karte werfen. Lenkt Infizierte 8 Sekunden ab.'},
 fuse:{name:'Sicherung',weight:0.2,kind:'quest',desc:'Passt in den Generator am Bunkereingang.'},
 fuel:{name:'Treibstoff',weight:2,kind:'quest',desc:'Ein kleiner Kanister Diesel für den Generator.'},
 keycard:{name:'Zugangskarte',weight:0.1,kind:'quest',desc:'Entriegelt das Labor und den Dachzugang.'},
 sample:{name:'Probe N-04',weight:0.6,kind:'quest',desc:'Die versiegelte Probe muss die Evakuierung erreichen.'},
 battery:{name:'Batterie',weight:1.5,kind:'quest',desc:'Versorgt den Sender auf dem Dach.'},
 scrap:{name:'Metallschrott',weight:1.2,kind:'salvage',desc:'Bergungsgut. Kann jederzeit wieder abgelegt werden.'},
 chair:{name:'Klappstuhl',weight:2.4,kind:'salvage',desc:'Noch brauchbar. Aber jeder Gegenstand wiegt.'},
 tire:{name:'Autoreifen',weight:4,kind:'salvage',desc:'Tragbar, aber schwer. Vielleicht besser liegen lassen.'},
 toolbox:{name:'Werkzeugkiste',weight:2.2,kind:'salvage',desc:'Altes Werkzeug. Eine kleine Sammlung aus einer anderen Zeit.'},
 ration:{name:'Konserve',weight:0.5,kind:'food',desc:'Eine warme Erinnerung. Stellt 18 Gesundheit wieder her.'},
};
const item=(id,x,y,itemId)=>({id,x,y,type:'item',item:itemId,name:ITEMS[itemId].name,desc:ITEMS[itemId].desc});
const prop=(id,x,y,style,w=1,h=1)=>({id,x,y,type:'prop',style,w,h,name:({car:'Fahrzeugwrack',wall:'Betonmauer',barrier:'Betonsperre',tank:'Wassertank',vent:'Lüftungsanlage',bed:'Krankenliege',desk:'Labortisch',tree:'Toter Baum'})[style]||'Trümmer',desc:'Zu schwer zum Tragen. Du musst darum herumgehen.',solid:true});
const crate=(id,x,y,name,contents,desc)=>({id,x,y,type:'container',name,contents,desc,solid:true});
const zombie=(id,x,y)=>({id,x,y,hp:76,maxHp:76,type:'zombie',name:'Infizierter',desc:'Reagiert auf Nähe und Lärm. Anklicken, um anzugreifen.',attack:0,repath:0,path:[],home:{x,y},alert:false});
export const LEVELS=[
 {name:'Asche vor dem Tor',place:'KONTROLLPUNKT 04',tag:'AUSSENBEZIRK',weather:'REGEN · 8 °C',intro:'Die Stadt ist verloren. Unter ihr liegt Station Null. Finde einen Weg durch das Bunkertor.',hint:'Durchsuche die Wachkiste und das Fahrzeugwrack. Der Generator braucht eine Sicherung und Treibstoff.',size:[21,19],start:{x:3,y:15},goals:['Sicherung und Treibstoff finden','Den Generator einschalten','Den Bunker betreten'],
 entities:[
  prop('north-wall',3,0,'wall',8,1),prop('side-wall',0,1,'wall',1,8),prop('ruin',1,5,'wall',2,1),prop('ruin2',5,1,'wall',1,5),
  prop('bunker-shell',15,0,'wall',6,2),prop('bunker-left',14,2,'wall',2,2),prop('bunker-right',19,2,'wall',2,2),
  prop('barrier1',7,8,'barrier',3,1),prop('barrier2',13,9,'barrier',4,1),prop('car1',10,12,'car',2,3),prop('car2',4,9,'car',2,3),
  prop('rubble1',2,2,'rubble',2,2),prop('rubble2',19,13,'rubble',2,2),prop('tree1',2,7,'tree'),prop('tree2',18,8,'tree'),
  crate('guard',3,4,'Wachkiste',['fuse','medkit'],'Eine Werkzeugkiste der Wachmannschaft. Auf dem Deckel steht: „Ersatzsicherungen“.'),
  crate('wreck',13,14,'Kofferraum',['fuel','bottle'],'Die Heckklappe ist nur angelehnt. Es riecht nach Diesel.'),
  crate('supply',8,3,'Vorratskiste',['ration','bottle'],'Jemand hat hier für den nächsten Winter gepackt.'),
  item('bottle1',4,14,'bottle'),item('scrap1',7,13,'scrap'),item('chair1',3,6,'chair'),item('tire1',6,11,'tire'),item('tools1',15,11,'toolbox'),item('medkit1',9,6,'medkit'),
  {id:'generator',x:15,y:5,type:'generator',name:'Notstromgenerator',desc:'Ohne Strom bleibt das Bunkertor versiegelt. Benötigt Sicherung und Treibstoff.',solid:true},
  {id:'bunker',x:17,y:3,type:'exit',name:'Bunkertor',desc:'Führt tief unter die Stadt. Der Generator muss laufen.',solid:true},
  {id:'note1',x:7,y:16,type:'note',name:'Letzter Funkspruch',desc:'„Wenn jemand das hört: Station Null. Bringt die Probe aufs Dach. Wir halten die Frequenz frei.“'}
 ],zombies:[zombie('z1',11,7),zombie('z2',17,12),zombie('z3',8,1)]},
 {name:'Station Null',place:'BUNKER / EBENE −02',tag:'UNTERGRUND',weather:'INNENRAUM · 14 °C',intro:'Die Notbeleuchtung läuft. Sichere eine Zugangskarte, öffne das Labor und bringe Probe N-04 zum Dach.',hint:'Die Zugangskarte liegt im Wartungsschrank im westlichen Raum. Das Labor liegt hinter der gesicherten Tür.',size:[21,19],start:{x:3,y:15},goals:['Zugangskarte sichern','Labor öffnen und Probe bergen','Den Dachzugang erreichen'],
 entities:[
  prop('nw',0,0,'wall',21,1),prop('ww',0,1,'wall',1,17),prop('ew',20,1,'wall',1,17),
  prop('divide1',9,1,'wall',1,6),prop('divide2',9,10,'wall',1,8),prop('lab1',10,7,'wall',4,1),prop('lab2',15,7,'wall',5,1),
  prop('bed1',2,8,'bed',1,3),prop('bed2',5,9,'bed',1,3),prop('desk1',12,2,'desk',3,1),prop('desk2',17,4,'desk',2,1),prop('vent1',2,1,'vent',3,2),
  crate('locker',3,4,'Wartungsschrank',['keycard','medkit'],'Ein verbogener Spind. Eine Zutrittskarte hängt an der Innenseite.'),
  crate('medical',6,13,'Sanitätskiste',['medkit','ration'],'Sterile Verbände und eine einzelne Konserve.'),
  item('lab-bottle',11,11,'bottle'),item('lab-chair',6,5,'chair'),item('lab-scrap',17,14,'scrap'),item('lab-tools',12,15,'toolbox'),
  {id:'lab-door',x:14,y:7,type:'door',name:'Labortür',desc:'Sicherheitsstufe 2. Benötigt eine Zugangskarte.',solid:true,open:false},
  item('sample',16,2,'sample'),
  {id:'roof',x:18,y:10,type:'exit',name:'Dachzugang',desc:'Der Aufzug funktioniert. Zugangskarte und Probe N-04 werden benötigt.',solid:true},
  {id:'terminal',x:7,y:2,type:'note',name:'Laborprotokoll',desc:'„N-04 zeigt keine Symptome. Die letzte Evakuierung startet vom Dach. Niemand darf die Probe zurücklassen.“'}
 ],zombies:[zombie('b1',7,8),zombie('b2',15,12),zombie('b3',16,4),zombie('b4',12,17)]},
 {name:'Die letzte Frequenz',place:'EVAKUIERUNG / DACH 07',tag:'LETZTER KONTAKT',weather:'NEBEL · 6 °C',intro:'Ein Licht kreist über den Dächern. Versorge den Sender mit Strom und halte durch, bis die Evakuierung eintrifft.',hint:'Die Batterie liegt im Dachlager. Aktiviere den Sender und überlebe 35 Sekunden. Erreiche dann die markierte Landezone.',size:[21,19],start:{x:3,y:15},goals:['Die Senderbatterie finden','Funkruf absetzen · 35 Sekunden überleben','Mit der Probe zur Landezone'],
 entities:[
  prop('rw1',0,0,'barrier',21,1),prop('rw2',0,1,'barrier',1,17),prop('rw3',20,1,'barrier',1,17),
  prop('v1',7,5,'vent',3,2),prop('v2',12,12,'vent',3,2),prop('water',17,3,'tank',2,2),prop('rubble',2,2,'rubble',2,2),
  prop('smallwall',5,11,'barrier',4,1),prop('smallwall2',13,7,'barrier',4,1),
  crate('roof-store',4,5,'Dachlager',['battery','medkit'],'Ein Reserveakku, trocken gelagert unter einer Plane.'),
  crate('roof-aid',16,15,'Notfallkiste',['medkit','bottle','bottle'],'Für die Evakuierung bereitgestellt. Endlich etwas Glück.'),
  item('roof-ration',6,14,'ration'),item('roof-chair',10,3,'chair'),item('roof-scrap',18,8,'scrap'),item('roof-bottle',11,16,'bottle'),
  {id:'radio',x:10,y:7,type:'radio',name:'Langwellensender',desc:'Die Frequenz ist eingestellt. Nur die Batterie fehlt.',solid:true},
  {id:'evac',x:16,y:10,type:'exit',name:'Landezone',desc:'Aktiviere den Sender und halte 35 Sekunden durch.',solid:false},
  {id:'roof-note',x:3,y:11,type:'note',name:'Evakuierungsplan',desc:'„35 Sekunden nach dem Signal. Bleib in Bewegung. Wir kommen nur einmal.“'}
 ],zombies:[zombie('r1',11,3),zombie('r2',18,13)]}
];
const clone=o=>JSON.parse(JSON.stringify(o));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const key=(x,y)=>`${x},${y}`;
export class Game {
 constructor(){this.listeners=new Set();this.level=0;this.unlocked=0;this.inventory=['crowbar','medkit','bottle'];this.health=100;this.kills=0;this.totalTime=0;this.history=[];this.entries=[];this.effects=[];this.mode='briefing';this.sneak=false;this.muted=true;this.loadLevel(0);}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 emit(){for(const fn of this.listeners)fn()}
 get weight(){return this.inventory.reduce((s,id)=>s+ITEMS[id].weight,0)}
 count(id){return this.inventory.filter(i=>i===id).length}
 has(id){return this.inventory.includes(id)}
 loadLevel(index,restart=false){
  if(restart){const e=this.entries[index];this.inventory=[...e.inventory];this.health=e.health;this.kills=e.kills;this.totalTime=e.totalTime;}
  this.level=index;this.unlocked=Math.max(this.unlocked,index);this.data=LEVELS[index];this.entities=clone(this.data.entities);this.zombies=clone(this.data.zombies);this.player={...this.data.start,facing:0,attack:0};this.path=[];this.target=null;this.selected=null;this.time=0;this.signal=-1;this.spawned=0;this.generatorOn=false;this.effects=[];this.mode='briefing';this.throwing=false;this.sneak=false;this.noise=0;this.flash=0;this.health=Math.max(85,this.health);this.pulse=0;
  this.inventoryOpen=false;this.inventoryReturnMode=null;
  if(!restart)this.entries[index]={inventory:[...this.inventory],health:this.health,kills:this.kills,totalTime:this.totalTime};
  this.history=[];this.log(this.data.intro,'info');this.emit();
 }
 start(){if(this.inventoryOpen)return;if(this.mode==='briefing'||this.mode==='paused')this.mode='playing';this.emit()}
 pause(){if(this.inventoryOpen)return;if(this.mode==='playing')this.mode='paused';else if(this.mode==='paused')this.mode='playing';this.emit()}
 openInventory(){if(this.inventoryOpen)return;this.inventoryReturnMode=this.mode;this.inventoryOpen=true;this.mode='paused';this.throwing=false;this.emit()}
 closeInventory(){if(!this.inventoryOpen)return;this.mode=this.inventoryReturnMode||'paused';this.inventoryReturnMode=null;this.inventoryOpen=false;this.emit()}
 get canManageInventory(){return this.mode==='playing'||this.mode==='paused'&&this.inventoryOpen&&['playing','paused'].includes(this.inventoryReturnMode)}
 next(){if(this.mode==='complete'&&this.level<2)this.loadLevel(this.level+1)}
 restart(){this.loadLevel(this.level,true)}
 newGame(){this.inventory=['crowbar','medkit','bottle'];this.health=100;this.kills=0;this.totalTime=0;this.entries=[];this.unlocked=0;this.loadLevel(0)}
 log(text,tone='info'){this.history.unshift({text,tone,id:Math.random()});this.history=this.history.slice(0,5);this.emit()}
 isBlocked(x,y,ignore){if(x<0||y<0||x>=this.data.size[0]||y>=this.data.size[1])return true;return this.entities.some(e=>e.id!==ignore&&!e.removed&&e.solid&&!(e.type==='door'&&e.open)&&x>=e.x&&x<e.x+(e.w||1)&&y>=e.y&&y<e.y+(e.h||1))}
 pathTo(from,to){
  const sx=Math.round(from.x),sy=Math.round(from.y),tx=Math.round(to.x),ty=Math.round(to.y);
  if(this.isBlocked(tx,ty))return null;if(sx===tx&&sy===ty)return distance(from,{x:tx,y:ty})>.01?[{x:tx,y:ty}]:[];
  const queue=[{x:sx,y:sy}],prev=new Map([[key(sx,sy),null]]);let found=false;
  for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x===tx&&p.y===ty){found=true;break}for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(!prev.has(k)&&!this.isBlocked(x,y)){prev.set(k,p);queue.push({x,y})}}}
  if(!found)return null;const path=[];let p={x:tx,y:ty};while(p){path.unshift(p);p=prev.get(key(p.x,p.y))}path.shift();return path;
 }
 nearestPath(e){const options=[];for(let dx=-1;dx<=(e.w||1);dx++)for(let dy=-1;dy<=(e.h||1);dy++){if(dx>=0&&dx<(e.w||1)&&dy>=0&&dy<(e.h||1)&&e.solid)continue;const t={x:e.x+dx,y:e.y+dy};if(distance(t,e)>1.45&&(!e.w&&!e.h))continue;const path=this.pathTo(this.player,t);if(path)options.push(path)}options.sort((a,b)=>a.length-b.length);return options[0]??null}
 move(x,y){if(this.mode!=='playing')return;this.throwing=false;const path=this.pathTo(this.player,{x,y});if(path===null){this.log('Dort ist der Weg versperrt.','warn');return}this.target=null;this.selected=null;this.path=path;this.emit()}
 select(id){if(this.mode!=='playing')return;const e=[...this.entities,...this.zombies].find(e=>e.id===id&&!e.removed&&e.hp!==0);if(!e)return;this.selected=e;this.throwing=false;
  if(e.type==='prop'){this.log(e.desc);this.emit();return}
  if(e.type==='zombie'){this.target=e;this.path=this.nearestPath(e)||[];this.emit();return}
  this.target=e;const path=this.nearestPath(e);if(path===null){this.target=null;this.log('Kein freier Weg. Öffne zuerst die Tür.','warn');return}this.path=path;this.emit();
 }
 addItem(id){if(this.weight+ITEMS[id].weight>CAPACITY+0.00001){this.log(`Zu schwer: ${ITEMS[id].name}. Lege etwas aus dem Rucksack ab.`,'warn');return false}this.inventory.push(id);this.log(`${ITEMS[id].name} aufgenommen.`,ITEMS[id].kind==='quest'?'success':'info');return true}
 consume(id){const i=this.inventory.indexOf(id);if(i<0)return false;this.inventory.splice(i,1);return true}
 drop(id){if(!this.canManageInventory||!this.has(id))return;this.consume(id);let tile={x:Math.round(this.player.x),y:Math.round(this.player.y)};const offsets=[[0,0],[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[2,0]];for(const [dx,dy] of offsets){const p={x:tile.x+dx,y:tile.y+dy};if(!this.isBlocked(p.x,p.y)&&!this.entities.some(e=>!e.removed&&e.x===p.x&&e.y===p.y&&e.type==='item')){tile=p;break}}this.entities.push(item('drop-'+Math.random(),tile.x,tile.y,id));this.log(`${ITEMS[id].name} abgelegt. Du kannst es wieder aufnehmen.`);this.emit()}
 use(id){if(!this.canManageInventory)return;if(!this.has(id)){this.log('Davon hast du gerade nichts.','warn');return}const def=ITEMS[id];if(def.kind==='heal'||def.kind==='food'){if(this.health>=100){this.log('Du bist bereits bei voller Gesundheit.');return}this.consume(id);this.health=Math.min(100,this.health+(def.kind==='heal'?40:18));this.effects.push({type:'heal',x:this.player.x,y:this.player.y,life:1});this.log(def.kind==='heal'?'Verband angelegt. +40 Gesundheit.':'Konserve gegessen. +18 Gesundheit.','success')}else if(def.kind==='throw'){if(this.inventoryOpen){this.throwing=true;this.closeInventory()}else this.throwing=!this.throwing;this.log(this.throwing?'Klicke auf ein freies Feld in Wurfweite.':'Wurf abgebrochen.')}else this.log(def.desc);this.emit()}
 throwBottle(x,y){if(this.mode!=='playing'||!this.throwing)return;const p={x,y};if(distance(this.player,p)>9){this.log('Zu weit. Flaschen fliegen maximal 9 Felder.','warn');return}if(this.isBlocked(x,y)){this.log('Wähle ein freies Feld für die Ablenkung.','warn');return}if(!this.consume('bottle')){this.throwing=false;this.log('Keine Flasche mehr im Rucksack.','warn');return}this.throwing=false;for(const z of this.zombies){if(z.hp>0&&distance(z,p)<12){z.lure={x,y,until:this.time+8};z.repath=0;z.alert=true}}this.effects.push({type:'bottle',x,y,life:8});this.noise=1;this.log('Glas zersplittert. Die Infizierten folgen dem Geräusch.');this.emit()}
 interact(e){
  if(e.removed)return;
  if(e.type==='item'){if(this.addItem(e.item)){e.removed=true;this.selected=null;}}
  else if(e.type==='container'){e.open=true;if(!e.contents.length){this.log('Bereits durchsucht. Hier ist nichts mehr.');return}const remaining=[];for(const id of e.contents){if(!this.addItem(id))remaining.push(id)}e.contents=remaining;}
  else if(e.type==='note')this.log(e.desc,'story');
  else if(e.type==='generator'){if(this.generatorOn){this.log('Der Generator läuft. Das Bunkertor hat Strom.','success');return}const missing=['fuse','fuel'].filter(id=>!this.has(id));if(missing.length){this.log('Es fehlt: '+missing.map(id=>ITEMS[id].name).join(' und ')+'.','warn');return}this.consume('fuse');this.consume('fuel');this.generatorOn=true;this.noise=1;this.log('Der Generator springt an. Das Bunkertor ist entriegelt.','success');}
  else if(e.type==='door'){if(!this.has('keycard')){this.log('Verriegelt. Finde die Zugangskarte im Wartungsschrank.','warn');return}e.open=!e.open;this.log(e.open?'Die Labortür ist offen.':'Die Labortür ist geschlossen.','success');}
  else if(e.type==='radio'){if(this.signal>=0){this.log('Signal gesendet. Bleib in Bewegung!');return}if(!this.has('battery')){this.log('Keine Stromversorgung. Suche die Batterie im Dachlager.','warn');return}this.consume('battery');this.signal=35;this.noise=1;this.log('Funkruf empfangen. Evakuierung in 35 Sekunden. Sie haben dich gehört.','warn');}
  else if(e.type==='exit'){
   if(this.level===0&&!this.generatorOn){this.log('Kein Strom. Repariere zuerst den Generator.','warn');return}
   if(this.level===1&&(!this.has('keycard')||!this.has('sample'))){this.log('Du brauchst die Zugangskarte und die Probe N-04.','warn');return}
   if(this.level===2&&(this.signal!==0||!this.has('sample'))){this.log(this.signal!==0?'Die Evakuierung ist noch nicht da. Aktiviere den Sender und halte durch.':'Hole die abgelegte Probe N-04. Ohne sie kannst du nicht gehen.','warn');return}
   this.mode=this.level===2?'won':'complete';this.path=[];this.target=null;this.log(this.level===2?'Du hast überlebt. Die Probe ist in Sicherheit.':'Sektor gesichert. Der Weg ist frei.','success');
  }this.emit();
 }
 objectives(){if(this.level===0)return [this.generatorOn||(this.has('fuse')&&this.has('fuel')),this.generatorOn,this.mode==='complete'];if(this.level===1)return [this.has('keycard'),this.has('sample'),this.mode==='complete'];return [this.has('battery')||this.signal>=0,this.signal===0,this.mode==='won']}
 advanceActor(actor,path,speed,dt){if(!path.length)return;const p=path[0],dx=p.x-actor.x,dy=p.y-actor.y,dist=Math.hypot(dx,dy);actor.facing=Math.atan2(dx,dy);if(dist<speed*dt){actor.x=p.x;actor.y=p.y;path.shift()}else {actor.x+=dx/dist*speed*dt;actor.y+=dy/dist*speed*dt;}}
 tick(dt){
  if(this.mode!=='playing')return;dt=Math.min(dt,.06);this.time+=dt;this.totalTime+=dt;this.pulse+=dt;this.player.attack=Math.max(0,this.player.attack-dt);this.noise=Math.max(0,this.noise-dt*.15);this.flash=Math.max(0,this.flash-dt*2);this.effects=this.effects.filter(e=>(e.life-=dt)>0);
  const target=this.target;
  if(target?.type==='zombie'&&target.hp>0){if(distance(this.player,target)>1.3){if(!this.path.length||distance(this.path[this.path.length-1],target)>1.5)this.path=this.nearestPath(target)||[]}else this.path=[];}
  if(this.path.length)this.advanceActor(this.player,this.path,this.sneak?1.8:3.1,dt);
  if(target&&!this.path.length){if(target.type==='zombie'){if(target.hp<=0){this.target=null;this.selected=null}else if(distance(this.player,target)<=1.45&&this.player.attack<=0)this.hit(target);}else if(distance(this.player,target)<=1.5){this.target=null;this.interact(target);}}
  if(this.mode!=='playing')return;
  // A held melee weapon automatically defends at close range; click to actively pursue.
  if(this.player.attack<=0){const close=this.zombies.find(z=>z.hp>0&&distance(this.player,z)<1.12);if(close)this.hit(close)}
  for(const z of this.zombies){if(z.hp<=0)continue;z.attack=Math.max(0,z.attack-dt);z.repath-=dt;const d=distance(z,this.player);const lured=z.lure&&z.lure.until>this.time;
   if(d<(this.sneak?2.5:4.5)||this.noise>.5&&d<8)z.alert=true;
   let dest=lured?z.lure:z.alert?this.player:{x:z.home.x+Math.sin(this.time*.2+z.home.x)*1.5,y:z.home.y+Math.cos(this.time*.2+z.home.y)*1.5};
   if(z.repath<=0){z.path=this.pathTo(z,dest)||[];z.repath=.65}
   if(d>1||lured)this.advanceActor(z,z.path,lured?.9:z.alert?.85:.35,dt);
   if(d<1.3&&!lured&&z.attack<=0){this.health=Math.max(0,this.health-7);z.attack=1.2;this.flash=1;if(this.health===0){this.mode='dead';this.log('Du wurdest überwältigt. Versuche den Sektor erneut.','warn');break}}
  }
  if(this.level===2&&this.signal>0){this.signal=Math.max(0,this.signal-dt);const elapsed=35-this.signal;const thresholds=[1,14,25];while(this.spawned<3&&elapsed>=thresholds[this.spawned]){const points=[[2,16],[18,16],[2,4]];const p=points[this.spawned];const z=zombie('wave'+this.spawned,p[0],p[1]);z.alert=true;this.zombies.push(z);this.spawned++;this.log('Bewegung am Treppenaufgang. Bleib in Bewegung!','warn')}if(this.signal===0)this.log('Evakuierung bereit! Erreiche die leuchtende Landezone mit der Probe.','success');}
  if(this.pulse>.12){this.pulse=0;this.emit()}
 }
 hit(z){this.player.attack=.7;this.player.facing=Math.atan2(z.x-this.player.x,z.y-this.player.y);z.hp=Math.max(0,z.hp-(this.has('crowbar')?38:19));this.noise=.65;this.effects.push({type:'hit',x:z.x,y:z.y,life:.3});z.alert=true;if(z.hp===0){this.kills++;this.log('Infizierter ausgeschaltet.');if(this.target?.id===z.id){this.target=null;this.selected=null;this.path=[]}}}
}
