# ASHFALL trilogy

Three playable campaigns of 30 levels each. Global indices remain stable: the original campaign is levels 1–30; campaign 2 is 31–60; campaign 3 is 61–90. Existing inventory, equipment, Koda, crafting, storage and recording systems continue across the boundaries.

- Campaign 1: **The Last Way Out** — the city escape, Haven, Aster's records, Jonas's rescue and contact with Lena. Its ending and existing films remain intact.
- Campaign 2: **Echoes Beyond Haven** — reaching Lena, tracing the parents' evacuation route, and taking the family search beyond Haven.
- Campaign 3: **What We Carry** — verified answers to the remaining family search and an ending built around community, remembrance and home.

The 60 new authored level records live in `app/game/trilogy-chapters.json`, with English and German story beats. Their deterministic maps use the existing rendering, pathfinding, inventory and interaction mechanics, across street, railway, clinic, garden, canal, industrial, rooftop and safe-zone settings. Later maps have additional layouts. Safe and family-only chapters have no enemies. Field chapters have finite enemies, supplies and bounded hold tasks. These are playable extensions of the existing mechanics, not separate new engines.

Each new level has an opening voice recording and a voiced field report. Field reports unlock only after its objectives, avoiding premature plot disclosures. Both languages use the established neural TTS pipeline; scripts, speaker assignment and file hashes are in `public/audio/radio/trilogy-credits.json`.

Films play after each third level. Campaigns 2 and 3 each add nine 15-second OpenArt short films and a three-part 45-second finale, assembled into one MP4. Played films stay in the shared archive. The campaign 3 finale returns to the final victory screen; earlier finales continue the journey. Film prompts and OpenArt generation provenance live under `art-source/trilogy/`.

Save/Load provides a campaign selector and a level selector for prepared starts. Old won-state saves below level 90 migrate to a completed chapter, allowing continuation. The private PIN-encrypted dossier contains all 90 isometric maps, walkthroughs, complete story, bilingual audio and films; compact embedded media keeps the download offline-capable. Its plaintext and PIN are excluded from Git.

Validation includes sequential gameplay through all generated chapters, crafting, collision/path reachability, combat survival, mission gates, saved work timers, 90 prepared saves, audio sequencing, spoiler gates and legacy campaign continuation.
