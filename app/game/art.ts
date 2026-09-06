/** OpenArt assets prepared from three generation atlases. */
export const ART = {
  surfaces: {
    concrete: '/images/openart/concrete.webp',
    asphalt: '/images/openart/asphalt.webp',
    steel: '/images/openart/steel.webp',
    paving: '/images/openart/paving.webp',
  },
  sectors: [
    { src: '/images/openart/checkpoint.webp', alt: 'Regennasser Kontrollpunkt mit verlassenem Bunkertor' },
    { src: '/images/openart/laboratory.webp', alt: 'Verlassenes Bunkerlabor unter kaltem Notlicht' },
    { src: '/images/openart/rooftop.webp', alt: 'Evakuierungsdach über der zerstörten Stadt im Abendlicht' },
  ],
  icons: '/images/openart/icons/',
};
export const ART_CELLS: Record<string, number> = {
  crowbar: 0, medkit: 1, bottle: 2, fuse: 3,
  fuel: 4, keycard: 5, sample: 6, battery: 7,
  scrap: 8, chair: 9, tire: 10, toolbox: 11,
  ration: 12, mara: 13, zombie: 14, radio: 15,
};
