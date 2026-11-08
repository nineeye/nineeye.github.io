#!/usr/bin/env python3
"""V50 safe additive patch. No network, no paid API, no policy bypass."""
from __future__ import annotations
import argparse, hashlib, json, os, tempfile
from pathlib import Path

NEW = ('webstudio/owner-launch.html','webstudio/assets/v50-owner-launch.js','webstudio/assets/v50-owner-launch.css')
HOOK = '\n<section class="body-section" id="v50-owner-link" aria-label="실제 수주 준비도"><div class="wrap"><h2>첫 고객 수주 준비도 점검</h2><p>공개 파일 검사와 실제 메일·검색·계약 확인을 분리합니다. 고객 정보 없이 안전하게 진행할 수 있습니다.</p><a class="action outline" href="./owner-launch.html">운영자용 준비도 점검 열기 ↗</a></div></section>\n'

def apply(root: Path, package: Path) -> dict:
    root = Path(root).resolve(); package = Path(package).resolve()
    site = root/'webstudio/site-check.html'; manifest = root/'webstudio/assets/current-release.json'
    if not site.is_file() or not manifest.is_file():
        raise FileNotFoundError('Expected V49 repository files not found. Do not apply to an incomplete checkout.')
    original = site.read_text(encoding='utf-8')
    if '</main>' not in original: raise ValueError('site-check.html missing closing main; abort')
    j = json.loads(manifest.read_text(encoding='utf-8'))
    if j.get('product') != 'AllFileOne WebStudio' or j.get('version') not in ('V49','V50'):
        raise ValueError('Only verified V49/V50 release manifests may be patched')
    for relative in NEW:
        if not (package/relative).is_file(): raise FileNotFoundError(relative)
    updated = original if 'id="v50-owner-link"' in original else original.replace('</main>', HOOK+'</main>',1)
    j.update(version='V50',release_id='WEBSTUDIO-V50-20261108',release_date='2026-11-08',
        release_note='V50 adds an owner-only noindex launch-readiness page: 11 public static checks, 10 explicitly self-attested owner tasks, TXT evidence; no user input or credentials sent to server.',
        verification='V50_ISOLATED_FIXTURE_QA_PASS; V50_OFFICIAL_CLOUDFLARE_PENDING; REAL_EMAIL_RECEIPT_NOT_TESTED; SEARCH_INDEX_NOT_VERIFIED',
        previous_release='V49',owner_readiness_url='/owner-launch.html',
        owner_readiness_auto_checks=11,owner_readiness_manual_self_checks=10,
        owner_readiness_search_index_verified=False,owner_readiness_real_email_verified=False)
    pending = {site: updated, manifest: json.dumps(j,ensure_ascii=False,indent=2)+'\n'}
    for relative in NEW: pending[root/relative]=(package/relative).read_text(encoding='utf-8')
    for path, value in pending.items():
        path.parent.mkdir(parents=True,exist_ok=True)
        fd,tmp=tempfile.mkstemp(prefix='.afo-v50-',dir=path.parent, text=True)
        try:
            with os.fdopen(fd,'w',encoding='utf-8',newline='\n') as f: f.write(value)
            os.replace(tmp,path)
        finally:
            if os.path.exists(tmp): os.unlink(tmp)
    return {'release':'V50','paths':[str(p.relative_to(root)) for p in pending],
        'sha256':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in pending}}

def main():
    p=argparse.ArgumentParser(description='Apply V50 owner readiness to verified V49 working tree')
    p.add_argument('--target-root',required=True,type=Path)
    p.add_argument('--package-root',type=Path,default=Path(__file__).resolve().parents[2])
    x=p.parse_args(); print(json.dumps(apply(x.target_root,x.package_root),ensure_ascii=False,indent=2))

if __name__=='__main__': main()
