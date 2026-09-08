import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CINEMATICS} from '../app/game/cinematic-library.mjs';
for(const film of CINEMATICS){
 const bytes=fs.readFileSync('public'+film.src);
 assert(bytes.length>100_000,film.id+' is empty');
 assert.equal(bytes.toString('ascii',4,8),'ftyp',film.id+' is not MP4');
 assert(fs.existsSync('public'+film.poster),film.id+' poster missing');
}
console.log('All 11 cinematic files and posters exist, with MP4 containers.');
