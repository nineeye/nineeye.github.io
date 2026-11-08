#!/usr/bin/env python3
"""V52 additive source patch: copy new flagship pages and link them from existing sales pages/gallery.
Fail-closed if expected V51 repository structure is missing. Idempotent on V52.
No server/API credentials. Python stdlib only.
"""
from __future__ import annotations
import argparse, json, shutil
from pathlib import Path
SECTORS={'manufacturing':'제조·도매','academy':'학원·교육','interior':'인테리어·시공'}
NEW=[*(f'webstudio/flagship/{k}.html' for k in SECTORS),
     'webstudio/assets/v52-flagship.css',
     *(f'webstudio/assets/v52-{k}.js' for k in SECTORS),
     'webstudio/assets/v52-showcase-entry.css']
HEAD='<link rel="stylesheet" href="./assets/v52-showcase-entry.css">\n<meta name="webstudio-release-v52" content="WEBSTUDIO-V52-20261108">\n'
FEATURE='''<section class="v52-featured" id="v52-featured" aria-label="업종별 완전히 다른 홈페이지 시연"><div class="v52-featured-inner"><div class="v52-featured-head"><div><span>FEATURED / INDUSTRY-SPECIFIC DEMOS</span><h2>업종이 다르면, 홈페이지의 중심도 다르게.</h2></div><p>기존 36개 디자인은 그대로 비교할 수 있습니다. 아래 3개는 메뉴·정보 구조·조작 방식까지 다른 독립형 가상 홈페이지 시연입니다.</p></div><div class="v52-featured-grid">
<a href="flagship/manufacturing.html"><small>01 / B2B PRODUCT FINDER</small><strong>제조·도매</strong><p>형번·재질·MOQ를 고르는 규격 카탈로그와 견적 준비서</p><b>제조업 전용 사이트 직접 열기 ↗</b></a>
<a href="flagship/academy.html"><small>02 / COURSE & TIMETABLE</small><strong>학원·교육</strong><p>학년별 강좌·주간 시간표·수업 겹침 알림</p><b>학원 전용 사이트 직접 열기 ↗</b></a>
<a href="flagship/interior.html"><small>03 / SPATIAL PORTFOLIO</small><strong>인테리어·시공</strong><p>공간별 프로젝트·콘셉트 전후 비교·면적 상담 메모</p><b>인테리어 전용 사이트 직접 열기 ↗</b></a>
</div><p style="font-size:11px;color:#647b70;margin-top:15px">※ 모든 상품·학원·시공 사례는 가상 자료이며, 실제 거래·예약·고객 납품 실적이 아닙니다.</p></div></section>\n'''

def updated_html(path:Path, industry:str)->str:
    src=path.read_text(encoding='utf-8')
    old=f'./demo/{industry}/modern/index.html';new=f'./flagship/{industry}.html'
    if src.count(f'href="{old}"')<1 or '실제 업종 시연 체험' not in src or 'class="hero-actions"' not in src:
        raise RuntimeError(f'Expected V49+ flagship sales layout missing: {path}')
    # Change only the hero primary, retaining the former demo via a secondary link.
    before=f'href="{old}">실제 업종 시연 체험'
    after=f'href="{new}">업종 전용 홈페이지 직접 체험'
    if src.count(before)!=1:raise RuntimeError(f'Ambiguous V52 original CTA in {path}')
    src=src.replace(before,after,1)
    marker='업종별 기능 직접 체험 ↓</a>'
    if marker not in src:raise RuntimeError(f'Original lab CTA missing: {path}')
    src=src.replace(marker,marker+f'<a class="button-outline" href="{old}">기존 모던 디자인 비교 ↗</a>',1)
    return src

def plan(root:Path):
    ws=root/'webstudio';release=json.loads((ws/'assets/current-release.json').read_text('utf-8'))
    if release.get('version')=='V52':
        if all((root/p).is_file() for p in NEW) and all(f'./flagship/{key}.html' in (ws/f'for-{key}.html').read_text('utf-8') for key in SECTORS):return None
        raise RuntimeError('V52 marker exists but one or more assets/links missing; manual reconciliation required')
    if release.get('version')!='V51':raise RuntimeError('Expected V51 source checkout, found '+str(release.get('version')))
    sales={key:updated_html(ws/f'for-{key}.html',key) for key in SECTORS}
    gal=ws/'design-gallery-v13.html';gallery=gal.read_text('utf-8')
    if '<section class="compare" id="compare"' not in gallery or gallery.count('</head>')!=1 or 'id="v52-featured"' in gallery:
        raise RuntimeError('Expected existing gallery structure missing or already modified')
    # Existing 36 demos share a layout engine. Do not suggest every site has an independent build.
    gallery=gallery.replace('같은 틀을 복사하지 않습니다.<br><em>사업마다 다른 첫인상.</em>',
                            '디자인은 비교하고,<br><em>업종 기능은 직접 경험하세요.</em>',1)
    gallery=gallery.replace('12개 업종, 36개의 실제 작동형 홈페이지 화면을 한눈에 비교하세요.',
                            '12개 업종 36개 디자인 시안과 제조·학원·인테리어 3개 독립 업무형 샘플을 비교하세요.',1)
    gallery=gallery.replace('</head>',HEAD+'</head>',1).replace('<section class="compare" id="compare"',FEATURE+'<section class="compare" id="compare"',1)
    release.update(version='V52',release_id='WEBSTUDIO-V52-20261108',release_date='2026-11-08',previous_release='V51',
      release_note='V52 adds three original independent visual and workflow-specific flagship demo sites for manufacturing, academy and interior; 36 existing style demos preserved.',
      verification='V52_ISOLATED_BROWSER_QA_PASS; V52_CLOUDFLARE_PENDING; NO_LIVE_CUSTOMER_EMAIL_SALES_OR_INDEXING_VERIFIED',
      flagship_independent_site_count=3,flagship_names=list(SECTORS),flagship_noindex=True,flagship_demo_no_backend=True,flagship_existing_36_preserved=True)
    return sales, gallery, json.dumps(release,ensure_ascii=False,indent=2)+'\n'

def patch(root:Path,package_root:Path):
    result=plan(root)
    if result is None:return {'status':'already_applied','new_files':len(NEW)}
    for f in NEW:
        origin=package_root/f
        if not origin.is_file():raise RuntimeError('Package file missing: '+f)
        dest=root/f
        if dest.exists() and dest.read_bytes()!=origin.read_bytes():raise RuntimeError('Existing path conflict: '+f)
    sales,gallery,manifest=result
    for f in NEW:
        dest=root/f;dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(package_root/f,dest)
    for key,text in sales.items():(root/f'webstudio/for-{key}.html').write_text(text,encoding='utf-8')
    (root/'webstudio/design-gallery-v13.html').write_text(gallery,encoding='utf-8')
    (root/'webstudio/assets/current-release.json').write_text(manifest,encoding='utf-8')
    return {'status':'applied','new_files':len(NEW),'updated':['webstudio/design-gallery-v13.html','webstudio/assets/current-release.json',*[f'webstudio/for-{key}.html' for key in SECTORS]]}
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--target-root',type=Path,required=True);a.add_argument('--package-root',type=Path,default=Path(__file__).resolve().parents[2]);args=a.parse_args();print(json.dumps(patch(args.target_root,args.package_root),ensure_ascii=False))
