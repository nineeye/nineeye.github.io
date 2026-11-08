#!/usr/bin/env python3
"""Apply the V47 delta onto an existing V46+ webstudio checkout. Offline and idempotent."""
from __future__ import annotations
import argparse,json,shutil
from pathlib import Path

FILES=('assets/v47-mail-packet.js','assets/v47-mail-packet.css',
       'qa/test_v47_mail_packet.py','qa/test_v47_static.py','qa/V47_QA_RESULTS.json',
       'docs/V47_RELEASE_NOTES_KO.md')
LINK='<link rel="stylesheet" href="./assets/v47-mail-packet.css">'
SCRIPT='<script defer src="./assets/v47-mail-packet.js"></script>'
META='<meta name="webstudio-release-v47" content="WEBSTUDIO-V47-20261108">'

def patch(target:Path,package:Path):
    web=target/'webstudio'; src=package/'webstudio'
    contact=web/'contact.html'; manifest=web/'assets/current-release.json'
    if not contact.is_file() or not manifest.is_file():
        raise RuntimeError('V46 webstudio checkout missing: contact.html or current-release.json')
    original=contact.read_text(encoding='utf-8')
    if '<head>' not in original or '</head>' not in original or 'v46-handoff.js' not in original or 'id="brief-form"' not in original:
        raise RuntimeError('Unexpected contact page: V46+ source prerequisites not met; unchanged')
    old=json.loads(manifest.read_text(encoding='utf-8'))
    if old.get('version') not in ('V46','V47'):
        raise RuntimeError('Unexpected manifest version: expected V46 or V47, unchanged')
    for relative in FILES:
        source=src/relative
        if not source.is_file(): raise RuntimeError('Missing package file '+relative)
    changed=original
    tags='\n'.join(tag for tag in (LINK,SCRIPT,META) if tag not in changed)
    if tags: changed=changed.replace('</head>', tags+'\n</head>',1)
    if changed!=original:contact.write_text(changed,encoding='utf-8')
    for relative in FILES:
        dest=web/relative;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src/relative,dest)
    if old.get('version')!='V47':
        old['previous_release']='V46'
        old['previous_release_verified']='V46 Cloudflare Pages official GitHub check success on 2026-11-08; live browser/email not verified'
    old.update({'version':'V47','release_id':'WEBSTUDIO-V47-20261108','release_date':'2026-11-08',
       'release_note':'Client-only full manual email packet copies/saves consultation + V46 original startkit without 700-character truncation. No auto email.',
       'verification':'V47_ISOLATED_74_PASS; V47_CLOUDFLARE_PENDING; REAL_EMAIL_RECEIPT_NOT_TESTED',
       'full_mail_packet':'manual_copy_text_download_no_backend','payment_api_cost':'none'})
    data=json.dumps(old,ensure_ascii=False,indent=2)+'\n'
    if manifest.read_text(encoding='utf-8')!=data:manifest.write_text(data,encoding='utf-8')
    (web/'assets/release-v47.json').write_text(data,encoding='utf-8')
    return {'release':'V47','files_placed':len(FILES),'contact_patched':changed!=original,'manifest_version':old['version']}

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--target-root',type=Path,required=True)
    a.add_argument('--package-root',type=Path,default=Path(__file__).resolve().parents[2]);args=a.parse_args()
    print(json.dumps(patch(args.target_root,args.package_root),ensure_ascii=False))
