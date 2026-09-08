# ASHFALL asset review — 7 September 2026

Reviewed the material files, render pipeline, pickup meshes, mission meshes and chapter definitions. This was source/asset inspection and geometry validation, not a browser visual playtest.

## Applied in this pass

- Compared the same concrete brief in OpenArt GPT Image 2 and Nano Banana Pro. Selected GPT Image 2: less conspicuous repeated damage, finer grain and a larger delivered source. This is one brief, not a general model ranking.
- GPT Image 2: concrete, asphalt and oxidized vehicle paint. Nano Banana Pro: regular hospital tile grid. Runtime maps are 1536×1152 or 1024×1024 without upscaling, replacing smaller atlas crops.
- Separate conservative high-frequency bump estimates and roughness estimates. These are derived from image pixels, not measured PBR scans. Color stains no longer directly drive all the bump variation in the new materials.
- Distinct antenna stations, laboratory benches, mechanical repair units, barricades and generator cabinets. Their navigation and interaction footprints are unchanged.
- Added the missing Sample carrier pickup mesh, with a reinforced shell, latches, handle and medical marking.

## Highest-value remaining work

1. Mara and infected: proportions, face topology, hands, clothing silhouette and animation deformation need authored/rigged 3D assets. Higher resolution 2D art alone will not repair the current primitive-based characters. Keep the established chestnut hair, teal jacket, rust scarf and Koda identity across references.
2. Chapter identity: the 23 added chapters share five layout families and many structures. Distinct landmarks and prop sets (Mercy reception, shelter kennels, Aster filter drums, observatory dome) would produce more atmosphere than increasing every texture to 4K.
3. Vehicle silhouette: crumpled panels, interior parts, missing doors and different body types matter more than adding further rust detail.
4. Cinematic continuity: reuse approved Mara/Koda subject references in an element-to-video workflow, rather than independently describing them for every new shot.

## Model use

For this material batch GPT Image 2 supplied the better concrete candidate. Nano Banana Pro supplied usable regular tiles. Use controlled same-prompt comparisons and inspect actual resolution; a model's maximum advertised resolution is not the CLI default. Existing Kling 3 Omni video generation remains useful for cutscenes; changing the video model cannot improve the realtime game meshes.

Generation IDs and exact prompts: art-source/openart-v5/jobs.json. Rebuild processed materials with scripts/prepare-materials-v5.cjs. Geometry checks include the five mission variants and all collectible meshes.

## 8 September — realtime models and animation

- Extended Mara's existing sculpted face/IK rig with lower eyelids, contoured sleeves and shoulder folds. Preserved equipment articulation and existing braid/scarf motion.
- Infected now have contoured coats, asymmetric backs, articulated jaws and three differentiated outfits matching shambler/runner/stalker variants. Rigid detail is batched within joints.
- Koda has two-bone legs, level paws, speed-based trot/bound blending, damped turns, ear/tail follow-through, sniff/feed and play-bow transitions, and a defensive lunge. Care preview uses the same rig as the game. These are procedural animations, not motion capture.
- First major structure in each of the 23 extension chapters uses a theme-specific landmark: clinic, observatory, filter plant, canopy/garden, rail shelter or street frontage. Existing footprints and routes are retained; these are seven landmark families, not 23 bespoke buildings.
- Validated finite animation transforms, pawn clearance, equipment articulation, resource cleanup, 23 landmark footprints and campaign traversal with source-level tests. No browser visual playtest.
- Updated an obsolete armor-test expectation from the former 7-damage enemy to the existing 8-damage shambler, explicitly fixing the fixture's enemy kind. Combat code was unchanged.
