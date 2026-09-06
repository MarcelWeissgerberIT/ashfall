// Deterministic atlas extraction and web compression; generation prompts are retained in art-source.
const path = require('node:path');
const fs = require('node:fs/promises');
const sharp = require(process.env.ASHFALL_SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'art-source/openart-v3');
const output = path.join(root, 'public/images/openart');
const surfaces = ['concrete','asphalt','steel','paving'];
const items = ['crowbar','medkit','bottle','fuse','fuel','keycard','sample','battery','scrap','chair','tire','toolbox','ration','mara','zombie','radio'];
(async()=>{
  await fs.mkdir(path.join(output,'icons'),{recursive:true});
  const jobs=[];
  surfaces.forEach((name,i)=>{
    const crop={left:(i%2)*896,top:Math.floor(i/2)*672,width:896,height:672};
    jobs.push(sharp(path.join(source,'materials.png')).extract(crop).webp({quality:88}).toFile(path.join(output,name+'.webp')));
    jobs.push(sharp(path.join(source,'materials.png')).extract(crop).greyscale().blur(.3).webp({quality:80}).toFile(path.join(output,name+'-detail.webp')));
  });
  items.forEach((name,i)=>{
    const portrait=name==='mara'||name==='zombie';
    const crop={left:(i%4)*448,top:portrait?984:Math.floor(i/4)*336,width:448,height:portrait?360:336};
    // Remove a thin lower edge from the chair/tire cell to keep portrait hair out of the item icon.
    if(name==='chair'||name==='tire')crop.height=310;
    jobs.push(sharp(path.join(source,'inventory.png')).extract(crop).resize({width:portrait?448:280}).webp({quality:90}).toFile(path.join(output,'icons',name+'.webp')));
  });
  ['checkpoint','laboratory','rooftop'].forEach((name,i)=>jobs.push(sharp(path.join(source,'sectors.png')).extract({left:0,top:i*448,width:1792,height:448}).webp({quality:90}).toFile(path.join(output,name+'.webp'))));
  await Promise.all(jobs);
  console.log(`Prepared ${jobs.length} optimized images from 3 OpenArt sources.`);
})();
