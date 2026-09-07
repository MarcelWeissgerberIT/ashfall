import {ITEMS,CAPACITY} from './engine.mjs';
export const RECIPES=[
 {id:'bandages',name:'Cut bandages',ingredients:{jacket:1},output:'medkit',quantity:2},
 {id:'salvage',name:'Dismantle chair',ingredients:{chair:1},output:'scrap',quantity:2,tool:'toolbox'},
 {id:'crowbar',name:'Forge crowbar',ingredients:{scrap:2},output:'crowbar',quantity:1,tool:'toolbox'},
 {id:'axe',name:'Build fire axe',ingredients:{crowbar:1,scrap:1},output:'axe',quantity:1,tool:'toolbox'},
 {id:'helmet',name:'Build patrol helmet',ingredients:{scrap:2},output:'helmet',quantity:1,tool:'toolbox'},
 {id:'vest',name:'Reinforce protection',ingredients:{jacket:1,tire:1,scrap:1},output:'vest',quantity:1,tool:'toolbox'}
];
export function recipeState(game,id){
 const recipe=RECIPES.find(r=>r.id===id);if(!recipe)return null;const bag=game.backpack;
 const ingredients=Object.entries(recipe.ingredients).map(([item,need])=>({item,need,have:bag.filter(v=>v===item).length}));
 const hasTool=!recipe.tool||bag.includes(recipe.tool);const weight=game.weight-ingredients.reduce((n,i)=>n+ITEMS[i.item].weight*i.need,0)+ITEMS[recipe.output].weight*recipe.quantity;
 const active=game.canAct||game.mode==='paused'&&(!(game.inventoryOpen||game.lootOpen)||game.canManageInventory);
 return {recipe,ingredients,hasTool,weight,active,ready:active&&hasTool&&ingredients.every(i=>i.have>=i.need)&&weight<=CAPACITY+.00001};
}
export function craft(game,id){const state=recipeState(game,id);if(!state?.ready)return false;for(const i of state.ingredients)for(let n=0;n<i.need;n++)game.consume(i.item);for(let n=0;n<state.recipe.quantity;n++)game.inventory.push(state.recipe.output);game.log('Crafted: '+state.recipe.quantity+' x '+ITEMS[state.recipe.output].name+'.','success');return true;}
