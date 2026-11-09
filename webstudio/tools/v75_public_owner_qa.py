#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V75 one-click Windows public acceptance: real HTTPS + actual Edge CDP checks.

Only public GETs and synthetic browser UI actions; never submit real customer forms,
open/send mail, connect external AI APIs, or change global Python/PowerShell settings.
Always writes truthful HOLD evidence on network/browser failure.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import zipfile

ORIGIN = 'https://allfileone-webstudio.pages.dev/'
VERSION = 'V74-20261109'  # V75 is the *local verifier*, public source still V74.
SECTORS = ('manufacturing','corporate','clinic','academy','interior','commerce',
           'professional','association','franchise','stay','realestate','event')
STYLES = ('modern','premium','editorial')
SCRIPT_SUITES = ('v65_edge_live_qa.py','v652_live_demo_qa.py',
                 'v653_live_sales_qa.py','v66_live_design_qa.py')
ROOT = Path(__file__).resolve().parents[1]


def now():
    return datetime.now().astimezone().isoformat(timespec='seconds')


def normalized_path(p):
    # Cloudflare may redirect /foo.html -> /foo but never allow a different route.
    p = p.rstrip('/') or '/'
    if p.endswith('.html'):
        p = p[:-5]
    return '/' if p in ('/index', '/index.html') else p


def exact_route(actual, requested):
    a, b = urlsplit(actual), urlsplit(requested)
    return (a.scheme, a.hostname, a.port) == (b.scheme, b.hostname, b.port) and \
        a.scheme == 'https' and normalized_path(a.path) == normalized_path(b.path) and \
        a.query == b.query


def probes():
    critical = [
        ('V74 릴리스 매니페스트','assets/current-release.json',None),
        ('V74 릴리스 증거','assets/release-v74.json',('\"release\": \"V74-20261109\"','\"public_proof\": true')),
        ('V74 공개 검증 화면','site-proof-v74.html',('data-v74-proof="V74-20261109"','assets/v74-public-proof.js')),
        ('V74 검증 실행 코드','assets/v74-public-proof.js',("window.AFO_V74_PUBLIC_PROOF='V74-20261109'",)),
        ('12업종 기능 원본','assets/v28-catalog.js',('window.ALLFILEONE_V28_CATALOG',)),
        ('홈페이지','index.html',('design-compare-live.html','contact.html')),
        ('3종 디자인 비교','design-compare-live.html',('assets/v70-buyer-bridge.js','assets/v28-catalog.js')),
        ('가격·제작 범위','plan-guide.html',('pg-form','v653')),
        ('상담 준비서','contact.html',('id="brief-form"','assets/v72-complete-contact.js')),
        ('전체 상담서 보존','assets/v72-complete-contact.js',("window.AFO_V73_SCOPE_GUARD='v73.0'",'function packet()')),
        ('상담 메일 요약','assets/v653-sales-bridge.js',('mailto','v71')),
        ('구분된 디자인','assets/v69-artdirection.css',('theme-modern','theme-premium','theme-editorial')),
        ('웹 데모 실행','assets/demo.js',('v69-artdirection.js','v28')),
        ('상담 흐름','assets/v70-buyer-bridge.js',('afo.webstudio.v653.offer',)),
        ('메인 디자인 비교 코드','assets/v67-compare.js',('actualFeatures(industry)','feature.title')),
        ('사이트맵','sitemap.xml',('contact.html',)),
    ]
    for sector in SECTORS:
        for style in STYLES:
            critical.append((f'실제 데모 {sector}/{style}',f'demo/{sector}/{style}/index.html',
                             (f'data-industry="{sector}"',f'data-v13-style="{style}"','../../../assets/demo.js')))
    return critical


def get_public(path, opener=urlopen):
    url = ORIGIN + path
    req = Request(url, headers={'User-Agent':'AllFileOne-WebStudio-Owner-QA/75',
                                'Cache-Control':'no-cache','Pragma':'no-cache',
                                'Accept':'text/html,application/json,text/plain,*/*'})
    with opener(req, timeout=9) as response:
        status = response.getcode()
        final_url = response.geturl()
        if status != 200:
            raise ValueError(f'HTTP {status} (200 필요)')
        if not exact_route(final_url,url):
            raise ValueError('다른 주소로 이동한 응답: '+final_url[:140])
        raw=response.read(2_000_001)
        if len(raw)>2_000_000:
            raise ValueError('본문 크기 제한 초과')
        return raw.decode('utf-8-sig')


def check_one(item, getter=get_public):
    name,path,markers=item
    try:
        body=getter(path)
        if path=='assets/current-release.json':
            m=json.loads(body)
            ok = (m.get('product')=='AllFileOne WebStudio' and
                  m.get('v74_public_proof_version')==VERSION and
                  m.get('v73_scope_guard_version')=='V73-20261109' and
                  m.get('v72_complete_packet_version')=='V72-20261109' and
                  m.get('v74_public_audit_no_mail_receipt_claim') is True)
            detail='정확한 V74/V73/V72 공개 매니페스트' if ok else '오래되었거나 잘못된 공개 버전'
        elif path=='assets/v28-catalog.js':
            match=re.search(r'Object\.freeze\((\{.*?\})\);',body,re.S)
            catalog=json.loads(match.group(1)) if match else {}
            ok=bool(markers and all(s in body for s in markers) and
                len(catalog)==12 and all(len(catalog.get(s,{}).get('features',[]))==4 and
                all(f.get('title') and f.get('desc') for f in catalog[s]['features']) for s in SECTORS))
            detail='12업종 / 48개 시연 기능 정의' if ok else '카탈로그 구성 불일치'
        else:
            ok=bool(markers and all(marker in body for marker in markers))
            detail='HTTP 200 / 본문 일치' if ok else 'HTTP 200이지만 본문 표식 누락 또는 구버전'
        return {'name':name,'path':path,'pass':ok,'detail':detail}
    except Exception as e:
        return {'name':name,'path':path,'pass':False,'detail':(type(e).__name__+': '+str(e))[:220]}


def http_check():
    items=probes()
    # Fail fast: a DNS/HTTPS failure or an out-of-date release makes dozens of
    # further HTTP GETs pointless. Report every skipped file as HOLD, not PASS.
    first=check_one(items[0])
    if not first['pass']:
        return [first]+[{'name':name,'path':path,'pass':False,
                         'detail':'선행 공개 버전 확인 실패로 검사 보류: '+first['detail'][:130]}
                        for name,path,_ in items[1:]]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        rest=list(pool.map(check_one,items[1:]))
    return [first]+rest


def run_browser_suites(out, output, python=sys.executable):
    results=[]
    for name in SCRIPT_SUITES:
        script=ROOT/'tools'/name
        result={'suite':name,'status':'HOLD','exit_code':None,'detail':''}
        suite_folder=out/name.replace('.py','')
        suite_folder.mkdir(parents=True,exist_ok=True)
        logpath=suite_folder/'V75_RUN.log'
        if not script.is_file():
            result['detail']='소스에 브라우저 검사 코드가 없습니다.'
        else:
            try:
                p=subprocess.run([python,str(script),'--output',str(suite_folder)],cwd=str(ROOT),
                                 stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,
                                 encoding='utf-8',errors='replace',timeout=300,check=False)
                logpath.write_text(p.stdout,encoding='utf-8')
                result['exit_code']=p.returncode
                result['status']='PASS' if p.returncode==0 else 'HOLD'
                result['detail']=p.stdout[-1600:]
            except subprocess.TimeoutExpired as e:
                result['detail']='검사 제한시간 초과 / 강제 종료됨'
                logpath.write_text(result['detail']+'\n',encoding='utf-8')
            except Exception as e:
                result['detail']='실행 실패: '+str(e)[:200]
                logpath.write_text(result['detail']+'\n',encoding='utf-8')
        results.append(result)
    return results


def pack(folder, dest, report):
    reportfile=folder/'V75_PUBLIC_QA_RESULT.json'
    reportfile.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    plain=[
        '올파일원 웹스튜디오 V75 공개 사이트 Windows 실기 검증',
        '검사 일시: '+report['timestamp'],
        '대상: '+ORIGIN,
        '상태: '+report['result'],
        '공개 파일: '+str(report['http_pass'])+'/'+str(report['http_total']),
        'Windows Edge 실기: '+str(sum(x['status']=='PASS' for x in report['browser']))+'/'+str(len(report['browser'])),
        '확인하지 않은 것: 실제 이메일 수신, 결제, 계약, 고객 문의 제출',
        '추가 유료 API: 사용하지 않음','',
        '[공개 파일 검사]'
    ]
    plain += [('PASS' if r['pass'] else 'HOLD')+' | '+r['path']+' | '+r['detail'] for r in report['http_checks']]
    plain += ['', '[실제 브라우저 검사]'] + [x['status']+' | '+x['suite']+' | 종료코드='+str(x['exit_code']) for x in report['browser']]
    if report['result']!='PASS_PUBLIC_FILES_AND_BROWSER_ONLY':
        plain += ['', 'HOLD 이유: 공개 주소 DNS/접속/구버전/실제 브라우저 오류가 있습니다. 위 항목을 확인하세요.']
    (folder/'V75_PUBLIC_QA_RESULT_KO.txt').write_text('\n'.join(plain)+'\n',encoding='utf-8-sig')
    srcfiles=sorted((x for x in folder.rglob('*') if x.is_file() and x.name!='V75_SHA256_MANIFEST.json'),key=lambda x:x.as_posix())
    manifest={'source':'V75 actual public acceptance (not offline fixture)',
              'status':report['result'],
              'files':{str(x.relative_to(folder)).replace('\\','/'):{'sha256':hashlib.sha256(x.read_bytes()).hexdigest(),'bytes':x.stat().st_size} for x in srcfiles}}
    (folder/'V75_SHA256_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    dest.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in sorted(folder.rglob('*')):
            if p.is_file():z.write(p,str(p.relative_to(folder)).replace('\\','/'))
    with zipfile.ZipFile(dest) as z:
        bad=z.testzip()
        if bad:raise RuntimeError('ZIP CRC 검사 실패: '+bad)
    (dest.parent/'AFO_WebStudio_V75_PUBLIC_QA_LATEST.sha256').write_text(
        hashlib.sha256(dest.read_bytes()).hexdigest()+'  '+dest.name+'\n',encoding='ascii')
    return manifest


def main(argv=None):
    p=argparse.ArgumentParser(description='Windows Edge / 실제 Cloudflare V74 공개 QA / 비용 0원')
    p.add_argument('--output',type=Path,default=Path.home()/'Downloads')
    p.add_argument('--http-only',action='store_true',help='공개 파일만 확인, 브라우저 검사는 HOLD')
    args=p.parse_args(argv)
    folder=args.output.expanduser().resolve()
    folder.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='AFO_V75_') as temp:
        working=Path(temp)
        checks=http_check()
        all_ok=bool(checks) and all(c['pass'] for c in checks)
        browsers=run_browser_suites(working,working) if all_ok and not args.http_only else [
            {'suite':s,'status':'HOLD','exit_code':None,'detail':'공개 파일 검사 실패 또는 --http-only 지정으로 보류'} for s in SCRIPT_SUITES]
        browser_ok=all(x['status']=='PASS' for x in browsers)
        result='PASS_PUBLIC_FILES_AND_BROWSER_ONLY' if all_ok and browser_ok else 'HOLD_PUBLIC_DEPLOY_OR_BROWSER'
        report={'version':'V75','timestamp':now(),'origin':ORIGIN,'result':result,
                'http_pass':sum(x['pass'] for x in checks),'http_total':len(checks),
                'http_checks':checks,'browser':browsers,'email_receipt':'NOT_VERIFIED',
                'customer_transaction':'NOT_VERIFIED','paid_api_calls':0}
        archive=folder/'AFO_WebStudio_V75_PUBLIC_QA_LATEST.zip'
        pack(working,archive,report)
        (folder/'AFO_WebStudio_V75_PUBLIC_QA_LATEST_KO.txt').write_bytes((working/'V75_PUBLIC_QA_RESULT_KO.txt').read_bytes())
        print('공개파일',report['http_pass'],'/',report['http_total'])
        print('실기 결과:',result)
        print('한국어 보고서:',folder/'AFO_WebStudio_V75_PUBLIC_QA_LATEST_KO.txt')
        print('증거 ZIP:',archive)
        return 0 if result=='PASS_PUBLIC_FILES_AND_BROWSER_ONLY' else 3


if __name__=='__main__':
    sys.exit(main())