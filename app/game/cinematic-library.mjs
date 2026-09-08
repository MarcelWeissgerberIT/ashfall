import trilogy from './trilogy-chapters.json' with {type:'json'};
const KEY='ashfall-cinematics-v1';
export const CINEMATICS=[
 {id:'intro',title:'A promise to Koda',deTitle:'Ein Versprechen an Koda',chapter:1,poster:'/video/ashfall-prologue-en.jpg',src:'/video/ashfall-prologue-en.mp4'},
 {id:'evac',title:'Flight to Haven',deTitle:'Flug nach Haven',chapter:3,poster:'/video/ashfall-evac-haven.jpg',src:'/video/ashfall-evac-haven.mp4'},
 ...[
 [6,'Water for Haven','Wasser für Haven'],[9,'The recorder in 4B','Der Rekorder in 4B'],
 [12,'A name on the collar','Ein Name am Halsband'],[15,'Dust in the ducts','Staub in den Schächten'],
 [18,'The ambulance lane','Die Rettungswagenspur'],[21,'An answer in the dark','Eine Antwort im Dunkeln'],
 [24,'A beginning, not a cure','Ein Anfang, kein Heilmittel'],[27,'The open frequency','Die offene Frequenz'],
 ].map(([chapter,title,deTitle])=>({id:'chapter-'+chapter,title:String(title),deTitle:String(deTitle),chapter:Number(chapter),poster:'/video/ashfall-chapter-'+chapter+'.jpg',src:'/video/ashfall-chapter-'+chapter+'.mp4'})),
 {id:'finale',title:'Tomorrow, we start here',deTitle:'Morgen fangen wir hier an',chapter:30,poster:'/video/ashfall-finale.jpg',src:'/video/ashfall-finale.mp4'},
];
for(let chapter=33;chapter<=90;chapter+=3){const row=trilogy[chapter-31],finale=chapter%30===0;const id=(finale?'finale-':'chapter-')+chapter;CINEMATICS.push({id,title:row[0],deTitle:row[1],chapter,poster:'/video/ashfall-'+id+'.jpg',src:'/video/ashfall-'+id+'.mp4'});}
export function chapterCinematic(game){
 if(!['complete','won'].includes(game.mode))return null;
 return CINEMATICS.find(f=>f.id!=='intro'&&f.chapter===game.level+1)||null;
}
export function seenCinematics(storage,game={}){
 let seen=[];
 try{const value=JSON.parse(storage?.getItem(KEY)||'[]');if(Array.isArray(value))seen=value.filter(id=>CINEMATICS.some(f=>f.id===id));}catch{}
 try{if(storage?.getItem('ashfall-intro-v1')==='seen')seen.push('intro')}catch{}
 // Recover films earned by older saves without revealing later story chapters.
 if(game.level>=3||game.unlocked>=3)seen.push('intro');
 for(const film of CINEMATICS)if(film.id!=='intro'&&(Math.max(game.level??0,game.unlocked??0)>=film.chapter||(game.mode==='won'&&film.chapter===game.level+1)))seen.push(film.id);
 return CINEMATICS.filter(f=>seen.includes(f.id));
}
export function rememberCinematic(storage,id){
 if(!CINEMATICS.some(f=>f.id===id))return;
 try{storage?.setItem(KEY,JSON.stringify([...new Set([...seenCinematics(storage).map(f=>f.id),id])]))}catch{}
}
