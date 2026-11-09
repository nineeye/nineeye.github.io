#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Read-only V84 public sales/showroom smoke: source markers, not GUI/transaction proof."""
from __future__ import annotations
import argparse
import datetime as dt
import json
from pathlib import Path
from v82_live_public_probe import actual_get,PRODUCTION_ORIGIN

CHECKS = (
  ('홈 진입 CTA', 'index.html',
   ('./design-studio-v84.html','site-current-version')),
  ('새 업종·디자인 선택기', 'design-studio-v84.html',
   ('AFO_V84_STUDIO_READY','id="sector"','data-switch="premium"','assets/v67-industry-data.js','feature-lab-v80.html')),
  ('12업종 원본 데이터', 'assets/v67-industry-data.js',
   ('window.AFO_V67_INDUSTRIES','"manufacturing"','"event"')),
  ('원본 핵심 기능', 'assets/v28-catalog.js',
   ('window.ALLFILEONE_V28_CATALOG','"manufacturing"','"event"')),
  ('7+1 기능 구분 원본', 'assets/v77-feature-data.js',
   ('window.AFO_V77_FEATURE_EXTENSION','"planned"','"simulated"')),
  ('기존 기능 시연 경로', 'demo/manufacturing/modern/index.html',
   ('data-industry="manufacturing"','data-v13-style="modern"','../../../assets/demo.js')),
  ('추가 시연 3종 도구', 'feature-lab-v80.html',
   ('v80-industry','v80-feature','v80-simulator.js')),
)

def check_public(origin=PRODUCTION_ORIGIN, getter=None):
    if getter is None: getter=lambda path:actual_get(origin,path)
    records=[]
    for name,path,markers in CHECKS:
        try:
            body=getter(path)
            missing=[m for m in markers if m not in body]
            state='PASS' if not missing else 'HOLD'
            reason='공개 본문 표식 확인' if not missing else '누락: '+', '.join(missing[:4])
        except Exception as exc:
            state='HOLD'
            reason=type(exc).__name__+': '+str(exc)
        records.append({'name':name,'path':path,'state':state,'reason':reason[:260]})
    passed=sum(r['state']=='PASS' for r in records)
    return {'product':'AllFileOne WebStudio','check_version':'V84-PUBLIC-READONLY',
            'utc':dt.datetime.now(dt.timezone.utc).isoformat(),
            'origin':origin,'result':'PASS_V84_PUBLIC_FILES_ONLY' if passed==len(CHECKS) else 'HOLD_V84_PUBLIC',
            'passed':passed,'total':len(CHECKS),'records':records,
            'real_desktop_mobile_clicks':'NOT_VERIFIED','customer_email_receipt':'NOT_VERIFIED',
            'customer_booking_payment':'NOT_IMPLEMENTED','cloudflare_production_sha':'NOT_VERIFIED',
            'paid_api_calls':0}

def write_report(report,out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    json_file=out/'AFO_V84_PUBLIC_SHOWROOM.json'
    txt_file=out/'AFO_V84_PUBLIC_SHOWROOM_KO.txt'
    json_file.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['올파일원 웹스튜디오 V84 실제 공개 파일 검사','실제 브라우저 클릭/메일 수신/예약/결제/배포 SHA까지 확인한 것은 아닙니다.',
           '결과: '+report['result'],'URL: '+report['origin'],
           '통과: '+str(report['passed'])+'/'+str(report['total']),'']
    lines += [r['state']+' | '+r['path']+' | '+r['reason'] for r in report['records']]
    txt_file.write_text('\n'.join(lines)+'\n',encoding='utf-8-sig')
    return json_file,txt_file

def main(argv=None):
    p=argparse.ArgumentParser(description='V84 무료 공개 사이트 read-only GET 검사')
    p.add_argument('--output',required=True,type=Path)
    args=p.parse_args(argv)
    report=check_public()
    _,txt_file=write_report(report,args.output)
    print(report['result'],f"{report['passed']}/{report['total']}",'report:',txt_file)
    return 0 if report['result']=='PASS_V84_PUBLIC_FILES_ONLY' else 3

if __name__=='__main__':
    raise SystemExit(main())
