import assert from 'node:assert/strict';import fs from 'node:fs';
import {Game} from '../app/game/engine.mjs';import {updateStoryEvents} from '../app/game/story-events.mjs';import {createSave,restoreSave} from '../app/game/savegame.mjs';
import calls from '../app/game/story-calls.json' with {type:'json'};
for(const call of calls){const g=new Game();g.loadLevel(call.level);g.start(false);g.time=27;updateStoryEvents(g);assert(!g.messages.some(m=>m.id==='background-'+g.level));g.time=28;updateStoryEvents(g);assert.equal(g.lastRadio.voiceId,call.id);assert.equal(g.messages.at(-1).sender,call.sender);const n=g.messages.length;updateStoryEvents(g);assert.equal(g.messages.length,n);restoreSave(g,createSave(g));updateStoryEvents(g);assert.equal(g.messages.length,n);for(const lang of ['','de/'])assert(fs.statSync('public/audio/radio/'+lang+call.id+'.mp3').size>10000)}
for(let i=0;i<30;i++){const g=new Game();g.loadLevel(i);updateStoryEvents(g,true);assert(g.messages.some(m=>m.id==='background-'+i));}
console.log('All 30 background events, 20 voice files, speaker identity, timing and save-safe deduplication verified.');
