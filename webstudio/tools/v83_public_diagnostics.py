#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""WebStudio V83: read-only, standard-library, multi-origin Cloudflare diagnosis.

This script NEVER deploys, signs in, submits forms, sends mail, changes DNS, or calls paid APIs.
PASS proves exact V82 public file responses at the selected origin only; it does not
prove browser interactions, email receipt, bookings, payments, or contracts.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import socket
import ssl
import sys
import urllib.error
import zipfile
from pathlib import Path
from urllib.parse import urlsplit

from v82_live_public_probe import (once, actual_get, summarize, EXPECTED_ID)

PRIMARY = 'https://allfileone-webstudio.pages.dev/'
ALLOWED_ORIGINS = (
    PRIMARY,
    'https://allfileone.co.kr/',
    'https://www.allfileone.co.kr/',
)
CLASS_ACTION = {
    'PASS_PUBLIC_FILES_ONLY': '공개 V82 파일은 일치합니다. 실제 PC·모바일 버튼 동작과 고객 메일 수신은 별도 검증하세요.',
    'DNS_FAILURE': '이 위치에서 도메인 이름을 확인할 수 없습니다. Cloudflare 프로젝트 도메인·DNS 기록, 다른 네트워크 접속 결과를 각각 확인하세요. 사이트 장애로 단정하지 마세요.',
    'TLS_CERTIFICATE': 'TLS/인증서 검증 문제가 있습니다. Cloudflare 도메인 연결과 인증서 발급 상태를 확인하세요.',
    'HTTP_NOT_FOUND': '공개 경로가 없습니다. Cloudflare Pages의 Production 배포 상태와 Build output directory=webstudio 설정을 확인하세요.',
    'HTTP_AUTH': '공개 페이지가 인증/접근 차단을 반환했습니다. Access 규칙과 공개 여부를 확인하세요.',
    'HTTP_SERVER': '서버가 오류를 반환했습니다. Cloudflare 배포 로그와 서비스 장애 여부를 확인하세요.',
    'HTTP_REDIRECT': '다른 도메인/경로로 이동했습니다. Pages 사용자 지정 도메인과 리디렉션 설정을 확인하세요.',
    'STALE_RELEASE': '공개 주소가 V82 아닌 구버전 파일을 제공하고 있습니다. Production branch=main, 커밋, 빌드 출력 폴더를 확인하세요.',
    'UNEXPECTED_CONTENT': '200 OK지만 예상한 웹스튜디오 릴리스 JSON이 아닙니다. 잘못된 배포 폴더 또는 SPA fallback을 확인하세요.',
    'PUBLIC_ASSET_MISMATCH': '릴리스 표식은 맞지만 일부 공개 파일이 누락/변경됐습니다. 공개 검증 보고서에서 개별 경로를 확인하세요.',
    'CONNECT_TIMEOUT': '연결 시간이 초과됐습니다. 네트워크·도메인·Cloudflare 상태를 다른 네트워크에서도 재검사하세요.',
    'NETWORK_ERROR': '네트워크 접속 오류입니다. 오류 상세를 참고해 브라우저/다른 네트워크로 교차 확인하세요.',
    'UNEXPECTED_ERROR': '예상 밖 오류입니다. 오류 유형을 확인하고 진단기 자체 결함인지 조사하세요.',
}

def normalized_origin(value: str) -> str:
    x = urlsplit(value.strip())
    if x.scheme != 'https' or not x.hostname or x.port not in (None, 443) or x.username or x.password or x.query or x.fragment or x.path not in ('', '/'):
        raise ValueError('허용된 HTTPS 공개 사이트의 원점 주소만 입력할 수 있습니다.')
    canonical = f'https://{x.hostname.lower()}/'
    if canonical not in ALLOWED_ORIGINS:
        raise ValueError('등록된 Pages 또는 소유자 도메인 후보 주소만 검사할 수 있습니다.')
    return canonical

def dns_resolves(host: str) -> None:
    # Do not include raw resolved IP addresses in reports; this is diagnostic only.
    socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)

def describe_error(exc: Exception) -> tuple[str, str]:
    if isinstance(exc, socket.gaierror): return 'DNS_FAILURE', f'{type(exc).__name__}: {exc}'
    if isinstance(exc, (ssl.SSLCertVerificationError, ssl.SSLError)): return 'TLS_CERTIFICATE', f'{type(exc).__name__}: {exc}'
    if isinstance(exc, TimeoutError) or isinstance(exc, socket.timeout):return 'CONNECT_TIMEOUT', f'{type(exc).__name__}: {exc}'
    if isinstance(exc, urllib.error.HTTPError):
        code=exc.code
        if code in (401,403): return 'HTTP_AUTH', f'HTTP {code}'
        if code==404: return 'HTTP_NOT_FOUND', f'HTTP {code}'
        if code>=500: return 'HTTP_SERVER', f'HTTP {code}'
        if 300<=code<400:return 'HTTP_REDIRECT', f'HTTP {code}'
        return 'NETWORK_ERROR', f'HTTP {code}'
    if isinstance(exc, urllib.error.URLError):
        reason = getattr(exc,'reason',exc)
        if isinstance(reason,Exception) and reason is not exc:return describe_error(reason)
        return 'NETWORK_ERROR', f'{type(exc).__name__}: {reason}'
    text=str(exc)
    if 'redirect' in text.lower() or '다른 경로' in text or '다른 출처' in text:return 'HTTP_REDIRECT', f'{type(exc).__name__}: {text}'
    return 'UNEXPECTED_ERROR', f'{type(exc).__name__}: {text}'

def probe_one(origin: str, *, dns=dns_resolves, get=None) -> dict:
    origin = normalized_origin(origin)
    name = urlsplit(origin).hostname or ''
    summary = {'origin':origin,'host':name,'status':'HOLD_PUBLIC_DEPLOY','cause':'NETWORK_ERROR',
               'passed':0,'expected':47,'records':[],'reason':'','actual_customer_email':'NOT_VERIFIED',
               'actual_browser_clicks':'NOT_VERIFIED','actual_booking_payment':'NOT_VERIFIED'}
    try:
        dns(name)
        getter=get or (lambda path:actual_get(origin,path,timeout=7))
        raw=getter('assets/current-release.json')
        try:
            manifest=json.loads(raw)
        except (ValueError,TypeError) as exc:
            summary.update(cause='UNEXPECTED_CONTENT',reason=f'예상한 JSON이 아님: {type(exc).__name__}')
            return finish(summary)
        if not isinstance(manifest,dict) or manifest.get('product')!='AllFileOne WebStudio':
            summary.update(cause='UNEXPECTED_CONTENT',reason='다른 사이트의 JSON 또는 올바르지 않은 파일')
            return finish(summary)
        if manifest.get('version')!='V82' or manifest.get('release_id')!=EXPECTED_ID:
            summary.update(cause='STALE_RELEASE',reason='공개 릴리스 값: '+str(manifest.get('version'))+' / '+str(manifest.get('release_id')))
            return finish(summary)
        # Delegate the exact 47-file/version check to the tested V82 source of truth.
        records=once(getter)
        audit=summarize(records,origin,1)
        summary.update(records=records,passed=audit['pass'],expected=audit['expected_checks'])
        if audit['result']=='PASS_PUBLIC_FILES_ONLY':
            summary.update(status='PASS_PUBLIC_FILES_ONLY',cause='PASS_PUBLIC_FILES_ONLY',reason='47/47 공개 소스 표식 일치')
        else:
            summary.update(cause='PUBLIC_ASSET_MISMATCH',reason='공개 파일 '+str(audit['pass'])+'/'+str(audit['expected_checks'])+' 일치')
    except Exception as exc:
        cause,reason=describe_error(exc)
        summary.update(cause=cause,reason=reason[:260])
    return finish(summary)

def finish(result: dict) -> dict:
    result['next_action_ko']=CLASS_ACTION.get(result['cause'], CLASS_ACTION['UNEXPECTED_ERROR'])
    return result

def report_for(origins, *, dns=dns_resolves, get_factory=None) -> dict:
    results=[]
    for o in origins:
        origin=normalized_origin(o)
        get=get_factory(origin) if get_factory is not None else None
        results.append(probe_one(origin,dns=dns,get=get))
    return {
      'product':'AllFileOne WebStudio','diagnostic_version':'V83-20261109',
      'expected_site_release':'V82-20261109',
      'timestamp_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
      'overall':'PASS_PRIMARY_PUBLIC_FILES_ONLY' if results and results[0]['status']=='PASS_PUBLIC_FILES_ONLY' else 'HOLD_PRIMARY_UNVERIFIED',
      'important':'모든 후보 도메인의 결과는 각각 독립적이며 사용자 지정 도메인은 연결된 것으로 가정하지 않습니다.',
      'actual_customer_email':'NOT_VERIFIED','actual_production_deploy_commit':'NOT_VERIFIED',
      'actual_browser_flow':'NOT_VERIFIED','paid_api_calls':0,'origins':results,
    }

def write_evidence(report: dict, out: Path) -> dict:
    out.mkdir(parents=True,exist_ok=True)
    j=out/'AFO_V83_PUBLIC_DIAGNOSTIC.json';t=out/'AFO_V83_PUBLIC_DIAGNOSTIC_KO.txt';z=out/'AFO_V83_PUBLIC_DIAGNOSTIC_EVIDENCE.zip';digest=out/'AFO_V83_PUBLIC_DIAGNOSTIC_EVIDENCE.sha256'
    j.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['올파일원 웹스튜디오 V83 공개 배포 원인 진단','대상: 정적 홈페이지 V82 / 검사기 V83',
           '종합 상태: '+report['overall'],'검사 시각 UTC: '+report['timestamp_utc'],'',
           '실제 고객 이메일·실제 예약·결제·브라우저 동선·Cloudflare 배포 커밋은 이 검사로 검증하지 않습니다.','']
    for result in report['origins']:
        lines += ['사이트: '+result['origin'],'결과: '+result['status'], '분류: '+result['cause'],
                  '공개 파일: '+str(result['passed'])+'/'+str(result['expected']),
                  '원인: '+result['reason'],'권장 확인: '+result['next_action_ko'],'']
        for row in result['records']:
            if row['status']!='PASS':lines.append('  '+row['status']+' | '+row['path']+' | '+row['reason'])
    t.write_text('\n'.join(lines)+'\n',encoding='utf-8-sig')
    with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as arc:
        arc.write(j,j.name);arc.write(t,t.name)
    with zipfile.ZipFile(z) as arc:
        if arc.testzip() is not None:raise ValueError('ZIP CRC 오류')
    digest.write_text(hashlib.sha256(z.read_bytes()).hexdigest()+'  '+z.name+'\n','ascii')
    return {'json':str(j),'txt':str(t),'zip':str(z),'sha256':str(digest)}

def main(argv=None):
    parser=argparse.ArgumentParser(description='V83 공개 사이트 읽기 전용 원인 진단, 추가 유료 서비스 없음')
    parser.add_argument('--output',type=Path,default=Path.home()/'Downloads'/'AFO_WebStudio_V83_Public_Diagnostic')
    parser.add_argument('--include-owned-domain',action='store_true',help='사용자 지정 도메인 후보를 추가 검사하며 실제 연결을 가정하지 않음')
    args=parser.parse_args(argv)
    origins=[PRIMARY]+(list(ALLOWED_ORIGINS[1:]) if args.include_owned_domain else [])
    report=report_for(origins)
    paths=write_evidence(report,args.output)
    print('V83 diagnostic:',report['overall'])
    for x in report['origins']:print(x['origin'],x['cause'],f"{x['passed']}/{x['expected']}")
    print('Report:',paths['txt'])
    return 0 if report['overall']=='PASS_PRIMARY_PUBLIC_FILES_ONLY' else 3

if __name__=='__main__':sys.exit(main())