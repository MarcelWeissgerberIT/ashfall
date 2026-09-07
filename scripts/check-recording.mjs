import assert from 'node:assert/strict';
import {recordGame,recordingType} from '../app/game/recording.mjs';
assert.equal(recordingType(t=>t==='video/webm'),'video/webm');assert.equal(recordingType(()=>false),'');
const original={stopped:false,clone(){return {stopped:false,stop(){this.stopped=true}}}};
let latest,video,tracks;
globalThis.MediaRecorder=class {static isTypeSupported(t){return t==='video/webm'}constructor(stream){this.stream=stream;this.state='inactive';this.mimeType='video/webm';latest=this}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['clip'])});this.onstop?.()}};
const canvas={captureStream(fps){assert.equal(fps,30);video={stopped:false,stop(){this.stopped=true}};tracks=[video];return {addTrack(t){tracks.push(t)},getTracks(){return tracks}}}};
let result;const session=recordGame(canvas,{getAudioTracks:()=>[original]},blob=>result=blob,()=>assert.fail('unexpected recording error'));
assert.equal(tracks.length,2);session.stop();assert.equal(result.type,'video/webm');assert.equal(result.size,4);assert.ok(tracks.every(t=>t.stopped));assert.equal(original.stopped,false);
let done=false,failed=false;recordGame(canvas,{getAudioTracks:()=>[original]},()=>done=true,()=>failed=true);latest.onerror();assert.equal(done,false);assert.equal(failed,true);assert.ok(tracks.every(t=>t.stopped));
const disposable=recordGame(canvas,{getAudioTracks:()=>[original]},()=>assert.fail('Unmount must not deliver video'),()=>{});disposable.dispose();assert.ok(tracks.every(t=>t.stopped));
console.log('Recording track mixing, stop/download blob, errors and cleanup verified with MediaRecorder test double.');

const displayVideo=new EventTarget();displayVideo.stopped=false;displayVideo.stop=()=>{displayVideo.stopped=true};const systemSound={stopped:false,stop(){this.stopped=true}};let displayTracks=[displayVideo,systemSound];const display={getTracks:()=>displayTracks,getVideoTracks:()=>[displayVideo],getAudioTracks:()=>[systemSound],removeTrack(t){displayTracks=displayTracks.filter(x=>x!==t)},addTrack(t){displayTracks.push(t)}};let fullTabResult=null;recordGame(display,{getAudioTracks:()=>[original]},blob=>fullTabResult=blob,()=>assert.fail('Tab recording error'));assert(systemSound.stopped,'System audio removed to prevent doubled sound');assert.equal(displayTracks.length,2);displayVideo.dispatchEvent(new Event('ended'));assert(fullTabResult?.size>0,'Browser stop finalizes the clip');assert(displayVideo.stopped);assert.equal(original.stopped,false);console.log('Full-tab stream, game-only audio mix and browser Stop sharing verified.');
