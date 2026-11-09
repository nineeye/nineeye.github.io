#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fail-closed read-only public site body check. No mail, POST or paid APIs."""
from __future__ import annotations
import argparse,datetime as dt,json,sys
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request,urlopen
PRODUCTION_ORIGIN='https://allfileone-webstudio.pages.dev/'

def normalized(path):
    if path.endswith('/index.html'):path=path[:-len('/index.html')]+'/'
    elif path.endswith('.html'):path=path[:-5]
    path=path.rstrip('/')
    return '/' if path in ('','/index') else path

def actual_get(origin,path,timeout=12):
    """Reject any redirect to another origin or a different logical route."""
    request_url=origin.rstrip('/')+'/'+path
    req=Request(request_url,headers={'User-Agent':'AFO-WebStudio-V85-ReadOnly/1','Cache-Control':'no-cache'})
    with urlopen(req,timeout=timeout) as resp:
        expected=urlsplit(request_url);actual=urlsplit(resp.geturl())
        if resp.status!=200:raise RuntimeError('HTTP '+str(resp.status))
        if (actual.scheme,actual.netloc)!=(expected.scheme,expected.netloc):
            raise RuntimeError('다른 출처 리디렉션')
        if normalized(actual.path)!=normalized(expected.path):
            raise RuntimeError('다른 경로 리디렉션')
        body=resp.read(2_000_001)
        if len(body)>2_000_000:raise RuntimeError('응답 크기 한도 초과')
        return body.decode('utf-8-sig')
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
STYLES=('modern','premium','editorial')
CHECKS=(
 ('첫 화면 V85 입장','index.html',('./experience-v85.html','site-current-version')),
 ('V85 HTML','experience-v85.html',('data-v85="WEBSTUDIO-V85-20261109"','id="v85-sector"','id="v85-live-frame"','v85-style-choice','v85-download')),
 ('V85 스타일','assets/v85-experience.css',('.v85-style-grid','.v85-preview-host','.v85-feature-grid')),
 ('V85 선택 동작','assets/v85-experience.js',('AFO_V85_EXPERIENCE_READY','v85-live-frame','v85-download','v85-preview-state')),
 ('기존 원형 48개','assets/v28-catalog.js',('ALLFILEONE_V28_CATALOG','"manufacturing"','"event"')),
 ('12업종 원본','assets/v67-industry-data.js',('AFO_V67_INDUSTRIES','"manufacturing"','"event"')),
 ('7+1 기능','assets/v77-feature-data.js',('AFO_V77_FEATURE_EXTENSION','"simulated"','"planned"')),
 ('기존 V80 추가 체험실','feature-lab-v80.html',('v80-industry','v80-feature','v80-simulator.js')),
) + tuple(('실제 HTML '+k+' / '+style, f'demo/{k}/{style}/index.html',
          (f'data-industry="{k}"',f'data-v13-style="{style}"','../../../assets/demo.js'))
        for k in SECTORS for style in STYLES)

def check(getter=None,origin=PRODUCTION_ORIGIN):
    if getter is None:getter=lambda path:actual_get(origin,path)
    records=[]
    for name,path,markers in CHECKS:
        try:
            data=getter(path)
            missing=[m for m in markers if m not in data]
            state='PASS' if not missing else 'HOLD';reason='정확한 공개 본문 표식 확인' if not missing else '필수 표식 누락: '+repr(missing)[:240]
        except Exception as exc:state='HOLD';reason=(type(exc).__name__+': '+str(exc))[:300]
        records.append({'name':name,'path':path,'state':state,'reason':reason})
    passed=sum(x['state']=='PASS' for x in records)
    return {'version':'WEBSTUDIO-V85-20261109','source':'real-public-HTTPS-body-GET-only',
            'origin':origin,'timestamp_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
            'status':'PASS_V85_PUBLIC_FILES_ONLY' if passed==len(CHECKS) else 'HOLD_V85_PUBLIC',
            'pass':passed,'total':len(CHECKS),'records':records,'customer_email_received':'NOT_VERIFIED',
            'cloudflare_production_commit':'NOT_VERIFIED','actual_browser_iframe_interactions':'SEPARATE_TEST',
            'customer_payment_or_reservation':'NOT_IMPLEMENTED','paid_apis_used':0}

def save(report,dest):
    dest=Path(dest);dest.mkdir(parents=True,exist_ok=True)
    j=dest/'AFO_V85_PUBLIC_FILES.json';t=dest/'AFO_V85_PUBLIC_FILES_KO.txt'
    j.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
    lines=['올파일원 웹스튜디오 V85 실공개 파일 점검','결과: '+report['status'],
           '공개 URL: '+report['origin'],f"본문 검사: {report['pass']}/{report['total']}",
           '※ HTML/JS/CSS 응답이 확인됐으며 실제 예약·결제·고객 메일·모든 화면 클릭은 증명되지 않습니다.','']
    lines += [x['state']+' | '+x['path']+' | '+x['reason'] for x in report['records'] if x['state']!='PASS']
    t.write_text('\n'.join(lines)+'\n',encoding='utf-8-sig');return j,t

def main(argv=None):
    p=argparse.ArgumentParser(description='V85 44-file HTTPS read-only check')
    p.add_argument('--output',type=Path,required=True)
    x=p.parse_args(argv);r=check();j,t=save(r,x.output)
    print(r['status'],r['pass'],'/',r['total'],'result:',t)
    return 0 if r['status']=='PASS_V85_PUBLIC_FILES_ONLY' else 3

if __name__=='__main__':sys.exit(main())
