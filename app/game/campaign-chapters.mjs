import trilogy from './trilogy-chapters.json' with {type:'json'};
// Chapter 8–30: authored revelations, objectives and deterministic traversable maps.
// English and German text travel together so new chapters never fall back to English.
export const CAMPAIGN_STORIES = [
 ['The familiar signal','Das vertraute Signal','street','fuse',
 'A transmission repeats Mara’s old service code. Follow it to the district relay before the signal dies.', 'Ein Funkspruch wiederholt Maras alte Dienstkennung. Folge ihm zum Bezirksrelais, bevor das Signal verstummt.',
 'Mara: That is my repair signature. Someone is using a radio I serviced before the evacuation.', 'Mara: Das ist meine Reparaturkennung. Jemand benutzt ein Funkgerät, das ich vor der Evakuierung gewartet habe.',
 'Levin: The relay points to your old apartment block. The sender signed the message J. Voss.', 'Levin: Das Relais verweist auf deinen alten Wohnblock. Der Absender hat mit J. Voss unterschrieben.'],
 ['Apartment 4B','Wohnung 4B','street','toolbox',
 'Mara returns to the home she abandoned. Her brother Jonas left a recorder behind a broken service panel.', 'Mara kehrt in ihre verlassene Wohnung zurück. Ihr Bruder Jonas versteckte ein Aufnahmegerät hinter einer defekten Wartungsklappe.',
 'Jonas: You were not imagining the missing evacuation calls. I copied the dispatch records. Look for the night bus.', 'Jonas: Du hast dir die fehlenden Evakuierungsrufe nicht eingebildet. Ich habe die Einsatzdaten kopiert. Suche nach dem Nachtbus.',
 'Mara: I thought he left without me. He was trying to tell me where to look.', 'Mara: Ich dachte, er wäre ohne mich gegangen. Er wollte mir sagen, wo ich suchen muss.'],
 ['The night bus','Der Nachtbus','rail','battery',
 'An evacuation bus never reached the depot. Restore its recorder and trace the passengers’ last route.', 'Ein Evakuierungsbus erreichte das Depot nie. Versorge seinen Rekorder mit Strom und verfolge die letzte Route der Fahrgäste.',
 'Dispatch record: Route 12 was diverted to Mercy Hospital under a medical transport order.', 'Einsatzprotokoll: Linie 12 wurde durch einen Krankentransportbefehl zum Mercy-Krankenhaus umgeleitet.',
 'Mara: That ambulance where I found Koda came from Mercy. Jonas and Koda were on the same route.', 'Mara: Der Rettungswagen, in dem ich Koda fand, kam vom Mercy. Jonas und Koda waren auf derselben Route.'],
 ['Mercy intake','Mercy-Aufnahme','hospital','samplecase',
 'The hospital intake desk still holds sealed transport records. Recover them without spreading the contaminated dust.', 'In der Krankenhausaufnahme liegen versiegelte Transportakten. Berge sie, ohne den kontaminierten Staub zu verteilen.',
 'Intake note: Jonas Voss, communications volunteer. Transferred alive to the northern quarantine.', 'Aufnahmenotiz: Jonas Voss, freiwilliger Funkhelfer. Lebend in die nördliche Quarantäne verlegt.',
 'Imani: The first patients arrived before the public alert. Someone had at least two days of warning.', 'Imani: Die ersten Patienten kamen vor der öffentlichen Warnung. Jemand hatte mindestens zwei Tage Vorlauf.'],
 ['A name on the collar','Ein Name am Halsband','garden','toolbox',
 'A veterinary shelter used Mercy’s transport network. Koda pulls toward its broken gate. Search the registration office.', 'Ein Tierheim nutzte Mercys Transportnetz. Koda zieht zu seinem beschädigten Tor. Durchsuche die Registrierung.',
 'Shelter register: Koda, shepherd puppy. Foster carer: Nurse Ada Bell. Evacuated with the pediatric ward.', 'Tierheimregister: Koda, Schäferhundwelpe. Pflegestelle: Schwester Ada Bell. Mit der Kinderstation evakuiert.',
 'Mara: You were someone’s little comfort before you were mine. We will find out what happened to Ada.', 'Mara: Du hast schon jemandem Trost gespendet, bevor du zu mir kamst. Wir finden heraus, was mit Ada geschah.'],
 ['The missing two days','Die fehlenden zwei Tage','safe','none',
 'Return to Haven with the hospital evidence. Imani and Levin must compare it with Mara’s service log.', 'Kehre mit den Krankenhausbelegen nach Haven zurück. Imani und Levin gleichen sie mit Maras Wartungsbuch ab.',
 'Imani: The infection began in maintenance workers. Their common link was the municipal air-filtration project, Aster.', 'Imani: Die Infektion begann bei Wartungsarbeitern. Ihre Verbindung war das städtische Luftfilterprojekt Aster.',
 'Mara: I maintained Aster’s alarm relays. My signature is on the last firmware release.', 'Mara: Ich habe Asters Alarmrelais gewartet. Meine Unterschrift steht unter der letzten Firmware-Freigabe.'],
 ['Aster maintenance','Aster-Wartung','industrial','fuse',
 'Reach an Aster filter station. Bring its local terminal online and retrieve the release manifest.', 'Erreiche eine Aster-Filterstation. Starte das lokale Terminal und berge die Freigabeliste.',
 'Release manifest: Mara’s patch repaired dropped radio packets. A separate override disabled contamination alerts.', 'Freigabeliste: Maras Änderung reparierte verlorene Funkpakete. Eine andere Übersteuerung deaktivierte Kontaminationswarnungen.',
 'Levin: Two signatures, two changes. Yours restored communication. The override came from the central tower.', 'Levin: Zwei Unterschriften, zwei Änderungen. Deine stellte die Verbindung wieder her. Die Übersteuerung kam vom Zentralturm.'],
 ['Dust in the ducts','Staub in den Schächten','industrial','samplecase',
 'Imani needs a sealed filter sample. The station still exhales dust; secure the extractor before opening the archive.', 'Imani braucht eine versiegelte Filterprobe. Die Station stößt noch Staub aus. Sichere den Abzug, bevor du das Archiv öffnest.',
 'Imani: Aster grew an engineered fungal filter. Heat stress changed its spores. This was an industrial organism, not a weapon.', 'Imani: Aster züchtete einen technischen Pilzfilter. Hitzestress veränderte seine Sporen. Das war ein Industrieorganismus, keine Waffe.',
 'Mara: They called the failures ordinary dust. People kept working in it.', 'Mara: Sie nannten die Ausfälle gewöhnlichen Staub. Die Menschen arbeiteten weiter darin.'],
 ['The flooded archive','Das geflutete Archiv','canal','toolbox',
 'A flooded service archive contains the first incident report. Restart the drainage controls and copy the evidence.', 'Ein überflutetes Wartungsarchiv enthält den ersten Vorfallsbericht. Repariere die Entwässerung und kopiere die Beweise.',
 'Incident report: Night crews developed fever, confusion and aggression. The contractor requested an immediate shutdown.', 'Vorfallsbericht: Nachtschichten entwickelten Fieber, Verwirrung und Aggression. Der Auftragnehmer verlangte die sofortige Abschaltung.',
 'Imani: The warning was real. The shutdown order was replaced by a request for more testing.', 'Imani: Die Warnung war eindeutig. Der Abschaltbefehl wurde durch die Forderung nach weiteren Tests ersetzt.'],
 ['Seven minutes','Sieben Minuten','rail','battery',
 'Jonas cached an evacuation timeline at the switching yard. Power its isolated recorder.', 'Jonas hinterlegte im Rangierbahnhof eine Evakuierungszeitleiste. Versorge den isolierten Rekorder mit Strom.',
 'Mara: I delayed one broadcast for seven minutes to confirm a route. I have carried those minutes ever since.', 'Mara: Ich verzögerte einen Funkspruch um sieben Minuten, um eine Route zu prüfen. Diese Minuten trage ich seitdem mit mir.',
 'Jonas: Your delay did not close the gates. The gates were locked forty minutes before your message. I have the order.', 'Jonas: Deine Verzögerung schloss die Tore nicht. Sie waren vierzig Minuten vor deiner Nachricht verriegelt. Ich habe den Befehl.'],
 ['The northern cordon','Der nördliche Sperrring','street','axe',
 'The path north is blocked by collapsed barricades. Prepare a fire axe and reach the quarantine records.', 'Eingestürzte Barrikaden versperren den Weg nach Norden. Bereite eine Feuerwehraxt vor und erreiche die Quarantäneakten.',
 'Quarantine list: Nurse Ada Bell escorted children and a puppy out through the ambulance lane. The route split at the cordon.', 'Quarantäneliste: Schwester Ada Bell führte Kinder und einen Welpen durch die Rettungswagenspur. Die Wege trennten sich am Sperrring.',
 'Mara: Koda was left when the ambulance broke down, not because Ada abandoned him. Her patients needed her.', 'Mara: Koda blieb zurück, als der Rettungswagen ausfiel. Ada hat ihn nicht aufgegeben. Ihre Patienten brauchten sie.'],
 ['Ada’s refuge','Adas Zuflucht','safe','none',
 'A small refuge answers Koda’s registration number. Reach Ada and ask about Jonas and the evacuation.', 'Eine kleine Zuflucht antwortet auf Kodas Registriernummer. Erreiche Ada und frage nach Jonas und der Evakuierung.',
 'Ada: I knew those ears. I searched until the infected reached us. Thank you for bringing him home to someone.', 'Ada: Diese Ohren würde ich überall erkennen. Ich suchte, bis die Infizierten kamen. Danke, dass er bei dir ein Zuhause gefunden hat.',
 'Ada: Jonas went to the reservoir station. He wanted a route back to you. He left this access code.', 'Ada: Jonas ging zur Reservoir-Station. Er suchte einen Weg zurück zu dir. Er hinterließ diesen Zugangscode.'],
 ['The reservoir line','Die Reservoir-Leitung','canal','fuse',
 'Haven’s new water supply passes an old monitoring station. Repair it before the colony draws from the reservoir.', 'Havens neue Wasserversorgung führt an einer alten Messstation vorbei. Repariere sie, bevor die Kolonie Reservoirwasser nutzt.',
 'Imani: The reservoir is clear. The infection spread through airborne spores and later through infected wounds. We can protect the water.', 'Imani: Das Reservoir ist sauber. Die Infektion verbreitete sich durch Sporen in der Luft und später durch infizierte Wunden. Das Wasser können wir schützen.',
 'Jonas’s note: I am at the observatory. The tower is listening. Use the maintenance frequency, Mara.', 'Jonas’ Notiz: Ich bin im Observatorium. Der Turm hört mit. Nutze die Wartungsfrequenz, Mara.'],
 ['The observatory','Das Observatorium','rooftop','battery',
 'A narrow-band transmitter is Jonas’s last known contact. Restore its power and hold the signal long enough to connect.', 'Ein Schmalbandsender ist Jonas’ letzter bekannter Kontakt. Stelle den Strom wieder her und halte das Signal bis zur Verbindung.',
 'Jonas: Mara? I am alive. My leg is broken. I hid the gate order in the weather station and stayed off the open channels.', 'Jonas: Mara? Ich lebe. Mein Bein ist gebrochen. Ich versteckte den Torbefehl in der Wetterstation und mied offene Kanäle.',
 'Mara: We are coming. Koda has been finding people better than any radio I ever repaired.', 'Mara: Wir kommen. Koda findet Menschen besser als jedes Funkgerät, das ich je repariert habe.'],
 ['The weather station','Die Wetterstation','rooftop','toolbox',
 'Reach Jonas’s shelter and repair its emergency lift. He cannot walk out without it.', 'Erreiche Jonas’ Unterschlupf und repariere den Notaufzug. Ohne ihn kann er den Ort nicht verlassen.',
 'Jonas: Director Vale locked the gates to keep Aster’s failure inside the district. I copied the signed order.', 'Jonas: Direktor Vale verriegelte die Tore, um Asters Versagen im Bezirk einzuschließen. Ich kopierte den unterschriebenen Befehl.',
 'Mara: I cannot undo those seven minutes. But I will not let him bury everyone else’s choices inside my guilt.', 'Mara: Ich kann diese sieben Minuten nicht rückgängig machen. Aber er wird die Entscheidungen der anderen nicht hinter meiner Schuld verstecken.'],
 ['A table for four','Ein Tisch für vier','safe','none',
 'Jonas and Ada reach Haven. Compare their evidence with Imani’s findings and decide what the colony must do next.', 'Jonas und Ada erreichen Haven. Vergleiche ihre Beweise mit Imanis Ergebnissen und kläre den nächsten Schritt.',
 'Imani: N-04 is a strain that suppresses the altered fungus in the lab. It is a lead, not a cure. We need a controlled culture.', 'Imani: N-04 hemmt den veränderten Pilz im Labor. Es ist ein Ansatz, kein Heilmittel. Wir brauchen eine kontrollierte Kultur.',
 'Jonas: Vale still controls the tower and the air plants. We need both the evidence and a way to shut them down safely.', 'Jonas: Vale kontrolliert noch immer den Turm und die Luftanlagen. Wir brauchen Beweise und eine sichere Abschaltung.'],
 ['The cold chain','Die Kühlkette','hospital','samplecase',
 'Recover viable starter cultures from the biobank. Build a protective carrier and stabilize the cooling circuit.', 'Berge lebensfähige Ausgangskulturen aus der Biobank. Baue einen Schutzbehälter und stabilisiere den Kühlkreislauf.',
 'Imani: Lena Voss signed these culture notes. Your sister preserved N-04 and escaped to the independent clinic. We can reproduce her sealed trial without experimenting on people.', 'Imani: Lena Voss unterschrieb diese Kulturnotizen. Deine Schwester bewahrte N-04 und floh in die unabhängige Klinik. Wir können ihren geschlossenen Versuch ohne Menschenexperimente wiederholen.',
 'Mara: No shortcuts this time. Record every result, including the failures.', 'Mara: Diesmal keine Abkürzungen. Dokumentiere jedes Ergebnis, auch die Fehlschläge.'],
 ['Blackout protocol','Abschaltprotokoll','industrial','fuse',
 'The plants share an emergency circuit. Repair the old interlock so shutting one down will not overload the others.', 'Die Anlagen teilen einen Notstromkreis. Repariere die Verriegelung, damit eine Abschaltung die anderen nicht überlastet.',
 'Levin: Pulling the main switch would vent the remaining spores. Your interlock lets us seal the filters first.', 'Levin: Der Hauptschalter würde die restlichen Sporen freisetzen. Deine Verriegelung erlaubt uns, zuerst die Filter abzudichten.',
 'Mara: This is why the order matters. Seal, isolate, then stop the fans.', 'Mara: Deshalb ist die Reihenfolge entscheidend. Abdichten, isolieren, dann die Lüfter stoppen.'],
 ['Under the tower','Unter dem Turm','industrial','axe',
 'The public entrance is sealed. Open a service passage and reach Vale’s local archive without restarting the ventilation.', 'Der öffentliche Eingang ist versiegelt. Öffne einen Wartungsweg und erreiche Vales lokales Archiv, ohne die Lüftung zu starten.',
 'Vale’s memo: Delaying the warning protected the project’s funding. The district was treated as an acceptable loss.', 'Vales Vermerk: Die verzögerte Warnung schützte die Finanzierung des Projekts. Der Bezirk galt als hinnehmbarer Verlust.',
 'Jonas: Keep the original signatures. People deserve evidence, not another voice telling them what to believe.', 'Jonas: Bewahre die Originalunterschriften. Die Menschen verdienen Beweise und nicht wieder eine Stimme, der sie einfach glauben sollen.'],
 ['The open frequency','Die offene Frequenz','rooftop','battery',
 'Broadcast the unedited records. Hold the rooftop uplink until neighboring settlements receive the archive.', 'Sende die unbearbeiteten Akten. Halte die Dachverbindung, bis benachbarte Siedlungen das Archiv empfangen haben.',
 'Neighboring relay: Archive received. We have our own Aster records. We will keep copies. No one can erase this alone.', 'Nachbarrelais: Archiv empfangen. Wir haben eigene Aster-Akten. Wir bewahren Kopien auf. Niemand kann das allein auslöschen.',
 'Mara: My name belongs in those records too. Let them read what I did, and what I should have questioned.', 'Mara: Mein Name gehört ebenfalls in diese Akten. Sie sollen lesen, was ich getan und was ich hätte hinterfragen müssen.'],
 ['Seal the source','Die Quelle versiegeln','industrial','toolbox',
 'The truth is out, but the plant is still breathing. Seal the source chambers and stop the final fan bank.', 'Die Wahrheit ist bekannt, doch die Anlage atmet noch. Versiegle die Quellkammern und stoppe die letzte Lüfterbank.',
 'Levin: Chamber pressure is stable. The spores are contained. The shutdown will not clear the streets, but it stops this source.', 'Levin: Der Kammerdruck ist stabil. Die Sporen sind eingeschlossen. Die Abschaltung macht die Straßen nicht frei, stoppt aber diese Quelle.',
 'Mara: For the first time, the silence means something is working.', 'Mara: Zum ersten Mal bedeutet die Stille, dass etwas funktioniert.'],
 ['A measured hope','Eine vorsichtige Hoffnung','hospital','samplecase',
 'Carry Imani’s trial cultures to an independent clinic. Repair its testing station and transmit the results to Haven.', 'Bringe Imanis Versuchskulturen in eine unabhängige Klinik. Repariere die Teststation und übertrage die Ergebnisse nach Haven.',
 'Lena: Mara, I kept our frequency open. I am alive. The independent trials confirm suppression. We can begin treatment research, with consent and shared records. Recovery will take time.', 'Lena: Mara, ich hielt unsere Frequenz offen. Ich lebe. Die unabhängigen Versuche bestätigen die Hemmung. Wir können mit Einwilligung und offenen Protokollen die Behandlungsforschung beginnen. Genesung braucht Zeit.',
 'Imani: Not a miracle. A beginning we can trust. Bring yourself and Koda home.', 'Imani: Kein Wunder. Ein Anfang, dem wir vertrauen können. Komm mit Koda nach Hause.'],
 ['The morning after','Der Morgen danach','safe','none',
 'Return to Haven. The gates are open to new arrivals, the records belong to everyone, and Mara no longer has to carry the truth alone.', 'Kehre nach Haven zurück. Die Tore stehen Neuankömmlingen offen, die Akten gehören allen und Mara muss die Wahrheit nicht länger allein tragen.',
 'Jonas: We will keep looking for the missing. Ada is opening a clinic. Levin is training new repair crews. There is work for all of us.', 'Jonas: Wir suchen weiter nach den Vermissten. Ada eröffnet eine Klinik. Levin bildet Reparaturteams aus. Es gibt Arbeit für uns alle.',
 'Mara: I promised you a way out, Koda. You helped me find a way back to people. Tomorrow, we start here.', 'Mara: Ich versprach dir einen Ausweg, Koda. Du halfst mir, zu den Menschen zurückzufinden. Morgen fangen wir hier an.']
];
CAMPAIGN_STORIES.push(...trilogy);
export const CAMPAIGN_DE={};
const pair=(en,de)=>(CAMPAIGN_DE[en]=de,en);
const taskWords={fuse:['Restore the relay','Relais wiederherstellen'],battery:['Power the station','Station mit Strom versorgen'],toolbox:['Repair the mechanism','Mechanismus reparieren'],samplecase:['Secure the evidence','Beweise sicher bergen'],axe:['Clear the service passage','Wartungsweg freimachen'],none:['Meet the survivors','Mit den Überlebenden sprechen']};
export function makeCampaignChapters(){return CAMPAIGN_STORIES.map((s,i)=>{
 const [name,deName,theme,requires,intro,deIntro,reveal,deReveal,result,deResult]=s,safe=theme==='safe'||requires==='none';
 const mirror=i%2===1;const point=(x,y)=>({x:mirror?20-x:x,y});
 const prop=(id,x,y,style,w=1,h=1)=>({id,...point(mirror?x+w-1:x,y),type:'prop',style,w,h,solid:true,name:pair('Abandoned structure','Verlassene Anlage'),desc:pair('Find a route around this structure.','Finde einen Weg um diese Anlage.')});
 const layouts=[[[6,4,3,4],[12,10,4,2],[5,12,2,2]],[[5,5,5,1],[12,4,2,5],[8,12,5,1]],[[4,6,2,4],[9,3,4,2],[13,11,3,3]],[[6,3,2,5],[11,7,5,1],[7,12,2,3]],[[5,4,4,2],[12,5,3,3],[6,11,6,1]]];
 const style=theme==='hospital'?'vent':theme==='canal'?'tank':theme==='rail'?'vent':theme==='garden'?'tree':theme==='safe'?'desk':'wall';
 if(i>=23)layouts.push([[5,3,2,5],[10,9,5,2],[6,13,3,1]],[[7,5,4,2],[5,10,2,4],[13,12,3,2]],[[4,6,4,1],[11,5,2,6],[6,13,4,1]],[[6,4,2,3],[12,8,4,2],[5,12,3,2]],[[5,5,3,2],[10,10,4,3],[14,2,2,2]]);
 const entities=layouts[i%layouts.length].map(([x,y,w,h],n)=>prop('structure-'+n,x,y,style,w,h));
 const label=pair(...taskWords[requires]);
 const briefing=pair(intro,deIntro),hint=pair(safe?'Meet both contacts, then reach the marked departure point.':'Search the marked supply cache. Prepare the required equipment in Crafting, complete the first task, then hold the transmission point. You can step away and return; progress is kept.',safe?'Sprich mit beiden Kontakten und erreiche dann den markierten Ausgang.':'Durchsuche das markierte Vorratslager. Bereite die Ausrüstung unter Herstellen vor, erledige die erste Aufgabe und halte dann den Sendepunkt. Du kannst weggehen und zurückkehren; der Fortschritt bleibt erhalten.');
 entities.push({id:'story-a',...point(3,3),type:safe?'npc':'mission',name:label,desc:pair(reveal,deReveal),requires:requires==='none'?null:requires,keepRequired:['axe','toolbox'].includes(requires)});
 const transmission=pair(safe?'Hear the next lead':'Transmit the findings',safe?'Die nächste Spur erfahren':'Ergebnisse übermitteln');
 entities.push({id:'story-b',...point(17,4),type:safe?'npc':'mission',name:transmission,desc:pair(result,deResult),prerequisite:'story-a',duration:safe?0:8+Math.min(4,Math.floor((i%30)/6))*2});
 const exitName=pair([22,52,82].includes(i)?'Rest with Koda':'Continue the journey',[22,52,82].includes(i)?'Mit Koda ausruhen':'Die Reise fortsetzen');
 entities.push({id:'story-exit',...point(17,16),type:'exit',name:exitName,desc:pair('Complete the chapter tasks before leaving.','Erledige vor dem Aufbruch die Kapitelaufgaben.'),solid:false});
 const ingredients=requires==='fuse'?['scrap','toolbox']:requires==='samplecase'?['scrap','bottle','toolbox']:requires==='axe'?['crowbar','scrap','toolbox']:requires==='none'?[]:[requires];
 entities.push({id:'story-supplies',...point(3,11),type:'container',solid:true,name:pair('Mission supply cache','Missionsvorräte'),desc:pair('Materials for this chapter. Take only what you need; tools and duplicate equipment add weight.','Material für dieses Kapitel. Nimm nur, was du brauchst; Werkzeug und doppelte Ausrüstung wiegen zusätzlich.'),contents:[...ingredients,...(i===0||safe?['vest','helmet']:[]),'medkit','medkit','ration','bottle']});
 entities.push({id:'story-aid',...point(17,12),type:'container',solid:true,name:pair('Emergency supplies','Notvorräte'),desc:pair('Bandages for Mara and food for Koda.','Verbände für Mara und Futter für Koda.'),contents:['medkit','medkit','ration','bottle']});
 // Three to five enemies, finite and separated from the entry and supply cache.
 const zombies=safe?[]:[[10,3],[17,8],[10,15],[15,15],[3,7]].slice(0,3+Math.floor(i/9)).map(([x,y],n)=>({id:'infected-'+n,...point(x,y),hp:76,maxHp:76,type:'zombie',attack:0,hurt:0,repath:0,path:[],home:point(x,y),alert:false}));
 for(const z of zombies){while(entities.some(e=>e.solid&&z.x>=e.x&&z.x<e.x+(e.w||1)&&z.y>=e.y&&z.y<e.y+(e.h||1))){z.y++;}z.home={x:z.x,y:z.y};}
 const tag=i>=53?pair('CAMPAIGN III · WHAT WE CARRY','KAMPAGNE III · WAS WIR MIT UNS TRAGEN'):i>=23?pair('CAMPAIGN II · ECHOES BEYOND HAVEN','KAMPAGNE II · ECHOS JENSEITS VON HAVEN'):i<5?pair('ACT II · THE MISSING','AKT II · DIE VERMISSTEN'):i<11?pair('ACT III · THE SOURCE','AKT III · DER URSPRUNG'):i<17?pair('ACT IV · THE RECORD','AKT IV · DIE AKTEN'):pair('ACT V · THE MORNING','AKT V · DER MORGEN');
 return {name:pair(name,deName),place:pair(name.toUpperCase(),deName.toUpperCase()),tag,weather:pair(safe?'DAWN · 12 °C':theme==='hospital'?'INDOORS · 14 °C':'MIST · 9 °C',safe?'MORGENGRAUEN · 12 °C':theme==='hospital'?'INNENRAUM · 14 °C':'NEBEL · 9 °C'),intro:briefing,hint,size:[21,19],start:point(3,16),goals:[label,transmission,exitName],entities,zombies,theme,safe,storyChapter:true,recipe:['fuse','samplecase','axe'].includes(requires)?requires:null};
});}
