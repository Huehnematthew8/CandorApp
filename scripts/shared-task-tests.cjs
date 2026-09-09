/* Tests run against synthetic in-memory contacts, never the user's browser data. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../app.html'),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(source);
const code=source.slice(0,source.indexOf('/* ---------------- Init ---------------- */'));
let passed=0;
function test(name,fn){
 const data=new Map();
 const ctx=vm.createContext({console,URL,Date,JSON,Math,Set,Map,assert,setTimeout(){},clearTimeout(){},navigator:{},confirm:()=>true,
  localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),key:i=>[...data.keys()][i],get length(){return data.size;}},window:{addEventListener(){}},document:{addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;}}});
 vm.runInContext(code,ctx);
 vm.runInContext(`state.applications=[{id:'role-test',company:'Test Co',role:'Analyst',stage:'research',market:'Sydney / Melbourne',notes:'',log:[]}];state.contacts=[];state.tasks=[];render=()=>{};renderStorageNotice=()=>{};toast=()=>{};markDirty=()=>true;`,ctx);
 const run=s=>vm.runInContext(s,ctx);fn(run);console.log('PASS',name);passed++;
}
test('new role row creates one linked task; Today edits that same record',run=>run(`const r=commitTaskField('','title','Ask about handover','role-test');assert(r.ok);assert.equal(state.tasks.length,1);assert.equal(state.tasks[0].linkedType,'application');assert.equal(state.tasks[0].linkedId,'role-test');commitTaskField(r.id,'title','Ask about team handover');assert.equal(state.tasks.length,1);assert(roleChecklistHTML(appById('role-test')).includes('Ask about team handover'));assert(tasksBlock().includes('Ask about team handover'));`));
test('role and Today use unique fresh input IDs; notes stay unchanged',run=>run(`appById('role-test').notes='- [ ] Historical note';assert(taskRow({title:''},true).includes('id="task-new"'));assert(taskRow({title:''},true,'role-test').includes('id="role-task-new"'));commitTaskField('','title','Shared checklist','role-test');assert.equal(appById('role-test').notes,'- [ ] Historical note');assert.equal(state.tasks.length,1);`));
test('role task retains shared completion and exact link through reload',run=>run(`const r=commitTaskField('','title','Send times','role-test');state.tasks[0].done=true;state.tasks[0].completedAt=todayISO();const saved=JSON.stringify(state);state=JSON.parse(saved);assert.equal(state.tasks.length,1);assert(roleChecklistHTML(appById('role-test')).includes(' checked'));assert(tasksBlock().includes('Completed · 1'));state.tasks[0].done=false;state.tasks[0].completedAt=null;assert(!roleChecklistHTML(appById('role-test')).includes(' checked'));assert(tasksBlock().includes('Send times'));`));
test('archived role tasks hidden on Today but preserved in role and restored; closed remains visible',run=>run(`const r=commitTaskField('','title','Keep contextual task','role-test');const a=appById('role-test');a.archivedAt='2026-09-08';assert(!taskVisible(state.tasks[0]));assert(!tasksBlock().includes('Keep contextual task'));assert(roleChecklistHTML(a).includes('Keep contextual task'));delete a.archivedAt;a.stage='closed';assert(taskVisible(state.tasks[0]));assert(tasksBlock().includes('Keep contextual task'));`));
test('invalid role prevents orphan task and pending save retry preserves one record',run=>run(`assert(!commitTaskField('','title','Orphan','missing').ok);assert.equal(state.tasks.length,0);markDirty=()=>false;const r=commitTaskField('','title','Pending','role-test');assert(!r.ok);assert.equal(state.tasks.length,1);markDirty=()=>true;assert(commitTaskField(r.id,'title','Pending edited','role-test').ok);assert.equal(state.tasks.length,1);assert.equal(state.tasks[0].linkedId,'role-test');`));
test('archived closed and rejected records always offer Restore',run=>run(`for(const stage of ['closed','rejected']){const a=appById('role-test');a.stage=stage;a.archivedAt='2026-09-08';openRoleId=a.id;assert(drawerHTML(a).includes('data-action="restore-app"'));}`));
console.log(`${passed} shared-task checks passed`);
