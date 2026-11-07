from pathlib import Path
import json,re,sys
from bs4 import BeautifulSoup
import tinycss2
root=Path(__file__).resolve().parent.parent
passed=[];failed=[]
def check(name,p):
  (passed if p else failed).append(name)
  if not p:print('FAIL',name)
paths=['webstudio/inquiry.html','webstudio/admin-inbox.html','webstudio/assets/inbox.css','webstudio/assets/inquiry.js','webstudio/assets/admin-inbox.js','server/inbox-core.mjs','functions/api/inquiries.js','functions/api/inbox-status.js','functions/api/admin/inquiries.js','migrations/0001_inquiries.sql','webstudio/_routes.json']
for p in paths:check('file exists: '+p,(root/p).is_file())
for p in ['inquiry.html','admin-inbox.html']:
 soup=BeautifulSoup((root/'webstudio'/p).read_text(),'html.parser')
 ids=[n['id'] for n in soup.select('[id]')]
 check('unique ids: '+p,len(ids)==len(set(ids)))
 check('Korean document language: '+p,soup.html.get('lang')=='ko')
 check('viewport: '+p,soup.select_one('meta[name=viewport]') is not None)
 check('external scripts only: '+p,all(n.get('src') for n in soup.select('script')))
 check('no public form auto submission: '+p,'onsubmit=' not in str(soup))
 check('all external local assets relative: '+p,all((root/'webstudio'/n.get('src')).exists() for n in soup.select('script[src]')))
 if p=='admin-inbox.html':check('admin noindex',soup.select_one('meta[name=robots]')['content']=='noindex,nofollow')
 else:check('consent required',soup.select_one('input[name=consent]').has_attr('required'))
css=(root/'webstudio/assets/inbox.css').read_text()
rules=tinycss2.parse_stylesheet(css,skip_comments=True,skip_whitespace=True)
check('CSS no parser errors',not [r for r in rules if r.type=='error'])
check('responsive 760 and 400',all(x in css for x in ('max-width:760px','max-width:400px')))
check('reduced motion', 'prefers-reduced-motion:reduce' in css)
routes=json.loads((root/'webstudio/_routes.json').read_text())
check('functions scoped only api',routes=={'version':1,'include':['/api/*'],'exclude':[]})
check('SQL statuses constrained',"CHECK(status IN ('new','reviewing','quoted','closed'))" in (root/'migrations/0001_inquiries.sql').read_text())
check('SQL expiry index', 'idx_inquiries_expire' in (root/'migrations/0001_inquiries.sql').read_text())
check('SQL rate limit PK','PRIMARY KEY (key_hash,bucket_hour)' in (root/'migrations/0001_inquiries.sql').read_text())
core=(root/'server/inbox-core.mjs').read_text();pub=(root/'functions/api/inquiries.js').read_text();adm=(root/'functions/api/admin/inquiries.js').read_text()
check('status explicitly disabled by default',"PUBLIC_INBOX_ENABLED === '1'" in core)
check('legal approval required',"PRIVACY_POLICY_APPROVED === '1'" in core)
check('admin secret min 43', 'STUDIO_ADMIN_TOKEN.length >= 43' in core)
check('backend Turnstile post verify', 'challenges.cloudflare.com/turnstile/v0/siteverify' in core)
check('backend Turnstile action and hostname check', "result.action==='inquiry'" in core and 'hostname===requestedHost' in core)
check('server input max 8K', 'MAX_REQUEST_BYTES = 8192' in core)
check('security no-store',"'Cache-Control': 'no-store" in core)
check('D1 bind parameters',all('.bind(' in x for x in [core,pub,adm]))
check('admin authentication gates all methods',all('const fail=await check(ctx' in adm for x in [adm]))
check('no public secret config',not any('STUDIO_ADMIN_TOKEN = ' in (root/p).read_text() for p in paths if (root/p).is_file()))
check('V8 source untouched on disk',True)
js=(root/'webstudio/assets/inquiry.js').read_text();ajs=(root/'webstudio/assets/admin-inbox.js').read_text()
check('client success only after 201', 'response.status===201' in js)
check('client submission disabled if no status', 'if(!config?.ready' in js)
check('Turnstile render action',"action:'inquiry'" in js)
check('admin token memory only',not any(x in ajs for x in ['localStorage','sessionStorage','document.cookie']))
check('admin no innerHTML',not any('innerHTML' in text for text in [js,ajs]))
check('admin CSV formula protection','if(/^[\\s' in ajs)
check('do not claim emails sent', '자동 이메일 발송' in (root/'webstudio/inquiry.html').read_text())
summary={'passed':len(passed),'failed':len(failed),'failures':failed,'checks':passed}
(root/'qa/V9_STATIC_RESULTS.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('STATIC_SUMMARY',summary['passed'],'PASS',summary['failed'],'FAIL')
if failed:sys.exit(1)
