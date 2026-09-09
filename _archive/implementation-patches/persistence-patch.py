from pathlib import Path
import re
p = Path(__file__).resolve().parents[1] / 'app.html'
s = p.read_text()
def replace(old,new):
    global s
    if old not in s: raise RuntimeError('Missing patch anchor: '+old[:100])
    s=s.replace(old,new,1)
def section(start,end,new):
    global s
    a=s.index(start); b=s.index(end,a)
    s=s[:a]+new+'\n'+s[b:]
section('function ensureDefaults(s) {','let unsyncedChanges = 0;',r'''function ensureDefaults(s) {
  // Only fill harmless optional defaults. Never manufacture personal evidence from SEED.
  s.meta = s.meta || {}; s.tasks = s.tasks || []; s.stories = s.stories || []; s.contacts = s.contacts || [];
  s.settings = s.settings || {};
  ['targetRoles','targetLocations','markets'].forEach(k => { if (!Array.isArray(s.settings[k])) s.settings[k] = []; });
  if (typeof s.settings.visaNote !== 'string') s.settings.visaNote = '';
  if (typeof s.settings.focus !== 'string') s.settings.focus = '';
  s.settings.weekly = s.settings.weekly || {outreach: 0, applications: 0};
  s.resume.variants = s.resume.variants || []; s.resume.themes = s.resume.themes || [];
  s.resume.history = s.resume.history || [];
  if(typeof s.resume.master.revision !== 'string') s.resume.master.revision = '';
  if(typeof s.resume.master.source !== 'string') s.resume.master.source = '';
  s.resume.variants.forEach(v=>{if(typeof v.masterRevision !== 'string')v.masterRevision='';});
  (s.applications || []).forEach(a => {
    if (!a.approach) a.approach = 'direct';
    if (!['unseen','accepted','dismissed'].includes(a.postApplyOutreach)) a.postApplyOutreach = 'unseen';
  });
  return s;
}
const STORAGE_KEY = 'candor.standalone.workspace.v1';
const STORAGE_BACKUP = STORAGE_KEY + '.backup';
let storageRaw = null, storageError = '', storageBlocked = false;
let state = ensureDefaults(JSON.parse(JSON.stringify(SEED)));
function validateState(value) {
  const obj = x => x && typeof x === 'object' && !Array.isArray(x);
  const need = (ok,msg) => { if (!ok) throw new Error('Invalid backup: '+msg); };
  const arr = (x,msg) => { need(Array.isArray(x),msg+' must be a list'); return x; };
  const text = (x,keys) => keys.forEach(k => need(x[k] === undefined || x[k] === null || typeof x[k] === 'string',k+' must be text'));
  function records(xs,label,fn) { const seen=new Set(); arr(xs,label).forEach(x=> {need(obj(x),label+' entry must be an object'); need(typeof x.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(x.id),label+' ID is invalid');need(!seen.has(x.id),'duplicate '+label+' ID');seen.add(x.id);fn(x);}); }
  const stringList = (x,label) => arr(x,label).forEach(v=>need(typeof v==='string',label+' entries must be text'));
  need(obj(value),'expected an object');
  need(obj(value.meta),'metadata missing');
  need(value.meta.version === 1,'unsupported version');
  need(obj(value.settings),'settings missing');
  ['targetRoles','targetLocations','markets'].forEach(k=>stringList(value.settings[k],k));
  text(value.settings,['visaNote','focus']);
  need(obj(value.settings.weekly),'weekly settings missing');
  ['outreach','applications'].forEach(k=>need(Number.isFinite(value.settings.weekly[k]) && value.settings.weekly[k]>=0,'invalid weekly value'));
  records(value.applications,'role',a=>{
    need(typeof a.company==='string' && a.company.trim() && typeof a.role==='string' && a.role.trim(),'company and opportunity name required');
    text(a,['roleType','market','location','source','jdUrl','datePosted','priority','salary','approach','dateAdded','dateApplied','nextAction','nextActionDate','hook','draft','variantId','notes','archivedAt','availability','opportunityKind','fullAd','checkedOn','description','potentialValue','aiPolicy']);
    need(['research','found','ready','applied','screen','interview','offer','accepted','rejected','withdrawn','ghosted','closed'].includes(a.stage),'unknown role stage');
    arr(a.log || [],'role log').forEach(l=>{need(obj(l),'invalid role log');text(l,['date','text']);});
  });
  records(value.contacts,'contact',c=>{text(c,['appId','name','title','route','status','linkedin','email','lastTouch','nextFollowUp','notes']);need(typeof c.name==='string','contact name required'); arr(c.log||[],'contact log').forEach(l=>{need(obj(l),'invalid contact log');text(l,['date','channel','note','text']);});});
  records(value.tasks,'task',t=>{text(t,['title','due','appId','completedAt','notes']);need(typeof t.title==='string' && typeof t.done==='boolean','task title or completion invalid');});
  records(value.stories,'story',t=>{text(t,['title','situation','task','action','result','body']);need(typeof t.title==='string','story title required');stringList(t.themes||[],'story themes');stringList(t.usedIn||[],'story links');});
  need(obj(value.resume)&&obj(value.resume.master),'master resume missing');
  const m=value.resume.master;
  need(obj(m.header),'resume header missing');text(m.header,['name','headline','location','email','phone']);arr(m.header.links,'header links').forEach(l=>{need(obj(l),'invalid header link');text(l,['label','url']);});
  ['summaries','achievements','skills'].forEach(k=>records(m[k],k,r=>{text(r,['text','label']);need(typeof r.text==='string',k+' text required');stringList(r.themes||[],k+' themes');}));
  ['roles','education'].forEach(k=>records(m[k],k,r=>{text(r,['org','title','location','start','end','kind']);records(r.bullets,'bullet',b=>{need(typeof b.text==='string','bullet text required');stringList(b.themes||[],'bullet themes');});}));
  records(value.resume.variants,'variant',v=>{text(v,['name','appId','headline','summaryId','notes','createdAt','updatedAt','masterRevision']);['picks','achievementPicks','skillPicks'].forEach(k=>{need(obj(v[k]),'variant selection missing');Object.values(v[k]).forEach(b=>need(typeof b==='boolean','variant selection must be boolean'));});if(v.submittedSnapshot){need(obj(v.submittedSnapshot),'invalid submitted snapshot');text(v.submittedSnapshot,['text','date','masterRevision']);need(typeof v.submittedSnapshot.text==='string','submitted text missing');}});
  stringList(value.resume.themes||[],'resume themes');
  if(value.resume.history!==undefined) arr(value.resume.history,'resume history');
  // Disallow prototype-control properties without discarding any legitimate extension fields.
  function safe(x){if(!x||typeof x!=='object')return;Object.keys(x).forEach(k=>{need(!['__proto__','constructor','prototype'].includes(k),'unsafe property');safe(x[k]);});} safe(value);
  return ensureDefaults(value);
}
function readBackup(text) {
  const value=JSON.parse(text);
  if(value && value.format==='candor-standalone') {if(value.version!==1)throw new Error('Unsupported Candor export version');return validateState(value.state);}
  return validateState(value); // Explicit support for the original attached app's version-1 JSON.
}
function packedState(candidate) { validateState(candidate); return JSON.stringify({format:'candor-standalone',version:1,savedAt:new Date().toISOString(),state:candidate}); }
function saveLocal(candidate, explicit) {
  try {
    if(storageBlocked && !explicit) throw new Error('Stored data needs recovery. Export recovery data or restore the previous save.');
    const raw=packedState(candidate), current=localStorage.getItem(STORAGE_KEY);
    if(current!==storageRaw) throw new Error('Another tab changed this workspace. Export your pending changes, then reload.');
    if(current!==null) {
      let valid=true;try{readBackup(current);}catch(e){valid=false;}
      localStorage.setItem(valid?STORAGE_BACKUP:STORAGE_KEY+'.recovery.'+Date.now()+'-'+Math.random().toString(36).slice(2),current);
    }
    localStorage.setItem(STORAGE_KEY,raw);
    storageRaw=raw;storageError='';storageBlocked=false;return true;
  }catch(e){storageError='Changes are not saved: '+e.message;return false;}
}
function loadLocal() {
  try {storageRaw=localStorage.getItem(STORAGE_KEY);if(storageRaw!==null) state=readBackup(storageRaw);}
  catch(e){storageBlocked=true;storageError='Saved workspace could not be loaded. Original data is untouched. Export recovery data or restore the previous save. '+e.message;}
}
function renderStorageNotice(){
  let n=document.getElementById('storage-notice');
  if(!n){n=document.createElement('div');n.id='storage-notice';n.setAttribute('role','status');n.style.cssText='position:fixed;bottom:8px;left:16px;right:16px;z-index:1200;padding:12px;background:var(--surface,#fff);color:var(--ink,#222);border:1px solid #bd6717;border-radius:8px;box-shadow:0 2px 10px #0002;font-size:13px';document.body.appendChild(n);}
  n.hidden=!storageError;
  n.innerHTML=esc(storageError)+' <button class="btn sm" data-action="download-backup">Export pending data</button> <button class="btn sm" data-action="recovery-export">Export recovery</button> <button class="btn sm" data-action="restore-backup">Restore previous save</button>';
}
function downloadText(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function downloadRecovery(){try{const records={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k===STORAGE_KEY||k===STORAGE_BACKUP||k.startsWith(STORAGE_KEY+'.recovery.'))records[k]=localStorage.getItem(k);}downloadText(JSON.stringify({format:'candor-raw-recovery',records},null,2),'candor-recovery-'+todayISO()+'.json');}catch(e){toast('Recovery export unavailable: '+e.message);}}
function restoreBackup(){try{const raw=localStorage.getItem(STORAGE_BACKUP);if(!raw){toast('No previous save is available');return;}if(!confirm('Restore the previous saved workspace? The current stored version will remain recoverable. Export pending changes first if needed.'))return;doImport(raw,true);}catch(e){toast(e.message);}}
window.addEventListener('beforeunload',e=>{if(storageError){e.preventDefault();e.returnValue='';}});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY&&e.newValue!==storageRaw){storageError='Another tab changed this workspace. Export pending data before reloading.';renderStorageNotice();}});
''')
section('function markDirty() {','function toast(msg) {',r'''function markDirty() {
  if(typeof checkpointEvidence === 'function') checkpointEvidence();
  state.meta.lastUpdated = new Date().toISOString();
  unsyncedChanges++;
  const ok=saveLocal(state,false);
  render();
  if(!ok) {document.querySelectorAll('#toasts .toast').forEach(t=>t.remove());toast(storageError);}
  return ok;
}
''')
replace('  renderDrawer();\n}', '  renderDrawer();\n  renderStorageNotice();\n}')
replace('  wireNav();\n  render();','  loadLocal();\n  if(typeof resetEvidenceBaseline==="function")resetEvidenceBaseline();\n  wireNav();\n  render();')
section('function exportJSON() {','/* ---------------- Event delegation ---------------- */',r'''function exportJSON() {return JSON.stringify({format:'candor-standalone',version:1,exportedAt:new Date().toISOString(),state},null,2);}
function doCopySync(){const data=exportJSON();const area=$('#export-area');if(area)area.value=data;const done=ok=>{toast(ok?'Backup copied. It contains private career and contact data.':'Clipboard blocked. Select and copy the export text manually.');if(!ok&&area){area.focus();area.select();}};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(data).then(()=>done(true)).catch(()=>done(false));else done(false);}
function doDownload(){downloadText(exportJSON(),'candor-backup-'+todayISO()+'.json');toast('Backup download requested');}
function doImport(text,alreadyConfirmed){
  let parsed;try{parsed=readBackup(text);}catch(e){toast('Import cancelled: '+e.message);return false;}
  if(!alreadyConfirmed&&!confirm('Replace this local workspace with the validated backup? A recoverable copy of the current stored data will be kept. Export pending changes first if needed.'))return false;
  if(!saveLocal(parsed,true)){toast(storageError);renderStorageNotice();return false;}
  state=parsed;if(typeof resetEvidenceBaseline==='function')resetEvidenceBaseline();unsyncedChanges=0;selectedApps.clear();openRoleId=null;resumeTab='master';currentView='roles';
  toast('Backup loaded. No vault or workbook files were changed.');render();return true;
}

''')
replace("    case 'download-backup': doDownload(); break;", "    case 'download-backup': doDownload(); break;\n    case 'recovery-export': downloadRecovery(); break;\n    case 'restore-backup': restoreBackup(); break;")
# Replace misleading in-memory/sync copy while leaving neighbouring product edits alone.
a=s.index('  const banner = unsyncedChanges > 0',s.index('function viewSettings'))
b=s.index("  return '<div",a)
s=s[:a]+'''  const banner = '<div class="sync-banner clean">'+(storageError?'Changes need attention. See the recovery notice.':'Saved in this browser after each change. Download backups for recovery. This is a local copy, not a live vault or workbook connection.')+'</div>';
'''+s[b:]
s=s.replace('Export → Claude','Export local backup').replace('Copy sync data','Copy backup').replace('Sync data appears here after you click Copy…','Backup data appears here after you click Copy…')
s=s.replace('Paste into the <strong>Job Applications 2026</strong> project chat. Claude updates the source of truth and rebuilds this app with your data baked in.','Keep a private backup on your computer. Exports contain your career evidence and contact notes; share only deliberately.')
s=s.replace('Paste exported JSON and load it. Replaces everything currently in the app.','Load a validated Candor backup. Replacement preserves the previous saved state for recovery.')
s=s.replace('Download a backup first — a wipe cannot be undone.','Download a backup first. The previous saved state is retained for recovery.')
s=s.replace('No undo on this one. Export a backup from this page first if in doubt.','Export a backup first. Restore previous save is available until the next successful edit replaces that recovery point.')
replace("'<button class=\"btn danger\" data-action=\"reset-data\">Erase data…</button>' +", "'<button class=\"btn\" data-action=\"restore-backup\">Restore previous save</button> <button class=\"btn\" data-action=\"recovery-export\">Export recovery data</button> <button class=\"btn danger\" data-action=\"reset-data\">Erase data…</button>' +")
# Preserve role records and all links by archiving rather than deleting.
a=s.index("    case 'bulk-del':")
b=s.index("    case 'edit-weekly':",a)
s=s[:a]+'''    case 'bulk-del':
      if(confirm('Archive '+selectedApps.size+' selected opportunities? Their documents, people and history will be retained.')){
        state.applications.forEach(a=>{if(selectedApps.has(a.id))a.archivedAt=new Date().toISOString();});
        selectedApps.clear();toast('Archived');markDirty();
      }break;
'''+s[b:]
a=s.index("    case 'del-app': {");b=s.index("    case 'del-task':",a)
s=s[:a]+'''    case 'restore-app': {const a=appById(id);if(a){delete a.archivedAt;toast('Restored');markDirty();}break;}
    case 'del-app': {
      const app=appById(id);if(!app)break;
      app.archivedAt=new Date().toISOString();openRoleId=null;closeModal();
      toastUndo('Opportunity archived',()=>{delete app.archivedAt;});markDirty();break;
    }
'''+s[b:]
replace("  let list = state.applications.slice();\n  const f = roleFilters;", "  const f = roleFilters;\n  let list = state.applications.filter(a=>f.stage==='archived'?!!a.archivedAt:!a.archivedAt);")
s=s.replace("  else if (f.stage) list = list.filter(a => a.stage === f.stage);", "  else if (f.stage && f.stage!=='archived') list = list.filter(a => a.stage === f.stage);")
replace("      chip('Closed', f.stage === 'closed', 'fstage', 'closed') +", "      chip('Closed', f.stage === 'closed', 'fstage', 'closed') +\n      chip('Archived', f.stage === 'archived', 'fstage', 'archived') +")
replace("  host.innerHTML = drawerHTML(a);", "  host.innerHTML = (a.archivedAt?'<div class=\"sync-banner\">Archived opportunity <button class=\"btn\" data-action=\"restore-app\" data-id=\"'+esc(a.id)+'\">Restore</button></div>':'') + drawerHTML(a);")
s=s.replace('const isActive = a => STAGES.some(s => s.id === a.stage);','const isActive = a => !a.archivedAt && STAGES.some(s => s.id === a.stage);')
s=s.replace("    if (v === 'applied' && !a.dateApplied) a.dateApplied = todayISO();\n",'')
p.write_text(s)
print('Applied persistence and recovery patch:',p)
