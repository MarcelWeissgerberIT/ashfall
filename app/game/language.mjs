export function detectLanguage(saved,languages=[]){
 if(saved==='de'||saved==='en')return saved;
 for(const value of languages){const code=String(value).toLowerCase().split('-')[0];if(code==='de'||code==='en')return code;}
 return 'en';
}
