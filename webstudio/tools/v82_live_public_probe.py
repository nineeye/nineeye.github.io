#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Read-only V82 live HTTPS source evidence, fail-closed on unreachable/stale Pages.

NO browser UI claim, customer email access, cookies, POST, or paid APIs. Intended
for Windows GitHub-hosted Actions + owner local Windows when deployed.
"""
from __future__ import annotations
import argparse, datetime, hashlib, json, re, sys, time, zipfile
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

PRODUCTION_ORIGIN='https://allfileone-webstudio.pages.dev/'
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce',
         'professional','association','franchise','stay','realestate','event')
STYLES=('modern','premium','editorial')
EXPECTED_ID='WEBSTUDIO-V82-20261109'
EXACT_ASSETS=[
 ('홈페이지','index.html',('site-current-version','홈페이지 HTML 버전 V82')),
 ('V82 공개 검사 화면','release-check-v82.html',('v82-release-check.js','V82 실제 공개 배포 확인')),
 ('V82 공개 검사 동작','assets/v82-release-check.js',("window.AFO_V82_PROBE='V82-20261109'",)),
 ('V81 제작 범위','feature-scope-v81.html',('data-v81-scope="V81-20261109"',)),
 ('고객 문의','contact.html',('id="brief-form"','v76-contact-unification.js')),
 ('디자인 비교','design-compare-live.html',('assets/v28-catalog.js','v81-compare-link.js')),
 ('업종 8개 기능','industry-features-v77.html',('v77-industry-hub.js',)),
 ('가상 시연 실행','assets/demo.js',('v80-simulator.js','v79-simulator.js','v78-simulator.js')),
 ('V80 엔진','assets/v80-simulator.js',("version:'V80-20261109'",)),
 ('V81 제작 범위 JS','assets/v81-production-scope.js',("window.AFO_V81_SCOPE_READY='V81-20261109'",)),
]

def norm_route(path):
    if path.endswith('.html'): return path[:-5]
    return path.rstrip('/')

def target_url(origin,path):return origin+path

def actual_get(origin,path,timeout=9):
    req=Request(target_url(origin,path),headers={'User-Agent':'AllFileOne-WebStudio-V82-ReadOnlyQA/1',
                       'Cache-Control':'no-cache','Accept':'text/html,application/json,text/plain,*/*'})
    with urlopen(req,timeout=timeout) as resp:
        actual=urlsplit(resp.geturl());expected=urlsplit(req.full_url)
        if resp.status!=200:raise RuntimeError(f'HTTP {resp.status}')
        if (actual.scheme,actual.netloc)!=(expected.scheme,expected.netloc):raise RuntimeError('다른 출처 리디렉션')
        if norm_route(actual.path)!=norm_route(expected.path):raise RuntimeError('다른 경로로 리디렉션')
        body=resp.read(2_000_001)
        if len(body)>2_000_000:raise RuntimeError('응답이 너무 큼')
        return body.decode('utf-8-sig')

def read_record(name,path,markers,getter):
    try:
        text=getter(path);passed=all(m in text for m in markers)
        return {'name':name,'path':path,'status':'PASS' if passed else 'HOLD','reason':'본문 표식 일치' if passed else '최신 릴리스 표식 불일치'}
    except Exception as e:
        return {'name':name,'path':path,'status':'HOLD','reason':(type(e).__name__+': '+str(e))[:220]}

def once(getter):
    report=[]
    try:
        text=getter('assets/current-release.json')
        data=json.loads(text)
        valid=bool(data.get('product')=='AllFileOne WebStudio' and data.get('version')=='V82' and
                   data.get('release_id')==EXPECTED_ID and data.get('v80_total_browser_simulations')==84 and
                   data.get('v81_scope_version')=='V81-20261109' and data.get('v82_released_source_version')=='V82-20261109')
        report.append({'name':'공개 릴리스 정본','path':'assets/current-release.json','status':'PASS' if valid else 'HOLD',
                       'reason':'V82 / 36개 시안 / 84개 가상 시연 확인' if valid else 'V82 이전 파일 또는 잘못된 매니페스트'})
        if not valid:return report
    except Exception as e:
        report.append({'name':'공개 릴리스 정본','path':'assets/current-release.json','status':'HOLD',
                       'reason':(type(e).__name__+': '+str(e))[:220]})
        return report
    for name,path,markers in EXACT_ASSETS:
        report.append(read_record(name,path,markers,getter))
    for sector in SECTORS:
        for style in STYLES:
            path=f'demo/{sector}/{style}/index.html'
            markers=(f'data-industry="{sector}"',f'data-v13-style="{style}"','../../../assets/demo.js')
            report.append(read_record('디자인 시연',path,markers,getter))
    return report

def summarize(report,origin,attempt):
    passed=sum(x['status']=='PASS' for x in report)
    all_ok=(len(report)==47 and passed==47)
    return {'version':'V82-20261109','origin':origin,'attempts':attempt,'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'result':'PASS_PUBLIC_FILES_ONLY' if all_ok else 'HOLD_PUBLIC_DEPLOY',
            'pass':passed,'total':len(report),'expected_checks':47,'records':report,'actual_customer_email':'NOT_VERIFIED',
            'actual_browser_clicks':'NOT_VERIFIED','actual_customer_contracts':'NOT_VERIFIED','paid_api_calls':0}

def write_report(report,outdir):
    outdir.mkdir(parents=True,exist_ok=True)
    txt=outdir/'AFO_V82_PUBLIC_LIVE_RESULT_KO.txt';js=outdir/'AFO_V82_PUBLIC_LIVE_RESULT.json'
    js.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
    lines=['올파일원 웹스튜디오 V82 — 실제 공개 서버 읽기 검사','검사 주소: '+report['origin'],
           '결과: '+report['result'],'공개 파일: '+str(report['pass'])+'/'+str(report['expected_checks']),
           '시도 횟수: '+str(report['attempts']),'','실제 이메일 수신·고객 예약·결제·계약: 검증하지 않았음',
           '추가 유료 API: 사용하지 않음','']
    lines.extend(x['status']+' | '+x['path']+' | '+x['reason'] for x in report['records'])
    txt.write_text('\n'.join(lines)+'\n','utf-8-sig')
    zipfile_path=outdir/'AFO_V82_PUBLIC_LIVE_EVIDENCE.zip'
    with zipfile.ZipFile(zipfile_path,'w',compression=zipfile.ZIP_DEFLATED) as z:
        z.write(js,js.name);z.write(txt,txt.name)
    with zipfile.ZipFile(zipfile_path) as z:
        if z.testzip():raise RuntimeError('Evidence ZIP CRC error')
    sha=hashlib.sha256(zipfile_path.read_bytes()).hexdigest()
    (outdir/'AFO_V82_PUBLIC_LIVE_EVIDENCE.sha256').write_text(sha+'  '+zipfile_path.name+'\n','ascii')
    return txt,js,zipfile_path

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--max-attempts',type=int,default=6)
    parser.add_argument('--retry-seconds',type=int,default=10)
    args=parser.parse_args()
    if not 1<=args.max_attempts<=12 or not 0<=args.retry_seconds<=30:parser.error('허용하지 않는 재시도 설정')
    getter=lambda path: actual_get(PRODUCTION_ORIGIN,path)
    rows=[];attempt=0
    for attempt in range(1,args.max_attempts+1):
        rows=once(getter)
        if len(rows)==47 and all(x['status']=='PASS' for x in rows):break
        # DNS failures and TLS errors won't be fixed by a brief propagation wait.
        reason=rows[0]['reason'] if rows else ''
        if any(key in reason for key in ('gaierror','Name or service not known','nodename nor servname','CERTIFICATE_VERIFY_FAILED')):break
        if attempt<args.max_attempts:time.sleep(args.retry_seconds)
    report=summarize(rows,PRODUCTION_ORIGIN,attempt);write_report(report,args.output)
    print('V82 live site',report['result'],report['pass'],'/',report['expected_checks'],'attempts',attempt)
    return 0 if report['result']=='PASS_PUBLIC_FILES_ONLY' else 3
if __name__=='__main__':sys.exit(main())