/* Isolated tests of the canonical standalone app. No browser profile or user storage is read. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
const source = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
new vm.Script(source); // Include init/accessibility syntax in this check.
const code = source.slice(0, source.indexOf('/* ---------------- Init ---------------- */'));
let passed = 0;
const failures = [];
function harness() {
  const data = new Map(), handlers = {}, messages = [];
  let failWrites = false;
  const localStorage = {getItem: key => data.get(key) ?? null, setItem(key, value) {if (failWrites) throw Error('QuotaExceededError'); data.set(key, String(value));}, key: i => [...data.keys()][i], get length() {return data.size;}};
  const ctx = vm.createContext({console, assert, URL, Set, Map, Date, JSON, Math, localStorage,
    window: {addEventListener() {}}, document: {addEventListener(name, fn, capture) {(handlers[name] ||= []).push({fn,capture});}, querySelectorAll() {return [];}, querySelector() {return null;}},
    navigator: {}, confirm: () => true, setTimeout() {}, clearTimeout() {}, messages,
  });
  vm.runInContext(code, ctx);
  vm.runInContext(`render=()=>{};renderStorageNotice=()=>{};closeModal=()=>{};toast=message=>messages.push(message);toastUndo=(message,fn)=>{undoFn=fn;messages.push(message);};openModal=(html,handler)=>{globalThis.formHTML=html;globalThis.submitForm=handler;};resetEvidenceBaseline();`, ctx);
  return {run: script => vm.runInContext(script, ctx), data, ctx, messages, failWrites: value => {failWrites = value;}, click(action,id) {
    const target = {dataset:{action,id}, tagName:'BUTTON'};
    const event = {target:{closest:()=>target},preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};
    for(const h of (handlers.click||[]).sort((a,b)=>Number(!!b.capture)-Number(!!a.capture))) {h.fn(event);if(event.stopped)break;}
  }};
}
function test(name, fn) {try {fn(harness());passed++;console.log('PASS',name);} catch(error) {failures.push({name,error});console.error('FAIL',name, error.message);}}
test('first master summary becomes selected and counted',h=>h.run(`state.resume.master.summaries=[];state.resume.master.roles=[];state.resume.master.education=[];state.resume.master.achievements=[];state.resume.master.skills=[];summaryForm();submitForm({get:k=>({label:'Operations',text:'My evidence'}[k]||''),getAll:()=>[]});assert.equal(state.resume.master.summaries[0].core,true);assert.equal(countIncluded(null),1);`));
test('experience and education can be created from empty master',h=>h.run(`state.resume.master.roles=[];state.resume.master.education=[];roleForm(null,'work');submitForm({get:k=>({org:'Example team',title:'Analyst',source:'Notes'}[k]||'')});roleForm(null,'education');submitForm({get:k=>({org:'Example university',title:'Degree'}[k]||'')});assert.equal(state.resume.master.roles.length,1);assert.equal(state.resume.master.education.length,1);assert(viewResume().includes('Example university'));assert(viewResume().includes('Add a bullet'));validateState(state);`));
test('new variant links back to opportunity',h=>h.run(`const app=state.applications[0];delete app.variantId;variantForm();submitForm({get:k=>({name:'Target draft',appId:app.id,seed:'on'}[k]||'')});assert.equal(app.variantId,resumeTab);assert.equal(activeVariant().appId,app.id);`));
test('creating a draft preserves existing submitted application link',h=>h.run(`const app=state.applications[0];state.resume.variants.push({id:'locked',name:'Submitted',appId:app.id,summaryId:'',picks:{},achievementPicks:{},skillPicks:{},submittedSnapshot:{text:'Sent',date:'2026-09-01'}});app.variantId='locked';variantForm();submitForm({get:k=>({name:'New draft',appId:app.id}[k]||'')});assert.equal(app.variantId,'locked');assert.notEqual(resumeTab,'locked');`));
test('submitted variant settings cannot open editing',h=>h.run(`state.resume.variants.push({id:'locked',submittedSnapshot:{text:'Sent'}});submitForm=null;variantForm('locked');assert.equal(submitForm,null);assert(messages.at(-1).includes('cannot be edited'));`));
test('theme creation preserves existing tags and escapes labels',h=>h.run(`state.resume.themes=['original'];const result=themesFrom({getAll:()=>['original'],get:()=> 'operations, <unsafe>, operations'});assert.equal(result.length,3);assert(state.resume.themes.includes('operations'));assert(themeCheckboxes([]).includes('&lt;unsafe&gt;'));resumeThemeFilter='operations';assert(viewResume().includes('aria-pressed="true"'));assert(viewResume().includes('Highlighting does not change'));`));
test('empty master hides irrelevant theme controls and explains next step',h=>h.run(`state.resume.master={header:{name:'Test',headline:'',location:'',email:'',phone:'',links:[]},summaries:[],roles:[],education:[],achievements:[],skills:[]};state.resume.themes=[];resumeTab='master';const html=viewResume();assert(!html.includes('Highlight matching'));assert(html.includes('+ Experience'));assert(html.includes('+ Education'));assert(html.includes('Start with your own evidence'));`));
test('counts match included summary bullets achievements and skills',h=>h.run(`const m=state.resume.master;const expected=m.roles.concat(m.education).flatMap(r=>r.bullets).filter(b=>b.core!==false).length+m.achievements.filter(a=>a.core!==false).length+m.skills.length+(m.summaries.some(s=>s.core!==false)?1:0);assert.equal(countIncluded(null),expected);`));
test('new bullet retains entered source evidence',h=>h.run(`const r=state.resume.master.roles[0];bulletForm(null,r.id);submitForm({get:k=>({text:'Supported contribution',source:'Interview notes',core:'on'}[k]||''),getAll:()=>[]});assert.equal(r.bullets.at(-1).source,'Interview notes');`));
console.log(passed+' resume usability checks passed; '+failures.length+' failed');if(failures.length)process.exitCode=1;
