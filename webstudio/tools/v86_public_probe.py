#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V86 exact public page readback, zero paid API, no POST, no client data."""
from __future__ import annotations
import argparse, datetime as dt, json
from pathlib import Path
from v85_public_probe import actual_get, ALLOWED_ORIGINS, PRODUCTION_ORIGIN
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce',
 'professional','association','franchise','stay','realestate','event')
CHECKS=[('업종별 안내 허브','industry-guide/index.html',('TWELVE INDUSTRIES','12개 업종','manufacturing.html')),
 ('V86 공통 CSS','assets/v86-guide.css',('.goal[aria-pressed=true]','.feature-grid','.hub-grid')),
 ('V86 공통 JS','assets/v86-guide.js',('AFO_V86_GUIDE_READY','URL.createObjectURL','data-v86-goal')),
 ('홈페이지 업종별 입장','index.html',('industry-guide/index.html','site-current-version')),
 ('V85 샘플 비교에서 연결','experience-v85.html',('industry-guide/index.html','WEBSTUDIO-V85-20261109')),
 ('사이트맵 12업종','sitemap.xml',('industry-guide/manufacturing.html','industry-guide/event.html'))]
CHECKS+= [('업종별 원본 '+k,'industry-guide/'+k+'.html',
           ('data-v86-industry="'+k+'"','id="v86-download"','data-v86-goal="0"',
            'data-v86-style="premium"','id="v86-to-scope"','별도 개발','미구현'))
           for k in SECTORS]

def inspect(origin=PRODUCTION_ORIGIN,get=None):
 if origin not in ALLOWED_ORIGINS:raise ValueError('Only approved owned-site origins')
 getter=get if get is not None else lambda p:actual_get(origin,p)
 results=[]
 for label,path,markers in CHECKS:
  try:
   body=getter(path)
   missing=[x for x in markers if x not in body]
   if path.startswith('industry-guide/') and path.endswith('.html') and path!='industry-guide/index.html':
    if body.count('data-v86-feature=')!=7:missing.append('7 simulated feature cards')
    if body.count('data-v86-goal=')!=3:missing.append('3 goal buttons')
   status='PASS' if not missing else 'HOLD'
   detail='본문 표식 및 업종 고유 링크 확인' if not missing else '누락: '+', '.join(missing[:4])
  except Exception as exc:
   status='HOLD';detail=type(exc).__name__+': '+str(exc)
  results.append({'name':label,'path':path,'status':status,'reason':detail[:280]})
 passed=sum(r['status']=='PASS' for r in results)
 return {'product':'AllFileOne WebStudio','version':'V86-PUBLIC-READONLY',
   'timestamp_utc':dt.datetime.now(dt.timezone.utc).isoformat(), 'origin':origin,
   'status':'PASS_V86_PUBLIC_FILES_ONLY' if passed==len(CHECKS) else 'HOLD_V86_PUBLIC',
   'passed':passed,'total':len(CHECKS),'records':results,
   'customer_inbox_received':'NOT_VERIFIED','server_booking_payment':'NOT_IMPLEMENTED',
   'desktop_mobile_browser_clicks':'NOT_VERIFIED_BY_THIS_SCRIPT','cloudflare_deployment_sha':'NOT_VERIFIED',
   'paid_external_api_requests':0}

def write_report(r,folder):
 folder=Path(folder);folder.mkdir(parents=True,exist_ok=True)
 js=folder/'AFO_V86_PUBLIC_FILES.json';ko=folder/'AFO_V86_PUBLIC_FILES_KO.txt'
 js.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf-8')
 lines=['올파일원 웹스튜디오 V86 실제 공개 파일 본문 검사',
  '원점: '+r['origin'],'결과: '+r['status'],f"통과: {r['passed']}/{r['total']}",
  '이 검사는 실고객 이메일·예약·결제·전체 브라우저 버튼 동작을 증명하지 않습니다.','']
 lines += [f"{x['status']} | {x['path']} | {x['reason']}" for x in r['records'] if x['status']!='PASS']
 ko.write_text('\n'.join(lines)+'\n','utf-8-sig')
 return js,ko

def main(argv=None):
 p=argparse.ArgumentParser(description='V86 18 public HTTPS source readbacks')
 p.add_argument('--origin',choices=ALLOWED_ORIGINS,default=PRODUCTION_ORIGIN)
 p.add_argument('--output',required=True,type=Path)
 args=p.parse_args(argv)
 r=inspect(origin=args.origin);_,ko=write_report(r,args.output)
 print(r['status'],str(r['passed'])+'/'+str(r['total']),'origin',r['origin'],'report',ko)
 return 0 if r['status']=='PASS_V86_PUBLIC_FILES_ONLY' else 3
if __name__=='__main__':raise SystemExit(main())
