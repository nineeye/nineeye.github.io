#!/usr/bin/env python3
from pathlib import Path
import re, json, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]; modes={}
process=(ROOT/'assets/js/pdf-tools/PDFToolApp.js').read_text(encoding='utf-8')
for d in sorted((ROOT/'converters').glob('pdf-*/definition.js')):
    txt=d.read_text(encoding='utf-8')
    mid=re.search(r"\bmode\s*:\s*['\"]([^'\"]+)",txt) or re.search(r'"mode"\s*:\s*"([^"]+)"',txt)
    iid=re.search(r"\bid\s*:\s*['\"]([^'\"]+)",txt) or re.search(r'"id"\s*:\s*"([^"]+)"',txt)
    if not mid or not iid:
        errors.append(f'정의 파싱 실패: {d.relative_to(ROOT)}'); continue
    mode=mid.group(1); tool_id=iid.group(1); modes.setdefault(mode,[]).append(tool_id)
    idx=d.with_name('index.html')
    if not idx.exists(): errors.append(f'페이지 없음: {tool_id}'); continue
    html=idx.read_text(encoding='utf-8')
    if 'PDFRuntimeLoader.js?v=1.41.0' not in html: errors.append(f'런타임 로더 누락: {tool_id}')
    if 'PDFRuntimeLoader.start' not in html: errors.append(f'가드 시작 누락: {tool_id}')
    if 'cdn.jsdelivr.net/npm/pdf-lib' in html or 'cdnjs.cloudflare.com/ajax/libs/pdf.js' in html:
        errors.append(f'레거시 직접 CDN 태그 잔존: {tool_id}')
    if mode not in process:
        errors.append(f'처리 분기에서 mode를 찾지 못함: {tool_id} / {mode}')
for p in ['assets/js/pdf-tools/PDFRuntimeLoader.js','assets/js/pdf-tools/PDFToolApp.js','assets/css/pdf-tool.css']:
    if not (ROOT/p).exists(): errors.append(f'필수 파일 누락: {p}')
if not (ROOT/'assets/vendor/pdf-lib.min.js').exists(): warnings.append('pdf-lib 로컬 번들이 없어 CDN 대체 로딩을 사용합니다.')
if not (ROOT/'assets/vendor/pdf.min.js').exists(): warnings.append('PDF.js 로컬 번들이 없어 CDN 대체 로딩을 사용합니다.')
print(json.dumps({'ok':not errors,'errors':errors,'warnings':warnings,'pdfPages':sum(map(len,modes.values())),'modes':{k:len(v) for k,v in sorted(modes.items())}},ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
