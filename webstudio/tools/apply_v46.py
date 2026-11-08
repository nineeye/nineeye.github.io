#!/usr/bin/env python3
"""Apply WebStudio V46 as a non-destructive overlay to a V45+ checkout.

stdlib-only; no network, no destructive directory mutation, no dependency install.
Explicitly does not deploy or send email. Repeat runs are idempotent.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE/'webstudio'

def sha(path: Path): return hashlib.sha256(path.read_bytes()).hexdigest()

def inject(html: str, needle: str, addition: str, label: str) -> str:
    if addition in html: return html
    if needle not in html: raise ValueError(f'expected integration anchor missing: {label}')
    return html.replace(needle, addition+needle, 1)

def patch(root: Path) -> dict:
    target = root/'webstudio' if (root/'webstudio'/'contact.html').is_file() else root
    must=[target/'contact.html',target/'launch-kit.html',target/'assets'/'v45-launch-kit.js']
    if not all(p.is_file() for p in must):
        raise ValueError('V45+ source not found. Provide repo root or webstudio directory; originals preserved.')
    changes={}
    contact=(target/'contact.html').read_text('utf-8')
    launch=(target/'launch-kit.html').read_text('utf-8')
    if 'id="brief-form"' not in contact or 'id="contactLink"' not in launch:
        raise ValueError('Source layout differs from approved V45. Refuse silent merge.')
    js='<script defer src="./assets/v46-handoff.js"></script>\n'
    css='<link rel="stylesheet" href="./assets/v46-handoff.css">\n'
    contact=inject(contact,'</head>',css+js,'contact head')
    launch=inject(launch,'</head>',js,'launch head')
    privacy_old='이 도구는 저장·자동 전송·메일 발송을 하지 않습니다.'
    privacy_new=('상담서 이동을 직접 누를 때만 같은 탭에 준비 내용을 한 번 임시 보관하며, 상담서가 읽는 즉시 지웁니다. '
                 '일반 체크와 메모는 서버로 전송하지 않습니다. 이 도구에서 자동 메일 발송은 하지 않습니다.')
    if privacy_old in launch: launch=launch.replace(privacy_old,privacy_new,1)
    elif privacy_new not in launch: raise ValueError('V45 privacy wording changed unexpectedly')
    contact=inject(contact,'</head>','<meta name="webstudio-release-v46" content="WEBSTUDIO-V46-20261108">\n','contact release marker')
    changes['contact.html']=contact
    changes['launch-kit.html']=launch
    manifest=target/'assets'/'current-release.json'
    if manifest.is_file():
        meta=json.loads(manifest.read_text('utf-8'))
        meta.update(version='V46',release_id='WEBSTUDIO-V46-20261108',release_date='2026-11-08',
                    previous_release='V45',
                    release_note='V46 same-tab explicit one-use startkit-to-consultation handoff; no user notes in URL, no server submission, browser-only transfer with immediate deletion; existing V45 demos and SEO retained.',
                    verification='V46_ISOLATED_BROWSER_QA_PASS; OFFICIAL_CLOUDFLARE_PENDING; REAL_EMAIL_RECEIPT_NOT_TESTED',
                    launch_kit_consultation_handoff='explicit_one_time_sessionStorage_removed_after_read',
                    launch_kit_server_submission=False)
        changes['assets/current-release.json']=json.dumps(meta,ensure_ascii=False,indent=2)+'\n'
    for rel,content in changes.items():
        out=target/rel
        if out.read_text('utf-8')!=content:
            out.write_text(content,'utf-8')
    copied=[]
    for filename in ['v46-handoff.js','v46-handoff.css']:
        source=BASE/'assets'/filename; dest=target/'assets'/filename
        if source.resolve()!=dest.resolve():
            if not dest.is_file() or dest.read_bytes()!=source.read_bytes(): shutil.copyfile(source,dest)
        copied.append(filename)
    checks={k:sha(target/k) for k in [*changes.keys(),'assets/v46-handoff.js','assets/v46-handoff.css']}
    return {'release':'V46','source_root':str(target),'files':checks,'v45_preserved':(target/'assets'/'v45-launch-kit.js').is_file(),'deployed':False}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('directory',help='local checkout root or webstudio directory')
    args=parser.parse_args();p=Path(args.directory).expanduser().resolve();result=patch(p)
    print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
