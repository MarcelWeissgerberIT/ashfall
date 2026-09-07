'use client';
import { LanguageSwitch, Localized } from './i18n';
import { ArrowRight, Backpack, BookOpen, Check, Crosshair, Pause, Radio } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import ScrollRegion from './ScrollRegion';
import { TUTORIAL_STEPS, tutorialHint, tutorialTarget } from './tutorial.mjs';
export default function TutorialPanel({game,portalContainer}:{game:any;portalContainer?:HTMLElement|null}) {
 const t=game.tutorial;
 if(!t.active||game.mode!=='playing'||game.inventoryOpen||game.lootOpen)return null;
 const step=TUTORIAL_STEPS[t.index],target=tutorialTarget(game),hint=tutorialHint(game);
 const begin=()=>{game.acknowledgeTutorial();if(step.id==='pack')game.openInventory()};
 const progress=<ol className="tutorial-progress" aria-label="Tutorial progress">{TUTORIAL_STEPS.map((s,i)=><li key={s.id} className={i<t.index?'done':i===t.index?'current':''} aria-current={i===t.index?'step':undefined} aria-label={`${s.title}: ${i<t.index?'complete':i===t.index?'current':'up next'}`}>{i<t.index?<Check size={10}/>:null}</li>)}</ol>;
 return <Localized><>
  {!t.reading&&<div className="tutorial-layer"><section className="tutorial-card" aria-label="Current tutorial task"><div className="tutorial-kicker"><span><Radio size={13}/> FIELD TRAINING</span><span>{t.index+1} / 8</span></div>{progress}<h2>{step.title}</h2><p className="tutorial-task">{step.task}</p><div className="tutorial-tools">{step.id==='pack'?<button onClick={()=>game.openInventory()}><Backpack size={14}/> Backpack</button>:target&&<button onClick={()=>game.focusTutorial()}><Crosshair size={14}/> Show target</button>}<button onClick={()=>{game.tutorial.reading=true;game.emit()}}><BookOpen size={14}/> Instructions</button></div></section></div>}
  <Dialog open={t.reading} onOpenChange={v=>{if(!v)game.acknowledgeTutorial()}}><DialogContent className="game-dialog tutorial-dialog" showCloseButton={false} portalContainer={portalContainer}><div className="tutorial-kicker"><span><Radio size={14}/> FIELD TRAINING</span><span>{t.index+1} / 8</span></div>{progress}<LanguageSwitch/><DialogTitle>{step.title}</DialogTitle><DialogDescription>{step.task}</DialogDescription><ScrollRegion label="Tutorial instructions"><p className="tutorial-explanation">{step.body}</p><div className="tutorial-control">{step.control}</div><p className="tutorial-safe"><Pause size={13}/> World paused while you read.{t.index<3?' Enemies stay still during the first three exercises.':''}</p>{hint&&<p className="tutorial-hint">{hint}</p>}</ScrollRegion><button className="primary-btn" onClick={begin}>{step.id==='pack'?'OPEN BACKPACK':'TRY IT'}<ArrowRight size={17}/></button><button className="tutorial-skip" onClick={()=>game.skipTutorial()}>Skip tutorial</button></DialogContent></Dialog>
 </></Localized>;
}
