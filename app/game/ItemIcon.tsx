import { Axe, Backpack, Hand, HardHat, Package, ShieldCheck, Shirt } from 'lucide-react';
import { ART, ART_CELLS } from './art';

export default function ItemIcon({id,size=24}:{id:string;size?:number}) {
  if(id in ART_CELLS)return <img className="item-art" src={`${ART.icons}${id}.webp`} alt="" width={size*2} height={size*1.5} draggable={false}/>;
  const Icon=({axe:Axe,jacket:Shirt,vest:ShieldCheck,helmet:HardHat,fists:Hand,backpack:Backpack} as Record<string,typeof Axe>)[id]||Package;
  return <Icon className={`equipment-icon equipment-${id}`} size={size} strokeWidth={1.5} aria-hidden="true"/>;
}
