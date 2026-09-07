# ASHFALL — Dead Sector

An isometric survival game with three connected, playable sectors: the Checkpoint, Station Zero, and the evacuation rooftop. Three.js renders the world; a separate simulation handles navigation, inventory, combat, and mission gates.

## Play

Start **Guided tutorial** in sector one to learn through eight practical exercises. Instructions pause the world; the first three exercises also keep enemies still. Real actions advance the guide, including actions completed out of order. Skip the tutorial at any time, or choose **Play without tutorial**. Later sectors play normally.

- Click or tap open ground to move. Click items, containers, devices, doors, or enemies to approach and interact.
- Wheel or pinch to zoom. Right/middle-drag or one-finger drag to pan. Focused map: `+`, `−`, `0`.
- `I` or `1`: equipment workbench. Drag an item onto Hand, Body, or Head to equip it. Touchscreens use the grip in an item’s corner. Selecting an item also exposes Equip, Use, Store, and Drop buttons. Capacity: 14 kg, including equipped items. Rotate Mara’s live preview to inspect her clothing and gear.
- Cars, crates, bedside storage, and desk drawers can be searched. Opening storage pauses the world and shows its real contents; Take or drag items into the backpack, or choose Take all that fits. Leftovers stay in the compartment. Drag carried items into the container to store them.
- The main game fits the viewport. Mission details, radio controls, tutorial explanations, and equipment open in modals. Scrollable modal areas show a scrollbar and clickable “Scroll for more” cues when more content is available.
- Hand: crowbar (38 damage / 0.7s), fire axe (54 / 1s), bottle, or bare hands (19 / 0.7s).
- Body: reinforced jacket (15% reduction) or protective vest (30%). Head: patrol helmet (15%). Worn protection combines multiplicatively.
- `2`: Bandage. `3`: ready a bottle, then click open ground within nine tiles. `Shift`: toggle Sneak. `Space`: pause.
- Audio starts from the first mission-start click. Mute in the header or radio panel. Replay voiced calls, read transcripts, and adjust music and voice independently in the radio panel.

Equipment and supplies carry between sectors. Restart restores the inventory, equipment, and health recorded at sector entry. A new campaign resets everything. Progress lasts for the current page session.

## Development and verification

Node.js >= 22.13.0. Install with `npm install`, then `npm run dev`. `npm run build` creates the Sites output.

- `node scripts/check-game.mjs`: two full campaigns, navigation, puzzles, health, carrying, distraction, inventory, and restart.
- `node scripts/check-tutorial.mjs`: full guided campaign, actual action progression, reading pauses, recovery, optional training, and out-of-order tasks.
- `node --experimental-strip-types scripts/check-camera.mjs`: real event handlers and Three camera projection, including targets placed outside the tutorial card.
- `node --experimental-strip-types scripts/check-world-props.mjs`: geometry, footprints, UVs, batching, and resource reuse.
- `node scripts/check-loot.mjs`: manual searches, reachable vehicle compartments, storage, carrying limits, and drag transfers.
- `node scripts/check-equipment.mjs`: weapon damage, armor, slots, checkpoints, pickups, and tutorial edge cases.
- `node scripts/check-character.mjs`: articulated animation, gear visibility, foot plants, transitions, and pooled resource cleanup without a GPU.
- `node scripts/check-audio.mjs`: radio triggers, MP3 hashes/captions, activation, pause/mute/replay races with a fake audio runtime.
- `npx tsc --noEmit`: TypeScript integration.

Repository-wide `npm run lint` is not clean: it reports strict typing, React mutability, and accessibility rules in game and bundled UI sources. Gameplay checks and the production build run independently.

## Visuals and audio

OpenArt surface atlases, inventory art, portraits, and sector illustrations ship in `public/images/openart`. Sources and prompts are in `art-source`. The new 17-item inventory atlas is in `public/images/loot/items-v2.png`, with its generation prompt in `art-source/items-v2/prompt.txt`. The detailed Mara rig, 17 pickup models, visible container contents, equipment, lighting, weather, and animated poses are code-native. Mara has a weathered red scarf with secondary motion, curved hair strands, blinking eyes, facial detail, and personal equipment. The equipment preview switches between the full outfit and a face close-up. Each sector adds batched architectural dressing: checkpoint drainage and fencing, bunker service pipes and bed rails, and rooftop cable trays and gutters.

The ambient score is composed procedurally with Web Audio: slow minor chords, filtered wind, distant pulses, reverb, and a distinct palette for each sector. Music lowers during radio speech and pauses.

Seven prerecorded English neural radio calls ship in `public/audio/radio`. Credits and full scripts are in `credits.json`; `app/game/radio.mjs` supplies captions. The voice is en-GB-RyanNeural, synthesized through the edge-tts project. Playback requires no speech service, account, or API key. Runtime filtering supplies the radio timbre and static. Transcripts remain available with sound muted.
