#!/usr/bin/env python3
"""V52 fail-closed patch tests with V51-shaped fixtures; not a live repository test."""
import json,tempfile,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'webstudio/tools'))
from apply_v52 import patch,NEW,SECTORS
results=[]
def ok(name,condition):
    results.append({'name':name,'pass':bool(condition)})
    if not condition:print('FAIL',name)
with tempfile.TemporaryDirectory(prefix='v52-') as td:
    root=Path(td);assets=root/'webstudio/assets';assets.mkdir(parents=True)
    (assets/'current-release.json').write_text(json.dumps({'product':'AllFileOne WebStudio','version':'V51','demo_count':36,'function_count':48}),encoding='utf-8')
    for key in SECTORS:
        (root/f'webstudio/for-{key}.html').write_text(f'<html><head></head><body><div class="hero-actions"><a href="./demo/{key}/modern/index.html">실제 업종 시연 체험 ↗</a><a href="#live-demo">업종별 기능 직접 체험 ↓</a></div></body></html>',encoding='utf-8')
    (root/'webstudio/design-gallery-v13.html').write_text('<html><head></head><body><main><section class="compare" id="compare">36 original cards</section></main></body></html>',encoding='utf-8')
    updated=patch(root,ROOT)
    ok('patch applied',updated['status']=='applied')
    ok('eight files copied',len(NEW)==8 and all((root/f).is_file() for f in NEW))
    for key in SECTORS:
        c=(root/f'webstudio/for-{key}.html').read_text('utf-8')
        ok(key+' flagship CTA',f'./flagship/{key}.html' in c)
        ok(key+' older style link preserved',f'./demo/{key}/modern/index.html' in c)
    gallery=(root/'webstudio/design-gallery-v13.html').read_text('utf-8')
    ok('gallery CTA before old compare',gallery.index('id="v52-featured"')<gallery.index('class="compare"'))
    ok('gallery three links',all(f'flagship/{key}.html' in gallery for key in SECTORS))
    ok('gallery 36 cards marker retained','36 original cards' in gallery)
    ok('manifest V52',json.loads((assets/'current-release.json').read_text())['version']=='V52')
    before={f:(root/f).read_bytes() for f in NEW}
    previous={key:(root/f'webstudio/for-{key}.html').read_bytes() for key in SECTORS}
    again=patch(root,ROOT)
    ok('idempotent',again['status']=='already_applied' and all((root/f).read_bytes()==b for f,b in before.items()) and all((root/f'webstudio/for-{key}.html').read_bytes()==b for key,b in previous.items()))
    (assets/'current-release.json').write_text(json.dumps({'version':'V50'}),encoding='utf-8')
    try:patch(root,ROOT);rejected=False
    except RuntimeError:rejected=True
    ok('older release rejected',rejected)
report={'release':'V52','scope':'synthetic V51-shaped source fixture for patch safety, idempotence, old links retained','total':len(results),'passed':sum(x['pass'] for x in results),'failed':sum(not x['pass'] for x in results),'results':results}
(ROOT/'webstudio/qa/V52_PATCH_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('PATCH',report['passed'],'/',report['total']);raise SystemExit(bool(report['failed']))
