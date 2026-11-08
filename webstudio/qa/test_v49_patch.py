#!/usr/bin/env python3
"""V49 patch safety tests against faithful V48 anchors. No third-party dependencies."""
from __future__ import annotations
import json, sys, tempfile, shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'webstudio/tools'))
from apply_v49 import apply,SECTORS
results=[]
def check(name,expr):
    results.append({'name':name,'pass':bool(expr)})
    if not expr:print('FAIL',name)

def make_fixture(base:Path,release='V48'):
    site=base/'webstudio';(site/'assets').mkdir(parents=True,exist_ok=True)
    (site/'assets/v48-sales-audit.js').write_text('existing V48',encoding='utf-8')
    (site/'assets/current-release.json').write_text(json.dumps({'version':release,'product':'AllFileOne WebStudio','demo_count':36,'important_prior_value':'KEEP'},ensure_ascii=False)+'\n',encoding='utf-8')
    (site/'index.html').write_text('<html><head></head><body><main><div class="v22-actions"><a href="./contact.html">기존 상담</a></div></main></body></html>\n',encoding='utf-8')
    for industry in SECTORS:
        (site/f'for-{industry}.html').write_text(f'<html><head></head><body><div class="hero-actions"><a href="./contact.html?industry={industry}">기존 상담</a></div></body></html>\n',encoding='utf-8')
    (site/'contact.html').write_text('<html><head></head><body><section id="brief"><form id="brief-form"></form></section></body></html>\n',encoding='utf-8')
    (site/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://allfileone-webstudio.pages.dev/</loc></url></urlset>\n',encoding='utf-8')
    return site

with tempfile.TemporaryDirectory(prefix='afo-v49-patch-') as tmp:
    base=Path(tmp);site=make_fixture(base)
    old={str(p.relative_to(base)):p.read_bytes() for p in site.rglob('*') if p.is_file()}
    checked=apply(base,ROOT,write=False)
    check('check mode lists at least 10 affected paths',checked['count']>=10)
    check('preflight leaves source untouched',all((base/p).read_bytes()==value for p,value in old.items()))
    patch=apply(base,ROOT,write=True)
    check('apply actually changes files',patch['count']>=10)
    check('V49 four source artifacts copied',all((base/f).is_file() for f in ('webstudio/quick-inquiry.html','webstudio/assets/v49-quick-inquiry.css','webstudio/assets/v49-quick-inquiry.js','webstudio/assets/v49-entry.css')))
    check('new page HTML title', '<title>1분 홈페이지 제작 문의' in (site/'quick-inquiry.html').read_text('utf-8'))
    check('home CTA inserted once', (site/'index.html').read_text('utf-8').count('v49-cta-home')==1)
    for sector in SECTORS:
        html=(site/f'for-{sector}.html').read_text('utf-8')
        check(f'{sector} quick route correct',f'quick-inquiry.html?industry={sector}' in html)
        check(f'{sector} original link retained','기존 상담' in html)
        check(f'{sector} one new CTA',html.count('v49-cta-sector')==1)
    check('contact existing form preserved','id="brief-form"' in (site/'contact.html').read_text('utf-8'))
    check('contact quick route', '1분 빠른 문의' in (site/'contact.html').read_text('utf-8'))
    check('sitemap quick route', 'quick-inquiry.html' in (site/'sitemap.xml').read_text('utf-8'))
    latest=json.loads((site/'assets/current-release.json').read_text('utf-8'))
    check('release version updated',latest['version']=='V49')
    check('legacy data retained',latest['demo_count']==36 and latest['important_prior_value']=='KEEP')
    check('no customer data server submission declared',latest['quick_inquiry_server_submission'] is False)
    check('reapply does nothing',apply(base,ROOT,write=True)['count']==0)
    check('reapply output identical',apply(base,ROOT,write=False)['count']==0)
    check('V48 sales audit retained',(site/'assets/v48-sales-audit.js').read_text('utf-8')=='existing V48')
with tempfile.TemporaryDirectory(prefix='afo-v49-fail-') as tmp:
    base=Path(tmp);site=make_fixture(base,release='V47')
    try:apply(base,ROOT,write=True); check('wrong base release blocked',False)
    except ValueError:check('wrong base release blocked',True)
    check('wrong base never writes new page',not (site/'quick-inquiry.html').exists())
with tempfile.TemporaryDirectory(prefix='afo-v49-fail-') as tmp:
    base=Path(tmp);site=make_fixture(base);(site/'index.html').write_text('<html><head></head><body></body></html>')
    try:apply(base,ROOT,write=True);check('missing anchor blocked',False)
    except ValueError:check('missing anchor blocked',True)
    check('missing anchor never writes new page',not (site/'quick-inquiry.html').exists())
summary={'version':'V49','total':len(results),'passed':sum(x['pass'] for x in results),'failed':sum(not x['pass'] for x in results),'test_scope':'stdlib V48-shaped fixture patch safety / idempotence','results':results}
(ROOT/'webstudio/qa/V49_PATCH_QA_RESULTS.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PATCH:',summary['passed'],'/',summary['total'])
sys.exit(int(summary['failed']!=0))
