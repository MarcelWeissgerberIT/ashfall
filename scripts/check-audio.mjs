import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const checkout=fileURLToPath(new URL('..',import.meta.url));
const source=fs.readFileSync(checkout+'/app/game/GameAudio.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {GameAudio}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const {Game}=await import(checkout+'/app/game/engine.mjs');
const {RADIO}=await import(checkout+'/app/game/radio.mjs');
const clientSource=fs.readFileSync(checkout+'/app/game/GameClient.tsx','utf8');
const clientAst=ts.createSourceFile('GameClient.tsx',clientSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const handlerDeclarations=new Map();
function findHandlers(node){if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&['enableAudio','replayRadio'].includes(node.name.text))handlerDeclarations.set(node.name.text,node.getText(clientAst));ts.forEachChild(node,findHandlers)}
findHandlers(clientAst);
const handlerSource=['enableAudio','replayRadio'].map(name=>'const '+handlerDeclarations.get(name)+';').join('\n')+'\nreturn {enableAudio,replayRadio};';
const handlerJs=ts.transpileModule(handlerSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const actualReplayHandlers=new Function('audio','audioChoice','setSound','setAudioStatus','game',handlerJs);

const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
class Param {value=0; setTargetAtTime(){} setValueAtTime(){} exponentialRampToValueAtTime(){} linearRampToValueAtTime(){}}
class Node {gain=new Param();frequency=new Param();Q=new Param();threshold=new Param();knee=new Param();ratio=new Param();pan=new Param();detune=new Param();connect(n){return n}disconnect(){}start(){}stop(){}}
class Context {
 static resumeGate=null;
 currentTime=0;sampleRate=100;state='running';destination=new Node();
 createGain(){return new Node()} createDynamicsCompressor(){return new Node()} createBiquadFilter(){return new Node()} createMediaElementSource(){return new Node()} createBufferSource(){return new Node()} createConvolver(){return new Node()} createOscillator(){return new Node()} createStereoPanner(){return new Node()}
 createBuffer(channels,length){const channelsData=Array.from({length:channels},()=>new Float32Array(length));return{getChannelData:i=>channelsData[i]}}
 resume(){return Context.resumeGate?.promise??Promise.resolve()}
 close(){this.state='closed';return Promise.resolve()}
}
class Media {
 static all=[];
 constructor(){Media.all.push(this)}
 paused=true;ended=false;pauseCalls=0;playCalls=0;pending=null;onplaying=null;onpause=null;onended=null;onerror=null;src='';currentTime=0;
 pause(){this.pauseCalls++;if(this.pending){const p=this.pending;this.pending=null;p.reject(Object.assign(new Error('interrupted'),{name:'AbortError'}))}if(!this.paused){this.paused=true;this.onpause?.()}}
 play(){this.playCalls++;this.paused=false;this.pending=deferred();return this.pending.promise}
 finishPlay(){const pending=this.pending;this.pending=null;this.paused=false;this.onplaying?.();pending?.resolve()}
 removeAttribute(){this.src=''}load(){}
}
globalThis.window={AudioContext:Context};
globalThis.Audio=Media;
const flush=async()=>{await Promise.resolve();await Promise.resolve()};
const game=()=>({level:0,mode:'playing',canAct:true,inventoryOpen:false,lastRadio:{id:'mission-a',voiceId:'checkpoint'}});
const results=[];
const run=async(name,fn)=>{try{await fn();results.push({name,status:'PASS'})}catch(error){results.push({name,status:'FAIL',detail:error.message})}};
const director=async()=>{const statuses=[];const a=new GameAudio(s=>statuses.push({...s}));await a.setEnabled(true);return{a,media:Media.all.at(-1),statuses}};

await run('Automatic cue is not duplicated by repeated sync',async()=>{
 const {a,media}=await director();try{const g=game();a.sync(g);a.sync(g);assert.equal(media.playCalls,1)}finally{a.dispose();await flush()}
});
for(const interruptedState of ['paused','inventory','dead']){
 await run('Pending call is canceled when entering '+interruptedState,async()=>{
  const {a,media}=await director();try{
   const g=game();a.sync(g);const pauseBefore=media.pauseCalls;
   g.canAct=false;g.mode=interruptedState==='dead'?'dead':'paused';g.inventoryOpen=interruptedState==='inventory';a.sync(g);
   assert.ok(media.pauseCalls>pauseBefore,'sync did not call pause while status.loading=true');
  }finally{a.dispose();await flush()}
 });
}
await run('Muted pending call recovers on unmute',async()=>{
 const {a,media,statuses}=await director();try{
  const g=game();a.sync(g);await a.setEnabled(false);await flush();await a.setEnabled(true);a.sync(g);await flush();
  assert.ok(media.playCalls>1,'unmute did not retry/resume the interrupted call; status='+JSON.stringify(statuses.at(-1)));
 }finally{a.dispose();await flush()}
});
await run('Explicit replay is allowed while mission is paused',async()=>{
 const {a,media,statuses}=await director();try{
  const g=game();g.mode='paused';g.canAct=false;a.sync(g);
  void a.playRadio('checkpoint',true);media.finishPlay();await flush();a.sync(g);
  assert.equal(media.paused,false);assert.equal(statuses.at(-1).playing,true);
 }finally{a.dispose();await flush()}
});
await run('Late playing event after pause is blocked',async()=>{
 const {a,media,statuses}=await director();try{
  const g=game();a.sync(g);g.mode='paused';g.canAct=false;a.sync(g);await flush();
  media.finishPlay();await flush();assert.equal(media.paused,true);assert.equal(statuses.at(-1).playing,false);
 }finally{a.dispose();await flush()}
});
await run('Late playing event after mute is blocked',async()=>{
 const {a,media,statuses}=await director();try{
  a.sync(game());await a.setEnabled(false);await flush();
  media.finishPlay();await flush();assert.equal(media.paused,true);assert.equal(statuses.at(-1).playing,false);
 }finally{a.dispose();await flush()}
});
await run('Explicit disable wins over an earlier pending enable',async()=>{
 const {a}=await director();try{
  Context.resumeGate=deferred();const enabling=a.setEnabled(true);await a.setEnabled(false);Context.resumeGate.resolve();await enabling;
  assert.equal(a.enabled,false,'an earlier resume promise re-enabled audio after explicit disable');
 }finally{Context.resumeGate=null;a.dispose();await flush()}
});
await run('Manual briefing playback is not restarted when mission begins',async()=>{
 const {a,media}=await director();try{
  const g=game();g.mode='briefing';g.canAct=false;a.sync(g);
  void a.playRadio('checkpoint',true);media.finishPlay();await flush();
  g.mode='playing';g.canAct=true;a.sync(g);
  assert.equal(media.playCalls,1,'starting mission replayed the briefing already being heard');
 }finally{a.dispose();await flush()}
});
await run('Replay wiring launches one call when unmuting in mission',async()=>{
 const {a,media}=await director();try{
  await a.setEnabled(false);const g=game();
  // Execute the current handlers extracted from GameClient, without React rendering.
  const handlers=actualReplayHandlers({current:a},{current:false},()=>{},()=>{},g);
  await handlers.replayRadio('checkpoint');await flush();
  assert.equal(media.playCalls,1,'enableAudio sync auto-started the cue, then replayRadio restarted it');
 }finally{a.dispose();await flush()}
});
await run('Every trigger has a file and matching prerecorded caption',async()=>{
 const credits=JSON.parse(fs.readFileSync(checkout+'/public/audio/radio/credits.json','utf8'));
 for(const asset of credits.assets){
  assert.equal(RADIO[asset.id].text,credits.cues[asset.id].text);
  const file=fs.readFileSync(checkout+'/public/audio/radio/'+asset.id+'.mp3');
  assert.equal(createHash('sha256').update(file).digest('hex'),asset.sha256);
  assert.ok(asset.duration>5&&file.length>20000,'Call contains a full prerecorded transmission');
 }
 const g=new Game(),seen=[];
 seen.push(g.lastRadio.voiceId);
 g.start(false);g.inventory.push('fuse','fuel');g.interact(g.entities.find(e=>e.id==='generator'));seen.push(g.lastRadio.voiceId);
 g.loadLevel(1);seen.push(g.lastRadio.voiceId);
 g.loadLevel(2);seen.push(g.lastRadio.voiceId);g.start(false);g.zombies=[];g.inventory.push('battery','sample');
 g.interact(g.entities.find(e=>e.id==='radio'));seen.push(g.lastRadio.voiceId);
 const signalId=g.lastRadio.id;g.interact(g.entities.find(e=>e.id==='radio'));assert.equal(g.lastRadio.id,signalId);
 g.signal=.01;g.tick(.02);seen.push(g.lastRadio.voiceId);
 const evacId=g.lastRadio.id;g.tick(.02);assert.equal(g.lastRadio.id,evacId);
 g.interact(g.entities.find(e=>e.id==='evac'));seen.push(g.lastRadio.voiceId);
 assert.deepEqual(seen,['checkpoint','generator','bunker','rooftop','signal','evac-ready','rescue']);
});
console.log(JSON.stringify(results,null,2));
process.exitCode=results.some(result=>result.status==='FAIL')?1:0;
