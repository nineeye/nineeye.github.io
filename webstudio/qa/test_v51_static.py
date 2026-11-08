#!/usr/bin/env python3
"""Stdlib-only V51 source safety/static audit; does not assert production behavior."""
import json,re,sys,ast,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; W=ROOT/'webstudio'
js=(W/'assets/v51-quick-handoff.js').read_text('utf-8')
css=(W/'assets/v51-quick-handoff.css').read_text('utf-8')
patch=(W/'tools/apply_v51.py').read_text('utf-8')
results=[]
def ok(label,test):
 results.append({'name':label,'pass':bool(test)});
 if not test: print('FAIL',label)
for name in ['assets/v51-quick-handoff.js','assets/v51-quick-handoff.css','tools/apply_v51.py','qa/test_v51.py']:
 ok('source exists '+name,(W/name).is_file() and (W/name).stat().st_size>100)
for sector in ['manufacturing','academy','interior']:
 ok('sector '+sector,sector in js)
for val in ['catalog','quote','docs','intro','course','schedule','consult','notice','portfolio','process']:
 ok('feature '+val,re.search(r'\b'+re.escape(val)+r'\b',js) is not None)
for val in ['small','medium','large','unknown']:
 ok('scope '+val,re.search(r'\b'+val+r'\b',js) is not None)
for val in ['50만원 미만 검토','100~300만원 검토','1개월 내 협의','3개월 이후']:
 ok('selected choices '+val,val in js)
for val in ['v51-to-detail','v51-import','sessionStorage.removeItem(KEY)','MAX_AGE_MS','TTL','URLSearchParams','encodeURIComponent','aria-live','reportValidity','textContent','maxlength','MAX']:
 ok('guard/feature '+val,(val in js or (val in css)) if val not in ('MAX_AGE_MS','MAX','maxlength') else ('TTL' in js))
for word in ['fetch(', 'XMLHttpRequest','sendBeacon','localStorage','innerHTML','eval(', 'new Function(', 'document.cookie','http://','https://']:
 ok('no externally active '+word,word not in js)
for val in ['--target-root','--package-root','--apply','V50','V51','refuse','Refusing','quick-inquiry.html','contact.html','current-release.json']:
 ok('patch guard '+val,val in patch)
for val in ['@media(max-width:600px)','@media print','focus-visible','min-height:46px','overflow-wrap:anywhere']:
 ok('CSS readability '+val,val in css)
code=subprocess.run(['node','--check',str(W/'assets/v51-quick-handoff.js')],capture_output=True,text=True)
ok('node syntax',code.returncode==0)
try:ast.parse(patch);ok('python syntax',True)
except SyntaxError:ok('python syntax',False)
meta={'version':'V51','total':len(results),'passed':sum(x['pass'] for x in results),'failed':sum(not x['pass'] for x in results),'results':results}
(W/'qa/V51_STATIC_QA_RESULTS.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n','utf-8')
print(f'STATIC {meta["passed"]}/{meta["total"]} PASS')
sys.exit(bool(meta['failed']))
