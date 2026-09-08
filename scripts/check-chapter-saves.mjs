import assert from 'node:assert/strict';
import {Game,CAPACITY} from '../app/game/engine.mjs';
import {chapterSave} from '../app/game/preset-saves.mjs';
import {readSave,restoreSave,createSave} from '../app/game/savegame.mjs';
import {craft,prepareRecipe} from '../app/game/crafting.mjs';
for(let level=0;level<3;level++){
 const game=new Game();restoreSave(game,chapterSave(level));
 assert.equal(game.level,level);assert.equal(game.mode,'briefing');assert(game.weight<=CAPACITY);
 assert.equal(game.objectives().filter(Boolean).length,0);
 assert(game.companion);assert.equal(readSave(createSave(game)).state.level,level);
 if(level===2)assert(game.has('sample')&&game.has('keycard'));
 game.start(false);
 if(level===0){const crate=game.entities.find(e=>e.id==='guard');assert(!crate.contents.includes('fuse'));game.inventory.push(...crate.contents);assert(craft(game,'fuse',prepareRecipe(game,'fuse')));game.inventory.push('fuel');game.interact(game.entities.find(e=>e.id==='generator'));assert(game.generatorOn);}
 if(level===1){const sample=game.entities.find(e=>e.id==='sample');game.interact(sample);assert(!game.has('sample')&&!sample.removed);game.inventory.push('scrap','bottle','toolbox');assert(craft(game,'samplecase',prepareRecipe(game,'samplecase')));game.interact(sample);assert(game.has('sample'));const loaded=new Game();restoreSave(loaded,createSave(game));assert(loaded.has('samplecase'));}
}
assert.throws(()=>chapterSave(90));console.log('All three chapter saves, crafting gates and round-trip persistence passed.');
