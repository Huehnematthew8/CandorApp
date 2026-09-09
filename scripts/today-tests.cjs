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
test('new checklist text saves immediately and reload retains it',h=>h.run(`const r=commitTaskField('','title','Read the job requirements');assert(r.ok);assert.equal(readBackup(storageRaw).tasks.find(t=>t.id===r.id).title,'Read the job requirements');loadLocal();assert.equal(state.tasks.find(t=>t.id===r.id).title,'Read the job requirements');`));
test('rapid checklist edits do not redraw or lose linked metadata',h=>h.run(`const r=commitTaskField('','title','First');const t=state.tasks.find(x=>x.id===r.id);t.priority='high';t.linkedType='application';t.linkedId=state.applications[0].id;let redraws=0;render=()=>redraws++;for(const text of ['R','Read','Read ad carefully'])commitTaskField(t.id,'title',text);commitTaskField(t.id,'due','2026-09-20');assert.equal(redraws,0);loadLocal();const saved=state.tasks.find(x=>x.id===r.id);assert.equal(saved.title,'Read ad carefully');assert.equal(saved.priority,'high');assert.equal(saved.linkedType,'application');assert.equal(saved.due,'2026-09-20');`));
test('empty checklist edit retains last saved text',h=>h.run(`const r=commitTaskField('','title','Keep this');assert(!commitTaskField(r.id,'title',' ').ok);assert.equal(state.tasks.find(t=>t.id===r.id).title,'Keep this');assert(!commitTaskField('','title',' ').id);`));
test('checklist quota failure keeps pending text and reports unsaved',h=>{h.run(`globalThis.r=commitTaskField('','title','Saved');globalThis.before=storageRaw;`);h.failWrites(true);h.run(`const result=commitTaskField(r.id,'title','Pending');assert(!result.ok);assert.match(result.message,/Not saved/);assert.equal(localStorage.getItem(STORAGE_KEY),before);assert.match(exportJSON(),/Pending/);`);});
test('checklist removal has undo and retains dates and role link',h=>{h.run(`globalThis.r=commitTaskField('','title','Restore me');commitTaskField(r.id,'due','2026-09-20');commitTaskField(r.id,'link','application:'+state.applications[0].id);`);h.click('del-task',h.ctx.r.id);h.run(`assert(!state.tasks.find(t=>t.id===r.id));undoFn();markDirty();loadLocal();const t=state.tasks.find(t=>t.id===r.id);assert.equal(t.title,'Restore me');assert.equal(t.due,'2026-09-20');assert.equal(t.linkedType,'application');`);});
test('future actions remain in upcoming instead of today and completion can be undone',h=>h.run(`const a=state.applications.find(isActive);state.applications.forEach(x=>{x.nextAction='';x.nextActionDate='';});state.contacts.forEach(c=>c.nextFollowUp='');a.nextAction='Future review';a.nextActionDate=isoPlus(2);assert(!computeMoves().some(m=>m.title==='Future review'));assert.match(modUpcoming(),/Future review/);a.nextActionDate=todayISO();assert(computeMoves().some(m=>m.title==='Future review'));completeNextAction(a.id);assert.equal(a.nextAction,'');assert(a.log.some(l=>l.text==='Completed next action: Future review'));undoFn();assert.equal(a.nextAction,'Future review');assert.equal(a.nextActionDate,todayISO());`));
test('draft helper preserves existing human wording',h=>h.run(`const a=state.applications[0];a.draft='My carefully written message';seedDraft(a);assert.equal(a.draft,'My carefully written message');assert.match(messages.at(-1),/existing draft is kept/);`));
test('weekly people contacted counts unique outbound recipients only',h=>h.run(`state.contacts=[{id:'c1',status:'replied',log:[{date:todayISO(),kind:'sent'},{date:todayISO(),kind:'sent'},{date:todayISO(),kind:'received'},{date:todayISO(),kind:'note'}]},{id:'c2',log:[{date:todayISO(),kind:'sent'}]}];const w=weekBuckets()[weekKey(todayISO())];assert.equal(w.outreach,2);assert.equal(w.replies,1);`));
console.log(`\n${passed} passed; ${failures.length} failed`);if(failures.length)process.exitCode=1;
