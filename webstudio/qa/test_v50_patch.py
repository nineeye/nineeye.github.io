#!/usr/bin/env python3
"""Synthetic V49 fixture patch testing, no actual repository access."""
import tempfile,sys,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'webstudio/tools'))
from apply_v50 import apply
results=[]
def ok(n,b): results.append({'name':n,'pass':bool(b)});print('FAIL',n) if not b else None
with tempfile.TemporaryDirectory(prefix='afo-v50-patch-') as d:
 root=Path(d);site=root/'webstudio/site-check.html';site.parent.mkdir(parents=True);site.write_text('<!doctype html><main>Old V48 audit preserved</main>\n<footer>Old footer</footer>','utf-8')
 manifest=root/'webstudio/assets/current-release.json';manifest.parent.mkdir(parents=True);manifest.write_text(json.dumps({'product':'AllFileOne WebStudio','version':'V49','demo_count':36,'sales_audit_public_checks':16}),encoding='utf-8')
 o=apply(root,ROOT)
 ok('updated 5 paths',len(o['paths'])==5)
 ok('no duplicate v50 anchor',site.read_text().count('id="v50-owner-link"')==1)
 ok('preserved older V48 site-check content','Old V48 audit preserved' in site.read_text())
 ok('preserved older website footer','Old footer' in site.read_text())
 ok('owner link exists','./owner-launch.html' in site.read_text())
 j=json.loads(manifest.read_text())
 ok('new release is V50',j.get('version')=='V50')
 ok('old demo_count preserved',j.get('demo_count')==36)
 ok('old V48 audit preserved',j.get('sales_audit_public_checks')==16)
 ok('no real email claim',j.get('owner_readiness_real_email_verified') is False)
 ok('no search index claim',j.get('owner_readiness_search_index_verified') is False)
 ok('11 auto checks',j.get('owner_readiness_auto_checks')==11)
 ok('10 manual checks',j.get('owner_readiness_manual_self_checks')==10)
 before={p:p.read_bytes() for p in root.rglob('*') if p.is_file()}
 apply(root,ROOT)
 after={p:p.read_bytes() for p in root.rglob('*') if p.is_file()}
 ok('idempotent second apply',before==after)
 ok('owner page exists',(root/'webstudio/owner-launch.html').is_file())
 ok('new js present',(root/'webstudio/assets/v50-owner-launch.js').is_file())
 ok('new css present',(root/'webstudio/assets/v50-owner-launch.css').is_file())
 ok('manifest parses clean',j['release_id']=='WEBSTUDIO-V50-20261108')
 ok('all returned SHA matches',all(hashlib.sha256((root/path).read_bytes()).hexdigest()==digest for path,digest in o['sha256'].items()))
 j['version']='V48';manifest.write_text(json.dumps(j),encoding='utf-8')
 try: apply(root,ROOT)
 except ValueError:ok('unrelated version rejected',True)
 else:ok('unrelated version rejected',False)
 ok('rejection did not mutate source',site.read_bytes()==before[site])
report={'release':'V50','scope':'synthetic V49 fixture, patch idempotence and guards','total':len(results),'pass':sum(x['pass'] for x in results),'fail':sum(not x['pass'] for x in results),'results':results}
(ROOT/'webstudio/qa/V50_PATCH_QA_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print(f'V50 PATCH QA {report["pass"]}/{report["total"]} PASS');sys.exit(report['fail']>0)
