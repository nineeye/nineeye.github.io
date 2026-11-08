#!/usr/bin/env python3
"""Safe V51 delta patch to an existing V50 WebStudio checkout.

stdlib-only; check mode is read-only; --apply explicitly writes. No network or paid tools.
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
FILES=('webstudio/assets/v51-quick-handoff.js','webstudio/assets/v51-quick-handoff.css')
HEAD='<link rel="stylesheet" href="./assets/v51-quick-handoff.css">\n<script defer src="./assets/v51-quick-handoff.js"></script>\n<meta name="webstudio-release-v51" content="WEBSTUDIO-V51-20261108">\n'

def once(t,needle,addition,path):
    if addition in t:return t
    if t.count(needle)!=1:raise ValueError(f'{path}: expected one {needle}, found {t.count(needle)}')
    return t.replace(needle,addition+needle,1)

def compute(root:Path,package:Path):
    site=root/'webstudio'
    manifest=site/'assets/current-release.json'
    if not site.is_dir() or not manifest.is_file():raise FileNotFoundError('V50 checkout webstudio/ not found')
    current=json.loads(manifest.read_text('utf-8'))
    if current.get('version') not in ('V50','V51'):raise ValueError('Only V50/V51 checkout supported; refused to overwrite another version')
    if not (site/'assets/v49-quick-inquiry.js').is_file() or not (site/'assets/v50-owner-launch.js').is_file():
        raise ValueError('V49 + V50 original sources missing, refusing partial modification')
    changes={}
    for file in FILES:
        src=package/file;dst=root/file
        if not src.is_file():raise FileNotFoundError('Package source missing: '+file)
        content=src.read_text('utf-8')
        if dst.is_file() and dst.read_text('utf-8')!=content:raise ValueError('Refusing to overwrite changed source: '+file)
        if not dst.is_file():changes[file]=content
    for file in ('webstudio/quick-inquiry.html','webstudio/contact.html'):
        html=(root/file).read_text('utf-8')
        marker='id="v49-form"' if file.endswith('quick-inquiry.html') else 'id="brief-form"'
        if marker not in html:raise ValueError('Source integration marker missing: '+file)
        patched=once(html,'</head>',HEAD,file)
        if patched!=html:changes[file]=patched
    current.update(version='V51',release_id='WEBSTUDIO-V51-20261108',release_date='2026-11-08',previous_release='V50',
        release_note='V51 explicit one-shot quick inquiry to detailed consultation handoff; field whitelisting, 15-minute expiry and deletion-on-read. V49/V50 and all 36 demo pages preserved.',
        verification='V51_LOCAL_ISOLATED_QA_PASS; CLOUDFLARE_CHECK_PENDING; REAL_EMAIL_RECEIPT_AND_SEARCH_INDEX_NOT_TESTED',
        quick_to_detailed_handoff='explicit_same_tab_one_time_sessionStorage',quick_to_detailed_no_personal_query=True,quick_to_detailed_server_submission=False)
    data=json.dumps(current,ensure_ascii=False,indent=2)+'\n'
    if manifest.read_text('utf-8')!=data:changes['webstudio/assets/current-release.json']=data
    return changes

def run(root:Path,package:Path,apply=False):
    changes=compute(root,package)
    if apply:
        for file,content in changes.items():
            dest=root/file;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(content,'utf-8')
    return {'mode':'APPLY' if apply else 'CHECK','files':sorted(changes),'count':len(changes)}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--target-root',type=Path,required=True);p.add_argument('--package-root',type=Path,default=Path(__file__).resolve().parents[2]);p.add_argument('--apply',action='store_true');a=p.parse_args();print(json.dumps(run(a.target_root,a.package_root,a.apply),ensure_ascii=False,indent=2))
