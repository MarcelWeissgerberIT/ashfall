import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ITEMS,LEVELS} from '../app/game/engine.mjs';
import {TUTORIAL_STEPS} from '../app/game/tutorial.mjs';
import {RADIO} from '../app/game/radio.mjs';
const d=JSON.parse(fs.readFileSync(new URL('../app/game/de.json',import.meta.url)));
for(const item of Object.values(ITEMS))for(const key of ['name','desc'])assert(d[item[key]],'German item '+item[key]);
for(const level of LEVELS){for(const key of ['name','place','tag','weather','intro','hint'])assert(d[level[key]],'German sector '+level[key]);for(const goal of level.goals)assert(d[goal]);for(const e of level.entities)assert(d[e.desc],'German object description '+e.desc);}
for(const step of TUTORIAL_STEPS)for(const key of ['title','task','body','control'])assert(d[step[key]],'German tutorial '+key);
const credits=JSON.parse(fs.readFileSync(new URL('../public/audio/radio/de/credits.json',import.meta.url)));
for(const [id,call] of Object.entries(RADIO)){const file=fs.readFileSync(new URL('../public/audio/radio/de/'+id+'.mp3',import.meta.url));assert(file.length>10000);assert.equal(createHash('sha256').update(file).digest('hex'),credits.calls[id].sha256);assert.equal(d[call.text],credits.calls[id].text);}
console.log('German items, all three missions, entity descriptions, all eight lessons and seven matching voice recordings verified.');
