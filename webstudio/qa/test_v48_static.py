#!/usr/bin/env python3
"""Offline V48 static/regression/self-preflight. No Chrome, network, paid services required."""
from pathlib import Path
import json,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
WEB=ROOT/'webstudio'
sys.path.insert(0,str(WEB/'tools'))
from apply_v48 import patch,LINK,SCRIPT,META,SECTION,REL_FILES
results=[]
def check(name,cond):
 results.append({'name':name,'pass':bool(cond)})
 if not cond: print('FAIL',name)
for rel in REL_FILES:check('source present '+rel,(WEB/rel).is_file())
js=(WEB/'assets/v48-sales-audit.js').read_text('utf-8')
css=(WEB/'assets/v48-sales-audit.css').read_text('utf-8')
for token in ('credentials:\'omit\'','cache:\'no-store\'','url.origin!==root.origin','fetch(url.href','16','AbortController','response.ok','no-store','RULES','v48-save','v48-copy'):
 check('safe source '+token,token in js)
for token in ('sessionStorage.getItem','localStorage.setItem','navigator.sendBeacon','eval(', 'innerHTML','mailto:'):
 check('reject '+token,token not in js)
check('CSS responsive','@media(max-width:600px)' in css)
with tempfile.TemporaryDirectory(prefix='afo48_static_') as d:
 repo=Path(d)/'repo';dst=repo/'webstudio';(dst/'assets').mkdir(parents=True)
 (dst/'site-check.html').write_text('<html><head></head><body><main><button id="run-quick">check</button></main></body></html>',encoding='utf-8')
 (dst/'assets/current-release.json').write_text('{"product":"AllFileOne WebStudio","version":"V47","demo_count":36}',encoding='utf-8')
 (dst/'assets/v47-mail-packet.js').write_text('// V47',encoding='utf-8')
 before=patch(repo,ROOT)
 check('patch has release',before['release']=='V48')
 html=(dst/'site-check.html').read_text('utf-8')
 manifest=json.loads((dst/'assets/current-release.json').read_text('utf-8'))
 for token in (LINK,SCRIPT,META,SECTION):check('patch inject '+token[:30],token in html)
 check('V47 demo count retained',manifest.get('demo_count')==36)
 check('manifest V48',manifest.get('version')=='V48')
 check('V48 release json same',(dst/'assets/release-v48.json').read_bytes()==(dst/'assets/current-release.json').read_bytes())
 original={str(p):p.read_bytes() for p in dst.rglob('*') if p.is_file()}
 again=patch(repo,ROOT)
 check('second patch idempotent',original=={str(p):p.read_bytes() for p in dst.rglob('*') if p.is_file()})
 check('patch one widget',html.count('id="v48-sales-audit"')==1)
 (dst/'assets/current-release.json').write_text('{"product":"AllFileOne WebStudio","version":"V40"}',encoding='utf-8')
 previous=(dst/'site-check.html').read_bytes()
 try:patch(repo,ROOT);rejected=False
 except RuntimeError:rejected=True
 check('refuses unsupported base version',rejected)
 check('rejected version leaves page unchanged',(dst/'site-check.html').read_bytes()==previous)
report={'release':'V48','suite':'offline stdlib static, idempotency, negative tests','passed':sum(x['pass'] for x in results),'failed':sum(not x['pass'] for x in results),'total':len(results),'cases':results}
(WEB/'qa/V48_STATIC_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('V48 static',report['passed'],'/',report['total'],'PASS')
if report['failed']:sys.exit(1)
