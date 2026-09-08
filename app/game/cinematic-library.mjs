const KEY='ashfall-cinematics-v1';
export const CINEMATICS=[
 {id:'intro',title:'A promise to Koda',deTitle:'Ein Versprechen an Koda',chapter:1},
 {id:'evac',title:'Flight to Haven',deTitle:'Flug nach Haven',chapter:3},
];
export function seenCinematics(storage,game={}){
 let seen=[];
 try{const value=JSON.parse(storage?.getItem(KEY)||'[]');if(Array.isArray(value))seen=value.filter(id=>CINEMATICS.some(f=>f.id===id));}catch{}
 try{if(storage?.getItem('ashfall-intro-v1')==='seen')seen.push('intro')}catch{}
 // Older saves predate the library. Reaching Haven also unlocks its arrival film.
 if(game.level>=3||game.unlocked>=3)seen.push('intro','evac');
 return CINEMATICS.filter(f=>seen.includes(f.id));
}
export function rememberCinematic(storage,id){
 if(!CINEMATICS.some(f=>f.id===id))return;
 try{storage?.setItem(KEY,JSON.stringify([...new Set([...seenCinematics(storage).map(f=>f.id),id])]))}catch{}
}
