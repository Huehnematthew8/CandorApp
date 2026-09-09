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
    window: {addEventListener() {}}, document: {addEventListener(name, fn, capture) {(handlers[name] ||= []).push({fn,capture});}, querySelectorAll() {return [];}, querySelector() {return null;}, getElementById() {return null;}},
    navigator: {}, confirm: () => true, setTimeout() {}, clearTimeout() {}, messages,
  });
  vm.runInContext(code, ctx);
  vm.runInContext(`render=()=>{};renderStorageNotice=()=>{};closeModal=()=>{};toast=message=>messages.push(message);toastUndo=(message,fn)=>{undoFn=fn;messages.push(message);};openModal=(html,handler)=>{globalThis.formHTML=html;globalThis.submitForm=handler;};resetEvidenceBaseline();`, ctx);
  return {run: script => vm.runInContext(script, ctx), data, ctx, messages, failWrites: value => {failWrites = value;}, click(action,id) {
    const target = {dataset:{action,id}, tagName:'BUTTON'};
    const event = {target:{closest:selector=>(selector==='[data-action]' || selector.includes('[data-action="'+action+'"]'))?target:null},preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};
    for(const h of (handlers.click||[]).sort((a,b)=>Number(!!b.capture)-Number(!!a.capture))) {h.fn(event);if(event.stopped)break;}
  }};
}
function test(name, fn) {try {fn(harness());passed++;console.log('PASS',name);} catch(error) {failures.push({name,error});console.error('FAIL',name, error.message);}}

test('URL capture stores only link and keeps optional details collapsed',h=>{h.run(String.raw`globalThis.capture={value:'https://example.com/jobs/analyst'};globalThis.hint={textContent:''};globalThis.details={open:false};globalThis.fields={jdUrl:{value:''},fullAd:{value:''}};document.getElementById=id=>id==='ad-paste'?capture:id==='ad-hint'?hint:null;document.querySelector=()=>({elements:fields,querySelector:()=>details});`);h.click('parse-ad');h.run(String.raw`assert.equal(fields.jdUrl.value,capture.value);assert.equal(fields.fullAd.value,'');assert.equal(details.open,false);assert.match(hint.textContent,/No page was fetched/);`);});
test('full ad retains exact whitespace and later URL capture does not erase it',h=>{h.run(String.raw`globalThis.capture={value:'  Business analyst\\nExample Company\\nRequirements: review customer feedback.  '.replaceAll('\\n','\n')};globalThis.expected=capture.value;globalThis.hint={textContent:''};globalThis.details={open:false};globalThis.fields={company:{value:''},role:{value:''},jdUrl:{value:''},fullAd:{value:''}};document.getElementById=id=>id==='ad-paste'?capture:id==='ad-hint'?hint:null;document.querySelector=()=>({elements:fields,querySelector:()=>details});`);h.click('parse-ad');h.run(String.raw`assert.equal(fields.fullAd.value,expected);assert.equal(details.open,false);capture.value='https://example.com/jobs/analyst';`);h.click('parse-ad');h.run(String.raw`assert.equal(fields.fullAd.value,expected);`);});
test('next action is before optional details and survives role save/reload',h=>h.run(String.raw`appForm();assert(formHTML.indexOf('name="nextAction"')<formHTML.indexOf('<details'));const values={company:'Synthetic Company',role:'Analyst',stage:'research',nextAction:'Read the ad',fullAd:'  Exact original\n\nAd text  '};submitForm({get:k=>values[k]??null});const a=state.applications.find(x=>x.company==='Synthetic Company');assert(a);assert.equal(a.nextAction,'Read the ad');assert.equal(a.fullAd,values.fullAd);loadLocal();assert.equal(appById(a.id).nextAction,'Read the ad');`));
test('editing a role without a next-action field preserves existing action',h=>h.run(String.raw`const a=state.applications[0];a.nextAction='Keep this step';appForm(a.id);const values={...a};delete values.nextAction;submitForm({get:k=>values[k]??null});assert.equal(a.nextAction,'Keep this step');`));
test('new unchecked story uses review wording without claiming historical origin',h=>h.run(String.raw`state.stories=[{id:'first-story',title:'New fact',source:'Today, firsthand',needsReview:true,themes:[],usedIn:[],situation:'Context',task:'Responsibility',action:'Action',result:'Observed result'}];assert.match(viewStories(),/Needs evidence review/);assert(!viewStories().includes('Historical story'));`));

test('contact research needs context plus explicit current confirmation',h=>h.run(String.raw`const a={id:'research-test',company:'Example',role:'Analyst',location:'Sydney',fullAd:'Responsibilities: analyse requirements and explain results.'};assert(!contactResearchReadiness(a).ready);assert(contactResearchReadiness(a).hasRequiredFields);a.contactResearchConfirmed=true;a.contactResearchContext=contactResearchContext(a);assert(contactResearchReadiness(a).ready);assert.match(contactResearchBrief(a),/Mutual connections require separately authorised LinkedIn access/);a.location='Melbourne';assert(!contactResearchReadiness(a).ready);`));
test('URL alone and unconfirmed location do not enable research brief',h=>h.run(String.raw`const a={company:'Example',role:'Analyst',location:'Unconfirmed',fullAd:'https://example.com/jobs/analyst',contactResearchConfirmed:true};a.contactResearchContext=contactResearchContext(a);assert(!contactResearchReadiness(a).ready);assert.deepEqual(contactResearchReadiness(a).missing,['Role location','Full job description']);assert.throws(()=>contactResearchBrief(a));`));
test('research confirmation is invalidated by changed context and saved as boolean',h=>h.run(String.raw`const a=state.applications[0];a.location='Sydney';a.fullAd='Responsibilities: understand user requirements.';a.contactResearchConfirmed=true;a.contactResearchContext=contactResearchContext(a);assert(markDirty());a.role+=' revised';assert(markDirty());assert.equal(a.contactResearchConfirmed,false);loadLocal();assert.equal(appById(a.id).contactResearchConfirmed,false);const bad=JSON.parse(JSON.stringify(state));bad.applications[0].contactResearchConfirmed='yes';assert.throws(()=>validateState(bad));`));


test('clipboard failure shows a manual brief without claiming copied',h=>{h.run(String.raw`globalThis.researchId=state.applications[0].id;const a=appById(researchId);a.location='Sydney';a.fullAd='Responsibilities: analyse requirements.';a.contactResearchConfirmed=true;a.contactResearchContext=contactResearchContext(a);navigator.clipboard={writeText:()=>({then:()=>({catch:fn=>fn()})})};`);h.click('copy-contact-research',h.ctx.researchId);h.run(String.raw`assert.match(formHTML,/Clipboard access was unavailable/);assert.match(formHTML,/CONTACT RESEARCH BRIEF/);assert(!messages.some(m=>m.includes('Research brief copied')));`);});

console.log(`\n${passed} passed; ${failures.length} failed`);
if(failures.length){for(const f of failures)console.error(f.name+'\n'+f.error.stack);process.exitCode=1;}
