const sharp=require('sharp');const fs=require('node:fs/promises');const path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.join(root,'art-source/openart-v5'),out=path.join(root,'public/images/openart/v5');
(async()=>{await fs.mkdir(out,{recursive:true});
for(const [name,file] of Object.entries({concrete:'concrete-gpt',asphalt:'asphalt',tiles:'tiles','car-paint':'car-paint'})){
 const {data,info}=await sharp(path.join(source,file+'.png')).resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const raw={width:info.width,height:info.height,channels:3};
 await sharp(data,{raw}).webp({quality:91}).toFile(path.join(out,name+'.webp'));
 const gray=await sharp(data,{raw}).greyscale().raw().toBuffer();const blur=await sharp(gray,{raw:{width:info.width,height:info.height,channels:1}}).blur(5).raw().toBuffer();
 const detail=Buffer.alloc(gray.length),rough=Buffer.alloc(gray.length);
 for(let i=0;i<gray.length;i++){
  // A conservative high-frequency height estimate; stains do not become deep holes.
  detail[i]=Math.max(0,Math.min(255,128+(gray[i]-blur[i])*1.2));
  const rust=Math.max(0,data[i*3]-data[i*3+2]);
  rough[i]=name==='car-paint'?Math.min(255,155+rust*2):name==='asphalt'?Math.min(255,175+gray[i]*.6):name==='tiles'?Math.min(250,150+(255-gray[i])*.35):240;
 }
 await sharp(detail,{raw:{width:info.width,height:info.height,channels:1}}).webp({quality:88}).toFile(path.join(out,name+'-detail.webp'));
 await sharp(rough,{raw:{width:info.width,height:info.height,channels:1}}).webp({quality:85}).toFile(path.join(out,name+'-roughness.webp'));
 console.log(name,info.width+'x'+info.height);
}})().catch(e=>{console.error(e);process.exitCode=1});
