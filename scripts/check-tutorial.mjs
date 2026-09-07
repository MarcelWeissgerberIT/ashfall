import assert from 'node:assert/strict';
import { Game } from '../app/game/engine.mjs';
import { TUTORIAL_STEPS, tutorialTarget, tutorialHint } from '../app/game/tutorial.mjs';

let assertions=0;
const check=(value,message)=>{assert.ok(value,message);assertions++};
const step=g=>TUTORIAL_STEPS[g.tutorial.index]?.id;
const snapshot=g=>JSON.stringify({player:g.player,zombies:g.zombies,health:g.health,time:g.time,total:g.totalTime,effects:g.effects});
function ticks(g,n=1){for(let i=0;i<n;i++){g.tick(1/60);if(g.canAct&&g.health<=60&&g.has('medkit'))g.use('medkit');assert.notEqual(g.mode,'dead','Survivor stays alive during tutorial');}}
function settle(g){let n=0;while(g.canAct&&(g.target||g.path.length)&&n++<12000)ticks(g);check(n<12000,'Navigation reaches a task or a reading pause');}
function go(g,id){g.select(id);settle(g);if(g.lootOpen){g.takeAllLoot();g.closeInventory()}}
function walk(g,x,y){g.move(x,y);settle(g);}
function guided(){const g=new Game({tutorial:true});g.start();return g;}
function basics(g){
  check(step(g)==='move'&&g.tutorial.reading,'Guided start opens the movement explanation');
  const frozen=snapshot(g);g.move(5,15);g.select('bottle1');g.toggleSneak();g.use('bottle');ticks(g,120);
  check(snapshot(g)===frozen&&!g.throwing&&!g.sneak,'Reading freezes actors, time, damage and gameplay input');
  g.acknowledgeTutorial();check(step(g)==='move','Acknowledgement alone never completes an exercise');
  const marker=tutorialTarget(g);g.move(marker.x,marker.y);ticks(g,5);
  check(tutorialTarget(g)===marker,'Movement destination stays fixed while Mara walks');settle(g);
  check(step(g)==='pickup'&&g.tutorial.reading,'Actual walking advances to scavenging');
  check(!g.path.length&&!g.target,'New explanations cancel stale movement and targets');
  g.acknowledgeTutorial();go(g,'bottle1');
  check(g.count('bottle')===2&&step(g)==='pack','Successful loose pickup advances to backpack training');
  g.acknowledgeTutorial();g.openInventory();
  check(step(g)==='pack'&&g.inventoryOpen&&g.canManageInventory,'Pack can be managed without interrupting it with the next lesson');
  const packFrozen=snapshot(g);ticks(g,120);check(snapshot(g)===packFrozen,'Backpack pauses the tutorial world');
  g.closeInventory();check(step(g)==='survive'&&g.tutorial.reading,'Closing the backpack introduces enemy survival');
}
function sneakLesson(g){
  g.acknowledgeTutorial();g.toggleSneak();check(step(g)==='survive','Sneak toggle alone does not complete the exercise');
  const p=tutorialTarget(g);walk(g,p.x,p.y);
  check(step(g)==='fuse'&&g.tutorial.reading,'Two actual sneaking tiles complete survival training');
}

{
  const g=guided();basics(g);sneakLesson(g);
  for(const [id,next] of [['guard','fuel'],['wreck','power']]){
    g.acknowledgeTutorial();go(g,id);check(step(g)===next&&g.tutorial.reading,`${id} acquisition opens the next relevant lesson`);
  }
  g.openInventory();g.drop('fuel');g.closeInventory();
  const dropped=tutorialTarget(g);
  check(dropped?.id.startsWith('drop-')&&dropped.item==='fuel','Generator lesson marks dropped fuel for recovery');
  check(tutorialHint(g).includes('Recover'),'Missing part has an explicit recovery instruction');
  g.acknowledgeTutorial();go(g,'generator');check(!g.generatorOn&&step(g)==='power','Generator rejects missing parts without breaking the guide');
  go(g,dropped.id);check(g.has('fuel')&&tutorialTarget(g).id==='generator','Recovering the part moves the target back to the generator');
  go(g,'generator');check(g.generatorOn&&!g.has('fuel')&&!g.has('fuse')&&step(g)==='bunker','Consumed parts remain learned and power completes');
  g.acknowledgeTutorial();go(g,'bunker');
  check(g.mode==='complete'&&g.tutorial.completed&&!g.tutorial.active&&!g.tutorial.reading,'Gate completes both the real mission and tutorial');
  g.next();g.start();check(g.level===1&&!g.tutorial.active&&g.canAct,'Station Zero starts as ordinary gameplay');
  for(const id of ['locker','medical','lab-door','sample','roof'])go(g,id);
  check(g.mode==='complete','Guided campaign continues through the playable bunker');
  g.next();g.start();for(const id of ['roof-store','roof-aid','radio'])go(g,id);
  while(g.signal>0){if(!g.path.length){const p=[[4,15],[16,16],[18,10],[10,10],[4,9]][Math.floor(g.time/5)%5];g.move(...p)}ticks(g,18);}
  go(g,'evac');for(let i=0;i<310;i++)g.tick(1/60);check(g.mode==='complete'&&g.spawned===3,'Tutorial campaign reaches the final evacuation');
  console.log(`Guided campaign: all three sectors won, ${g.kills} kills, ${g.health} HP.`);
}
{
  const g=guided();g.acknowledgeTutorial();go(g,'bottle1');
  check(step(g)==='move'&&g.tutorial.facts.pickups===1&&g.tutorial.facts.distance===0,'Nearby bottle can be collected before movement; starter bottle never counts');
  g.openInventory();g.closeInventory();walk(g,5,15);
  check(step(g)==='survive','Completed out-of-order pickup and pack exercises are remembered');
  g.acknowledgeTutorial();g.use('bottle');g.throwBottle(8,15);
  check(step(g)==='fuse'&&g.tutorial.facts.threw,'A successful distraction is an alternative survival exercise');
  g.acknowledgeTutorial();go(g,'wreck');check(g.has('fuel')&&step(g)==='fuse','Fuel can be acquired before the guide asks for it');
  go(g,'guard');check(step(g)==='power','Previously acquired fuel is accepted without an impossible repeat search');
}
{
  const g=guided();basics(g);sneakLesson(g);g.acknowledgeTutorial();go(g,'guard');g.acknowledgeTutorial();
  g.inventory=[...Array(11).fill('scrap'),'fuse'];go(g,'wreck');
  const trunk=g.entities.find(e=>e.id==='wreck');
  check(trunk.open&&trunk.contents.includes('fuel')&&!g.has('fuel')&&step(g)==='fuel','An opened overweight trunk does not complete the fuel exercise');
  check(tutorialHint(g)?.includes('Backpack full'),'Overweight search offers a useful recovery hint');
  g.openInventory();g.drop('scrap');g.drop('scrap');g.closeInventory();go(g,'wreck');
  check(g.has('fuel')&&step(g)==='power','Making space and searching again recovers the required part');
}
{
  const g=guided();g.acknowledgeTutorial();g.inventory=[...Array(11).fill('scrap'),'bottle'];go(g,'tire1');
  check(!g.tutorial.facts.pickups,'Failed loose pickup does not count as scavenging');
  g.skipTutorial();check(g.canAct&&!g.tutorial.active&&!g.tutorial.reading,'Skipping releases tutorial protection and reading pause');
  g.restart();check(g.mode==='briefing'&&g.tutorial.index===0&&!g.tutorial.facts.pickups,'Restart resets tutorial facts and offers the guide again');
  g.start(false);check(!g.tutorial.active&&g.canAct,'Play without tutorial starts normal gameplay');
  g.newGame();g.start();check(g.tutorial.active&&g.tutorial.reading,'New campaign restores the guided option');
  g.pause();g.openInventory();g.closeInventory();check(g.mode==='paused','Inventory preserves an ordinary pause during training');
  g.start();check(g.tutorial.reading&&!g.canAct,'Resuming ordinary pause preserves the explanation');
  g.acknowledgeTutorial();g.skipTutorial();const before=g.time;ticks(g,60);check(g.time>before,'Skipped tutorial continues to simulate normally');
}
{
  const g=guided();g.acknowledgeTutorial();const before=JSON.stringify(g.zombies);ticks(g,120);check(JSON.stringify(g.zombies)===before,'Enemies remain still during opening exercises');
  g.generatorOn=true;g.player.x=17;g.player.y=4;go(g,'bunker');
  check(g.mode==='complete'&&g.tutorial.completed,'Optional exercises never add a new lock to the real bunker gate');
}
console.log(`Tutorial checks passed (${assertions} assertions plus per-tick survival checks): actions, reading safety, targets, out-of-order tasks, carrying limits, recovery, skip, restart and full campaign.`);
