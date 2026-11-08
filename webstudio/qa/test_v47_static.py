#!/usr/bin/env python3
"""V47 stdlib-only file, patch and malicious-input guard tests; no external services."""
from __future__ import annotations
import importlib.util, json, re, tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[2]
web=root/'webstudio'
items=[]
def check(name,yes):
    items.append((name,bool(yes)))
    if not yes: print('FAIL',name)
js=(web/'assets/v47-mail-packet.js').read_text(encoding='utf-8')
css=(web/'assets/v47-mail-packet.css').read_text(encoding='utf-8')
for name in ['v47-copy-all','v47-download-all','v47-show-all','v46-full-report','aria-live','navigator.clipboard','reportValidity','noopener noreferrer','textContent','URL.revokeObjectURL','30','MAX']:
    check('required '+name,name in js)
for banned in ['fetch(', 'XMLHttpRequest','sendBeacon','localStorage','innerHTML','eval(', 'new Function(', 'https://api.']:
    check('forbid '+banned,banned not in js)
for piece in ['@media(max-width:560px)','overflow-wrap:anywhere','min-width:0','focus-visible']:
    check('css '+piece,piece in css)
check('no external font cdn',not re.search(r'@import|url\(http',css))
q=json.loads((web/'qa/V47_QA_RESULTS.json').read_text('utf-8'))
check('browser 74 PASS',q['passed']==74 and q['failed']==0 and q['total']==74)
spec=importlib.util.spec_from_file_location('patch_v47',web/'tools/apply_v47.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
with tempfile.TemporaryDirectory() as t:
    target=Path(t); w=target/'webstudio';(w/'assets').mkdir(parents=True)
    base='<!doctype html><html><head><script defer src="assets/v46-handoff.js"></script></head><body><form id="brief-form"></form></body></html>'
    (w/'contact.html').write_text(base,encoding='utf-8')
    (w/'assets/current-release.json').write_text('{"version":"V46","demo_count":36,"function_count":48}',encoding='utf-8')
    mod.patch(target,root)
    first=(w/'contact.html').read_bytes(); manifest=(w/'assets/current-release.json').read_bytes()
    check('css integrated',b'v47-mail-packet.css' in first)
    check('js integrated',b'v47-mail-packet.js' in first)
    check('v46 preserved',b'v46-handoff.js' in first)
    check('one style',first.count(b'v47-mail-packet.css')==1)
    check('one script',first.count(b'v47-mail-packet.js')==1)
    check('manifest V47',json.loads(manifest)['version']=='V47')
    check('36 demos preserved',json.loads(manifest)['demo_count']==36)
    mod.patch(target,root)
    check('second run no change',first==(w/'contact.html').read_bytes() and manifest==(w/'assets/current-release.json').read_bytes())
    check('new release file',json.loads((w/'assets/release-v47.json').read_text('utf-8'))['version']=='V47')
    (w/'contact.html').write_text('NOT A WEBSTUDIO PAGE',encoding='utf-8')
    try: mod.patch(target,root)
    except RuntimeError:check('unknown pages rejected',True)
    else:check('unknown pages rejected',False)
    check('invalid page unchanged',(w/'contact.html').read_text('utf-8')=='NOT A WEBSTUDIO PAGE')
    (w/'contact.html').write_text(base,encoding='utf-8')
    (w/'assets/current-release.json').write_text('{"version":"V12"}',encoding='utf-8')
    try:mod.patch(target,root)
    except RuntimeError:check('older version rejected',True)
    else:check('older version rejected',False)
print('V47 stdlib QA',sum(v for _,v in items),'/',len(items),'PASS')
if not all(v for _,v in items):raise SystemExit(1)
