#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AllFileOne WebStudio read-only production diagnostics, V2.

Standard-library only, Python 3.9+, public HTTPS requests, normal TLS validation.
No account credentials, proxies to bypass policies, uploads, or modifications.
Cloudflare PR preview evidence NEVER attests to production deployment.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
import os
import queue
import threading
from pathlib import Path
import platform
import re
import socket
import ssl
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit, urlunsplit, urljoin
from urllib.request import Request, urlopen
import zipfile

PRODUCTION = 'https://allfileone-webstudio.pages.dev/'
GITHUB_ROOT = 'https://raw.githubusercontent.com/nineeye/nineeye.github.io/main/webstudio/'
GITHUB_API = 'https://api.github.com/repos/nineeye/nineeye.github.io/'
LAST_KNOWN_VERSION = 'V33'  # only a local fallback, never an authoritative latest version
INDUSTRIES = ('manufacturing','corporate','clinic','academy','interior','commerce',
              'professional','association','franchise','stay','realestate','event')
STYLES = ('modern','premium','editorial')
ALTERNATES = (
    ('V32 preview: definitely not production', 'https://3d945038.allfileone-webstudio.pages.dev/'),
    ('Candidate user-owned domain: unverified', 'https://allfileone.co.kr/'),
    ('Candidate GitHub Pages mirror: unverified', 'https://nineeye.github.io/webstudio/'),
)
UA = 'AllFileOne-WebStudio-PublicVerifier/2.0 (public-readonly; no auth)'
MAX_BYTES = 1_750_000


def now_utc():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def numbered(v):
    m = re.fullmatch(r'V([1-9][0-9]{0,3})', str(v or ''))
    return int(m.group(1)) if m else None


def append_query(url: str, nonce: str) -> str:
    p = urlsplit(url)
    sep = '&' if p.query else ''
    return urlunsplit((p.scheme, p.netloc, p.path, p.query+sep+urlencode({'_afow_probe':nonce}), p.fragment))


def _blocking_get(url: str, nonce: str, timeout: float=6.0) -> dict:
    """Underlying urllib call; run only in an isolated daemon thread."""
    start = time.monotonic()
    request = Request(append_query(url,nonce), headers={
        'User-Agent':UA, 'Accept':'application/json,text/html,text/plain,*/*',
        'Cache-Control':'no-cache, no-store', 'Pragma':'no-cache',
    })
    try:
        with urlopen(request, timeout=timeout, context=ssl.create_default_context()) as response:
            data = response.read(MAX_BYTES+1)
            if len(data)>MAX_BYTES: raise ValueError('response too large')
            # Reject redirect to a different origin so a branded 200 error page
            # on an unrelated host cannot impersonate a static production file.
            actual = urlsplit(response.url)
            original = urlsplit(url)
            if actual.scheme != 'https' or actual.netloc.lower()!=original.netloc.lower():
                raise ValueError('redirected away from expected HTTPS host')
            return {'ok':response.status==200, 'status':response.status,
                'url':url,'final_url':response.url,
                'elapsed_ms':int((time.monotonic()-start)*1000),
                'content_type':response.headers.get('Content-Type',''),
                'cf_ray':response.headers.get('CF-Ray',''),
                'cf_cache_status':response.headers.get('CF-Cache-Status',''),
                'sha256':hashlib.sha256(data).hexdigest(),
                'text':data.decode('utf-8','replace')}
    except (HTTPError, URLError, TimeoutError, OSError, ssl.SSLError, ValueError) as ex:
        return {'ok':False,'status':getattr(ex,'code',0),'error':str(ex)[:300],
                'elapsed_ms':int((time.monotonic()-start)*1000),'url':url}


def get(url: str, nonce: str, timeout: float=6.0) -> dict:
    """Bound total wall time even when system DNS hangs outside socket timeout.

    Standard urllib timeout may not bound getaddrinfo() on some hosts.
    A daemon thread ensures the verifier can finish and write a failure ZIP.
    """
    result_queue=queue.Queue(maxsize=1)
    start=time.monotonic()
    worker=threading.Thread(target=lambda:result_queue.put(_blocking_get(url,nonce,timeout)),daemon=True)
    worker.start()
    try:return result_queue.get(timeout=timeout+0.8)
    except queue.Empty:
        return {'ok':False,'status':0,'url':url,'error':'DNS/HTTPS request deadline exceeded',
                'elapsed_ms':int((time.monotonic()-start)*1000)}


def dns_lookup(host, timeout=2.0):
    results=queue.Queue(maxsize=1)
    def task():
        try:
            result=sorted(set(a[4][0] for a in socket.getaddrinfo(host,443,type=socket.SOCK_STREAM)))
        except OSError as exc:result={'error':str(exc)[:250]}
        results.put(result)
    thread=threading.Thread(target=task,daemon=True)
    thread.start()
    try:return results.get(timeout=timeout)
    except queue.Empty:return {'error':'DNS lookup deadline exceeded'}


def parse_release(result:dict):
    if not result.get('ok'):return None
    try:
        obj=json.loads(result.get('text',''))
        if (not isinstance(obj,dict) or obj.get('product')!='AllFileOne WebStudio'
            or numbered(obj.get('version')) is None
            or not str(obj.get('release_id','')).startswith('WEBSTUDIO-'+obj['version']+'-')):
            return None
        return {'version':obj['version'],'release_id':obj['release_id']}
    except (TypeError, ValueError, KeyError, AttributeError):return None


class Assets(HTMLParser):
    """Collect only same-origin relative JS/CSS referenced by main/contact HTML."""
    def __init__(self):
        super().__init__()
        self.assets=[]
    def handle_starttag(self,tag,attrs):
        values=dict(attrs)
        ref = values.get('src') if tag=='script' else values.get('href') if tag=='link' and values.get('rel')=='stylesheet' else None
        if ref and not (ref.startswith('/') or '://' in ref or ref.startswith('data:') or ref.startswith('#')):
            path=ref.split('?',1)[0].split('#',1)[0]
            if re.fullmatch(r'assets/[A-Za-z0-9_./-]+\.(?:js|css)',path) and '..' not in path.split('/'):
                self.assets.append(path)


def paths_for_version(version, all_demos=False):
    paths = ['assets/current-release.json',f'assets/release-{version.lower()}.json',
             'index.html','contact.html','site-check.html']
    if all_demos:
        paths += [f'demo/{ind}/{style}/index.html' for ind in INDUSTRIES for style in STYLES]
    return paths


def page_check(path,response,version):
    status = {k:response.get(k) for k in ('ok','status','elapsed_ms','content_type','cf_ray','sha256','error') if k in response}
    status['path']=path
    html=response.get('text','')
    if not response.get('ok'):
        status.update(pass_check=False,reason='HTTP / DNS / TLS failure')
        return status
    if path=='assets/current-release.json':
        release=parse_release(response)
        passed=bool(release and release['version']==version)
        desc='public release '+(release['version'] if release else 'INVALID')
    elif path==f'assets/release-{version.lower()}.json':
        try:
            obj=json.loads(html)
            passed=(obj.get('version')==version and obj.get('release_id','').startswith(f'WEBSTUDIO-{version}-'))
        except (ValueError,AttributeError,TypeError):passed=False
        desc='matching declared release manifest'
    elif path=='index.html':
        passed=f'WEBSTUDIO-{version}-' in html and 'id="site-current-version"' in html
        desc='main HTML release marker + visible version badge'
    elif path=='contact.html':
        passed='<html' in html.lower() and 'id="brief-form"' in html
        desc='customer consultation HTML'
    elif path=='site-check.html':
        passed='<html' in html.lower() and 'v25-audit.js' in html
        desc='independent client diagnostic entry'
    elif path.startswith('demo/'):
        passed='<html' in html.lower() and 'assets/demo.js' in html
        desc='existing demo HTML and shared module import'
    elif path.startswith('assets/') and path.endswith('.js'):
        passed=bool(html.strip() and not html.lstrip().lower().startswith(('<!doctype','<html'))) and ('javascript' in response.get('content_type','').lower() or not response.get('content_type'))
        desc='nonempty JavaScript, not HTML fallback'
    elif path.startswith('assets/') and path.endswith('.css'):
        passed=bool(html.strip() and not html.lstrip().lower().startswith(('<!doctype','<html'))) and ('css' in response.get('content_type','').lower() or not response.get('content_type'))
        desc='nonempty CSS, not HTML fallback'
    else:
        passed=bool(html)
        desc='nonempty file'
    status.update(pass_check=passed,reason=desc)
    return status


def best_effort_bot_evidence(fetch, nonce):
    """GitHub comments prove ONLY PR preview deployments, never production."""
    output=[]
    # Discover recent merged PRs rather than permanently examining only V32/V33.
    # Public GitHub API needs no paid service or access token on public repos.
    # If the repository is private/unreadable via anonymous API, fall back to
    # the two PRs that previously had official deployment evidence.
    pull_url=GITHUB_API+'pulls?state=closed&sort=updated&direction=desc&per_page=8'
    pull_response=fetch(pull_url,nonce)
    pr_numbers=[]
    if pull_response.get('ok'):
        try:
            items=json.loads(pull_response.get('text',''))
            if isinstance(items,list):
                pr_numbers=[row['number'] for row in items if isinstance(row,dict)
                            and isinstance(row.get('number'),int)
                            and row.get('merged_at') is not None][:6]
        except (TypeError,ValueError,KeyError):pass
    if not pr_numbers:pr_numbers=[25,24]
    for pr in pr_numbers:
        response=fetch(GITHUB_API+f'issues/{pr}/comments?per_page=100',nonce)
        if not response.get('ok'):
            output.append({'pr':pr,'status':'NOT_READABLE','error':response.get('error','HTTP '+str(response.get('status','?')))})
            continue
        try:
            comments=json.loads(response.get('text',''))
            if not isinstance(comments,list):raise ValueError('comments not list')
            bots=[]
            for comment in comments:
                if comment.get('user',{}).get('login')!='cloudflare-workers-and-pages[bot]':continue
                body=str(comment.get('body',''))
                if 'Deploying allfileone-webstudio' not in body:continue
                found=re.search(r"https://([0-9a-f]{8})\.allfileone-webstudio\.pages\.dev",body)
                commit=re.search(r'<code>([a-f0-9]{7,40})</code>',body)
                bots.append({'preview_success':'Deploy successful!' in body,
                    'preview_url':'https://'+found.group(1)+'.allfileone-webstudio.pages.dev' if found else None,
                    'commit_prefix':commit.group(1) if commit else None,
                    'source_url':comment.get('html_url',''),
                    'proof_scope':'PR_PREVIEW_ONLY_NOT_PRODUCTION'})
            output.append({'pr':pr,'status':'EVIDENCE_FOUND' if bots else 'NO_BOT_EVIDENCE','previews':bots})
        except (ValueError,TypeError,AttributeError) as ex:
            output.append({'pr':pr,'status':'INVALID_API_CONTENT','error':str(ex)[:200]})
    return output


def inspect(fetch=get, *, all_demos=True, timeout=6.0, probe_alternates=True,
            github_pr_evidence=True, asset_limit=18):
    nonce=str(int(time.time()))+'-'+str(os.getpid())
    def fetchp(url, marker):
        return fetch(url,marker,timeout) if fetch is get else fetch(url,marker)
    github=fetchp(GITHUB_ROOT+'assets/current-release.json',nonce)
    github_release=parse_release(github)
    trusted_expected=github_release is not None
    expected=github_release['version'] if trusted_expected else LAST_KNOWN_VERSION
    public=fetchp(PRODUCTION+'assets/current-release.json',nonce)
    public_release=parse_release(public)
    served_version=public_release['version'] if public_release else None
    # The checked routes are based on the actual public version when possible.
    # A GitHub-newer, Cloudflare-older release produces VERSION_MISMATCH explicitly.
    target_version=served_version or expected
    paths=paths_for_version(target_version,all_demos=all_demos)
    result_by_path={'assets/current-release.json':public}
    base = [p for p in paths if p not in result_by_path]
    with ThreadPoolExecutor(max_workers=8) as pool:
        tasks={pool.submit(fetchp,PRODUCTION+p,nonce):p for p in base}
        for future in as_completed(tasks):result_by_path[tasks[future]]=future.result()
    # Discover actual loaded first-party JS/CSS. A V34 or later release will
    # be checked without hardcoding V33 JS filenames.
    declared=[]
    for p in ('index.html','contact.html'):
        response=result_by_path.get(p,{})
        if response.get('ok'):
            parser=Assets()
            try:parser.feed(response.get('text',''))
            except (TypeError,ValueError):pass
            declared+=parser.assets
    assets=[]
    for item in declared:
        if item not in assets and item not in result_by_path:assets.append(item)
    assets=assets[:asset_limit]
    with ThreadPoolExecutor(max_workers=8) as pool:
        tasks={pool.submit(fetchp,PRODUCTION+p,nonce):p for p in assets}
        for future in as_completed(tasks):result_by_path[tasks[future]]=future.result()
    paths+=assets
    checks=[page_check(p,result_by_path[p],target_version) for p in paths]
    comparison=[]
    # Compare exact bytes for critical static script and release pointers only.
    # Other Cloudflare-transformed assets can be valid even if byte-different.
    for p in ('assets/current-release.json','assets/v33-estimate-model.js'):
        if p not in result_by_path:continue
        github_file=github if p=='assets/current-release.json' else fetchp(GITHUB_ROOT+p,nonce)
        live_file=result_by_path[p]
        if github_file.get('ok') and live_file.get('ok'):
            comparison.append({'path':p,'match':github_file.get('sha256')==live_file.get('sha256'),
                'scope':'EXACT_BYTES' if p.endswith('.js') else 'EXACT_JSON_BYTES',
                'github_sha256':github_file.get('sha256'),'live_sha256':live_file.get('sha256')})
        else:comparison.append({'path':p,'match':None,'scope':'COMPARISON_UNAVAILABLE'})
    alternates=[]
    if probe_alternates:
        with ThreadPoolExecutor(max_workers=3) as pool:
            tasks={pool.submit(fetchp,url+'assets/current-release.json',nonce):(label,url) for label,url in ALTERNATES}
            for fut in as_completed(tasks):
                label,url=tasks[fut]
                val=fut.result();rel=parse_release(val)
                alternates.append({'label':label,'url':url,
                    'version':rel['version'] if rel else None,'ok':val.get('ok',False),
                    'error':val.get('error',''),'production_attestation':False})
        alternates.sort(key=lambda x:x['label'])
    dns=dns_lookup('allfileone-webstudio.pages.dev',timeout=1.5)
    passed=sum(c['pass_check'] for c in checks)
    total=len(checks)
    critical_mismatch=any(x.get('match') is False for x in comparison)
    if served_version is None:status='PRODUCTION_UNREACHABLE_OR_INVALID'
    elif trusted_expected and numbered(served_version)!=numbered(expected):status='VERSION_MISMATCH'
    elif passed!=total:status='PARTIAL_OR_BROKEN'
    elif critical_mismatch:status='SOURCE_BYTES_MISMATCH'
    elif not trusted_expected:status='STATIC_HEALTH_OK_EXPECTED_UNVERIFIED'
    else:status='VERIFIED_CURRENT_STATIC'
    bots=best_effort_bot_evidence(fetchp,nonce) if github_pr_evidence else []
    report={'tool':'AllFileOne WebStudio Live Verifier', 'tool_version':'2.0',
        'checked_utc':now_utc(),'production_url':PRODUCTION,
        'github_expected_version':expected,'github_expected_authoritative':trusted_expected,
        'github_release_accessible':github.get('ok',False),
        'production_declared_version':served_version,
        'checked_static_version':target_version,
        'status':status,'checks_passed':passed,'checks_total':total,
        'dns':dns,'checks':checks,'source_byte_comparison':comparison,
        'cloudflare_pr_preview_evidence':bots,'alternate_paths':alternates,
        'security':'public read-only HTTPS with valid TLS; no secrets, uploads or security bypass',
        'note':'Static file verification is NOT real customer email, payment, booking or functional UI proof. PR-preview success is NOT production success.'}
    return report


def create_artifacts(report,outdir):
    outdir=Path(outdir)
    outdir.mkdir(parents=True,exist_ok=True)
    base='ALLFILEONE_WEBSTUDIO_LIVE_STATUS_LATEST'
    j=json.dumps(report,ensure_ascii=False,indent=2).encode('utf-8')
    lines=[f"올파일원 웹스튜디오 실서버 상태 V2 / {report['checked_utc']}",
       f"판정: {report['status']}",
       f"GitHub 기준: {report['github_expected_version']} (신뢰성 검증: {'예' if report['github_expected_authoritative'] else '아니오 — 임시 기준'})",
       f"Cloudflare 운영 서버: {report['production_declared_version'] or '읽지 못함'}",
       f"HTTP 정적 검사: {report['checks_passed']}/{report['checks_total']}",
       f"운영 주소: {report['production_url']}", f"DNS: {report['dns']}",
       '', '정적 검사 상세:']
    for c in report['checks']:
        lines.append(('PASS' if c['pass_check'] else 'FAIL')+' | '+c['path']+' | '+c['reason']+' | '+c.get('error',''))
    lines+=['','GitHub 파일과 공개 서버 바이트 비교:']
    for c in report['source_byte_comparison']:
        lines.append(f"{c['path']} | 같음={c['match']} | {c['scope']}")
    lines+=['','Cloudflare 공식 PR 미리보기 기록(운영 배포 아님):']
    for c in report['cloudflare_pr_preview_evidence']:
        lines.append('PR #'+str(c['pr'])+' | '+c['status'])
        for prev in c.get('previews',[]):lines.append('  preview_success='+str(prev['preview_success'])+' | '+str(prev['preview_url']))
    lines+=['',report['note'],report['security']]
    txt=('\n'.join(lines)+'\n').encode('utf-8-sig')
    sha=f"{hashlib.sha256(j).hexdigest()}  status.json\n{hashlib.sha256(txt).hexdigest()}  REPORT_KO.txt\n".encode()
    target=outdir/(base+'.zip')
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        z.writestr('status.json',j)
        z.writestr('REPORT_KO.txt',txt)
        z.writestr('SHA256SUMS.txt',sha)
    checksum=outdir/(base+'.zip.sha256')
    checksum.write_text(hashlib.sha256(target.read_bytes()).hexdigest()+'  '+target.name+'\n',encoding='ascii')
    with zipfile.ZipFile(target) as z:
        if z.testzip() is not None:raise RuntimeError('ZIP CRC failure')
        for member,actual in [('status.json',j),('REPORT_KO.txt',txt),('SHA256SUMS.txt',sha)]:
            if z.read(member)!=actual:raise RuntimeError('Internal ZIP verification failed: '+member)
    return target,checksum


def main():
    p=argparse.ArgumentParser(description='Read-only Cloudflare Pages + Github main public deployment verification')
    p.add_argument('--quick',action='store_true',help='Skip all 36 demos; verify main and loaded JS/CSS')
    p.add_argument('--no-alternates',action='store_true')
    p.add_argument('--no-pr-evidence',action='store_true')
    p.add_argument('--timeout',type=float,default=6.0)
    p.add_argument('--out',default='')
    a=p.parse_args()
    if not (1<=a.timeout<=20):p.error('--timeout must be 1 to 20 seconds')
    home=Path.home();folder=Path(a.out) if a.out else (home/'Downloads' if (home/'Downloads').is_dir() else Path.cwd())
    print('SELF_PREFLIGHT=PASS | Python='+platform.python_version()+' | TLS=VERIFIED | uploads=NONE')
    report=inspect(all_demos=not a.quick,timeout=a.timeout,probe_alternates=not a.no_alternates,github_pr_evidence=not a.no_pr_evidence)
    result,checksum=create_artifacts(report,folder)
    print('STATUS='+report['status'])
    print('GITHUB='+report['github_expected_version']+' trusted='+str(report['github_expected_authoritative']))
    print('CLOUDFLARE='+str(report['production_declared_version']))
    print('CHECKS='+str(report['checks_passed'])+'/'+str(report['checks_total']))
    print('EVIDENCE='+str(result))
    print('SHA256='+str(checksum))
    return 0 if report['status']=='VERIFIED_CURRENT_STATIC' else 2


if __name__=='__main__':
    sys.exit(main())
