'use client';
import { useEffect, useRef } from 'react';
import { ArrowRight, Backpack, BookOpen, Check, Crosshair, Pause, Radio } from 'lucide-react';
import { TUTORIAL_STEPS, tutorialHint, tutorialTarget } from './tutorial.mjs';

export default function TutorialPanel({game}:{game:any}) {
  const t=game.tutorial;
  const beginButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(t.active&&t.reading&&game.mode==='playing'&&!game.inventoryOpen)beginButton.current?.focus({preventScroll:true})},[t.active,t.reading,t.index,game.mode,game.inventoryOpen]);
  if(!t.active||game.mode!=='playing'||game.inventoryOpen)return null;
  const step=TUTORIAL_STEPS[t.index],target=tutorialTarget(game),hint=tutorialHint(game);
  const begin=()=>{game.acknowledgeTutorial();if(step.id==='pack')game.openInventory()};
  return <div className={t.reading?'tutorial-layer reading':'tutorial-layer'}>
    <section className="tutorial-card" aria-label="Checkpoint tutorial">
      <div className="tutorial-kicker"><span><Radio size={14}/> FIELD TRAINING</span><span>{String(t.index+1).padStart(2,'0')} / 08</span></div>
      <ol className="tutorial-progress" aria-label="Tutorial progress">{TUTORIAL_STEPS.map((s,i)=><li key={s.id} className={i<t.index?'done':i===t.index?'current':''} aria-current={i===t.index?'step':undefined} aria-label={`${s.title}: ${i<t.index?'complete':i===t.index?'current':'up next'}`}>{i<t.index?<Check size={10}/>:null}</li>)}</ol>
      <div aria-live="polite" aria-atomic="true"><h2>{step.title}</h2><p className="tutorial-task"><span className="tutorial-task-dot"/>{step.task}</p></div>
      {t.reading&&<><p className="tutorial-explanation">{step.body}</p><div className="tutorial-control">{step.control}</div><p className="tutorial-safe"><Pause size={12}/> World paused while you read.{t.index<3?' Enemies stay still during the first three exercises.':''}</p></>}
      {hint&&<p className="tutorial-hint">{hint}</p>}
      {t.reading?<button ref={beginButton} className="primary-btn" onClick={begin}>{step.id==='pack'?'OPEN BACKPACK':'TRY IT'}{step.id==='pack'?<Backpack size={16}/>:<ArrowRight size={16}/>}</button>:<div className="tutorial-tools">{step.id==='pack'?<button onClick={()=>game.openInventory()}><Backpack size={14}/> Open backpack <kbd>I</kbd></button>:target&&<button onClick={()=>game.focusTutorial()} title={`Center the map on ${target.name}`}><Crosshair size={14}/> Show target</button>}<button onClick={()=>{game.tutorial.reading=true;game.emit()}}><BookOpen size={14}/> Read again</button></div>}
      <div className="tutorial-bottom"><span>{t.reading?'LEARN. SCAVENGE. SURVIVE.':target?.name||'Inspect your equipment'}</span><button onClick={()=>game.skipTutorial()}>Skip tutorial</button></div>
    </section>
  </div>;
}
