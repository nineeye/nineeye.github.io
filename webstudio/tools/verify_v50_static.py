#!/usr/bin/env python3
"""V50 strict stdlib-only checks; does NOT certify production web/email/indexing."""
import json,re,sys,html.parser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
HTML=ROOT/'webstudio/owner-launch.html'
JS=ROOT/'webstudio/assets/v50-owner-launch.js'
CSS=ROOT/'webstudio/assets/v50-owner-launch.css'
PATCH=ROOT/'webstudio/tools/apply_v50.py'
checks=[]
def ok(label, condition): checks.append((label,bool(condition)))
for p in (HTML,JS,CSS,PATCH):ok('exists '+p.name,p.exists() and p.stat().st_size>100)
h=HTML.read_text('utf-8');j=JS.read_text('utf-8');css=CSS.read_text('utf-8');patch=PATCH.read_text('utf-8')
class Tags(html.parser.HTMLParser):
    def __init__(self): super().__init__();self.links=[];self.ids=[];self.inputs=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if 'id' in d:self.ids.append(d['id'])
        if tag=='a':self.links.append(d.get('href',''))
        if tag=='input':self.inputs.append(d)
parser=Tags();parser.feed(h)
ok('HTML parser',len(parser.ids)>12)
ok('no duplicate element ids',len(parser.ids)==len(set(parser.ids)))
for s in ('auto-run','auto-count','auto-results','manual-list','manual-count','report-preview','report-copy','report-download','report-status','report-text'):ok('needed id '+s,s in parser.ids)
ok('10 manual owner checks',len([x for x in parser.inputs if x.get('data-check')])==10)
ok('manual inputs checkbox only',all(x.get('type')=='checkbox' for x in parser.inputs))
ok('owner page noindex','name="robots" content="noindex,nofollow,noarchive"' in h)
ok('HTML no external scripts',not re.search(r'<script[^>]*src="https?://',h))
ok('HTML no external styles',not re.search(r'<link[^>]*stylesheet[^>]*href="https?://',h))
ok('local assets linked',all('assets/'+x in h for x in ('v50-owner-launch.js','v50-owner-launch.css')))
for s in ('site-check.html','quick-inquiry.html','sitemap.xml','robots.txt','assets/current-release.json') :ok('expected check file '+s,s in j or s in h)
for forbidden in ('localStorage','sessionStorage','document.cookie','sendBeacon','XMLHttpRequest','/api/inquiries','innerHTML','eval('):ok('safe JS no '+forbidden,forbidden not in j)
ok('only GET-ish public fetch',"credentials:'omit'" in j and "cache:'no-store'" in j and 'fetch(u.href' in j)
ok('guard origin',"u.origin!==origin.origin" in j)
ok('bounded response size','1200000' in j)
ok('timeout and abort','AbortController' in j and '8000' in j)
ok('rule source count','const RULES = [' in j and 'industries.map(x=>' in j)
ok('report separates manual checks','자체 확인' in j)
ok('no pretend receipt',all(s in h for s in ('실제 이메일 수신','검색 색인','자동 검사하지 않습니다')))
ok('links to official sources',all(x in h for x in ('searchadvisor.naver.com','search.google.com/search-console','mail.naver.com')))
ok('responsive small screens','@media(max-width:600px)' in css)
ok('focus-visible styles',':focus-visible' in css)
ok('reduced motion','prefers-reduced-motion' in css)
ok('patch anchored before main',"replace('</main>'" in patch)
ok('patch idempotent',"'id=\"v50-owner-link\"' in original" in patch)
ok('manifest guard',"('V49','V50')" in patch)
ok('patch no paid network','urlopen(' not in patch and 'requests.' not in patch)
ok('nothing stored in browser',not any(x in j for x in ['localStorage','sessionStorage']))
report={'version':'V50','scope':'static source audit, NOT real production','tests':len(checks),'pass':sum(p for _,p in checks),'fail':sum(not p for _,p in checks),'results':[{'name':n,'pass':p} for n,p in checks]}
path=ROOT/'webstudio/qa/V50_STATIC_QA_RESULTS.json';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'V50 STATIC QA {report["pass"]}/{report["tests"]} PASS');
for name,success in checks:
 if not success: print('FAIL',name)
sys.exit(1 if report['fail'] else 0)
