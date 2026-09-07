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
