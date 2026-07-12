#!/usr/bin/env python3
import json, pathlib, sys, collections, re
root=pathlib.Path(__file__).resolve().parents[1]
tools=json.load(open(root/'data/tools.json',encoding='utf-8'))
pdf=[t for t in tools if t.get('category')=='pdf' and t.get('status')=='ready']
errors=[]; warnings=[]
if len(pdf)!=60: errors.append(f'PDF ready 도구 수가 60이 아님: {len(pdf)}')
for t in pdf:
 for key in ('toolGroup','toolGroupLabel','toolGroupOrder','description','path'):
  if not t.get(key): errors.append(f"{t.get('id')}: {key} 누락")
 if not (root/t['path']).exists(): errors.append(f"{t['id']}: 페이지 없음")
 if not (root/t['path']).parent.joinpath('definition.js').exists(): errors.append(f"{t['id']}: definition.js 없음")
counts=collections.Counter(t['toolGroup'] for t in pdf)
for k,n in counts.items():
 if n<3: warnings.append(f'{k}: 도구가 {n}개뿐이라 분류가 얇음')
# CDN usage is intentional until local vendor bundle is verified
cdn=[]
for t in pdf:
 txt=(root/t['path']).read_text(encoding='utf-8',errors='ignore')
 if 'cdn.jsdelivr.net' in txt or 'cdnjs.cloudflare.com' in txt: cdn.append(t['id'])
if cdn: warnings.append(f'외부 PDF 라이브러리 의존 도구 {len(cdn)}개')
print(f'PDF tools: {len(pdf)} / groups: {dict(counts)}')
for w in warnings: print('WARN:',w)
for e in errors: print('ERROR:',e)
sys.exit(1 if errors else 0)
