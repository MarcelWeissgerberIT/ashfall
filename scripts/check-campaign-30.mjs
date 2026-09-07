import assert from 'node:assert/strict';
import {Game,LEVELS,CAPACITY} from '../app/game/engine.mjs';
import {craft,prepareRecipe,RECIPES} from '../app/game/crafting.mjs';
import {createSave,restoreSave} from '../app/game/savegame.mjs';
assert.equal(LEVELS.length,30);
const game=new Game();game.inventory=['axe','vest','helmet','toolbox','medkit','medkit','medkit','ration'];game.equipment={hand:'axe',body:'vest',head:'helmet'};game.loadLevel(7);game.start(false);
let tasks=0;
function tick(){game.tick(1/60);if(game.health<=60&&game.has('medkit'))game.use('medkit');if(game.health<=75&&game.has('ration'))game.use('ration');assert.notEqual(game.mode,'dead','Died in '+game.data.name)}
function go(id){const e=game.entities.find(e=>e.id===id);assert.notEqual(game.nearestPath(e),null,'Reachable '+id+' in '+game.data.name);game.select(id);let n=0;while(game.target||game.path.length){tick();assert(++n<18000,'Path stalled '+game.data.name)}return e}
function take(id){while(game.weight+(id==='medkit'?.3:.5)>CAPACITY&&game.has('bottle'))game.drop('bottle');return game.takeLoot(id)}
for(let level=7;level<30;level++){
 assert.equal(game.level,level);assert.equal(game.mode,'playing');
 for(const e of game.entities)assert.notEqual(game.nearestPath(e),null,`${level+1}: ${e.id} reachable`);
 const exit=game.entities.find(e=>e.type==='exit');go(exit.id);assert.equal(game.mode,'playing','Exit is gated');
 go('story-b');assert(!game.entities.find(e=>e.id==='story-b').done,'Sequence enforced');
 const first=game.entities.find(e=>e.id==='story-a');
 go('story-supplies');
 const needs=game.data.recipe&&!game.has(first.requires)?Object.keys(RECIPES.find(r=>r.id===game.data.recipe).ingredients):first.requires?[first.requires]:[];
 for(const id of needs){if(!game.has(id))game.takeLoot(id)}
 if(game.data.recipe&&!game.has('toolbox'))game.takeLoot('toolbox');
 while(game.count('medkit')<4&&game.entities.find(e=>e.id==='story-supplies').contents.includes('medkit')){if(!take('medkit'))break}
 game.closeInventory();
 if(game.data.recipe&&!game.has(first.requires))assert(craft(game,game.data.recipe,prepareRecipe(game,game.data.recipe)),'Craft '+game.data.name);
 go('story-a');assert(first.done,'First task '+game.data.name);tasks++;
 go('story-a');assert(first.done,'Repeated interaction is safe');
 const second=go('story-b');
 if(second.duration){
  for(let i=0;i<60;i++)tick();const remaining=second.remaining;
  game.pause();for(let i=0;i<60;i++)game.tick(1/60);assert.equal(second.remaining,remaining,'Paused work stays frozen');
  const save=createSave(game);restoreSave(game,save);game.start(false);
  const restored=game.entities.find(e=>e.id==='story-b');assert.equal(restored.remaining,remaining,'Work survives save');
  for(let i=0;i<1200&&!restored.done;i++)tick();assert(restored.done,'Timed task finishes');
 }
 tasks++;
 go(exit.id);assert.equal(game.mode,level===29?'won':'complete');
 console.log(`${level+1}: ${game.data.name} completed, ${Math.ceil(game.health)} HP`);
 if(level<29){game.next();game.start(false)}
}
assert.equal(tasks,46);assert(game.messages.some(m=>m.text.includes('Jonas')));assert(game.messages.some(m=>m.text.includes('Aster')));
const legacy=new Game();legacy.loadLevel(6);const raw=JSON.parse(createSave(legacy));raw.state.mode='won';restoreSave(legacy,JSON.stringify(raw));assert.equal(legacy.mode,'complete');legacy.next();assert.equal(legacy.level,7);
console.log('30 chapters, 46 new tasks, traversal, combat survival, crafting, gating, saved timers and legacy continuation verified.');
