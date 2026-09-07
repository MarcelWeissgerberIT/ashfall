import {ITEMS,CAPACITY} from './engine.mjs';
export const RECIPES=[
 {id:'fuse',name:'Assemble fuse',ingredients:{scrap:1},output:'fuse',quantity:1,tool:'toolbox'},
 {id:'samplecase',name:'Build sample carrier',ingredients:{scrap:1,bottle:1},output:'samplecase',quantity:1,tool:'toolbox'},
 {id:'bandages',name:'Cut bandages',ingredients:{jacket:1},output:'medkit',quantity:2},
 {id:'salvage',name:'Dismantle chair',ingredients:{chair:1},output:'scrap',quantity:2,tool:'toolbox'},
 {id:'crowbar',name:'Forge crowbar',ingredients:{scrap:2},output:'crowbar',quantity:1,tool:'toolbox'},
 {id:'axe',name:'Build fire axe',ingredients:{crowbar:1,scrap:1},output:'axe',quantity:1,tool:'toolbox'},
 {id:'helmet',name:'Build patrol helmet',ingredients:{scrap:2},output:'helmet',quantity:1,tool:'toolbox'},
 {id:'vest',name:'Reinforce protection',ingredients:{jacket:1,tire:1,scrap:1},output:'vest',quantity:1,tool:'toolbox'}
];
export function recipeState(game,id){
 const recipe=RECIPES.find(r=>r.id===id);if(!recipe)return null;const bag=game.inventory;
 const ingredients=Object.entries(recipe.ingredients).map(([item,need])=>({item,need,have:bag.filter(v=>v===item).length}));
 const hasTool=!recipe.tool||bag.includes(recipe.tool);const weight=game.weight-ingredients.reduce((n,i)=>n+ITEMS[i.item].weight*i.need,0)+ITEMS[recipe.output].weight*recipe.quantity;
 const active=game.canAct||game.mode==='paused'&&(!(game.inventoryOpen||game.lootOpen)||game.canManageInventory);
 return {recipe,ingredients,hasTool,weight,active,ready:active&&hasTool&&ingredients.every(i=>i.have>=i.need)&&weight<=CAPACITY+.00001};
}
export function matchesRecipe(id,grid){const r=RECIPES.find(r=>r.id===id);if(!r||!Array.isArray(grid)||grid.length!==9)return false;const counts={};for(const v of grid){if(v!==null){if(typeof v!=='string')return false;counts[v]=(counts[v]||0)+1;}}return Object.keys(counts).length===Object.keys(r.ingredients).length&&Object.entries(r.ingredients).every(([id,n])=>counts[id]===n);}
export function craft(game,id,grid){if(!matchesRecipe(id,grid))return false;const state=recipeState(game,id);if(!state?.ready)return false;for(const i of state.ingredients)for(let n=0;n<i.need;n++)game.consume(i.item);for(let n=0;n<state.recipe.quantity;n++)game.inventory.push(state.recipe.output);if(id==='fuse')game.log('Mara: Just like the old emergency radios. This fuse will get us inside, Koda. Find fuel and start the generator.','story');if(id==='samplecase')game.log('Mara: Metal outside, glass inside. N-04 can travel safely now. Stay close, Koda. We are going to the lab.','story');game.log('Crafted: '+state.recipe.quantity+' x '+ITEMS[state.recipe.output].name+'.','success');return true;}

// Stage only owned ingredients; preparing never consumes or unequips anything.
export function prepareRecipe(game,id){const state=recipeState(game,id);const grid=Array(9).fill(null);if(!state)return grid;let index=0;for(const i of state.ingredients)for(let n=0;n<Math.min(i.have,i.need)&&index<9;n++)grid[index++]=i.item;return grid;}
