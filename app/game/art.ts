/** OpenArt atlases, cropped into individual runtime materials and illustrations. */
export const ART = {
  surfaces: {
    concrete: '/images/openart/concrete.webp',
    asphalt: '/images/openart/asphalt.webp',
    steel: '/images/openart/steel.webp',
    paving: '/images/openart/paving.webp',
    wood: '/images/openart/v4/wood.webp',
    carPaint: '/images/openart/v4/car-paint.webp',
    rubber: '/images/openart/v4/rubber.webp',
    brushedSteel: '/images/openart/v4/brushed-steel.webp',
    tiles: '/images/openart/v4/tiles.webp',
    vinyl: '/images/openart/v4/vinyl.webp',
    corrugated: '/images/openart/v4/corrugated.webp',
    glass: '/images/openart/v4/glass.webp',
    canvas: '/images/openart/v4/canvas.webp',
    jacket: '/images/openart/v4/jacket.webp',
    denim: '/images/openart/v4/denim.webp',
    bark: '/images/openart/v4/bark.webp',
  },
  sectors: [
    { src: '/images/openart/checkpoint.webp', alt: 'Rain-soaked checkpoint with an abandoned bunker gate' },
    { src: '/images/openart/laboratory.webp', alt: 'Abandoned bunker laboratory under cold emergency lighting' },
    { src: '/images/openart/rooftop.webp', alt: 'Evacuation rooftop above the ruined city at dusk' },
  ],
  icons: '/images/openart/icons/',
};
export const ART_CELLS: Record<string, number> = {
  crowbar: 0, medkit: 1, bottle: 2, fuse: 3,
  fuel: 4, keycard: 5, sample: 6, battery: 7,
  scrap: 8, chair: 9, tire: 10, toolbox: 11,
  ration: 12, mara: 13, zombie: 14, radio: 15,
};
