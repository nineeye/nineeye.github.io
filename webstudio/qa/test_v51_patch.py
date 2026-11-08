#!/usr/bin/env python3
"""V51 patch safety/idempotence tests using genuine V49 quick source and dummy V50 fixture."""
from __future__ import annotations
import tempfile,shutil,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];WEB=ROOT/'webstudio'
sys.path.insert(0,str(WEB/'tools'))
from apply_v51 import run
results=[]
def ok(label,p):
 results.append({'name':label,'pass':bool(p)});
 if not p:print('FAIL',label)
with tempfile.TemporaryDirectory(prefix='afo_v51_') as d:
 repo=Path(d);w=repo/'webstudio';(w/'assets').mkdir(parents=True)
 src=Path('/mnt/data/afo_v49/webstudio');shutil.copyfile(src/'quick-inquiry.html',w/'quick-inquiry.html')
 for f in ['v49-quick-inquiry.js','v49-quick-inquiry.css']:
  shutil.copyfile(src/'assets'/f,w/'assets'/f)
 (w/'assets/v50-owner-launch.js').write_text('/* V50 marker */','utf-8')
 (w/'contact.html').write_text('<!doctype html><html><head></head><body><form id="brief-form"></form></body></html>','utf-8')
 (w/'assets/current-release.json').write_text(json.dumps({'product':'AllFileOne WebStudio','version':'V50','demo_count':36}),encoding='utf-8')
 (w/'DO_NOT_TOUCH.txt').write_text('ORIGINAL V50 FILE','utf-8')
 old=(w/'quick-inquiry.html').read_bytes()
 test=run(repo,ROOT,apply=False)
 ok('check mode detects 5 modifications',test['count']==5)
 ok('check mode is read-only', (w/'quick-inquiry.html').read_bytes()==old and not (w/'assets/v51-quick-handoff.js').exists())
 first=run(repo,ROOT,apply=True)
 ok('applied 5 files',first['count']==5)
 ok('actual script to quick', 'v51-quick-handoff.js' in (w/'quick-inquiry.html').read_text('utf-8'))
 ok('actual script to contact','v51-quick-handoff.js' in (w/'contact.html').read_text('utf-8'))
 ok('manifest V51',json.loads((w/'assets/current-release.json').read_text('utf-8'))['version']=='V51')
 ok('existing V49 script preserved',(w/'assets/v49-quick-inquiry.js').read_bytes()==(src/'assets/v49-quick-inquiry.js').read_bytes())
 ok('existing V50 file preserved',(w/'DO_NOT_TOUCH.txt').read_text('utf-8')=='ORIGINAL V50 FILE')
 second=run(repo,ROOT,apply=True)
 ok('repeat does nothing',second['count']==0)
 ok('script not duplicated',(w/'quick-inquiry.html').read_text('utf-8').count('src="./assets/v51-quick-handoff.js"')==1)
 ok('contact not duplicated',(w/'contact.html').read_text('utf-8').count('src="./assets/v51-quick-handoff.js"')==1)
 ok('36 demo declaration unchanged',json.loads((w/'assets/current-release.json').read_text('utf-8'))['demo_count']==36)
 (w/'assets/current-release.json').write_text(json.dumps({'version':'V44'}),encoding='utf-8')
 try:run(repo,ROOT,apply=True);oldrejected=False
 except ValueError:oldrejected=True
 ok('wrong version refused',oldrejected)
 (w/'assets/current-release.json').write_text(json.dumps({'version':'V51'}),encoding='utf-8')
 (w/'assets/v51-quick-handoff.js').write_text('tampered',encoding='utf-8')
 try:run(repo,ROOT,apply=True);conflictrefused=False
 except ValueError:conflictrefused=True
 ok('modified V51 source refused',conflictrefused)
 (w/'assets/v51-quick-handoff.js').write_text((WEB/'assets/v51-quick-handoff.js').read_text('utf-8'),encoding='utf-8')
 (w/'assets/v49-quick-inquiry.js').unlink()
 try:run(repo,ROOT,apply=True);missingrefused=False
 except ValueError:missingrefused=True
 ok('missing V49 prerequisite refused',missingrefused)
meta={'version':'V51','total':len(results),'passed':sum(x['pass'] for x in results),'failed':sum(not x['pass'] for x in results),'results':results}
(WEB/'qa/V51_PATCH_QA_RESULTS.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n','utf-8')
print(f'PATCH {meta["passed"]}/{meta["total"]} PASS')
sys.exit(bool(meta['failed']))
