#!/usr/bin/env python3
# AllFileOne WebStudio V59 - zero-cost, read-only publication proof.
# Standard library only; no credential access, no customer data, no writes to servers.
"""Check source release, official Cloudflare CI, and independent public site reads."""
import argparse
import base64
import binascii
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler

REPO = 'nineeye/nineeye.github.io'
API = 'https://api.github.com/repos/' + REPO
LIVE = 'https://allfileone-webstudio.pages.dev'
SECTORS = ('manufacturing', 'academy', 'interior', 'restaurant', 'beauty', 'logistics')

class SafeRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        parsed = urlparse(newurl)
        if parsed.scheme != 'https' or parsed.netloc not in ('api.github.com', 'allfileone-webstudio.pages.dev'):
            raise ValueError('외부 도메인 리다이렉트 차단')
        return super().redirect_request(request, fp, code, msg, headers, newurl)

OPENER = build_opener(SafeRedirect)

def get(url):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.netloc not in ('api.github.com', 'allfileone-webstudio.pages.dev'):
        raise ValueError('허용되지 않은 검사 대상')
    req = Request(url, headers={'User-Agent':'AllFileOne-WebStudio-V59-ReadOnly',
                                'Accept':'application/vnd.github+json' if parsed.netloc == 'api.github.com' else 'text/html,application/json'})
    with OPENER.open(req, timeout=9) as response:
        if response.status != 200:
            raise ValueError('HTTP ' + str(response.status))
        if urlparse(response.url).netloc != parsed.netloc:
            raise ValueError('검사 출처가 달라졌습니다')
        body = response.read(1_500_001)
        if len(body) > 1_500_000:
            raise ValueError('응답 크기가 허용 범위를 초과했습니다')
        return body.decode('utf-8-sig')

def analyze(fetch=get):
    report = {'checked_at_utc':datetime.now(timezone.utc).isoformat(timespec='seconds'),
              'source':'official GitHub API + independent Cloudflare Pages HTTP',
              'repository':REPO, 'cloudflare_url':LIVE,
              'commit_sha':None, 'release':None, 'release_id':None, 'ci':{'status':'HOLD','detail':'미확인'},
              'live':{'status':'HOLD','checks':[]},
              'real_mail':'NOT_TESTED', 'search_index':'NOT_TESTED',
              'technical_status':'HOLD', 'notes':[]}
    def fail(scope, reason):
        report['notes'].append(scope+': '+str(reason)[:180])
    def json_read(url):
        return json.loads(fetch(url))
    try:
        commit = json_read(API + '/commits/main')
        sha = commit.get('sha','')
        if not re.fullmatch(r'[a-f0-9]{40}',sha):
            raise ValueError('GitHub 커밋 SHA 형식 오류')
        report['commit_sha'] = sha
        data = json_read(API + '/contents/webstudio/assets/current-release.json?ref='+sha)
        if data.get('encoding') != 'base64' or not isinstance(data.get('content'),str):
            raise ValueError('릴리스 파일 응답 형식이 다릅니다')
        release = json.loads(base64.b64decode(''.join(data['content'].split()),validate=True).decode('utf-8-sig'))
        if release.get('product') != 'AllFileOne WebStudio' or not re.fullmatch(r'V\d+',str(release.get('version',''))):
            raise ValueError('제품 릴리스 데이터 불일치')
        report['release'] = release['version']
        report['release_id'] = str(release.get('release_id',''))
        checks = json_read(API+'/commits/'+sha+'/check-runs?per_page=100').get('check_runs',[])
        cfs = [x for x in checks if x.get('name') == 'Cloudflare Pages' and x.get('head_sha',sha) == sha]
        if cfs and any(x.get('status')=='completed' and x.get('conclusion')=='success' for x in cfs):
            report['ci']={'status':'PASS','detail':'GitHub Cloudflare Pages check-run success for exact commit SHA',
                          'evidence_url':cfs[0].get('html_url','')}
        elif cfs:
            report['ci']={'status':'HOLD','detail':'Cloudflare Pages check-run exists but not successful: '+str(cfs[0].get('conclusion'))}
        else:
            report['ci']={'status':'HOLD','detail':'해당 커밋의 Cloudflare Pages 검사 기록 없음'}
    except (HTTPError, URLError, OSError, ValueError, KeyError, TypeError, UnicodeError, binascii.Error, json.JSONDecodeError) as exc:
        fail('GitHub 소스·공식 배포',exc)
    if report['release']:
        paths=[('assets/current-release.json',lambda t: json.loads(t).get('version')==report['release']),
               ('index.html',lambda t:'site-current-version' in t and 'quick-inquiry.html' in t and str(report['release_id']) in t),
               ('quick-inquiry.html',lambda t:all('name="industry" value="'+s+'"' in t for s in SECTORS)),
               ('launch-kit.html',lambda t:all('data-sector="'+s+'"' in t for s in SECTORS)),
               ('contact.html',lambda t:'id="brief-form"' in t)]
        for s in SECTORS:
            paths.append(('for-'+s+'.html',lambda t,s=s:'quick-inquiry.html?industry='+s in t or (s in ('manufacturing','academy','interior') and 'contact.html' in t)))
        for path,test in paths:
            try:
                text = fetch(LIVE+'/'+path)
                passed = bool(test(text))
                detail = '현재 서버 파일·예상 내용 확인' if passed else 'HTTP 응답은 있으나 기대 내용 불일치'
                report['live']['checks'].append({'path':path,'status':'PASS' if passed else 'HOLD','detail':detail})
            except (HTTPError, URLError, OSError, ValueError, TypeError, json.JSONDecodeError) as exc:
                report['live']['checks'].append({'path':path,'status':'HOLD','detail':str(exc)[:140]})
        total = len(report['live']['checks']); good=sum(x['status']=='PASS' for x in report['live']['checks'])
        report['live']['status'] = 'PASS' if good==total else 'HOLD'
        report['live']['summary'] = f'{good}/{total} 공개 파일 검사 통과'
    if report['ci']['status']=='PASS' and report['live']['status']=='PASS':
        report['technical_status']='PASS_TECHNICAL_ONLY'
    report['notes'].append('GitHub 배포 검사 PASS는 공개 페이지 동작·문의 메일 수신 성공과 다릅니다.')
    report['notes'].append('실제 문의 메일 수신, 검색 색인, 고객 계약, 결제는 검사하지 않습니다.')
    return report

def ko_text(r):
    rows=['올파일원 웹스튜디오 V59 / 공개 배포 근거 점검',
          '점검 시각(UTC): '+r['checked_at_utc'], 'GitHub 소스: '+r['repository'],
          '커밋: '+str(r['commit_sha'] or '확인 불가'), '소스 버전: '+str(r['release'] or '확인 불가'),
          'Cloudflare 공식 CI: '+r['ci']['status']+' | '+r['ci']['detail'],
          'Cloudflare 공개 페이지: '+r['live']['status']+' | '+r['live'].get('summary','검사하지 못함'),
          '이메일 실제 수신: 미검증', '검색 색인: 미검증', '기술 검증 판정: '+r['technical_status'],'']
    rows.extend(x['status']+' | '+x['path']+' | '+x['detail'] for x in r['live']['checks'])
    rows.extend(['','검사 참고:']+['- '+x for x in r['notes']])
    return '\n'.join(rows)+'\n'

def main():
    p=argparse.ArgumentParser(description='추가 비용 없는 공개 배포 검증: 소스/CI/실제 HTTP 분리')
    p.add_argument('--output-dir',type=Path,default=Path.home()/'Downloads')
    p.add_argument('--fixture',type=Path,help='QA 전용 로컬 합성 응답 JSON. 실제 배포 근거로 사용 금지')
    args=p.parse_args()
    if args.fixture:
        mapping=json.loads(args.fixture.read_text(encoding='utf-8'))
        def fake(url):
            if url not in mapping: raise URLError('synthetic missing')
            v=mapping[url]
            if isinstance(v,dict): return json.dumps(v,ensure_ascii=False)
            return str(v)
        report=analyze(fake)
        report['source']='SYNTHETIC_QA_ONLY_NOT_LIVE'
        report['technical_status']='SYNTHETIC_TEST_ONLY'
    else:
        report=analyze()
    args.output_dir.mkdir(parents=True,exist_ok=True)
    j=args.output_dir/'WebStudio_V59_Deployment_Proof.json'
    t=args.output_dir/'WebStudio_V59_Deployment_Proof_KO.txt'
    j.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    t.write_text(ko_text(report),encoding='utf-8-sig')
    print(ko_text(report))
    print('저장:',j,'|',t)
    return 0 if report['technical_status']=='PASS_TECHNICAL_ONLY' else 3

if __name__ == '__main__':
    sys.exit(main())
