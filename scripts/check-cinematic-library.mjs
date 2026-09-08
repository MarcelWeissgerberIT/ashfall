import assert from 'node:assert/strict';
import {seenCinematics,rememberCinematic} from '../app/game/cinematic-library.mjs';
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
const ids=(game={})=>seenCinematics(storage,game).map(f=>f.id);
assert.deepEqual(ids(),[]);
storage.setItem('ashfall-intro-v1','seen');assert.deepEqual(ids(),['intro']);
rememberCinematic(storage,'evac');rememberCinematic(storage,'evac');assert.deepEqual(ids(),['intro','evac']);
rememberCinematic(storage,'invalid');assert.deepEqual(ids(),['intro','evac']);
data.clear();assert.deepEqual(ids({level:3}),['intro','evac']);assert.deepEqual(ids({level:0,unlocked:3}),['intro','evac']);assert.deepEqual(ids({level:2,unlocked:2}),[]);
storage.setItem('ashfall-cinematics-v1','broken');storage.setItem('ashfall-intro-v1','seen');assert.deepEqual(ids(),['intro']);
assert.deepEqual(seenCinematics({getItem(){throw Error('denied')}},{level:3}).map(f=>f.id),['intro','evac']);
assert.doesNotThrow(()=>rememberCinematic({getItem(){throw Error('denied')},setItem(){throw Error('denied')}},'intro'));
console.log('Cinematic archive: unlocks, legacy saves, deduplication and unavailable/corrupt storage passed.');

const {CINEMATICS,chapterCinematic}=await import('../app/game/cinematic-library.mjs');
assert.deepEqual(CINEMATICS.filter(f=>f.id!=='intro').map(f=>f.chapter),[3,6,9,12,15,18,21,24,27,30]);
for(let level=0;level<30;level++){
 assert.equal(chapterCinematic({level,mode:'playing'}),null);
 assert.equal(!!chapterCinematic({level,mode:level===29?'won':'complete'}),(level+1)%3===0);
 const available=seenCinematics(null,{level,unlocked:level});
 assert(available.every(f=>f.id==='intro'||f.chapter<=level));
}
assert.equal(chapterCinematic({level:29,mode:'won'}).id,'finale');
assert(seenCinematics(null,{level:29,mode:'won'}).some(f=>f.id==='finale'));
assert.equal(new Set(CINEMATICS.map(f=>f.id)).size,CINEMATICS.length);
console.log('All 30 transitions, finale and spoiler-safe legacy unlocks passed.');
