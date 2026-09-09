const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'app.html'),'utf8');
function slice(start,end){return html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));}
const seed=slice('const SEED =','/* ---------------- State');
const defaults=slice('function ensureDefaults(',"const STORAGE_KEY =");
const validation=slice('function validateState(','function saveLocal(');
const links=slice('function safeWebUrl(','const todayISO');
const ctx=vm.createContext({URL,console});
vm.runInContext(seed+'\n'+defaults+'\n'+validation+'\n'+links+'\nglobalThis.api={SEED,validateState,readBackup,safeWebUrl};',ctx);
const {SEED,validateState,readBackup,safeWebUrl}=ctx.api;
const clone=x=>JSON.parse(JSON.stringify(x));let checks=0;
function test(label,fn){fn();checks++;console.log('PASS '+label);}
function bad(label,mutate){test(label,()=>{const s=clone(SEED);mutate(s);assert.throws(()=>validateState(s));});}
const variant=()=>({id:'v-test',name:'Draft',appId:'',headline:'',summaryId:'',notes:'',masterRevision:'',picks:{},achievementPicks:{},skillPicks:{}});
test('canonical state accepted',()=>validateState(clone(SEED)));
test('original attached backup accepted without losing fields',()=>{
 const original=fs.readFileSync(path.join(root,'_archive/user-attachment-20260908/app.html'),'utf8');const c=vm.createContext({});vm.runInContext(original.slice(original.indexOf('const SEED ='),original.indexOf('/* ---------------- State'))+';globalThis.seed=SEED;',c);
 const old=clone(c.seed), accepted=readBackup(JSON.stringify(old));
 for(const key of Object.keys(old.resume.master))assert.deepEqual(clone(accepted.resume.master[key]),old.resume.master[key]);
 assert.equal(accepted.applications.length,old.applications.length);
});
test('valid histories, source fields, overrides and submitted text round-trip intact',()=>{
 const s=clone(SEED),v=variant();v.overrides={b1:'My actual contribution'};v.history=[{savedAt:'2026-09-08',source:'notes',text:'Earlier draft'}];v.submittedSnapshot={text:'Exact submitted text',date:'2026-09-08',source:'Master',masterRevision:'rev1'};s.resume.variants=[v];s.resume.history=[{savedAt:'2026-09-08',master:clone(s.resume.master)}];
 const out=readBackup(JSON.stringify(s));assert.deepEqual(clone(out.resume.variants),s.resume.variants);assert.deepEqual(clone(out.resume.history),s.resume.history);
});
for(const h of [null,{},'bad',{master:null},{master:{header:{}}}])bad('reject malformed master history '+JSON.stringify(h),s=>s.resume.history=[h]);
for(const h of ['bad',{},[null],[{text:{}}]])bad('reject malformed variant history '+JSON.stringify(h),s=>{const v=variant();v.history=h;s.resume.variants=[v];});
for(const snapshot of [false,0,'bad',[],{}, {text:'x',date:{}},{text:'x',date:'2026-09-08',source:{}}])bad('reject malformed submitted copy '+JSON.stringify(snapshot),s=>{const v=variant();v.submittedSnapshot=snapshot;s.resume.variants=[v];});
for(const overrides of [null,[],{b1:{}},{b1:false}])bad('reject malformed overrides '+JSON.stringify(overrides),s=>{const v=variant();v.overrides=overrides;s.resume.variants=[v];});
bad('reject duplicate role IDs',s=>s.applications.push(clone(s.applications[0])));
bad('reject HTML-bearing IDs',s=>s.applications[0].id='x"><img src=x onerror=alert(1)>');
bad('reject prototype pollution extension',s=>s.extra=JSON.parse('{"__proto__":{"polluted":true}}'));
bad('reject extreme nested extensions',s=>{let x=s;for(let i=0;i<70;i++)x=x.nested={};});
bad('reject malformed archived master bullets',s=>{const m=clone(s.resume.master);m.roles[0].bullets={};s.resume.history=[{master:m}];});
test('reject oversized input before JSON parsing',()=>assert.throws(()=>readBackup(' '.repeat(10*1024*1024+1)),/10 MB/));
for(const u of ['javascript:alert(1)','JaVaScRiPt:alert(1)','java\nscript:alert(1)','data:text/html,test','file:///etc/passwd','//example.com','https://user:pass@example.com','https://example.com\n'])test('URL blocked '+JSON.stringify(u),()=>{
 // Outer whitespace is deliberately trimmed; a trailing newline cannot change an HTTPS scheme.
 assert.equal(safeWebUrl(u),u==='https://example.com\n'?'https://example.com/':'');
});
for(const u of ['https://example.com/role?id=1','http://localhost:8800/'])test('safe URL retained '+u,()=>assert.equal(safeWebUrl(u),u));
test('all imported ID concatenations escaped',()=>assert.equal(/\+ [A-Za-z]\w*\.(?:id|appId|variantId|roleId|summaryId) \+/.test(html),false));
test('all external data links validate schemes',()=>{for(const x of ['c.linkedin','a.jdUrl','l.url'])assert.ok(html.includes('esc(safeWebUrl('+x+'))'));});
test('invalid imported date is escaped at log HTML sink',()=>assert.ok(html.includes('esc(fmtDate(l.date))')));
console.log(`${checks} security checks passed.`);
