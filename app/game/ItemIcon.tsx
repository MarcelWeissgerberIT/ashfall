import { Axe, Backpack, Hand, HardHat, Package, ShieldCheck, Shirt } from 'lucide-react';
import { ART, ART_CELLS } from './art';

const itemCells=['crowbar','axe','jacket','vest','helmet','medkit','bottle','fuse','fuel','keycard','sample','battery','scrap','chair','tire','toolbox','ration'];
export default function ItemIcon({id,size=24}:{id:string;size?:number}) {
  const cell=itemCells.indexOf(id);if(cell>=0)return <span className="item-art item-atlas" aria-hidden="true" style={{width:size*2,height:size*2,backgroundImage:'url(/images/loot/items-v2.png)',backgroundSize:'500% 400%',backgroundPosition:`${cell%5*25}% ${Math.floor(cell/5)*100/3}%`}}/>;
  if(id in ART_CELLS)return <img className="item-art" src={`${ART.icons}${id}.webp`} alt="" width={size*2} height={size*1.5} draggable={false}/>;
  const Icon=({axe:Axe,jacket:Shirt,vest:ShieldCheck,helmet:HardHat,fists:Hand,backpack:Backpack} as Record<string,typeof Axe>)[id]||Package;
  return <Icon className={`equipment-icon equipment-${id}`} size={size} strokeWidth={1.5} aria-hidden="true"/>;
}
