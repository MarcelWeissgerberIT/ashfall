import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../app/game/engine.mjs';
import {RADIO} from '../app/game/radio.mjs';
const g=new Game();assert.equal(g.messages.length,2);assert.equal(g.messages[0].sender,'Mara');assert.equal(g.messages[1].voiceId,'checkpoint');
g.start(false);for(let i=0;i<12;i++)g.log('Event '+i);assert.equal(g.history.length,5);assert.equal(g.messages.length,14);g.loadLevel(1);g.loadLevel(2);assert(g.messages.some(m=>m.text==='Event 0'));assert.equal(g.messages.filter(m=>m.sender==='Mara').length,3);g.restart();assert.equal(g.messages.filter(m=>m.sender==='Mara').length,3);assert.equal(new Set(g.messages.map(m=>m.id)).size,g.messages.length);
for(const m of g.messages.filter(m=>m.voiceId)){assert(RADIO[m.voiceId]);for(const prefix of ['', 'de/'])assert(fs.statSync(new URL('../public/audio/radio/'+prefix+m.voiceId+'.mp3',import.meta.url)).size>10000);}
g.newGame();assert.equal(g.messages.length,2);console.log('Campaign chat retains events, unlocks three memories, avoids duplicate memories on retry, resets on new game, and has English/German recordings.');
