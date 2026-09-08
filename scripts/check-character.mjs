import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const require=createRequire(root+'/package.json'),ts=require('typescript');
const THREE=await import(pathToFileURL(root+'/node_modules/three/build/three.module.js'));
const renderPath=root+'/app/game/render-kit.ts';
const integrated=fs.readFileSync(renderPath,'utf8');
const opts={noEmit:true,strict:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,skipLibCheck:true,lib:['lib.es2022.d.ts','lib.dom.d.ts'],types:[]};
const host=ts.createCompilerHost(opts),oldGet=host.getSourceFile.bind(host);
host.getSourceFile=(f,lv,onError,fresh)=>f===renderPath?ts.createSourceFile(f,integrated,lv,true):oldGet(f,lv,onError,fresh);
const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([renderPath],opts,host));
assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
function url(src){return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64')}
const threeURL=pathToFileURL(root+'/node_modules/three/build/three.module.js').href;
const roundedURL=pathToFileURL(root+'/node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js').href;
const artURL=url(fs.readFileSync(root+'/app/game/art.ts','utf8'));
const renderURL=url(integrated.replace("from 'three'",`from '${threeURL}'`).replace("from 'three/addons/geometries/RoundedBoxGeometry.js'",`from '${roundedURL}'`).replace("from './art'",`from '${artURL}'`));
globalThis.document={createElement:()=>({width:128,height:128,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
const originalLoad=THREE.TextureLoader.prototype.load;
THREE.TextureLoader.prototype.load=function(){return new THREE.Texture()};
const {createRenderKit,createCharacter,animateCharacter}=await import(renderURL);
const kit=createRenderKit({capabilities:{getMaxAnisotropy:()=>8}});
const roots=[];let frames=0,maxFootError=0,minGround=Infinity,minWeaponGround=Infinity,maxFootCase=null,minWeaponCase=null;
function check(group,actor){
  const before=JSON.stringify(actor);animateCharacter(group,actor,1/60,true,frames/60);assert.equal(JSON.stringify(actor),before);group.updateMatrixWorld(true);frames++;
  group.traverse(o=>{assert(o.matrixWorld.elements.every(Number.isFinite),'nonfinite transform '+o.name)});
  if(actor.hp>0)for(const leg of group.userData.legs){const foot=leg.foot.getWorldPosition(new THREE.Vector3());const error=foot.distanceTo(leg.plant);if(error>maxFootError){maxFootError=error;maxFootCase={sneak:actor.sneak,sprint:actor.sprint,action:actor.action,frame:frames}}if(leg.stance)minGround=Math.min(minGround,foot.y-.102)}
  if(actor.hp>0&&!actor.action&&!group.userData.zombie)for(const gear of Object.values(group.userData.hands))if(gear.visible){gear.traverseVisible(o=>{if(o.isMesh){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);if(b.min.y<minWeaponGround){minWeaponGround=b.min.y;minWeaponCase={gear:gear.name,sneak:actor.sneak,sprint:actor.sprint,frame:frames}}}})}
}
for(const zombie of [false,true])for(let variant=0;variant<3;variant++){
  const group=createCharacter(kit,zombie,variant);roots.push(group);
  const actor={x:0,y:0,facing:0,hp:100,hurt:0,sneak:false,sprint:false,equipment:{hand:'crowbar',body:'jacket',head:'helmet'},action:null};
  for(const mode of ['idle','walk','sneak','sprint']){
    actor.sneak=mode==='sneak';actor.sprint=mode==='sprint';
    for(let i=0;i<240;i++){
      const speed=mode==='idle'?0:mode==='sprint'?4.8:mode==='sneak'?1.0:zombie?1.7:2.7;
      actor.facing=i<120?0:(i-120)/120*Math.PI*.7;
      actor.x+=Math.sin(actor.facing)*speed/60;actor.y+=Math.cos(actor.facing)*speed/60;check(group,actor);
    }
  }
  actor.sneak=false;actor.sprint=false;
  for(const action of ['attack','throw','heal','interact'])for(let i=0;i<=100;i++){
    actor.action={type:action,remaining:Math.max(0,1-i/100),duration:1};actor.hurt=i===45?.8:0;check(group,actor);
    if(!zombie){assert.equal(group.userData.hands.bottle.visible,action==='throw'&&i>0&&i<52||action==='throw'&&i===0);if(action==='heal'&&i<100)assert(group.userData.bandage.visible)}
  }
  actor.action=null;actor.hurt=0;
  if(!zombie)for(const hand of [null,'crowbar','axe','bottle'])for(const body of [null,'jacket','vest'])for(const head of [null,'helmet']){
    actor.equipment={hand,body,head};check(group,actor);
    for(const [id,object] of Object.entries(group.userData.hands))assert.equal(object.visible,hand===id);
    for(const [id,pieces] of Object.entries(group.userData.wear))for(const o of pieces)assert.equal(o.visible,id==='helmet'?head===id:body===id);
    assert(group.userData.backpack.visible);
  }
  const lastPhase=group.userData.phase;animateCharacter(group,actor,1/60,false,frames/60);assert.equal(group.userData.phase,lastPhase);
  actor.x+=50;check(group,actor);assert(group.userData.legs.every(l=>l.plant.distanceTo(new THREE.Vector3(actor.x,.102,actor.y))<.6));
  actor.hp=0;for(let i=0;i<70;i++)check(group,actor);assert.equal(group.userData.death,1);assert.equal(group.userData.halo.visible,false);
}
const puppyURL=url(fs.readFileSync(root+'/app/game/puppy.ts','utf8').replace("from 'three'","from '"+threeURL+"'"));
const {createPuppy,animatePuppy}=await import(puppyURL);const puppy=createPuppy(kit);roots.push(puppy);
const dog={x:0,y:0,facing:0,mode:'idle',action:0};
for(let i=0;i<720;i++){dog.mode=i<240?'idle':i<480?'follow':'defend';if(i>=240&&i<480)dog.y+=.04;dog.action=i>=480?.5-(i%30)/60:0;const before=JSON.stringify(dog);animatePuppy(puppy,dog,1/60,true,i/60);assert.equal(JSON.stringify(dog),before);puppy.updateMatrixWorld(true);puppy.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite),'Puppy finite joint transform'));}const phase=puppy.userData.phase;animatePuppy(puppy,dog,1/60,false,12);assert.equal(puppy.userData.phase,phase,'Paused puppy animation freezes');
// Articulated puppy: care transitions, all speeds, turning, pause and teleport.
for(const mode of ['sniff','found','follow','defend'])for(const speed of [0,1,2.8,4.5])for(let i=0;i<120;i++){
 dog.mode=mode;dog.facing=i/30;dog.x+=Math.sin(dog.facing)*speed/60;dog.y+=Math.cos(dog.facing)*speed/60;
 animatePuppy(puppy,dog,1/60,true,i/60);puppy.updateMatrixWorld(true);
 puppy.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));
 for(const leg of puppy.userData.legs){assert(leg.userData.knee&&leg.userData.paw);const paw=leg.userData.paw.getWorldPosition(new THREE.Vector3());assert(paw.y>=.025,'Paw must not penetrate floor');}
}
for(const kind of ['play','feed']){dog.care={kind,at:Date.now()};for(let i=0;i<90;i++)animatePuppy(puppy,dog,1/60,true,i/60);assert(puppy.userData[kind]>.9);}
delete dog.care;dog.x+=50;animatePuppy(puppy,dog,1/60,true,0);assert(Number.isFinite(puppy.userData.phase));
console.log('720 puppy animation frames verified: idle, trot, defence, pause and actor immutability.');
for(let variant=0;variant<3;variant++){const corpse=createCharacter(kit,true,variant);roots.push(corpse);animateCharacter(corpse,{x:0,y:0,hp:0,facing:0},1/60,true,1);corpse.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(corpse.userData.body);assert(bounds.max.y<.9,'Defeated infected lie below standing actors');assert(bounds.max.z-bounds.min.z>1.3,'Defeated infected lie horizontally');}
const geos=new Set(),mats=new Set();for(const g of roots)g.traverse(o=>{if(o.isMesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m)}});
let geoDisposals=0,materialDisposals=0;for(const g of geos)g.addEventListener('dispose',()=>geoDisposals++);for(const m of mats)m.addEventListener('dispose',()=>materialDisposals++);
const perLevelMaterials=kit.extras.size;for(const g of roots)kit.disposeLocal(g);assert.equal(kit.extras.size,0);assert.equal(geoDisposals,0);assert.equal(materialDisposals,perLevelMaterials);
kit.dispose();assert.equal(geoDisposals,geos.size);assert.equal(materialDisposals,mats.size);
THREE.TextureLoader.prototype.load=originalLoad;
console.log(JSON.stringify({typecheck:'pass',frames,geometries:geos.size,materials:mats.size,maxFootError,maxFootCase,minStanceGround:minGround,minWeaponGround,minWeaponCase,resourceCleanup:'pass',actorMutation:'none'}));
