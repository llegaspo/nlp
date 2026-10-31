// Optional DOM integration checks; run against a fresh production build.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require(process.env.NLP_TEST_DOM_MODULE || 'jsdom');
const root=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const {lessons}=await import(root+'/src/data/course.ts');
const files=await readdir(root+'/dist/assets');
const js=await readFile(root+'/dist/assets/'+files.find(f=>/^index-.*\.js$/.test(f)),'utf8');
const html=await readFile(root+'/dist/index.html','utf8');
const themeInit=html.match(/<script id="theme-init">([\s\S]*?)<\/script>/)[1];
const errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',(...args)=>errors.push(args.join(' ')));
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://nlp.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const {window:w}=dom;w.structuredClone=structuredClone;w.scrollTo=()=>{};
w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
w.eval(js);
const tick=()=>new Promise(r=>setTimeout(r,40));
const $=s=>w.document.querySelector(s);
const $$=s=>[...w.document.querySelectorAll(s)];
const visible=e=>e&&!e.closest('[hidden]');
const button=(text,root=w.document)=>[...root.querySelectorAll('button')].find(e=>visible(e)&&e.textContent.includes(text));
const click=async e=>{assert.ok(e,'click target exists');e.click();await tick();};
const route=async id=>{w.location.hash=id;await tick();await tick();};
const setValue=async (el,value)=>{const proto=el instanceof w.HTMLSelectElement?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,String(value));el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();};
await tick();await tick();
assert.equal(w.document.documentElement.dataset.theme,'dark');
assert.equal($('.theme-toggle').getAttribute('aria-label'),'Switch to light mode');
await click($('.theme-toggle'));
assert.equal(w.document.documentElement.dataset.theme,'light');
assert.equal(w.localStorage.getItem('nlp-visual-lab.theme'),'light');
await click($('.theme-toggle'));
assert.equal(w.document.documentElement.dataset.theme,'dark');
assert.match($('h1').textContent,/Make sense/);
assert.equal($$('.chapter-lessons>a').length,lessons.length);
const before=$('.preview-predictions').textContent;
await click(button('dog',$('.preview-token-select')));
assert.notEqual($('.preview-predictions').textContent,before);
console.log('Home and live probability preview passed.');
for(const lesson of lessons){
 await route(lesson.id);
 assert.equal($('h1').textContent,lesson.title);
 assert.ok(!$('#panel-learn').hidden);
 await click($('#tab-experiment'));
 assert.ok(!$('#panel-experiment').hidden);
 assert.ok($('#panel-experiment').textContent.length>200);
 await click($('#tab-practice'));
 for(let i=0;i<lesson.questions.length;i++){
   const q=lesson.questions[i];
   await click($$('.quiz-card')[i].querySelectorAll('.quiz-options button')[(q.correct+1)%q.options.length]);
   assert.ok($$('.quiz-card')[i].querySelector('.answer-feedback.retry'));
   await click($$('.quiz-card')[i].querySelectorAll('.quiz-options button')[q.correct]);
 }
 assert.ok($('.lesson-complete'),lesson.id+' completes');
}
assert.equal(JSON.parse(w.localStorage.getItem('nlp-visual-lab.progress.v2')).answers.masked[1],2);
await route('home');assert.match($('.journey-progress').textContent,/13 \/ 13/);
console.log('All 13 lessons render; 26 questions, feedback, completion, and saved progress passed.');
await route('attention');await click($('#tab-experiment'));
assert.equal($$('.attention-matrix button').length,36);
await click($('input[type=checkbox]'));
assert.equal($$('.attention-matrix button').filter(e=>e.textContent==='—').length,15);
const attentionBefore=$('.attention-matrix').textContent;
await click(button('Head 2'));assert.notEqual($('.attention-matrix').textContent,attentionBefore);
await click(button('02 Position'));await setValue($('#position-slider'),8);assert.match($('.position-values').textContent,/0.989/);
await click(button('03 Architecture'));await click(button('Encoder–decoder'));assert.ok(button('Cross-attention'));
console.log('Attention masking, projections, positions, and architecture controls passed.');
await route('masked');await click($('#tab-experiment'));
assert.equal($$('.masked-token-stream button.target').length,3);
await setValue($('#masked-probability'),0.9);assert.match($('#panel-experiment').textContent,/−ln\(0.9\)/);
await click(button('Keep original'));assert.equal($$('.masked-token-stream button')[2].querySelector('strong').textContent,'cat');
for(const e of $$('.masked-token-stream button.target'))await click(e);
assert.match($('#panel-experiment').textContent,/No selected targets/);
await click(button('Reset to 3 targets'));
assert.equal($$('.masked-token-stream button.target').length,3);
console.log('BERT target selection, unchanged-token loss, probability editing, and reset passed.');
await route('llms');await click($('#tab-experiment'));await setValue($('#decode-topk'),1);
assert.equal($$('.probability-row strong').filter(e=>e.textContent==='1').length,1);
await click(button('Generate next token'));assert.equal($$('.generated-sequence>span').length,2);
await click(button('Undo'));assert.equal($$('.generated-sequence>span').length,1);
console.log('Generation, top-k, and undo passed.');
await route('embeddings');await click($('#tab-experiment'));await click(button('Train 20'));assert.match($('.plot-caption').textContent,/Step 20/);
await click(button('Play'));await click($('#tab-learn'));const step=$('.plot-caption').textContent;await new Promise(r=>setTimeout(r,400));assert.equal($('.plot-caption').textContent,step);
console.log('Embedding training and pause when leaving experiment passed.');
await route('tokens');await click($('#tab-experiment'));
for(const name of ['02 Normalize','03 Morphemes','04 Subwords','05 Compare','01 Token stream']){await click(button(name));assert.ok($('#panel-experiment').textContent.length>500);}
await route('glossary');await setValue($('.glossary-search input'),'causal');assert.equal($$('.glossary-entry').length,1);
await setValue($('.glossary-search input'),'nosuchterm');assert.equal($$('.glossary-entry').length,0);assert.ok($('.empty-state'));
await click($('.header-search'));await setValue($('#lesson-search'),'BERT');assert.ok($('.search-results').textContent.includes('BERT & masked language'));
await route('tokens');await click($('#tab-experiment'));await click(button('01 Token stream'));
await route('edit-distance');await click($('#tab-experiment'));await setValue($('#edit-source'),'cat');await setValue($('#edit-target'),'cut');await click(button('Fill all'));assert.equal($('.stat strong').textContent,'1');
await route('responsible');await click($('#tab-experiment'));await setValue($('#benchmark-mixture'),50);assert.equal($('.stat strong').textContent,'72.5%');
await route('not-a-lesson');assert.match($('h1').textContent,/isn’t here/);
assert.deepEqual(errors,[]);
console.log('Token subtopics, glossary, lesson search, invalid routes passed. No runtime errors.');
const persisted=w.localStorage.getItem('nlp-visual-lab.progress.v2');

const cafe=JSON.parse(await readFile(root+'/src/data/cafeExercise.json','utf8'));
await route('exercises');
assert.match($('h1').textContent,/A tiny café/);
assert.match(w.document.title,/Build a café autocomplete/);
assert.equal($('.sidebar-resources a[href="#exercises"]').getAttribute('aria-current'),'page');
assert.equal($$('.mission-nav button').length,5);
assert.equal($('.setup-code pre code').textContent,cafe.setup.trimEnd());
await click(button('Jupyter',$('.exercise-setup')));
assert.match($('.notebook-instructions').textContent,/Python 3 kernel/);
await click(button('Google Colab',$('.exercise-setup')));
assert.ok($('.notebook-instructions a[href="https://colab.research.google.com/"]'));
await click(button('A little nudge?'));
assert.equal($$('.mission-hints p').length,1);
await click(button('One more hint'));
assert.equal($$('.mission-hints p').length,2);
await setValue($('#cafe-token-input'),'Tea? TEA! Cake.');
assert.equal($$('.cafe-token-stream>span').length,3);
assert.match($('.cafe-preview-result').textContent,/3 token instances.*2 distinct types/);
await setValue($('#cafe-token-input'),'123!');
assert.equal($$('.cafe-token-stream>span').length,0);
assert.ok(button('Check my prediction').disabled);
await click($$('.checkpoint-options button')[2]);
await click(button('Check my prediction'));
assert.ok($('.mission-checkpoint .answer-feedback.retry'));
assert.equal($('.mission-progress [role="progressbar"]').getAttribute('aria-valuenow'),'0');

let copied;
Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
for(let i=0;i<cafe.steps.length;i++) {
 await click($$('.mission-nav button')[i]);
 const mission=cafe.steps[i];
 assert.equal($('#cafe-mission-title').textContent,mission.title);
 assert.equal($('.cafe-code-workspace pre code').textContent,mission.starter.trimEnd());
 await click(button('Worked version',$('.mission-code-toolbar')));
 assert.equal($('.cafe-code-workspace pre code').textContent,mission.solution.trimEnd());
 assert.equal($('.cafe-code-workspace .expected-output pre').textContent,mission.output);
 await click($('.cafe-code-workspace .code-copy'));
 assert.equal(copied,mission.solution);
 assert.match($('.cafe-code-workspace .copy-status').textContent,/Code copied/);
 if(i===1) {
  await setValue($('#cafe-history'),'would');
  assert.equal($('.probability-row.is-selected strong').textContent,'0');
  assert.equal($$('.probability-row').find(e=>e.querySelector('span').textContent==='like').querySelector('strong').textContent,'5');
 }
 if(i===3) {
  assert.equal($('.cafe-feature-number strong').textContent,'0.1');
  await setValue($('#cafe-smoothing-k'),0);
  assert.equal($('.cafe-feature-number strong').textContent,'0');
 }
 if(i===4) {
  assert.equal($$('.cafe-score .stat strong')[1].textContent,'5.8');
  assert.equal($$('.cafe-prediction-trace>div').length,5);
  await setValue($('#cafe-eval-k'),0);
  assert.equal($$('.cafe-score .stat strong')[1].textContent,'∞');
  await setValue($('#cafe-test-input'),'i would like cake');
  assert.notEqual($$('.cafe-score .stat strong')[1].textContent,'∞');
  await setValue($('#cafe-eval-k'),1);
  await setValue($('#cafe-test-input'),'we would like espresso');
  assert.equal($$('.cafe-score .stat strong')[1].textContent,'∞');
  assert.match($('.cafe-preview .callout').textContent,/espresso/);
 }
 await click($$('.checkpoint-options button')[mission.correct]);
 await click(button('Check my prediction'));
 assert.ok($('.mission-checkpoint .answer-feedback.correct'));
 assert.equal($('.mission-progress [role="progressbar"]').getAttribute('aria-valuenow'),String(i+1));
}
assert.ok($('.cafe-finished'));
await setValue($('#cafe-eval-k'),0);
await setValue($('#cafe-test-input'),'espresso tea');
assert.match($('.cafe-prediction-trace').textContent,/undefinedhistory has no counts/);
await setValue($('#cafe-test-input'),'we like tea');
assert.match($('.cafe-preview .callout').textContent,/appears in training/);
assert.equal(w.localStorage.getItem('nlp-visual-lab.progress.v2'),persisted,'Exercise progress does not change lesson progress');
Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:undefined});
await click($('.cafe-code-workspace .code-copy'));
assert.match($('.cafe-code-workspace .copy-status').textContent,/Code selected/);
assert.equal(w.getSelection().toString(),cafe.steps[4].solution.trimEnd());
const cafeProgress=w.localStorage.getItem('nlp-visual-lab.cafe.v1');
await route('home');
assert.ok($('.home-exercise a[href="#exercises"]'));
await route('exercises');
assert.equal($('#cafe-mission-title').textContent,cafe.steps[4].title);
assert.ok($('.cafe-finished'));
await click($$('.mission-nav button')[0]);
await click(button('Next mission'));
assert.equal($('#cafe-mission-title').textContent,cafe.steps[1].title);
assert.equal(w.document.activeElement.id,'cafe-mission-title');
assert.deepEqual(errors,[]);
console.log('Exercise navigation, code copying and fallback, hints, live previews, checkpoints, and independent progress passed.');
w.close();

for(const stored of [cafeProgress,'{invalid',JSON.stringify({stage:999,completed:['tokens','tokens','invented']}),'storage-blocked']) {
 const fresh=new JSDOM('<div id="root"></div>',{url:'https://nlp.test/#exercises',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const win=fresh.window;
 if(stored==='storage-blocked')Object.defineProperty(win,'localStorage',{get(){throw new Error('Storage is disabled');}});
 else win.localStorage.setItem('nlp-visual-lab.cafe.v1',stored);
 win.eval(js);await tick();await tick();
 const doc=win.document;
 assert.match(doc.querySelector('h1').textContent,/A tiny café/);
 const expected=stored===cafeProgress?5:stored.includes('invented')?1:0;
 assert.equal(doc.querySelector('.mission-progress [role="progressbar"]').getAttribute('aria-valuenow'),String(expected));
 assert.equal(doc.querySelector('#cafe-mission-title').textContent,cafe.steps[stored===cafeProgress?4:0].title);
 if(stored==='storage-blocked')assert.match(doc.querySelector('.mission-progress').textContent,/Progress lasts this visit/);
 win.close();
}
assert.deepEqual(errors,[]);
console.log('Exercise reload, malformed progress, deduplication, and unavailable storage passed.');
for (const stored of [persisted, '{invalid json', JSON.stringify({answers:{intro:[null,99]},lastLesson:'unknown'})]) {
 const fresh=new JSDOM('<div id="root"></div>',{url:'https://nlp.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 fresh.window.structuredClone=structuredClone;
 fresh.window.localStorage.setItem('nlp-visual-lab.progress.v2',stored);
 fresh.window.eval(js);await tick();await tick();
 assert.ok(fresh.window.document.querySelector('h1'));
 if(stored===persisted)assert.match(fresh.window.document.querySelector('.journey-progress').textContent,/13 \/ 13/);
 else assert.match(fresh.window.document.querySelector('.journey-progress').textContent,/0 \/ 13/);
 fresh.window.close();
}
assert.deepEqual(errors,[]);
console.log('Reload persistence and corrupt-storage recovery passed.');

// Check startup before React runs, reload preferences, and unavailable storage.
for (const storedTheme of [null, 'light', 'dark', 'invalid', 'storage-blocked']) {
 const fresh=new JSDOM('<head><meta name="theme-color" content="#141c18"></head><body><div id="root"></div></body>',{url:'https://nlp.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const win=fresh.window;
 if(storedTheme==='storage-blocked')Object.defineProperty(win,'localStorage',{get(){throw new Error('Storage is disabled');}});
 else if(storedTheme!==null)win.localStorage.setItem('nlp-visual-lab.theme',storedTheme);
 const expected=storedTheme==='light'?'light':'dark';
 win.eval(themeInit);
 assert.equal(win.document.documentElement.dataset.theme,expected,'Saved theme applies before React mounts');
 win.eval(js);await tick();await tick();
 assert.equal(win.document.documentElement.dataset.theme,expected);
 const toggle=win.document.querySelector('.theme-toggle');
 assert.equal(toggle.getAttribute('aria-label'),`Switch to ${expected==='dark'?'light':'dark'} mode`);
 toggle.click();await tick();
 const switched=expected==='dark'?'light':'dark';
 assert.equal(win.document.documentElement.dataset.theme,switched);
 assert.equal(win.document.querySelector('meta[name="theme-color"]').content,switched==='dark'?'#141c18':'#f7f8f2');
 if(storedTheme!=='storage-blocked') {
  assert.equal(win.localStorage.getItem('nlp-visual-lab.theme'),switched);
  win.eval(themeInit);
  assert.equal(win.document.documentElement.dataset.theme,switched,'Startup restores the selection written by the toggle');
 }
 win.close();
}
assert.deepEqual(errors,[]);
console.log('Dark default, theme toggle, pre-paint persistence, invalid preferences, and blocked storage passed.');
