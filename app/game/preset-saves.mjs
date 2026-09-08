import {Game,LEVELS} from './engine.mjs';
import {createSave} from './savegame.mjs';
// Fresh, deterministic chapter starts, separate from the user's named save library.
export function chapterSave(level){
 if(!Number.isInteger(level)||level<0||level>=LEVELS.length)throw Error('Unknown chapter');
 const game=new Game({tutorial:level===0});
 if(level>0){
  game.inventory=['crowbar','jacket','helmet','medkit','medkit','bottle','ration'];
  game.equipment={hand:'crowbar',body:'jacket',head:'helmet'};
  if(level===2)game.inventory.push('sample','keycard','samplecase');
  if(level>=3){game.inventory=['axe','vest','helmet','toolbox','medkit','medkit','ration','bottle'];game.equipment={hand:'axe',body:'vest',head:'helmet'};if(level===3)game.inventory.push('sample');}
  game.loadLevel(level);
 }
 return createSave(game);
}
