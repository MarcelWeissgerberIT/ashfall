import storyCalls from './story-calls.json' with {type:'json'};
/** @type {Record<string, {title:string,text:string,duration?:number}>} */
export const RADIO = {
  "bunker": {
    "title": "Recover Sample N-04",
    "text": "Control to Mara. Welcome to Station Zero. Find the keycard in the western maintenance locker. Open the laboratory, recover Sample N-04, and take it to the rooftop elevator. Do not leave the sample behind.",
    "duration": 17.664
  },
  "rescue": {
    "title": "Control, out",
    "text": "Mara, you are clear. Sample N-04 is secure. We are leaving the city behind. You made it. Control, out.",
    "duration": 12.72
  },
  "checkpoint": {
    "title": "A way beneath the city",
    "text": "Mara, this is Control. Station Zero lies beneath the checkpoint. Find a fuse in the guard crate, and fuel in the car trunk. Restore generator power, then enter the bunker. Keep your profile low.",
    "duration": 17.16
  },
  "evac-ready": {
    "title": "Move to the landing zone",
    "text": "Mara, evacuation is ready. Reach the marked landing zone with Sample N-04. Move now. This is your way out.",
    "duration": 11.808
  },
  "generator": {
    "title": "Bunker gate unlocked",
    "text": "Control to Mara. The generator is online. Bunker gate unlocked. Proceed inside, and stay alert.",
    "duration": 10.464
  },
  "rooftop": {
    "title": "The last frequency",
    "text": "Mara, we have your position. Find the battery in rooftop storage, then power the longwave transmitter. Send your signal and hold out for 35 seconds. Keep Sample N-04 with you.",
    "duration": 15.768
  },
  "signal": {
    "title": "Hold for evacuation",
    "text": "Signal received, Mara. Evacuation in 35 seconds. The noise will draw them in. Keep moving. We are coming for you.",
    "duration": 12.912
  },
  "memory-checkpoint": {
    "title": "Before the silence",
    "text": "Before the outbreak, I repaired the emergency radios for this district. Three nights ago I heard scratching inside an abandoned ambulance. Koda was hiding under the seat, still wearing a collar much too big for him. I promised him we would leave this city together."
  },
  "memory-bunker": {
    "title": "A familiar corridor",
    "text": "I used to service the backup radio down here. My sister Lena worked in the laboratory. Her last message mentioned Sample N-04 and then the signal went dead. I do not know if she got out. Koda stays close whenever I stop at a door. Somehow that makes it easier to keep going."
  },
  "memory-rooftop": {
    "title": "A promise to keep",
    "text": "Lena always said a working radio means someone can still find you. I kept her old frequency in my notebook. If the helicopter comes, there has to be room for Koda too. After this, I want him to know grass, sunlight, and a morning without sirens."
  }
};

for(const call of storyCalls)RADIO[call.id]={title:call.title,text:call.text};
