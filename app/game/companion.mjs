export function createCompanion(player){return {name:'Koda',x:player.x,y:player.y,facing:0,path:[],repath:0,cooldown:0,action:0,id:'koda',type:'companion',desc:'Mara’s loyal companion. Click to care for Koda.',command:'assist',foundId:null,searchId:null,sniff:0,bond:0,care:null,mode:'follow',target:null};}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const hasLoot=e=>!e.removed&&(e.type==='item'||e.type==='container'&&e.contents?.length>0);
function approach(game,dog,e){const paths=[];for(let x=e.x-1;x<=e.x+(e.w||1);x++)for(let y=e.y-1;y<=e.y+(e.h||1);y++){if(distance({x,y},game.player)<.95)continue;const p=game.pathTo(dog,{x,y});if(p)paths.push(p)}paths.sort((a,b)=>a.length-b.length);return paths[0]??null;}
export function commandCompanion(game,command){
 const d=game.companion;if(!d||(!game.canAct&&!game.companionOpen)||!['assist','search'].includes(command))return false;
 d.command=command;d.path=[];d.repath=0;d.searchId=null;d.foundId=null;d.sniff=0;
 if(command==='search'){
  const options=game.entities.filter(e=>hasLoot(e)&&distance(e,game.player)<=8&&approach(game,game.player,e)!==null).map(e=>({e,path:approach(game,d,e)})).filter(o=>o.path!==null&&o.path.length<=18).sort((a,b)=>a.path.length-b.path.length);
  if(!options.length){d.command='assist';game.log('Koda cannot find reachable supplies nearby.');return false;}
  d.searchId=options[0].e.id;game.log('Koda is tracking supplies.');
 }else game.log('Koda will stay close and protect Mara.');game.emit();return true;
}
export function updateCompanion(game,dt){
 const dog=game.companion;if(!dog)return;
 dog.cooldown=Math.max(0,dog.cooldown-dt);dog.action=Math.max(0,dog.action-dt);dog.repath-=dt;
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const safe=game.tutorial.active&&game.tutorial.index<3;
 const threats=safe?[]:game.zombies.filter(z=>z.hp>0&&z.alert&&dist(z,game.player)<3.2).sort((a,b)=>dist(a,game.player)-dist(b,game.player));
 let search=dog.command==='search'?game.entities.find(e=>e.id===dog.searchId&&hasLoot(e)):null;
 if(dog.command==='search'&&(!search||distance(search,game.player)>10)){dog.command='assist';dog.searchId=null;dog.foundId=null;search=null;dog.repath=0;}
 if(dog.foundId&&!game.entities.some(e=>e.id===dog.foundId&&hasLoot(e)))dog.foundId=null;
 const target=threats[0];dog.target=target?.id||null;dog.mode=target?'defend':dist(dog,game.player)>1.5?'follow':'idle';
 // Keep the puppy beside Mara, including when both reach the same container.
 if(!target&&!search&&dist(dog,game.player)<.85){
  const routes=[];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]){const p={x:Math.round(game.player.x)+dx,y:Math.round(game.player.y)+dy};if(dist(p,game.player)<1)continue;const route=game.pathTo(dog,p);if(route?.length)routes.push(route);}routes.sort((a,b)=>a.length-b.length);
  if(routes.length){dog.mode='follow';dog.path=routes[0];game.advanceActor(dog,dog.path,2.8,dt);dog.repath=0;return;}
 }
 if(search&&!target){
  dog.mode=dog.foundId===search.id?'found':'search';
  if(dog.repath<=0){dog.repath=.4;const route=approach(game,dog,search);if(route===null){dog.command='assist';dog.searchId=null;dog.path=[];game.log('Koda cannot find reachable supplies nearby.');return;}dog.path=route;}
  if(!dog.path.length){dog.mode=dog.foundId?'found':'sniff';dog.sniff+=dt;if(dog.sniff>=1.4&&!dog.foundId){dog.foundId=search.id;game.log('Koda found supplies. Follow his marker.','success');}}
  else{dog.sniff=0;game.advanceActor(dog,dog.path,2.8,dt);}return;
 }
 if(target&&dist(dog,target)<1.15&&dog.cooldown<=0&&(game.pathTo(dog,target)?.length??99)<=2){
  dog.facing=Math.atan2(target.x-dog.x,target.y-dog.y);dog.action=.5;dog.cooldown=1.7;target.hp=Math.max(0,target.hp-9);target.hurt=.25;target.attack=Math.max(target.attack,.65);
  game.effects.push({type:'hit',x:target.x,y:target.y,life:.2});if(!target.hp){game.kills++;game.log('Koda protected Mara.');}
 }
 if(dog.repath<=0){
  dog.repath=.3;
  if(target){// Route from the puppy to a reachable perimeter tile.
   const options=[];for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const path=game.pathTo(dog,{x:Math.round(target.x)+dx,y:Math.round(target.y)+dy});if(path)options.push(path)}options.sort((a,b)=>a.length-b.length);dog.path=dist(dog,target)<1.05?[]:options[0]||[];
  }else if(dist(dog,game.player)>1.5){const choices=[];for(const [dx,dy] of [[-1,0],[0,1],[1,0],[0,-1]]){const path=game.pathTo(dog,{x:Math.round(game.player.x)+dx,y:Math.round(game.player.y)+dy});if(path)choices.push(path)}choices.sort((a,b)=>a.length-b.length);dog.path=choices[0]||[];}else dog.path=[];
 }
 if(dog.action<.18)game.advanceActor(dog,dog.path,target?3.8:dist(dog,game.player)>4?4.5:3.4,dt);
}
