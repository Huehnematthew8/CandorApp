from pathlib import Path
p=Path('app.html');s=p.read_text()
a=s.index('function resumeText() {');b=s.index('\nfunction resumePreview()',a)
s=s[:a]+'''function resumeTextFor(m,v) {
 const lines=[m.header.name.toUpperCase(),v && v.headline || m.header.headline,[m.header.location,m.header.email,m.header.phone].filter(Boolean).join(' | '),m.header.links.map(l=>l.label+': '+l.url).join(' | ')];
 const picked=(kind,item)=>v ? !!((v[kind]||{})[item.id]) : item.core!==false;
 const sum=v ? m.summaries.find(x=>x.id===v.summaryId) : m.summaries.find(x=>x.core!==false);
 if(sum)lines.push('','SUMMARY',sum.text);
 [['EXPERIENCE',m.roles],['EDUCATION',m.education]].forEach(([label,roles])=>{
  const kept=roles.map(r=>({r,bs:r.bullets.filter(x=>picked('picks',x))})).filter(x=>x.bs.length);
  if(kept.length)lines.push('',label);
  kept.forEach(({r,bs})=>{lines.push('',r.org+' | '+r.title+' ('+r.start+' to '+r.end+')');bs.forEach(b=>lines.push(' • '+(v && v.overrides && v.overrides[b.id] || b.text)));});
 });
 const ach=m.achievements.filter(x=>picked('achievementPicks',x));if(ach.length)lines.push('','ACHIEVEMENTS',...ach.map(x=>' • '+x.text));
 const skills=m.skills.filter(x=>v?picked('skillPicks',x):true);if(skills.length)lines.push('','SKILLS',skills.map(x=>x.text).join(' · '));
 return lines.join('\\n');
}
function resumeText() {
 const v=activeVariant();
 return v && v.submittedSnapshot ? v.submittedSnapshot.text : resumeTextFor(resumeMaster(),v);
}
let evidenceBaseline=null;
function resetEvidenceBaseline(){evidenceBaseline=JSON.parse(JSON.stringify(state.resume));}
function checkpointEvidence(){
 if(!evidenceBaseline){resetEvidenceBaseline();return;}
 const old=evidenceBaseline, cur=state.resume;
 if(JSON.stringify(old.master)!==JSON.stringify(cur.master)){
  cur.history=cur.history||[];cur.history.push({savedAt:new Date().toISOString(),master:old.master});
  cur.master.revision=uid('master');
 }
 (cur.variants||[]).forEach(v=>{
  const prev=(old.variants||[]).find(x=>x.id===v.id);
  if(prev && prev.submittedSnapshot)v.submittedSnapshot=prev.submittedSnapshot;
  if(prev && !prev.submittedSnapshot && (JSON.stringify(prev)!==JSON.stringify(v) || JSON.stringify(old.master)!==JSON.stringify(cur.master))){
   v.history=(prev.history||[]).concat([{savedAt:new Date().toISOString(),text:resumeTextFor(old.master,prev),source:old.master.source||''}]);
  }
 });
 resetEvidenceBaseline();
}
function recordSubmitted(id){
 const v=variantById(id);if(!v || v.submittedSnapshot)return;
 const text=resumeTextFor(resumeMaster(),v);
 if(/\\[NEEDS YOUR INPUT\\]|\\[CONFIRM DATES\\]/.test(text)){toast('Resolve placeholders before recording submission.');return;}
 openModal('<h3>Record a submitted copy<button class="x" data-action="close-modal">✕</button></h3><p>This records an application you already submitted. It sends nothing. The text below becomes immutable.</p><pre class="respre">'+esc(text)+'</pre><form>'+field('Actual submission date',inp('date','','type="date" required'))+'<label><input type="checkbox" required name="checked"> I checked this exact text against my submitted document and source evidence.</label><div class="modal-foot"><button class="btn primary">Save submitted record</button></div></form>',fd=>{
  v.submittedSnapshot={text,date:String(fd.get('date')),masterRevision:resumeMaster().revision||'',source:resumeMaster().source||''};
  closeModal();markDirty();toast('Submitted text preserved.');
 },true);
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 if(el.dataset.action==='record-submitted'){e.preventDefault();recordSubmitted(el.dataset.id);}
 if(el.dataset.action==='review-variant'){const v=activeVariant();if(v&&!v.submittedSnapshot){v.masterRevision=resumeMaster().revision;markDirty();toast('Draft reviewed against this master revision.');}}
 if(el.dataset.action==='res-history'){
  const v=activeVariant();const rows=v?(v.history||[]):(state.resume.history||[]).map(h=>({savedAt:h.savedAt,text:resumeTextFor(h.master,null),source:h.master.source||''}));
  openModal('<h3>Archived versions<button class="x" data-action="close-modal">✕</button></h3>'+ (rows.length?rows.slice().reverse().map(h=>'<details><summary>'+esc(h.savedAt)+' · '+esc(h.source||'')+'</summary><pre class="respre">'+esc(h.text)+'</pre></details>').join(''):'<p>No earlier edits yet.</p>'),null,true);
 }
 if(el.dataset.action==='res-del-variant' && variantById(el.dataset.id)?.submittedSnapshot){e.stopImmediatePropagation();toast('Submitted copies are immutable. Archive the opportunity to retain this record.');}
},true);
''' + s[b:]
# Baseline after bootstrap, before user edits.
s=s.replace("/* ---------------- Theme ---------------- */", "resetEvidenceBaseline();\n\n/* ---------------- Theme ---------------- */")
# Display immutable copy, with the same sidebar navigation.
needle="  const gapBanner = gaps.length"
s=s.replace(needle,"""  if(v && v.submittedSnapshot)return '<div class="res-shell">'+rail+'<div class="res-main"><div class="content-inner"><h2>'+esc(v.name)+'</h2><p>Submitted '+esc(v.submittedSnapshot.date)+'. This text is immutable; later master edits do not change it.</p><p>Source: '+esc(v.submittedSnapshot.source||'Not recorded')+'</p><button class="btn" data-action="res-preview">Preview & copy</button><pre class="respre">'+esc(v.submittedSnapshot.text)+'</pre></div></div></div>';
  const gapBanner = gaps.length""")
s=s.replace("gapBanner + header + themeChips + notes + summaries", "'<p class=\"banner\">Source: '+esc(m.source || 'Source not recorded')+'. Local copy; no automatic vault sync.</p>'+ (v && v.masterRevision!==m.revision ? '<p class=\"banner warn\">Master evidence changed. Review this draft before reuse. <button class=\"btn sm\" data-action=\"review-variant\">I reviewed this version</button></p>' : '') + gapBanner + header + themeChips + notes + summaries")
s=s.replace("'<button class=\"btn sm\" data-action=\"res-preview\">Preview & copy</button>'", "'<button class=\"btn sm\" data-action=\"res-history\">Version history</button>' +\n    (v ? '<button class=\"btn sm\" data-action=\"record-submitted\" data-id=\"'+esc(v.id)+'\">Record submitted copy</button>' : '') +\n    '<button class=\"btn sm\" data-action=\"res-preview\">Preview & copy</button>'")
s=s.replace("createdAt: todayISO(), updatedAt: todayISO(),\n          picks:", "createdAt: todayISO(), updatedAt: todayISO(), masterRevision: m.revision || '',\n          picks:")
# A source is required for changed master bullets. Variant edits get an explicit text override.
s=s.replace("const b = found ? found.bullet : null;\n  const role", "const b = found ? found.bullet : null;\n  const tailoring = activeVariant();\n  const role")
s=s.replace("esc(b ? b.text : '') + '</textarea>'", "esc(b ? (tailoring && tailoring.overrides && tailoring.overrides[b.id] || b.text) : '') + '</textarea>'")
s=s.replace("field('Themes — used for tailoring", "field('Source note / evidence', inp('source', b && b.source || resumeMaster().source, 'required')) + '</div><div class=\"full\">' + field('Themes — used for tailoring",1)
s=s.replace("if (b) {\n        b.text = text;", "if(tailoring && b){tailoring.overrides=tailoring.overrides||{};tailoring.overrides[b.id]=text;tailoring.notes=(tailoring.notes||'')+'\\nBullet source: '+String(fd.get('source')||'');closeModal();markDirty();toast('Tailored wording saved. Add new facts to the master first.');return;}\n      if (b) {\n        b.source=String(fd.get('source')||''); b.text = text;")
s=s.replace("'<div class=\"rbody\"><div class=\"rtext\">' + esc(b.text)", "'<div class=\"rbody\"><div class=\"rtext\">' + esc(v && v.overrides && v.overrides[b.id] || b.text)")
s=s.replace("esc(b.text) + '</div>' + themePills", "esc(b.text) + '</div>' + themePills")
# Expose and maintain story provenance rather than treating an old anecdote as ready evidence.
s=s.replace("field('Title *', inp('title',", "field('Title *', inp('title',")
a=s.index('function storyForm(');b=s.index('/* Doc form */',a);block=s[a:b]
block=block.replace("'<form><div class=\"fgrid\">' +", "'<form><div class=\"fgrid\">' + '<div class=\"full\">'+field('Source / provenance', inp('evidenceSource',s && s.source,'required'))+'</div><div class=\"full\"><label><input type=\"checkbox\" name=\"reviewed\" '+(s && !s.needsReview?'checked':'')+'> Checked against current master and source</label></div>' +",1)
block=block.replace("if (!s) state.stories.push(obj);", "obj.source=String(fd.get('evidenceSource')||'');obj.needsReview=!fd.get('reviewed');\n      if (!s) state.stories.push(obj);")
s=s[:a]+block+s[b:]
p.write_text(s)
print('Evidence revisions, tailored wording and submitted snapshots applied')
