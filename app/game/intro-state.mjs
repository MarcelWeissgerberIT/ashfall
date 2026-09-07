export function shouldShowIntro(storage){try{return storage.getItem('ashfall-intro-v1')!=='seen'}catch{return true}}
export function markIntroSeen(storage){try{storage.setItem('ashfall-intro-v1','seen')}catch{}}
