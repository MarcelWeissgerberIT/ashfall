import assert from 'node:assert/strict';import fs from 'node:fs';
import {Game,LEVELS} from '../app/game/engine.mjs';
import {chapterSave} from '../app/game/preset-saves.mjs';
import {restoreSave} from '../app/game/savegame.mjs';
import {CINEMATICS} from '../app/game/cinematic-library.mjs';
import {updateStoryEvents} from '../app/game/story-events.mjs';
import calls from '../app/game/story-calls.json' with {type:'json'};
import briefings from '../app/game/chapter-briefings.json' with {type:'json'};
assert.equal(LEVELS.length,90);assert.equal(CINEMATICS.length,31);assert.equal(calls.length,90);assert.equal(briefings.length,90);
for(let level=0;level<90;level++){
 const g=new Game();restoreSave(g,chapterSave(level));assert.equal(g.level,level);assert.equal(g.mode,'briefing');
 const call=calls.find(c=>c.level===level),brief=briefings.find(c=>c.level===level);assert(call&&brief);
 for(const c of [call,brief])for(const prefix of ['','de/'])assert(fs.statSync('public/audio/radio/'+prefix+c.id+'.mp3').size>1000);
 if(level>=30){g.time=100;updateStoryEvents(g);assert(!g.messages.some(m=>m.id==='background-'+level),'New plot reveal must wait for objectives');g.entities.find(e=>e.id==='story-b').done=true;updateStoryEvents(g);assert(g.messages.some(m=>m.id==='background-'+level));}
 if(LEVELS[level].safe)assert.equal(LEVELS[level].zombies.length,0);
}
console.log('Three campaigns: 90 presets, 180 bilingual calls, safe chapters and spoiler gates verified.');
