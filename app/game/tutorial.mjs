export const TUTORIAL_STEPS = [
  {id:'move',title:'Take your first steps',task:'Click open ground and walk at least one tile.',body:'You are Mara Voss. Click or tap the ground to move; Mara finds a path around walls and wrecks. The amber marker shows a useful destination. Zoom with the wheel or a two-finger pinch. Right-drag, or drag one finger on mobile, to pan.',control:'CLICK / TAP · MOVE'},
  {id:'pickup',title:'Scavenge what you can carry',task:'Pick up the glass bottle near your starting position.',body:'Click the marked bottle. Mara walks into reach and picks it up automatically. Loose supplies and salvage can go in your backpack. Large structures and vehicles stay on the map, but some contain useful items.',control:'CLICK AN ITEM · PICK UP'},
  {id:'pack',title:'Know your equipment',task:'Open your inventory, inspect your gear, then close it.',body:'Press I or use the backpack button. Drag an item onto a matching equipment slot, or select it and click Equip. Drag worn gear back to your backpack to remove it. Hand, body, and head slots show your loadout. Only your held weapon deals its listed damage; only worn armor protects you. Find a jacket and helmet near the start. You can carry 14 kg. Dropped items stay where you leave them. Opening the backpack pauses the mission; close it with I, Escape, or the close button.',control:'I · OPEN / CLOSE BACKPACK'},
  {id:'survive',title:'Keep a low profile',task:'Switch to Sneak and walk two tiles. A hit or bottle throw also counts.',body:'The Infected can now react to you. Press Shift or click Walk to toggle Sneak: slower movement attracts less attention. Click an Infected to attack; Mara also defends herself at close range. Press 2 for a Bandage when injured. Press 3, then click open ground, to distract enemies with a bottle.',control:'SHIFT · SNEAK   2 · HEAL   3 · DISTRACT'},
  {id:'fuse',title:'Repair what the city left behind',task:'Craft a Fuse using metal scrap and a toolbox from the guard crate.',body:'The gate fuse is burned out. Search the guard crate for metal scrap and a toolbox. Open Crafting in the top bar, choose Assemble fuse, and click Craft item. The grid prepares carried materials automatically; drag and drop works too. Metal is consumed, tools stay in your backpack.',control:'CRAFTING · ASSEMBLE FUSE'},
  {id:'fuel',title:'Find fuel in the wreck',task:'Search the car trunk for a Fuel canister.',body:'The generator also needs diesel. Click the marked car trunk in the southeast. Its contents stay visible until you take them. Take the Fuel and keep it with the Fuse. The crate or trunk keeps anything that did not fit in your backpack, so you can come back after making space.',control:'FUSE + FUEL · RESTORE POWER'},
  {id:'power',title:'Bring the generator online',task:'Carry both parts to the emergency generator and interact.',body:'Click the generator near the bunker entrance. Quest items are used automatically: the Fuse and Fuel are consumed to restore power. If you dropped a part, collect it first. The generator will tell you what is missing.',control:'CLICK THE GENERATOR · REPAIR'},
  {id:'bunker',title:'Leave the checkpoint',task:'Click the bunker gate to finish your first mission.',body:'Power is on and the gate is unlocked. Click it to enter. The next sector continues with your remaining gear and health, with health restored to at least 85. Inside Station Zero, find a Keycard, open the lab, and recover Sample N-04. You know the basics now.',control:'CLICK THE GATE · ENTER BUNKER'},
];

export function createTutorial(enabled) {
  return {active:enabled,index:0,reading:enabled,completed:false,facts:{distance:0,pickups:0,inventoryViewed:false,sneakDistance:0,hit:false,threw:false,fuse:false,fuel:false}};
}

export function updateTutorial(game) {
  const t=game.tutorial;
  if(!t?.active||game.level!==0)return;
  const f=t.facts;
  f.fuse ||= game.has('fuse')||game.generatorOn;
  f.fuel ||= game.has('fuel')||game.generatorOn;
  // Leaving the sector never depends on completing optional training exercises.
  if(game.mode==='complete') {t.active=false;t.reading=false;t.completed=true;t.index=TUTORIAL_STEPS.length;return;}
  if(game.inventoryOpen||game.lootOpen||game.mode!=='playing')return;
  const done=[f.distance>=.99,f.pickups>0,f.inventoryViewed,f.sneakDistance>=1.99||f.hit||f.threw,f.fuse,f.fuel,game.generatorOn,false];
  const previous=t.index;
  while(done[t.index])t.index++;
  if(t.index!==previous){
    t.reading=true;t.waypoint=null;
    game.path=[];game.target=null;
  }
}

function looseItem(game,id) {
  return game.entities.find(e=>!e.removed&&e.type==='item'&&e.item===id);
}
function freeDestination(game,minimum=2) {
  const origin={x:Math.round(game.player.x),y:Math.round(game.player.y)};
  // Choose a reachable destination; the survivor may have explored out of order.
  for(const [dx,dy] of [[minimum,0],[0,-minimum],[-minimum,0],[0,minimum],[minimum,minimum]]){
    const p={x:origin.x+dx,y:origin.y+dy};
    const path=game.pathTo(game.player,p);
    if(path?.length>=minimum)return {...p,name:'Open ground'};
  }
  return null;
}

export function tutorialTarget(game) {
  const t=game.tutorial;
  if(!t?.active||game.level!==0)return null;
  const step=TUTORIAL_STEPS[t.index]?.id;
  const entity=id=>game.entities.find(e=>e.id===id&&!e.removed);
  const part=id=>looseItem(game,id)||entity(id==='fuse'?'guard':'wreck');
  if(step==='move'||step==='survive'){
    if(!t.waypoint||Math.hypot(t.waypoint.x-game.player.x,t.waypoint.y-game.player.y)<.15)t.waypoint=freeDestination(game,2);
    return t.waypoint;
  }
  if(step==='pickup')return entity('bottle1')||game.entities.find(e=>!e.removed&&e.type==='item')||null;
  if(step==='pack')return null;
  if(step==='fuse'&&game.has('scrap')&&game.has('toolbox'))return null;
  if(step==='fuse'||step==='fuel')return part(step);
  if(step==='power'){
    const missing=['fuse','fuel'].find(id=>!game.has(id));
    return missing?part(missing):entity('generator');
  }
  return step==='bunker'?entity('bunker'):null;
}

export function tutorialHint(game) {
  if(game.tutorial?.index===4&&game.has('scrap')&&game.has('toolbox'))return 'Open Crafting and assemble the Fuse. Your materials are ready.';
  const step=TUTORIAL_STEPS[game.tutorial?.index]?.id;
  if(step==='power'){
    const missing=['fuse','fuel'].filter(id=>!game.has(id));
    if(missing.length)return `Recover the ${missing.map(id=>id==='fuse'?'Fuse':'Fuel').join(' and ')} first. The marker points to the next missing part.`;
  }
  const target=tutorialTarget(game);
  if(target?.type==='container'&&target.contents.some(id=>game.weight+({fuse:.2,fuel:2}[id]||0)>14+.00001))return 'Backpack full: open Inventory, drop some salvage, then search this container again.';
  if(target?.id?.startsWith('drop-'))return 'This part is on the ground where you dropped it. Pick it up again to continue.';
  return null;
}
