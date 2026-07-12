#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TOOLS=json.loads((ROOT/'data/tools.json').read_text(encoding='utf-8'))
errors=[]; warnings=[]; stats={}
ready=[t for t in TOOLS if t.get('status')=='ready']
planned=[t for t in TOOLS if t.get('status')!='ready']
stats.update(total=len(TOOLS),ready=len(ready),planned=len(planned))
ids=[t.get('id') for t in TOOLS]
if len(ids)!=len(set(ids)): errors.append('중복 도구 ID가 있습니다.')
for t in ready:
    p=t.get('path')
    if not p or not (ROOT/p).exists(): errors.append(f"{t.get('id')}: 실제 페이지가 없습니다: {p}")
    for key in ('title','description','accessLevel','seo','relatedTools'):
        if not t.get(key): errors.append(f"{t.get('id')}: {key} 누락")
    seo=t.get('seo') or {}
    for key in ('title','description','introduction'):
        if not seo.get(key): errors.append(f"{t.get('id')}: seo.{key} 누락")
    for rid in t.get('relatedTools',[]):
        if rid not in ids: errors.append(f"{t.get('id')}: 존재하지 않는 관련 도구 {rid}")
for t in planned:
    if t.get('visible',True) or t.get('indexable',True):
        errors.append(f"{t.get('id')}: planned 도구는 visible/indexable=false여야 합니다.")
# Common image runtime must not lie about formats.
card=(ROOT/'assets/js/image-platform/ui/FileCardView.js').read_text(encoding='utf-8')
if '예상 JPG:' in card or '<span class="badge">PNG</span>' in card:
    errors.append('공통 파일 카드에 PNG/JPG 하드코딩이 남아 있습니다.')
if 'sourceFormat' not in card or 'targetFormat' not in card:
    errors.append('공통 파일 카드가 입력/출력 형식을 동적으로 받지 않습니다.')
# Detect placeholder deployment origin.
robots=(ROOT/'robots.txt').read_text(encoding='utf-8')
sitemap=(ROOT/'sitemap.xml').read_text(encoding='utf-8')
if 'example.com' in robots or 'example.com' in sitemap:
    warnings.append('배포 전 robots.txt와 sitemap.xml의 example.com을 실제 도메인으로 교체해야 합니다.')
# PDF currently depends on external libraries.
pdf_pages=list((ROOT/'converters').glob('pdf-*/index.html'))
external_pdf=sum('cdn.jsdelivr.net' in p.read_text(encoding='utf-8') or 'cdnjs.cloudflare.com' in p.read_text(encoding='utf-8') for p in pdf_pages)
stats['pdf_pages_with_external_runtime']=external_pdf
if external_pdf:
    warnings.append(f'PDF 페이지 {external_pdf}개가 pdf-lib/PDF.js CDN 로딩에 의존합니다. 오프라인 완전 지원은 별도 번들링 작업이 필요합니다.')
# Page metadata uniqueness.
for key in ('title','description'):
    seen={}
    for t in ready:
        value=(t.get('seo') or {}).get(key)
        if value in seen: errors.append(f"중복 SEO {key}: {seen[value]} / {t['id']}")
        seen[value]=t['id']
# Count tool families.
stats['access_levels']={}
for t in ready: stats['access_levels'][t['accessLevel']]=stats['access_levels'].get(t['accessLevel'],0)+1
stats['categories']={}
for t in ready: stats['categories'][t.get('category','unknown')]=stats['categories'].get(t.get('category','unknown'),0)+1
result={'ok':not errors,'errors':errors,'warnings':warnings,'stats':stats}
print(json.dumps(result,ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
