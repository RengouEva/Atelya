const fs=require('fs');
const path='/home/z/my-project/download/atelier-coupe.html';
const html=fs.readFileSync(path,'utf8');
const m=html.match(/<script>([\s\S]*)<\/script>/);
if(!m){console.log('NO SCRIPT FOUND');process.exit(1)}
const src=m[1];
try{new Function(src);console.log('1) JS SYNTAX OK —',src.length,'chars')}
catch(e){console.log('JS SYNTAX ERROR:',e.message);process.exit(1)}

// Exécution réelle du moteur (sans boot), puis tests fonctionnels
const noBoot=src.replace(/boot\(\);\s*$/,'')+
 '\n;return {MODELS,calc,FABRICS,PREVIEWS,ST,asmPose,asmLayout,boardSVG,pieceCard,uid};';
const elStub=()=>new Proxy(function(){},{
  get:(t,p)=>{ if(p===Symbol.toPrimitive) return ()=>''; return elStub(); },
  set:()=>true, apply:()=>elStub()});
const sandbox={
  console,Math,JSON,localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  window:{matchMedia:()=>({matches:false}),scrollTo:()=>{},addEventListener:()=>{}},
  document:{querySelector:()=>elStub(),querySelectorAll:()=>[],getElementById:()=>null,
    addEventListener:()=>{},createElement:()=>elStub(),
    documentElement:{dataset:{}}},
  location:{}, navigator:{}, requestAnimationFrame:f=>setTimeout(f,0), setTimeout, clearTimeout, setInterval, clearInterval};
sandbox.window.document=sandbox.document;
let api;
try{api=new Function('window','document','localStorage','navigator','requestAnimationFrame','setTimeout','clearTimeout','setInterval','clearInterval',noBoot)
 (sandbox.window,sandbox.document,sandbox.localStorage,sandbox.navigator||{},sandbox.requestAnimationFrame,sandbox.setTimeout,sandbox.clearTimeout,sandbox.setInterval,sandbox.clearInterval);
 console.log('2) MOTEUR EXÉCUTÉ OK — MODELS:',Object.keys(api.MODELS).length,'PREVIEWS:',Object.keys(api.PREVIEWS).length)}
catch(e){console.log('RUNTIME ERROR (chargement):',e.message);console.log(e.stack.split('\n').slice(0,4).join('\n'));process.exit(1)}

const mKeys=Object.keys(api.MODELS).sort().join(',');
const pKeys=Object.keys(api.PREVIEWS).sort().join(',');
if(mKeys!==pKeys){console.log('ERREUR: clés PREVIEWS ≠ MODELS\n',mKeys,'\n',pKeys);process.exit(1)}
console.log('3) CLÉS alignées:',mKeys);

const morphs=[
 {P:92,T:74,H:100,L:58,C:58,W:150,S:1,n:'standard'},
 {P:84,T:66,H:92,L:40,C:55,W:120,S:1,n:'petite'},
 {P:110,T:96,H:118,L:110,C:62,W:280,S:1.5,n:'grande+long'},
 {P:70,T:56,H:82,L:25,C:20,W:90,S:0.5,n:'mini'}
];
let problems=0;
for(const k of Object.keys(api.MODELS)){
 for(const mo of morphs){
  const mm={...mo,L:api.MODELS[k].Ld};
  api.ST.style=k;Object.assign(api.ST.m,mm);api.ST.cut.clear();
  let L;
  try{L=api.calc()}catch(e){console.log('  ✗ calc',k,mo.n,e.message);problems++;continue}
  let bad=[];
  if(!L.pcs.length)bad.push('0 pièces');
  L.pcs.forEach((p,i)=>{if(!isFinite(p.w)||!isFinite(p.h)||p.w<=0||p.h<=0)bad.push('dims pièce'+i+'='+p.w+'x'+p.h)});
  if(!isFinite(L.len)||L.len<=0)bad.push('len='+L.len);
  L.placed.forEach((o,i)=>{if(!isFinite(o.x)||!isFinite(o.y))bad.push('pos'+i)});
  let pv='';try{pv=api.PREVIEWS[k](mm,api.FABRICS[0])}catch(e){bad.push('preview err:'+e.message)}
  if(pv.includes('NaN')||pv.includes('undefined')||!pv.includes('<svg'))bad.push('preview NaN/invalide');
  let bs='';try{bs=api.boardSVG(false)}catch(e){bad.push('board err:'+e.message)}
  if(bs.includes('NaN')||bs.includes('undefined'))bad.push('board NaN');
  let ap='';try{const r=api.asmPose(api.MODELS[k].asm.length);
   r.pos.forEach((q,i)=>{if(!isFinite(q.x)||!isFinite(q.y))bad.push('asm pos'+i)});
   ap=api.asmLayout().W;}catch(e){bad.push('asm err:'+e.message)}
  if(bad.length){problems++;console.log('  ✗',k,'['+mo.n+'] →',bad.join(' | '))}
 }
}
console.log(problems?('4) PROBLÈMES: '+problems):'4) TESTS NUMÉRIQUES OK (12 modèles × 4 morphologies : pièces, plombage, aperçu, plateau, assemblage)');
// Aperçu global du métrage standard
api.ST.style='droite';Object.assign(api.ST.m,{P:92,T:74,H:100,L:58,C:58,W:150,S:1});api.ST.cut.clear();
const L=api.calc();
console.log('   Exemple jupe droite (standard):',L.pcs.length,'types de pièces,',L.tot,'occurrences, métrage ≈',(Math.ceil(L.len/5)*5/100)+' m, laize 150, warns:',L.warns.length);
console.log('DONE');
