import assert from 'node:assert/strict';
import {Game,LEVELS,CAPACITY,ITEMS} from '../app/game/engine.mjs';
let assertions=0;
function check(v,msg){assert.ok(v,msg);assertions++}
function progress(g,seconds,heal=true){for(let i=0;i<seconds*60;i++){g.tick(1/60);if(heal&&g.health<=60&&g.has('medkit'))g.use('medkit');if(heal&&g.health<=75&&g.has('ration'))g.use('ration');if(g.mode==='dead')throw Error(`Died in level ${g.level+1} after ${g.time.toFixed(1)} seconds`);}}
function go(g,id){g.select(id);let ticks=0;while((g.target||g.path.length)&&g.mode==='playing'&&ticks<60*150){progress(g,1/60);ticks++}check(ticks<60*150,`Interaction ${id} did not finish`);check(!g.target,`Target ${id} remains`);}
function campaign(loaded=false){const g=new Game();g.start();if(loaded){g.inventory.push('chair','tire','scrap');check(g.weight<14,'Starting load valid')}
 go(g,'bunker');check(g.mode==='playing','Bunker blocks without generator');
 go(g,'guard');check(g.has('fuse'),'Fuse retrieved from reachable guard crate');
 if(loaded){g.drop('tire');g.drop('chair');}
 go(g,'wreck');check(g.has('fuel'),'Fuel retrieved');go(g,'generator');check(g.generatorOn,'Generator activated');check(!g.has('fuel')&&!g.has('fuse'),'Generator consumes ingredients');go(g,'bunker');check(g.mode==='complete','Level one completed through movement');
 const inventory=[...g.inventory];g.next();check(g.mode==='briefing'&&g.level===1,'Level two briefing');check(g.inventory.join()===inventory.join(),'Inventory carries to bunker');g.start();
 check(g.nearestPath(g.entities.find(e=>e.id==='sample'))===null,'Lab sample inaccessible through closed door');go(g,'lab-door');check(!g.entities.find(e=>e.id==='lab-door').open,'Lab door requires card');go(g,'locker');check(g.has('keycard'),'Keycard retrieved');go(g,'roof');check(g.mode==='playing','Dachzugang blocks without sample');go(g,'medical');go(g,'lab-door');check(g.entities.find(e=>e.id==='lab-door').open,'Door opens with card');go(g,'sample');check(g.has('sample'),'Sample secured');go(g,'roof');check(g.mode==='complete','Level two complete');
 g.next();g.start();go(g,'evac');check(g.mode==='playing','Evac blocks before signal');go(g,'roof-store');check(g.has('battery'),'Battery retrieved');go(g,'roof-aid');go(g,'radio');check(g.signal>0,'Signal timer starts');check(!g.has('battery'),'Radio consumes battery');
 while(g.signal>0){const points=[[4,15],[16,16],[18,10],[10,10],[4,9]];const point=points[Math.floor(g.time/5)%points.length];if(!g.path.length)g.move(...point);progress(g,.3);}
 check(g.spawned===3,'Three finite waves spawned');go(g,'evac');check(g.mode==='won','All three levels won');console.log(`Campaign ${loaded?'with full backpack':'without bottle use'}: won, ${g.kills} kills, ${g.health} HP, ${Math.round(g.totalTime)} seconds`);return g;
}
campaign();campaign(true);
{
 const g=new Game();g.start();g.player={x:3,y:15.49,attack:0};go(g,'bottle1');check(g.count('bottle')===2,'Click mid-move reaches actual tile center and collects item');
 const crate=g.entities.find(e=>e.id==='guard');crate.open=true;check(g.isBlocked(crate.x,crate.y),'Searched containers remain solid');
 const before=[...g.inventory];g.drop('crowbar');check(!g.has('crowbar'),'Drop removes carried item');const dropped=g.entities.find(e=>e.id.startsWith('drop-'));go(g,dropped.id);check(g.has('crowbar'),'Dropped item can be picked up');
 g.inventory=Array(11).fill('scrap');check(!g.addItem('fuel'),'Overweight pickup rejected');check(g.weight<=CAPACITY,'Weight limit enforced');
 g.inventory=['crowbar','bottle','medkit'];g.health=30;g.use('medkit');check(g.health===70&&!g.has('medkit'),'Healing consumes one medkit and heals 40');
 const z=g.zombies[0];g.player.x=10;g.player.y=6;g.use('bottle');g.throwBottle(11,6);check(!g.has('bottle')&&z.lure?.until>g.time,'Bottle consumes and lures');
 const snapshot={x:g.player.x,y:g.player.y,h:g.health,t:g.time,zx:z.x,zy:z.y};g.pause();progress(g,10,false);check(snapshot.x===g.player.x&&snapshot.y===g.player.y&&snapshot.h===g.health&&snapshot.t===g.time&&snapshot.zx===z.x&&snapshot.zy===z.y,'Pause freezes player, enemy, damage and time');
 g.restart();check(g.mode==='briefing'&&g.health===100&&g.inventory.join()==='crowbar,medkit,bottle','Restart restores entry snapshot');
}
{
 const g=new Game();g.inventory.push('keycard','sample');g.loadLevel(2);g.start();g.signal=3;g.pause();progress(g,8,false);check(g.signal===3,'Pause freezes wave timer');g.start();g.signal=0;g.drop('sample');go(g,'evac');check(g.mode==='playing','Cannot evacuate without sample');
 for(const p of [[2,16],[18,16],[2,4]])check(!g.isBlocked(...p),'Wave spawn is clear');
}
console.log(`${assertions} assertions passed. Campaign navigation, puzzle gates, combat, carrying, health, distraction, waves, pause and restart verified.`);
