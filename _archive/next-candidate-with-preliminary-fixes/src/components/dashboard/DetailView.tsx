'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusDropdown } from '@/components/ui/StatusBadge';
import type { Job, WorkflowRecord, TailoredDocument } from '@/types';

export const blankWorkflow = (): WorkflowRecord => ({kind:'target',availability:'unknown',sourceUrl:'',sourceNote:'',checkedOn:'',fullAd:'',description:'',potentialValue:'',nextAction:'',nextActionDue:'',track:'',aiPolicy:'',contactsContext:'',documents:[]});
const value = (form: FormData, key: string) => String(form.get(key) || '').trim();
function Field({name,label,initial='',area=false,type='text'}: {name:string;label:string;initial?:string;area?:boolean;type?:string}) {
 return <label className="field">{label}{area ? <textarea name={name} defaultValue={initial} rows={4}/> : <input name={name} type={type} defaultValue={initial}/>}</label>;
}
export default function DetailView({job}: {job:Job;onLogInteraction:()=>void}) {
 const store=useAppStore(); const w={...blankWorkflow(),...job.workflow};
 const [tab,setTab]=useState('Opportunity'); const [message,setMessage]=useState('');
 const [editingDoc,setEditingDoc]=useState<TailoredDocument|null>(null);
 async function save(updates:Partial<Job>) { await store.updateJob(job.id,updates); const err=useAppStore.getState().error;setMessage(err || 'Saved in this browser.');return !err; }
 async function saveOverview(e:React.FormEvent<HTMLFormElement>) {
  e.preventDefault();const f=new FormData(e.currentTarget);const next={...w};
  for(const k of ['sourceUrl','sourceNote','checkedOn','fullAd','description','potentialValue','nextAction','nextActionDue','track','aiPolicy','contactsContext'] as const) next[k]=value(f,k);
  if(next.sourceUrl) {try {const url=new URL(next.sourceUrl);if(!['https:','http:'].includes(url.protocol))throw Error();}catch{setMessage('Use a full http or https job link.');return;}}
  next.kind=value(f,'kind') as WorkflowRecord['kind'];next.availability=value(f,'availability') as WorkflowRecord['availability'];
  await save({company:value(f,'company'),role:value(f,'role'),location:value(f,'location') || null,why:value(f,'why'),applied_at:value(f,'applied_at') || null,workflow:next});
 }
 async function saveDocument(e:React.FormEvent<HTMLFormElement>) {
  e.preventDefault();const f=new FormData(e.currentTarget);const body=value(f,'body'),source=value(f,'source');
  const document:TailoredDocument={id:editingDoc?.id || crypto.randomUUID(),title:value(f,'title'),body,source,masterRevision:store.master.revision,state:'draft',history:editingDoc ? [...editingDoc.history,{body:editingDoc.body,source:editingDoc.source,masterRevision:editingDoc.masterRevision,savedAt:new Date().toISOString()}] : []};
  const documents=editingDoc ? w.documents.map(d=>d.id===document.id?document:d) : [...w.documents,document];
  if(await save({workflow:{...w,documents}})) {setEditingDoc(null); e.currentTarget?.reset();}
 }
 return <main className="workspace-detail">
  <button className="btn-ghost" onClick={()=>store.selectJob(null)}>← Applications</button>
  <header className="detail-heading"><div><h1>{job.company}</h1><p>{job.role} · {job.location || 'Location unconfirmed'}</p></div><label className="field">Application status<StatusDropdown status={job.status} onChange={s=>void save({status:s})}/></label></header>
  <p className="muted">Recording a status does not submit an application. Listing availability is recorded separately below.</p>
  <nav className="workspace-tabs" aria-label="Opportunity sections">{['Opportunity','Contacts & activity','Documents'].map(t=><button key={t} aria-current={t===tab?'page':undefined} className={t===tab?'btn-primary':'btn-ghost'} onClick={()=>{setTab(t);setMessage('');}}>{t}</button>)}</nav>
  <p role="status" className="save-message">{message}</p>
  {tab==='Opportunity' && <form className="workspace-card" onSubmit={saveOverview}>
   <div className="field-grid"><label className="field">Company<input name="company" required defaultValue={job.company}/></label><label className="field">Role or area of interest<input name="role" required defaultValue={job.role}/></label><Field name="location" label="Location (leave blank if unknown)" initial={job.location || ''}/><Field name="track" label="Career track" initial={w.track}/>
   <label className="field">Opportunity type<select name="kind" defaultValue={w.kind}><option value="target">Exploratory company target</option><option value="vacancy">Specific vacancy</option></select></label>
   <label className="field">Listing availability<select name="availability" defaultValue={w.availability}><option value="unknown">Unverified</option><option value="open">Open when checked</option><option value="unavailable">Listing unavailable</option></select></label>
   <Field name="nextAction" label="Next action" initial={w.nextAction}/><Field name="nextActionDue" label="Next action due (optional)" type="date" initial={w.nextActionDue}/>
   <Field name="sourceUrl" label="Direct job link" initial={w.sourceUrl} type="url"/><Field name="checkedOn" label="Listing checked on" type="date" initial={w.checkedOn}/>
   <Field name="sourceNote" label="Source note / provenance" initial={w.sourceNote}/><Field name="applied_at" label="Actual submission date (leave blank if unknown or not submitted)" type="date" initial={job.applied_at || ''}/></div>
   <Field name="description" label="What the employer and role do" initial={w.description} area/>
   <Field name="potentialValue" label="Potential contribution (your hypothesis, with evidence)" initial={w.potentialValue} area/>
   <Field name="why" label="Why this opportunity interests you" initial={job.why || ''} area/>
   <Field name="fullAd" label="Full job advertisement, verbatim" initial={w.fullAd} area/>
   <Field name="aiPolicy" label="Employer AI rules and source" initial={w.aiPolicy} area/>
   <Field name="contactsContext" label="Contact context: warmth, source, uncertainty and next step" initial={w.contactsContext} area/>
   <button className="btn-primary">Save opportunity</button>
  </form>}
  {tab==='Contacts & activity' && <div className="workspace-card">
   <h2>Contacts</h2><p>Keep potential contacts distinct from confirmed referrals. Nothing is sent from Candor.</p>
   {(job.contacts || []).map(c=><div className="record" key={c.id}><strong>{c.name}</strong><p>{c.role || 'Relationship unconfirmed'}</p><p>{c.email} {c.phone}</p></div>)}
   <form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);const result=await store.addContact(job.id,{name:value(f,'name'),role:value(f,'role'),email:value(f,'email'),phone:value(f,'phone')});setMessage(result.ok?'Contact saved.':useAppStore.getState().error || 'Contact was not saved.');if(result.ok)form.reset();}}>
    <div className="field-grid"><label className="field">Contact name<input name="name" required/></label><Field name="role" label="Role / relationship and source"/><Field name="email" type="email" label="Email (optional)"/><Field name="phone" label="Phone (optional)"/></div><button className="btn-primary">Add contact</button>
   </form>
   <h2>Activity history</h2><p>Record what happened. Save unsent outreach in Documents.</p>
   <form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);await store.addInteraction(job.id,{channel:'note',subject:value(f,'subject'),body:value(f,'body'),interacted_at:new Date(value(f,'date')+'T12:00:00').toISOString()});const err=useAppStore.getState().error;setMessage(err || 'Activity recorded.');if(!err)form.reset();}}>
    <div className="field-grid"><label className="field">What happened<input name="subject" required placeholder="E.g. Intro requested, no reply yet"/></label><label className="field">Activity date<input name="date" type="date" required/></label></div><Field name="body" label="Details, contact and source" area/><button className="btn-primary">Record activity</button>
   </form>
   {(job.interactions || []).map(i=><article className="record" key={i.id}><strong>{i.subject}</strong><p>{new Date(i.interacted_at).toLocaleDateString('en-AU')}</p><p className="preserve-text">{i.body}</p></article>)}
  </div>}
  {tab==='Documents' && <div className="workspace-card">
   <h2>Tailored documents and outreach drafts</h2><p>Start from your <a href="/story">master evidence</a>. Keep personal and team contributions clear. Saving a draft sends nothing.</p>
   {!store.master.body && <p className="notice">Add your master evidence first. Drafts can still be saved with their source recorded.</p>}
   {w.documents.map(d=><article key={d.id} className="record"><h3>{d.title}</h3><p>{d.state==='submitted'?'Submitted record · immutable':'Draft'}{d.state==='draft' && d.masterRevision!==store.master.revision ? ' · Master changed: review this draft' : ''}</p><p>Source: {d.source}</p><p className="preserve-text">{d.body}</p><div className="button-row"><button className="btn-ghost" onClick={()=>{const a=document.createElement('a');const u=URL.createObjectURL(new Blob([d.body],{type:'text/plain'}));a.href=u;a.download='candor-document.txt';a.click();URL.revokeObjectURL(u);}}>Download text</button>{d.state==='draft' && <><button className="btn-ghost" onClick={()=>setEditingDoc(d)}>Edit draft</button><button className="btn-ghost" onClick={async ()=>{const date=window.prompt('Record an actual submission. Enter its date (YYYY-MM-DD). This does not send anything.');if(!date)return;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))){setMessage('Enter a valid date.');return;}await save({workflow:{...w,documents:w.documents.map(x=>x.id===d.id?{...d,state:'submitted',submittedAt:date}:x)}});}}>Record as submitted</button></>}</div>{d.history.length>0 && <details><summary>{d.history.length} archived draft versions</summary>{d.history.map((h,i)=><div className="record" key={i}><p>{h.savedAt} · {h.source}</p><pre>{h.body}</pre></div>)}</details>}</article>)}
   <form key={editingDoc?.id || 'new'} onSubmit={saveDocument}><h3>{editingDoc?'Edit draft':'New draft'}</h3><div className="field-grid"><label className="field">Document title<input name="title" required defaultValue={editingDoc?.title || ''} placeholder="Tailored CV, cover letter or outreach"/></label><label className="field">Evidence source / source note<input name="source" required defaultValue={editingDoc?.source || ''}/></label></div><label className="field">Draft text<textarea name="body" required rows={10} defaultValue={editingDoc?.body || ''}/></label><label className="check-label"><input type="checkbox" required/>I checked this draft against the current master and source, including qualifications and team attribution.</label><div className="button-row"><button className="btn-primary">Save draft</button>{editingDoc && <button type="button" className="btn-ghost" onClick={()=>setEditingDoc(null)}>Cancel edit</button>}</div></form>
  </div>}
 </main>;
}
