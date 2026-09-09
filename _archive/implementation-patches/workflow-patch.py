from pathlib import Path
import json,re
p=Path('app.html');s=p.read_text()
def between(start,end,new):
 global s
 a=s.index(start);b=s.index(end,a);s=s[:a]+new+'\n\n'+s[b:]
# The uploaded original and its private historical records are preserved in _archive.
a=s.index('const SEED = ')+len('const SEED = ');seed,n=json.JSONDecoder().raw_decode(s[a:])
seed['meta']['lastUpdated']='2026-09-08T00:00:00.000Z';seed['meta']['source']='Career Context.md and Master Resume.md, Obsidian vault, read 8 September 2026. Local copy; no automatic sync.'
seed['settings'].update(targetRoles=['Business analyst / Product operations / Commercial analyst','Solutions / Implementation','Selective APM / Early-career PMM','SDR as a separate path'],visaNote='Australian citizenship and working rights recorded in the master. Overseas work rights are not established.',focus='Australia first. Sydney or Melbourne preferred; learning, ownership and customer exposure matter. International opportunities stay separate.',weekly={'outreach':0,'applications':0})
seek=seed['applications'][0];seek.update(stage='rejected',availability='unknown',opportunityKind='vacancy',nextAction='',nextActionDate='',source='User-reported rejection, Career Context.md, 8 September 2026. Actual rejection date unknown.')
seek['log'].append({'date':'2026-09-08','text':'Rejection reported by Matthew. Actual rejection date unknown. Submitted materials unchanged.'})
seed['applications'].append(dict(id='app-google-apmm',company='Google',role='Associate Product Marketing Manager',roleType='Growth / GTM',market='Sydney / Melbourne',location='Australia; location to confirm',stage='closed',availability='unavailable',opportunityKind='vacancy',priority='med',approach='direct',dateAdded='2026-09-08',dateApplied='',nextAction='',nextActionDate='',hook='',draft='',variantId='',notes='Matthew reported listing/application no longer available. Not submitted; removal reason unknown.',source='Career Context.md, 8 September 2026',checkedOn='2026-09-08',jdUrl='',log=[]))
master=Path("/Users/matthewhuehne/Desktop/Obsidian Vault/Matty's Vault/Job Applications/Master Resume.md").read_text()
m=seed['resume']['master'];m['source']='Master Resume.md, Obsidian vault, 8 September 2026';m['revision']='vault-2026-09-08';m['header']['headline']='Consultant, Engineering, AI & Data | Deloitte';m['header']['links']=[{'label':'LinkedIn','url':'https://www.linkedin.com/in/matthewhuehne/'}]
summary=master.split('## Summary\n\n')[1].split('\n\n')[0].replace(' Current career direction: [[Career Context]].','')
m['summaries']=[dict(id='sum-current',label='Current master summary',text=summary,core=True,themes=['data','delivery'],source=m['source'])]
def bullets(text,prefix):return [dict(id=prefix+'-'+str(i),text=t.strip(),themes=[],core=True,needsInput=False,source=m['source']) for i,t in enumerate(text) if t.strip()]
dtt=master.split('### Deloitte, Engineering')[1].split('Source:')[0];dtt=re.findall(r'^- (.+)$',dtt,re.M)
roles=[dict(id='r-dtt',org='Deloitte, Engineering, AI & Data',title='Consultant (Aug 2026 to present); Analyst (Jul 2025 to Aug 2026)',location='Brisbane',start='Jul 2025',end='Present',kind='work',bullets=bullets(dtt,'r-dtt'))]
for rid,heading,org,title,start,end in [('r-ey','Technology Strategy and Transformation Intern, Ernst & Young','Ernst & Young','Technology Strategy and Transformation Intern','Jan 2025','Feb 2025'),('r-moon','Quality Assurance Tester, Moonward Apps','Moonward Apps','Quality Assurance Tester','Jun 2024','Jan 2025'),('r-dttv','Deloitte, Technology Strategy and Transformation','Deloitte, Technology Strategy and Transformation','Intern, Cloud and Engineering Advisory','Nov 2023','Feb 2024'),('r-180','180 Degrees Consulting QUT','180 Degrees Consulting QUT','Student Consultant; Consulting Director; Treasurer','2023','2024'),('r-ped','Digital Marketing and Data Intern, Paedix Paediatrics','Paedix Paediatrics','Digital Marketing and Data Intern','Mar 2023','Oct 2023')]:
 block=master.split('### '+heading+'\n')[1].split('\n### ')[0].split('\n## ')[0]
 lines=[t for t in block.splitlines() if t and not t.startswith('**')]
 text=lines[-1].split(' Source:')[0]
 if rid=='r-dttv':text=lines[-1]
 roles.append(dict(id=rid,org=org,title=title,location='',start=start,end=end,kind='work',bullets=bullets([text],rid)))
m['roles']=roles
m['education']=m['education'][:1];m['education'][0]['bullets']=bullets(['Dual degree completed February 2026. Formal conferral date not recorded.'],'e-qut')
comp=master.split('## Case Competitions')[1].split('## Skills')[0]
m['achievements']=bullets([re.sub(r'\*\*','',x).split(' Source:')[0] for x in re.findall(r'^- (.+)$',comp,re.M)],'achievement')
m['skills']=bullets(['SQL, Python, Excel modelling','AWS, cloud architecture and migration patterns','Application dependency analysis, Cypress test automation','Codex and Cursor, used to build applications','Discovery interviews and workshops','Writing for technical and commercial audiences'],'skill')
seed['resume']['history']=[]
# Retain historical stories as review-needed; do not pull them into outreach automatically.
for story in seed['stories']:story.update(needsReview=True,source='Uploaded app snapshot, 3 August 2026. Check against current master and source story before reuse.')
s=s[:a]+json.dumps(seed,ensure_ascii=False,indent=2)+s[a+n:]
s=s.replace('<title>Job Search HQ — Matty</title>','<title>Candor | Job Search HQ</title>').replace('<html lang="en"','<html lang="en-AU"')
s=s.replace("{ id: 'research',  label:","{ id: 'found', label: 'Found', color: 'var(--stage-1)' },\n  { id: 'ready', label: 'Ready', color: 'var(--stage-1)' },\n  { id: 'research',  label:")
s=s.replace("const CLOSED_STAGES = [","const CLOSED_STAGES = [\n  { id: 'closed', label: 'Closed / listing unavailable' },")
s=s.replace("const ROLE_TYPES = [", "const ROLE_TYPES = ['Business / Commercial analyst', 'Product operations', 'Solutions / Implementation', ")
s=s.replace("let tableSort = { key: 'dateAdded', dir: -1 };","let tableSort = { key: 'workflow', dir: 1 };")
s=s.replace("if (v === 'applied' && !a.dateApplied) a.dateApplied = todayISO();", "// Application dates are recorded explicitly; stage changes do not infer them.")
between('function computeMoves() {','/* ---------------- Views registry', '''function computeMoves() {
 const moves=[];
 state.tasks.filter(t=>!t.done && t.due).forEach(t=>{const n=daysFromToday(t.due);if(n!==null && n<=1)moves.push({icon:'☑',overdue:n<0,title:t.title,sub:'Task · '+relDue(t.due),action:'edit-task',id:t.id,sort:n});});
 state.applications.filter(isActive).forEach(a=>{
   if(a.nextAction){const n=a.nextActionDate?daysFromToday(a.nextActionDate):null;moves.push({icon:'→',overdue:n!==null && n<0,title:a.nextAction,sub:a.company+' · '+(a.nextActionDate?relDue(a.nextActionDate):'No date set'),action:'open-role',id:a.id,sort:n===null?999:n});}
   roleContacts(a.id).filter(c=>c.nextFollowUp && c.status!=='dormant').forEach(c=>{const n=daysFromToday(c.nextFollowUp);if(n!==null && n<=1)moves.push({icon:'◎',overdue:n<0,title:'Review follow-up: '+c.name,sub:a.company+' · '+relDue(c.nextFollowUp),action:'open-role',id:a.id,sort:n});});
 });
 return moves.sort((a,b)=>a.sort-b.sort);
}''')
between('const READY_STEPS = [','function stepsFor(a)', '''const READY_STEPS = [
 { k:'logged',lab:'Saved',hint:'Opportunity recorded.' },
 { k:'human',lab:'Contact',hint:'Optional contact lead; this does not confirm a referral.' },
 { k:'sent',lab:'Outreach',hint:'An actual sent message has been recorded.' },
 { k:'applied',lab:'Applied',hint:'An actual submission date has been recorded.' }
];
const DIRECT_STEPS = [READY_STEPS[0],READY_STEPS[3]];''')
s=s.replace("sent: people.some(c => (c.log || []).length > 0),","sent: people.some(c => (c.log || []).some(l => l.kind === 'sent' || (!l.kind && l.channel && !['Call','Video call','In person'].includes(l.channel)))),")
between('function nextMove(a) {','/* Ashby (93K jobs)', '''function nextMove(a) {
 if(!isActive(a))return {text:'Closed record',cls:'muted'};
 if(a.nextAction)return {text:a.nextAction,cls:a.nextActionDate && daysFromToday(a.nextActionDate)<0?'due':'',when:a.nextActionDate?relDue(a.nextActionDate):''};
 if(a.availability==='unavailable')return {text:'Listing unavailable; review next step',cls:'muted'};
 if(a.opportunityKind==='target')return {text:'Explore openings and team context',cls:''};
 if(!a.dateApplied)return {text:'Review requirements and evidence',cls:''};
 return {text:'Set a next action when needed',cls:'muted'};
}''')
s=s.replace("if (k === 'ready') list.sort", "if (k === 'workflow') list.sort((a,b)=>Number(!isActive(a))-Number(!isActive(b)) || Number(!/Sydney|Melbourne|Brisbane|AU|Australia/i.test(a.location||''))-Number(!/Sydney|Melbourne|Brisbane|AU|Australia/i.test(b.location||'')) || STAGES.findIndex(x=>x.id===b.stage)-STAGES.findIndex(x=>x.id===a.stage) || Number(!roleContacts(a.id).length)-Number(!roleContacts(b.id).length) || a.company.localeCompare(b.company));\n  else if (k === 'ready') list.sort")
# Role capture: source text is retained in full, separate from description or inferred fields.
s=s.replace("field('Role', inp('role', a && a.role, 'placeholder=\"Associate Product Manager\"'))", "field('Role / area of interest *', inp('role', a && a.role, 'required placeholder=\"Business analyst or product operations\"'))")
s=s.replace("field('Priority', sel", "field('Opportunity type', sel('opportunityKind', [['target','Exploratory target'],['vacancy','Specific vacancy']], a && a.opportunityKind || 'target')) +\n      field('Listing availability', sel('availability', [['unknown','Unverified'],['open','Open when checked'],['unavailable','Unavailable']], a && a.availability || 'unknown')) +\n      field('Listing checked on', inp('checkedOn', a && a.checkedOn, 'type=\"date\"')) +\n      field('Source / provenance', inp('source', a && a.source)) +\n      field('Priority', sel",1)
s=s.replace("'<div class=\"full\">' + field('Notes',", "'<div class=\"full\">' + field('What the employer and role do', '<textarea name=\"description\">' + esc(a && a.description || '') + '</textarea>') + '</div>' +\n      '<div class=\"full\">' + field('Potential contribution (hypothesis, with evidence)', '<textarea name=\"potentialValue\">' + esc(a && a.potentialValue || '') + '</textarea>') + '</div>' +\n      '<div class=\"full\">' + field('Employer AI rules and source', '<textarea name=\"aiPolicy\">' + esc(a && a.aiPolicy || '') + '</textarea>') + '</div>' +\n      '<div class=\"full\">' + field('Full job ad, verbatim', '<textarea name=\"fullAd\">' + esc(a && a.fullAd || '') + '</textarea>') + '</div>' +\n      '<div class=\"full\">' + field('Notes',",1)
s=s.replace("['company','role','roleType','market','stage','priority','approach','location','salary','datePosted','jdUrl','notes']", "['company','role','roleType','market','stage','priority','approach','location','salary','datePosted','jdUrl','notes','opportunityKind','availability','checkedOn','source','fullAd','description','potentialValue','aiPolicy']")
s=s.replace("const obj = a || { id: uid('app')", "const candidateCompany=String(fd.get('company')||'').trim(),candidateRole=String(fd.get('role')||'').trim();\n      if(!candidateCompany || !candidateRole){toast('Add a company and role or area of interest.');return;}\n      if(state.applications.some(x=>x.id!==id && x.company.trim().toLowerCase()===candidateCompany.toLowerCase() && x.role.trim().toLowerCase()===candidateRole.toLowerCase() && (x.location||'').trim().toLowerCase()===String(fd.get('location')||'').trim().toLowerCase())){toast('This opportunity is already recorded. Open it to update.');return;}\n      const obj = a || { id: uid('app')")
s=s.replace("const parsed2 = parseJobAd(ta2.value);", "const parsed2 = parseJobAd(ta2.value);\n      form2.elements.fullAd.value=ta2.value; // Always retain the original text.")
s=s.replace("else if (/brisbane|remote/.test(l))", "else if (/brisbane/.test(l))")
s=s.replace("field('Market', sel('market', MARKETS, a ? a.market : FOCUS_MARKET))", "field('Market', sel('market', MARKETS, a ? a.market : 'Other'))")
s=s.replace("field('Role type', sel('roleType', ROLE_TYPES, a ? a.roleType : 'Product / APM'))", "field('Role type', sel('roleType', ROLE_TYPES, a ? a.roleType : 'Other'))")
s=s.replace("else if (/operations|chief of staff|bizops/.test(rl))", "else if (/solutions|implementation/.test(rl)) out.roleType = 'Solutions / Implementation';\n    else if (/analyst/.test(rl)) out.roleType = 'Business / Commercial analyst';\n    else if (/operations|chief of staff|bizops/.test(rl))")
# Visible source context and optional contact journey.
s=s.replace("const applyBlock =", "const applyBlock =")
s=s.replace("'<label class=\"dlab\">Date applied</label>'", "'<label class=\"dlab\">Actual date applied</label>'")
s=s.replace("'<div class=\"drow\">' +\n      '<label class=\"dlab\">Resume variant</label>'", "'<p class=\"dhint\">Recording a date does not submit anything. Leave it blank if not submitted or the date is unknown.</p>' +\n    '<div class=\"drow\">' +\n      '<label class=\"dlab\">Resume variant</label>'")
s=s.replace("state.stories.filter(s => s.result || s.body)","state.stories.filter(s => !s.needsReview && (s.result || s.body))")
s=s.replace("'<div class=\"s-title\">' + esc(s.title)","'<div class=\"s-title\">' + esc(s.title)")
s=s.replace("'<div class=\"s-themes\">'", "(s.needsReview ? '<div class=\"banner warn\">Historical story: review against current evidence before reuse.</div>' : '') +\n        '<p class=\"muted\">' + esc(s.source || 'Source not recorded') + '</p>' +\n        '<div class=\"s-themes\">'",1)
p.write_text(s)
print('Applied workflow and canonical seed corrections')
