#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AllFileOne WebStudio V63: live-page Edge/Chromium CDP smoke QA.

Python standard library only. Read public HTML/CSS/JS in isolated headless browser;
no inquiry POST, email sending, customer data, login, cookies export, paid APIs or
modification to any existing browser profile. Synthetic form choices are used.

A PASS means the specified public browser smoke suite succeeded at this moment;
it is NOT evidence of customer email receipt, search indexing or live database writes.
"""
from __future__ import annotations
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import ssl
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request
import urllib.error
import zipfile
from datetime import datetime

BASE = 'https://allfileone-webstudio.pages.dev/'
EXPECTED = 'V63'
SECTORS = ('manufacturing','academy','interior','restaurant','beauty','logistics')
TIMEOUT_SECONDS = 14

class BrowserError(Exception): pass


def now(): return datetime.now().astimezone().isoformat(timespec='seconds')

def find_browser(explicit=''):
    if explicit:
        p=Path(explicit)
        if not p.is_file(): raise BrowserError('지정한 브라우저 파일이 없습니다: '+str(p))
        return str(p)
    candidates=[]
    if os.name == 'nt':
        for env in ('PROGRAMFILES(X86)','PROGRAMFILES','LOCALAPPDATA'):
            root=os.environ.get(env)
            if root:
                candidates.extend([Path(root)/'Microsoft/Edge/Application/msedge.exe',Path(root)/'Google/Chrome/Application/chrome.exe'])
    for name in ('msedge','msedge.exe','chromium','chromium-browser','google-chrome','chrome'):
        found=shutil.which(name)
        if found: candidates.append(Path(found))
    for c in candidates:
        if c.is_file(): return str(c)
    raise BrowserError('Windows Edge/Chrome/Chromium 실행 파일을 찾지 못했습니다. 브라우저를 설치하거나 --browser 경로를 지정하세요.')


class WebSocket:
    """Minimal RFC 6455 client for local Chrome DevTools; no dependencies."""
    def __init__(self,url):
        from urllib.parse import urlsplit
        info=urlsplit(url)
        if info.scheme != 'ws' or info.hostname not in ('127.0.0.1','localhost'):
            raise BrowserError('보안: 로컬 디버그 WebSocket만 허용합니다.')
        self.sock=socket.create_connection((info.hostname,info.port or 80),timeout=5)
        self.sock.settimeout(10)
        key=base64.b64encode(secrets.token_bytes(16)).decode('ascii')
        path=(info.path or '/')+('?' + info.query if info.query else '')
        request=(f'GET {path} HTTP/1.1\r\nHost: {info.hostname}:{info.port}\r\n'
          f'Upgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\n'
          f'Sec-WebSocket-Key: {key}\r\nOrigin: http://127.0.0.1\r\n\r\n').encode('ascii')
        self.sock.sendall(request)
        response=b''
        while b'\r\n\r\n' not in response:
            more=self.sock.recv(4096)
            if not more or len(response)>16384: raise BrowserError('CDP WebSocket 접속 응답이 올바르지 않습니다.')
            response+=more
        header,remaining=response.split(b'\r\n\r\n',1)
        if b' 101 ' not in header.split(b'\r\n',1)[0]:
            raise BrowserError('CDP WebSocket 접속 거부: '+header[:200].decode(errors='replace'))
        accept=base64.b64encode(hashlib.sha1((key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').encode()).digest())
        if b'Sec-WebSocket-Accept: '+accept not in header and b'sec-websocket-accept: '+accept not in header.lower():
            # Header capitalization varies; use a case-insensitive fallback.
            lines=header.decode('latin1').split('\r\n')
            if not any(line.lower().startswith('sec-websocket-accept:') and line.split(':',1)[1].strip()==accept.decode() for line in lines):
                raise BrowserError('CDP WebSocket handshake 검증 실패')
        self.pending=remaining
    def close(self):
        try:self.sock.close()
        except OSError: pass
    def _read(self,n):
        while len(self.pending)<n:
            chunk=self.sock.recv(max(4096,n-len(self.pending)))
            if not chunk: raise BrowserError('브라우저 연결이 종료되었습니다.')
            self.pending+=chunk
        a,self.pending=self.pending[:n],self.pending[n:]
        return a
    def send(self,data:bytes,opcode=1):
        mask=secrets.token_bytes(4)
        l=len(data)
        h=bytes([0x80|opcode,0x80|(l if l<126 else 126 if l<65536 else 127)])
        if l>=126:h+=struct.pack('!H',l) if l<65536 else struct.pack('!Q',l)
        self.sock.sendall(h+mask+bytes(b^mask[i%4] for i,b in enumerate(data)))
    def recv(self):
        while True:
            h=self._read(2); op=h[0]&15; masked=bool(h[1]&0x80);n=h[1]&127
            if n==126:n=struct.unpack('!H',self._read(2))[0]
            elif n==127:n=struct.unpack('!Q',self._read(8))[0]
            if n>16_000_000:raise BrowserError('비정상적으로 큰 CDP 응답')
            mask=self._read(4) if masked else b'';data=self._read(n)
            if masked:data=bytes(b^mask[i%4] for i,b in enumerate(data))
            if op==8:raise BrowserError('Chrome DevTools WebSocket 연결 종료')
            if op==9:self.send(data,10);continue
            if op==10:continue
            if op!=1:continue
            return json.loads(data.decode('utf-8'))


class CDP:
    def __init__(self,websocket): self.ws=WebSocket(websocket);self.n=0;self.events=[]
    def close(self): self.ws.close()
    def call(self,method,params=None,seconds=12):
        self.n+=1; target=self.n
        self.ws.send(json.dumps({'id':target,'method':method,'params':params or {}},separators=(',',':')).encode())
        until=time.monotonic()+seconds
        while time.monotonic()<until:
            self.ws.sock.settimeout(max(.2,until-time.monotonic()))
            try:r=self.ws.recv()
            except socket.timeout:continue
            if r.get('id')==target:
                if 'error' in r:raise BrowserError(f'브라우저 명령 {method} 오류: {r["error"]}')
                return r.get('result',{})
            if 'method' in r:self.events.append(r)
        raise BrowserError(f'브라우저 명령 시간 초과: {method}')
    def evaluate(self,expr):
        r=self.call('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True,'userGesture':False},seconds=12)
        if r.get('exceptionDetails'):raise BrowserError('웹페이지 JavaScript 실행 오류: '+str(r['exceptionDetails'].get('text','unknown')))
        return r.get('result',{}).get('value')


def launch_cdp(binary,temporary):
    profile=Path(temporary)/'browser-profile'
    profile.mkdir(parents=True,exist_ok=True)
    args=[binary,'--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
      '--disable-background-networking','--disable-component-update','--disable-sync',
      '--disable-extensions','--remote-allow-origins=http://127.0.0.1',
      '--remote-debugging-port=0','--user-data-dir='+str(profile),'about:blank']
    if os.name!='nt' and hasattr(os,'geteuid') and os.geteuid()==0:args.append('--no-sandbox')
    log=open(Path(temporary)/'browser-stderr.log','wb')
    proc=subprocess.Popen(args,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=log)
    try:
        until=time.monotonic()+12
        portfile=profile/'DevToolsActivePort'
        port=None
        while time.monotonic()<until:
            if proc.poll() is not None:raise BrowserError('브라우저 시작 실패. 로컬 브라우저와 보안 정책을 확인하세요.')
            if portfile.is_file():
                try:port=int(portfile.read_text().splitlines()[0]);break
                except (ValueError,IndexError,PermissionError): pass
            time.sleep(.12)
        if not port:raise BrowserError('브라우저 원격 디버그 포트 확인 실패')
        req=urllib.request.Request(f'http://127.0.0.1:{port}/json/list',headers={'Accept':'application/json'})
        with urllib.request.urlopen(req,timeout=4) as response:
            tabs=json.load(response)
        pages=[x for x in tabs if x.get('type')=='page' and x.get('webSocketDebuggerUrl')]
        if not pages:raise BrowserError('검사할 Edge 탭을 만들지 못했습니다.')
        return proc,log,CDP(pages[0]['webSocketDebuggerUrl'])
    except Exception:
        proc.terminate()
        try:proc.wait(timeout=3)
        except subprocess.TimeoutExpired:proc.kill()
        log.close();raise


def smoke(cdp,base,output_dir,do_screenshots=True):
    rows=[];screens=[]
    def record(name,ok,detail=''):
        rows.append({'check':name,'pass':bool(ok),'detail':str(detail)[:320]})
    cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable')
    cdp.call('Network.setCacheDisabled',{'cacheDisabled':True})
    def nav(path,width):
        cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':860,'deviceScaleFactor':1,'mobile':width<=440})
        url=base+path
        cdp.events.clear()
        r=cdp.call('Page.navigate',{'url':url},seconds=15)
        if r.get('errorText'):raise BrowserError('공개 페이지 탐색 실패: '+r['errorText'])
        end=time.monotonic()+TIMEOUT_SECONDS
        while time.monotonic()<end:
            ready=cdp.evaluate('document.readyState === "complete" && Boolean(document.body)')
            if ready:break
            time.sleep(.16)
        else:raise BrowserError('페이지 렌더링 시간 초과: '+path)
        # Let deferred initializers and layout settle for a bounded time.
        time.sleep(.16)
        result=cdp.evaluate('({url:location.href,title:document.title,h1:document.querySelector("h1")?.textContent?.trim()||"",bodyWidth:document.documentElement.scrollWidth,viewWidth:innerWidth,visible:!!document.body,version:document.querySelector("meta[name=webstudio-release-v63]")?.content||"",notFound:document.title.includes("404")})')
        # Require an actual HTTP 2xx Document response; a pretty Cloudflare 404/SPA fallback is a HOLD.
        document_responses=[ev.get('params',{}).get('response',{}) for ev in cdp.events
          if ev.get('method')=='Network.responseReceived' and ev.get('params',{}).get('type')=='Document']
        exact=[res for res in document_responses if res.get('url','').split('#')[0]==url.split('#')[0]]
        http_status=exact[-1].get('status') if exact else None
        record('공개 HTTP 2xx '+path+' / '+str(width),
           isinstance(http_status,(int,float)) and 200<=http_status<300, http_status if http_status is not None else 'HTTP 응답 증거 없음')
        record('HTML 본문 '+path+' / '+str(width),result.get('url','').split('?')[0].rstrip('/')==url.split('?')[0].rstrip('/') and bool(result.get('h1')) and not result.get('notFound'),result.get('title'))
        record('가로 넘침 '+path+' / '+str(width),result['bodyWidth']<=result['viewWidth']+2,f'{result["bodyWidth"]}/{result["viewWidth"]}')
        return result
    for width in (390,1280):
        try:
            r=nav('',width)
            record('홈 화면 최신 V63 / '+str(width),r['version']=='WEBSTUDIO-V63-20261108',r['version'])
            if do_screenshots:
                data=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False}).get('data','')
                if data:
                    p=Path(output_dir)/('HOME_MOBILE_390.png' if width==390 else 'HOME_PC_1280.png')
                    p.write_bytes(base64.b64decode(data));screens.append(p.name)
        except Exception as e:record('홈 화면 '+str(width),False,str(e))
        for sector in SECTORS:
            try:
                r=nav('for-'+sector+'.html',width)
                record('업종 판매 고유 CTA '+sector+' / '+str(width),bool(cdp.evaluate('Boolean(document.querySelector("a[href*=\\"quick-inquiry.html?industry='+sector+'\\"]"))')))
            except Exception as e:record('업종 판매 '+sector+' / '+str(width),False,str(e))
        try:
            nav('quick-inquiry.html?industry=restaurant',width)
            state=cdp.evaluate('({radio:document.querySelector("input[name=industry][value=restaurant]")?.checked||false,preview:document.querySelector("#v49-output")?.textContent||"",subject:!!document.querySelector("#v62-subject"),body:!!document.querySelector("#v62-body"),provider:!!document.querySelector("#v62-gmail")})')
            record('빠른 문의 restaurant 초기선택 '+str(width),state['radio'] and '음식점' in state['preview'])
            record('메일 제목·본문 별도 복사 UI '+str(width),state['subject'] and state['body'] and state['provider'])
            # V51 creates a safe, one-time same-tab handoff; never submit or mailto.
            linked=cdp.evaluate('Boolean(document.getElementById("v51-to-detail"))')
            record('상세 상담 연결 CTA '+str(width),linked)
            if linked:
                pre=cdp.evaluate('(()=>{const e=document.getElementById("v51-to-detail");e.click();return true})()')
                end=time.monotonic()+TIMEOUT_SECONDS;ok=False
                while time.monotonic()<end:
                    state=cdp.evaluate('({path:location.pathname,industry:document.querySelector("#brief-form select[name=industry]")?.value||"",imported:!!document.querySelector("#v51-import")})')
                    if state['path'].endswith('/contact.html'):
                        ok=state['industry']=='restaurant' and state['imported'];break
                    time.sleep(.25)
                record('빠른 문의 → 상세 상담 1회 인계 '+str(width),ok,str(state))
        except Exception as e:record('빠른 문의/상세 상담 '+str(width),False,str(e))
    return rows,screens


def write_reports(folder,record,rows,screens):
    folder=Path(folder);folder.mkdir(parents=True,exist_ok=True)
    report={'product':'AllFileOne WebStudio','expected_release':EXPECTED,'started':record['started'],'finished':now(),
       'source':record['base'],'browser':record.get('browser',''),'checks':rows,'total':len(rows),
       'passed':sum(x['pass'] for x in rows),'failed':sum(not x['pass'] for x in rows),'screenshots':screens,
       'scope':'LIVE_BROWSER_PUBLIC_PAGES_SMOKE_ONLY_NO_EMAIL_OR_DB_SUBMISSION',
       'customer_email_received':'NOT_TESTED','customer_contract_signed':'NOT_TESTED',
       'privacy':'NO_CUSTOMER_INPUT_NO_AUTOMATIC_SENDING_NO_PII_QUERY'}
    report['status']='PASS_PUBLIC_BROWSER_SMOKE_ONLY' if rows and report['failed']==0 else 'HOLD_BROWSER_OR_NETWORK'
    (folder/'V63_LIVE_BROWSER_RESULT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    txt=['올파일원 웹스튜디오 V63 실제 공개 브라우저 QA','검사 시작: '+report['started'],'완료: '+report['finished'],
      '대상: '+report['source'],'결과: '+report['status'],f'검사 {report["passed"]}/{report["total"]} 통과 / 실패 {report["failed"]}',
      '메일 실수신: 미검증 / 실제 고객 접수: 미검증 / 계약: 미검증','']
    for i,row in enumerate(rows,1):txt.append(f'{i:02d} [{"PASS" if row["pass"] else "HOLD"}] {row["check"]} {row["detail"]}')
    (folder/'V63_LIVE_BROWSER_RESULT_KO.txt').write_text('\n'.join(txt)+'\n',encoding='utf-8')
    files=[folder/'V63_LIVE_BROWSER_RESULT.json',folder/'V63_LIVE_BROWSER_RESULT_KO.txt']
    files.extend(folder/name for name in screens if (folder/name).is_file())
    digest={p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size_bytes':p.stat().st_size} for p in files}
    (folder/'V63_SHA256_MANIFEST.json').write_text(json.dumps({'scope':report['scope'],'files':digest},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    archive=folder/'V63_LIVE_BROWSER_EVIDENCE_LATEST.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for f in files+[folder/'V63_SHA256_MANIFEST.json']:z.write(f,f.name)
    with zipfile.ZipFile(archive) as z:
        if z.testzip():raise BrowserError('증거 ZIP CRC 검사에 실패했습니다.')
    (folder/'V63_LIVE_BROWSER_EVIDENCE_LATEST.zip.sha256').write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n',encoding='ascii')
    return report


def main(argv=None):
    p=argparse.ArgumentParser(description='V63 Windows Edge zero-cost public-page browser smoke QA')
    p.add_argument('--browser',default='',help='Edge/Chrome/Chromium binary path (optional)')
    p.add_argument('--output',default=str(Path.home()/'Downloads'),help='Evidence destination')
    p.add_argument('--fixture-url',default='',help='EXPLICIT LOCAL TEST ONLY: 127.0.0.1 fixture root')
    p.add_argument('--no-screenshots',action='store_true')
    args=p.parse_args(argv)
    base=BASE
    if args.fixture_url:
        from urllib.parse import urlsplit
        x=urlsplit(args.fixture_url)
        if x.scheme!='http' or x.hostname not in ('127.0.0.1','localhost'):
            p.error('Fixture must be localhost only (not a public site).')
        base=args.fixture_url.rstrip('/')+'/'
    record={'started':now(),'base':base}
    rows=[];screens=[]
    try:
        record['browser']=find_browser(args.browser)
        with tempfile.TemporaryDirectory(prefix='AFO_V63_EDGE_') as temp:
            proc=None;log=None;cdp=None
            try:
                proc,log,cdp=launch_cdp(record['browser'],temp)
                rows,screens=smoke(cdp,base,args.output,not args.no_screenshots)
            finally:
                if cdp:cdp.close()
                if proc:
                    proc.terminate()
                    try:proc.wait(timeout=4)
                    except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=2)
                if log:log.close()
    except Exception as e:rows.append({'check':'브라우저 실행/네트워크 접근','pass':False,'detail':str(e)[:320]})
    out=write_reports(args.output,record,rows,screens)
    print('V63_EDGE_BROWSER_QA',out['status'],f'{out["passed"]}/{out["total"]}', '결과 저장:',args.output)
    return 0 if out['status']=='PASS_PUBLIC_BROWSER_SMOKE_ONLY' else 3

if __name__=='__main__':raise SystemExit(main())
