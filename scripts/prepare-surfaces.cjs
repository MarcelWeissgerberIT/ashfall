// Crop the second OpenArt material collection, preserving originals and provenance.
const path = require('node:path');
const fs = require('node:fs/promises');
const sharp = require(process.env.ASHFALL_SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'art-source/openart-v4');
const output = path.join(root, 'public/images/openart/v4');
const atlases = {
  industrial: ['wood', 'car-paint', 'rubber', 'brushed-steel'],
  bunker: ['tiles', 'vinyl', 'corrugated', 'glass'],
  survival: ['canvas', 'jacket', 'denim', 'bark'],
};
(async () => {
  await fs.mkdir(output, { recursive: true });
  const jobs = [];
  for (const [atlas, names] of Object.entries(atlases)) {
    const image = path.join(source, `${atlas}.png`);
    const { width, height } = await sharp(image).metadata();
    if (width !== 1792 || height !== 1344) throw new Error(`Unexpected atlas dimensions: ${atlas}`);
    names.forEach((name, index) => {
      // Two pixels of inset prevent colour bleed across neighbouring atlas cells.
      const crop = { left: (index % 2) * 896 + 2, top: Math.floor(index / 2) * 672 + 2, width: 892, height: 668 };
      jobs.push(sharp(image).extract(crop).resize(640, 480).webp({ quality: 88 }).toFile(path.join(output, `${name}.webp`)));
      jobs.push(sharp(image).extract(crop).resize(640, 480).greyscale().blur(.3).webp({ quality: 80 }).toFile(path.join(output, `${name}-detail.webp`)));
    });
  }
  await Promise.all(jobs);
  console.log(`Prepared ${jobs.length} material images from 3 OpenArt atlases.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
