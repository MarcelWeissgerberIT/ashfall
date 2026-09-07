export function createCompanion(player){return {name:'Koda',x:player.x,y:player.y,facing:0,path:[],repath:0,cooldown:0,action:0,mode:'follow',target:null};}
export function updateCompanion(game,dt){
 const dog=game.companion;if(!dog)return;
 dog.cooldown=Math.max(0,dog.cooldown-dt);dog.action=Math.max(0,dog.action-dt);dog.repath-=dt;
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const safe=game.tutorial.active&&game.tutorial.index<3;
 const threats=safe?[]:game.zombies.filter(z=>z.hp>0&&z.alert&&dist(z,game.player)<3.2).sort((a,b)=>dist(a,game.player)-dist(b,game.player));
 const target=threats[0];dog.target=target?.id||null;dog.mode=target?'defend':dist(dog,game.player)>1.5?'follow':'idle';
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
