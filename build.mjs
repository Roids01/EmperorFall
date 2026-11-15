// Small Crown build: joins src/ into the playable game.
//   src/head.html, src/style.css, src/body.html   page shell
//   src/game/*.js                                 the game, in order; joined back into one script
//   src/i18n-es.js                                Spanish text, its own file
//   src/ink/*.ink                                 court audiences, compiled to data/*.json
// Outputs
//   index.html, game.js, i18n-es.js, data/        the web build (Netlify serves the repo root)
//   dist/artifact.html (+ copies of the assets)   the claude.ai artifact page
//   dist/dev.html                                 one unminified file, used by the tests
import fs from 'node:fs'; import path from 'node:path'; import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), esbuild=require('esbuild'), inkjs=require('inkjs/full');
const R=path.dirname(new URL(import.meta.url).pathname), rd=f=>fs.readFileSync(path.join(R,f),'utf8'), wr=(f,s)=>{ fs.mkdirSync(path.dirname(path.join(R,f)),{recursive:true}); fs.writeFileSync(path.join(R,f),s); };
const head=rd('src/head.html'), css=rd('src/style.css'), body=rd('src/body.html'), es=rd('src/i18n-es.js');
const parts=fs.readdirSync(path.join(R,'src/game')).filter(f=>f.endsWith('.js')).sort();
const game=parts.map(f=>rd('src/game/'+f)).join('');
// compile the Ink stories
const ink={};
for(const f of fs.readdirSync(path.join(R,'src/ink')).filter(f=>f.endsWith('.ink'))){ const l=f.match(/_(\w+)\.ink$/)[1], errs=[];
  const st=new inkjs.Compiler(rd('src/ink/'+f),new inkjs.CompilerOptions(null,[],false,(m,t)=>{ if(t===2||/ERROR/.test(m)) errs.push(m); })).Compile();
  if(!st||errs.length){ console.error(`Ink errors in ${f}:\n`+errs.join('\n')); process.exit(1); } ink[l]=st.ToJson(); }
// syntax check the joined game before minifying
const min=await esbuild.transform(game,{minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,legalComments:'none',target:'es2020'});
const esMin=(await esbuild.transform(es,{minify:true})).code;
const cssMin=(await esbuild.transform(css,{loader:'css',minify:true})).code;
const banner='/* Small Crown. Source: src/game/*.js in https://github.com/Roids01/EmperorFall. Built by build.mjs. */\n';
const pwaHead=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="A minimalist kingdom build-and-defend game in a low-poly desert canyon.">
<meta name="pwa" content="1">
<meta name="theme-color" content="#1C1714">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style>
`;
const shell=(styleTag,scripts)=>head+'<script src="i18n-es.js"></script>\n'+styleTag+body+scripts;
// web build at the repo root
wr('index.html',pwaHead+shell(`<style>${cssMin}</style>`,'').replace(/(<main>)/,'</head>\n<body>\n$1')+'<script src="game.js"></script>\n</body>\n</html>\n');
wr('game.js',banner+min.code); wr('i18n-es.js',esMin);
for(const l in ink) wr(`data/court_${l}.json`,ink[l]);
// artifact page: same files beside it
wr('dist/artifact.html',shell(`<style>${cssMin}</style>`,'<script src="game.js"></script>\n'));
for(const f of ['game.js','i18n-es.js',...Object.keys(ink).map(l=>`data/court_${l}.json`)]) wr('dist/'+f,rd(f));
// dev single file for tests: unminified, everything inline
if(process.argv.includes('--dev')||true){
  const inkInline=`<script>window.SC_INK={${Object.entries(ink).map(([l,j])=>`${l}:${j}`).join(',')}};</script>\n`;
  wr('dist/dev.html',head.replace('<script src="i18n-es.js"></script>','')+`<script>${es}</script>\n`+inkInline+`<style>${css}</style>`+body+`<script>${game}</script>`);
}
const kb=f=>(fs.statSync(path.join(R,f)).size/1024).toFixed(0)+' KB';
console.log(`built: index.html ${kb('index.html')}, game.js ${kb('game.js')} (source ${(game.length/1024).toFixed(0)} KB in ${parts.length} files), i18n-es.js ${kb('i18n-es.js')}, ink ${Object.keys(ink).join('/')}`);
