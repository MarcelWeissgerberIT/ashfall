# Chapter audio expansion

Every chapter now has two authored voiced messages: a mission opening after five seconds of active play, and a personal/background message after 28 seconds. Completing a chapter early adds missing messages to its transcript archive. Existing critical mission calls and memories are retained.

Added 30 mission openings and 20 personal stories, in English and German: 100 new MP3 files. There are now 70 recordings per language, including the ten existing mission/memory recordings. All are included in the PIN-encrypted offline dossier alongside the eleven videos.

The game keeps current-chapter voice messages in order, waits for the active voice to finish, and excludes manual memory entries from automatic playback. Inventory/pause and manual replay retain their existing behavior. Message IDs prevent duplicate story entries across saves.

Sources:
- `app/game/chapter-briefings.json`: openings, current objectives and speaker assignments.
- `app/game/story-calls.json`: personal story scripts for all 30 chapters.
- `public/audio/radio/expansion-credits.json`: voice provider, voice names, exact scripts and file hashes for the new recordings.

English is the primary writing language; German scripts are separately generated speech, not live browser speech synthesis. Voices use the existing Microsoft Edge neural TTS pipeline. Mara, Control/Levin, Imani, Jonas and Ada have assigned voices.
