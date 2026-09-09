"""Apply only after the main task has finished concurrent app.html edits."""
from pathlib import Path
import re
p = Path(__file__).resolve().parent.parent / 'app.html'
s = p.read_text()
if 'function safeWebUrl(' not in s:
    anchor = "const todayISO = "
    helper = """// Imported data is untrusted: escaping text does not validate URL schemes.
function safeWebUrl(value) {
  const text = String(value || '').trim();
  if (/[\\u0000-\\u0020\\u007f]/.test(text)) return '';
  try {
    const url = new URL(text);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch (_) { return ''; }
}
"""
    assert anchor in s
    s = s.replace(anchor, helper + anchor, 1)
# Record IDs appear in rendered HTML attributes. Keep their exact underlying values.
s = re.sub(r"\+ ([A-Za-z][A-Za-z0-9_]*\.(?:id|appId|variantId|roleId|summaryId)) \+", r"+ esc(\1) +", s)
for field in ['c.linkedin', 'a.jdUrl', 'l.url']:
    s = s.replace('esc(' + field + ')', 'esc(safeWebUrl(' + field + '))')
s = s.replace('rel="noopener"', 'rel="noopener noreferrer"')
s = s.replace('data-tab="\' + tab +', 'data-tab="\' + esc(tab) +')
# Theme labels and values are user/import content, not trusted HTML.
s = s.replace("' data-theme=\"' + t +", "' data-theme=\"' + esc(t) +")
s = s.replace("data-theme=\"' + t +", "data-theme=\"' + esc(t) +")
s = s.replace("value=\"' + t +", "value=\"' + esc(t) +")
s = s.replace("'>' + t + '</button>'", "'>' + esc(t) + '</button>'")
s = s.replace("'>' + t + '</label>'", "'>' + esc(t) + '</label>'")
s = s.replace("'>' + t + '</label>", "'>' + esc(t) + '</label>")
s = s.replace("\">' + t + '</button>'", "\">' + esc(t) + '</button>'")
s = s.replace("\">' + t + '</label>'", "\">' + esc(t) + '</label>'")
for value in ['w.outreach', 'w.applications']:
    s = s.replace("+ " + value + " + '</span>", "+ esc(" + value + ") + '</span>")
s = s.replace("'I\\'m an analyst at Deloitte in Brisbane moving into product.'", "'[Add one accurate sentence about your background and why this role interests you.]'")
s = s.replace("toast(st ? 'Draft ready — swap in a story if it earns its place' : 'Draft ready — send it');", "toast('Draft outline ready — verify every fact and replace placeholders before copying');")
s = s.replace('Write it for me', 'Start a draft outline')
s = s.replace('Why this shape: structured behavioural interviews are scored against rubrics that expect a situation, the action <b>you</b> took, and a concrete result — and interview coaching measurably raises structured-interview scores (Maurer et al., <i>J. Applied Psychology</i>). The Result line doubles as the proof-sentence your outreach drafts pull from. Say S and T in one breath; spend the interview on A and R.', 'Record the situation, your task, the action <b>you</b> took, and the result you can support. Distinguish your contribution from the team’s. Keep source notes so you can check wording before reusing a story in an application.')

# These are app guidance, not the user's stored career evidence.
s = re.sub(r"const ROUTE_HINTS = \{[\s\S]*?\n\};", """const ROUTE_HINTS = {
  'Peer in the role': 'Look for someone doing similar work. Ask a specific question about the role, and record what they actually tell you.',
  'Mutual (2nd degree)': 'Ask a shared contact whether they know the person well enough to introduce you. Give them an easy way to decline.',
  'Hiring manager': 'Check the listing or company information for the reporting line. Do not assume a contact controls hiring decisions.',
  'Recruiter': 'Use a published recruitment contact or an existing introduction. Confirm contact details rather than guessing an email address.',
  'Cold': 'Explain why you chose this person, keep the request specific, and respect silence or a decline.',
};""", s, count=1)
s = s.replace('Routes ordered by evidence, not vibes.', 'Common contact routes; choose the one that fits the relationship.')
s = s.replace('Warm: find a person first (referrals convert ~30x). Direct: straight application (still 52% of startup hires).', 'Warm: explore an existing connection. Direct: prepare and submit an application. Choose per role.')
s = s.replace('Shorter asks beat longer ones — Cochrane meta-analysis, questionnaire response: <b>shortening the ask OR 1.73</b>, following up <b>OR 1.35</b>, personalising <b>OR 1.24</b>. Personalisation is the <i>weakest</i> of the three. Under 120 words.', 'Use a specific, accurate reason for reaching out. Make the request easy to understand and review the draft before sending it yourself.')
s = s.replace('A short note to one person after applying still beats the pile — referrals convert ~30x per application, and it takes one name. The application stands either way.', 'If you have a relevant contact or a useful question, you can add outreach after applying. It is optional; your submitted application stands either way.')
s = s.replace('In the 61,293-person gym megastudy (Milkman et al., <i>Nature</i> 2021, 54 arms tested), the top-ranked intervention of all 54 was a bonus for <b>returning after a missed session</b>. Rewarding an unbroken run ranked nowhere. Coming back is the thing that gets rewarded here.', 'A missed week does not erase earlier work. Review what matters now and choose a manageable next action.')
for key, text in {
  'setup': 'Add a role, understand the work, and choose your next action. Dismiss this guide whenever it is no longer useful.',
  'week': 'Counts the actions you record this week. Targets are optional planning aids; they do not predict interviews or offers.',
  'funnels': 'Shows the stages recorded in your pipeline. With a small personal sample, percentages describe these records only and do not predict future outcomes.',
}.items():
  s = re.sub(r"(  " + key + r": )'[^\n]*',", lambda m: m.group(1) + repr(text) + ',', s, count=1)
s = re.sub(r"/\* A first draft you edit,[\s\S]*?\*/", '/* A draft outline to check and edit using your own evidence. */', s, count=1)
s = re.sub(r"/\* One click = the behaviour is recorded\.[\s\S]*?\*/", '/* Records an action the user says they have already taken. */', s, count=1)
s = re.sub(r"/\* Ashby \(93K jobs\):[\s\S]*?\*/", '/* Posting age is context, not a reason to delay a ready application. */', s, count=1)

p.write_text(s)
print('Applied standalone security patch: safe web links, escaped imported IDs/themes/targets, evidence-led draft outline.')
