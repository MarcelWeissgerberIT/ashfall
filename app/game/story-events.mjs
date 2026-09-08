import briefings from './chapter-briefings.json' with {type:'json'};
import background from './background-notes.json' with {type:'json'};
import calls from './story-calls.json' with {type:'json'};
const quietNotes=[
 ['Mara: My sister Lena left her old frequency in my notebook. I still check it.','Mara: Meine Schwester Lena hinterließ ihre alte Frequenz in meinem Notizbuch. Ich prüfe sie noch immer.'],
 ['Levin: Some municipal relays were deliberately disconnected. I am marking them on our route.','Levin: Manche städtischen Relais wurden absichtlich getrennt. Ich markiere sie auf unserer Route.'],
 ['Imani: Keep the sample sealed. The records matter as much as the material itself.','Imani: Halte die Probe versiegelt. Die Akten sind genauso wichtig wie das Material selbst.'],
 ['Mara: Koda stops at ambulance markings. I wonder what he remembers.','Mara: Koda bleibt bei Rettungswagenmarkierungen stehen. Ich frage mich, woran er sich erinnert.'],
 ['Ada: Keep asking for names. An evacuation list is a list of people, not cargo.','Ada: Frage weiter nach Namen. Eine Evakuierungsliste enthält Menschen, keine Fracht.']
];
export const STORY_NOTE_DE=Object.fromEntries([...quietNotes,...background]);
export function updateStoryEvents(game,force=false){
 const briefing=briefings.find(c=>c.level===game.level);
 const briefId='briefing-event-'+game.level;
 if(briefing&&(force||game.time>=5)&&!game.messages.some(m=>m.id===briefId)){
  game.log(briefing.text,'story',briefing.id);
  const message=game.messages.at(-1);message.id=briefId;message.sender=briefing.sender;
 }
 const voice=calls.find(c=>c.level===game.level);
 const id='background-'+game.level;
 if(!force&&game.time<12||game.messages.some(m=>m.id===id))return;
 // Hold story calls until the opening mission traffic has had time to finish.
 if(!force&&voice&&game.time<28)return;
 // Avoid repeating generic notes; later chapters carry their own authored clues.
 const [text]=quietNotes[game.level%quietNotes.length];
 const body=voice?.text||(game.data.storyChapter?background[game.level-7][0]:text);
 if(voice)game.log(body,'story',voice.id);else game.log(body,'story');
 const m=game.messages[game.messages.length-1];m.id=id;m.sender=voice?.sender||'Mara';
}
