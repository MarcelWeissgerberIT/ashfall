import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/postcss';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const base=process.env.PAGES_BASE_PATH||'/ashfall/';
export default defineConfig({
 root:root+'static-entry',base,publicDir:root+'public',
 resolve:{alias:{'@':root,'next/dynamic':root+'static-entry/dynamic.tsx'}},
 css:{postcss:{plugins:[tailwindcss()]}},
 plugins:[{name:'ashfall-pages-assets',enforce:'pre',transform(code,id){if(id.startsWith(root+'app/')&&/\.(tsx?|m?js)$/.test(id))return code.replace(/(['"`(])\/(images|audio|video)\//g,(_,quote,folder)=>quote+base+folder+'/');}}],
 build:{outDir:root+'dist-pages',emptyOutDir:true}
});
