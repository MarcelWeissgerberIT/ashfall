# ASHFALL — Dead Sector

An isometric survival game with three connected, playable sectors: the Checkpoint, Station Zero, and the evacuation rooftop. Three.js renders the world; a separate simulation handles navigation, inventory, combat, and mission gates.

## Play

Start **Guided tutorial** in sector one to learn through eight practical exercises. Instructions pause the world; the first three exercises also keep enemies still. Real actions advance the guide, including actions completed out of order. Skip the tutorial at any time, or choose **Play without tutorial**. Later sectors play normally.

- Click or tap open ground to move. Click items, containers, devices, doors, or enemies to approach and interact.
- Wheel or pinch to zoom. Right/middle-drag or one-finger drag to pan. Focused map: `+`, `−`, `0`.
- `I` or `1`: backpack and loadout. Select a carried item to equip, wear, use, or drop it. Capacity: 14 kg, including equipped items.
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
- `node scripts/check-equipment.mjs`: weapon damage, armor, slots, checkpoints, pickups, and tutorial edge cases.
- `node scripts/check-character.mjs`: articulated animation, gear visibility, foot plants, transitions, and pooled resource cleanup without a GPU.
- `node scripts/check-audio.mjs`: radio triggers, MP3 hashes/captions, activation, pause/mute/replay races with a fake audio runtime.
- `npx tsc --noEmit`: TypeScript integration.

## Visuals and audio

OpenArt surface atlases, inventory art, portraits, and sector illustrations ship in `public/images/openart`. Sources and prompts are in `art-source`. The 3D character rig, equipment, lighting, weather, and animated poses are code-native.

The ambient score is composed procedurally with Web Audio: slow minor chords, filtered wind, distant pulses, reverb, and a distinct palette for each sector. Music lowers during radio speech and pauses.

Seven prerecorded English neural radio calls ship in `public/audio/radio`. Credits and full scripts are in `credits.json`; `app/game/radio.mjs` supplies captions. The voice is en-GB-RyanNeural, synthesized through the edge-tts project. Playback requires no speech service, account, or API key. Runtime filtering supplies the radio timbre and static. Transcripts remain available with sound muted.
