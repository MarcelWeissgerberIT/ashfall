export const INFECTED=[
 {kind:'shambler',name:'Shambler',desc:'Slow and relentless. Tougher than it looks; easily distracted by sound.',hp:94,speed:.95,damage:8,cooldown:1.35,sight:4.5},
 {kind:'runner',name:'Runner',desc:'Fast and fragile. Keep your distance or interrupt its rush.',hp:62,speed:1.5,damage:6,cooldown:1,sight:5.1},
 {kind:'stalker',name:'Stalker',desc:'Anticipates your route and quickly loses interest in distractions.',hp:80,speed:1.15,damage:8,cooldown:1.2,sight:5.5}
];
export function configureInfected(z,index){const v=INFECTED[index%3];Object.assign(z,{kind:v.kind,name:v.name,desc:v.desc,hp:v.hp,maxHp:v.hp});return z;}
export function infectedRules(z){return INFECTED.find(v=>v.kind===z.kind)||{...INFECTED[0],damage:7,speed:.85,cooldown:1.2};}
export function clearSight(game,a,b){const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*4);for(let i=1;i<n;i++){const t=i/n;if(game.isBlocked(Math.round(a.x+(b.x-a.x)*t),Math.round(a.y+(b.y-a.y)*t)))return false;}return true;}
