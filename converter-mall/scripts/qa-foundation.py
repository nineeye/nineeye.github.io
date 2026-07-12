#!/usr/bin/env python3
import json,re,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[1]
tools=json.load(open(root/'data/tools.json',encoding='utf-8'))
errors=[]; titles={}; descs={}; ids=set()
for t in tools:
 if t['id'] in ids: errors.append('중복 ID: '+t['id'])
 ids.add(t['id'])
 if not t.get('path'):
  if t.get('status')!='planned': errors.append('경로 없음: '+t['id'])
  continue
 p=root/t['path']
 if not p.exists(): errors.append('페이지 없음: '+t['path']); continue
 s=p.read_text(encoding='utf-8')
 for key in ('title','description','introduction'):
  if not t.get('seo',{}).get(key): errors.append(f"SEO {key} 없음: {t['id']}")
 title=t.get('seo',{}).get('title',''); desc=t.get('seo',{}).get('description','')
 titles.setdefault(title,[]).append(t['id']);descs.setdefault(desc,[]).append(t['id'])
 if 'page-foundation.js' not in s: errors.append('공통 기반 누락: '+t['id'])
 for rid in t.get('relatedTools',[]):
  if rid not in {x['id'] for x in tools}: errors.append(f'잘못된 관련 도구: {t["id"]}->{rid}')
for k,v in titles.items():
 if k and len(v)>1: errors.append('중복 title: '+','.join(v))
for k,v in descs.items():
 if k and len(v)>1: errors.append('중복 description: '+','.join(v))
print(f'도구 {len(tools)}개 검사, 오류 {len(errors)}개')
for e in errors: print('-',e)
sys.exit(1 if errors else 0)
