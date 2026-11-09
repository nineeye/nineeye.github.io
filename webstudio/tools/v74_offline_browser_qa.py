#!/usr/bin/env python3
"""V74 local browser simulation: intercept current public origin into exact local source.
Not a public Cloudflare test. Generates screenshots & Korean report in EVIDENCE.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
import re,json,os,hashlib,shutil
R=Path(__file__).resolve().parents[1]
REPORT=R.parent/'EVIDENCE'/'V74_Browser_Test_Report_KO.txt'
SCREEN=R.parent/'EVIDENCE'/'V74_SCREENSHOTS'
SCREEN.mkdir(parents=True,exist_ok=True)
ORIGIN='https://allfileone-webstudio.pages.dev/'
HTML=(R/'site-proof-v74.html').read_text('utf-8')
HTML=re.sub(r'<script\s+defer[^>]*></script>','',HTML)
HTML=re.sub(r'<link\s+rel="stylesheet"[^>]*>','',HTML)
HTML=re.sub(r'<link\s+rel="icon"[^>]*>','',HTML)
HTML=HTML.replace('<head>','<head><base href="'+ORIGIN+'">')
CSS=(R/'assets'/'v74-public-proof.css').read_text('utf-8')
CATALOG=(R/'assets'/'v28-catalog.js').read_text('utf-8')
SCRIPT=(R/'assets'/'v74-public-proof.js').read_text('utf-8')
LOG=[]

def check(desc,ok,extra=''):
 LOG.append(('PASS' if ok else 'FAIL')+' | '+desc+(' | '+str(extra) if extra else ''))
 if not ok:print('FAILED',desc,extra)

def make_page(browser,width):
 page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
 scenario={'missing':None,'stale':False,'fake':False,'requested':[]}
 def handler(route):
  u=urlparse(route.request.url)
  path=u.path.lstrip('/')
  scenario['requested'].append(path)
  target=(R/path).resolve()
  if not target.is_relative_to(R) or not target.is_file():
   route.fulfill(status=404,headers={'Access-Control-Allow-Origin':'*'},body='Not Found')
   return
  if scenario['missing']==path:
   route.fulfill(status=404,headers={'Access-Control-Allow-Origin':'*'},body='Not Found')
   return
  if scenario['fake'] and path=='demo/manufacturing/modern/index.html':
   route.fulfill(status=200,headers={'Access-Control-Allow-Origin':'*'},content_type='text/html',body=(R/'index.html').read_bytes())
   return
  content=target.read_bytes()
  if scenario['stale'] and path=='assets/current-release.json':
   payload=json.loads(content);payload.pop('v74_public_proof_version',None);content=json.dumps(payload).encode()
  ct='application/json' if path.endswith('.json') else ('text/html' if path.endswith('.html') else ('application/javascript' if path.endswith('.js') else ('text/plain' if path.endswith('.xml') else 'text/css')))
  route.fulfill(status=200,headers={'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'},content_type=ct,body=content)
 page.route(ORIGIN+'**',handler)
 page.set_content(HTML,wait_until='domcontentloaded')
 page.add_style_tag(content=CSS)
 page.add_script_tag(content=CATALOG)
 page.add_script_tag(content=SCRIPT)
 return page,scenario

def run(page,full=True):
 button=page.locator('#check-all' if full else '#check-essential')
 button.click()
 page.wait_for_function('''() => Number(document.querySelector('#total-count').textContent)>0 && !document.querySelector('#check-all').disabled''',timeout=35000)
 return int(page.locator('#pass-count').inner_text()),int(page.locator('#hold-count').inner_text()),int(page.locator('#total-count').inner_text())

def find_browser():
 candidates=[os.getenv('CHROME_PATH'),shutil.which('chromium'),shutil.which('google-chrome'),
  r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
  r'C:\Program Files\Google\Chrome\Application\chrome.exe']
 for candidate in candidates:
  if candidate and Path(candidate).is_file():return candidate
 raise RuntimeError('Chrome 또는 Edge 실행 파일을 찾지 못했습니다. CHROME_PATH에 설치 경로를 지정하세요.')

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=find_browser(),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  page,scenario=make_page(browser,width)
  check('V74 DOM mounted '+str(width),page.locator('[data-v74-proof]').count()==1)
  pass_count,hold_count,total=run(page,True)
  print('SCREEN '+str(width),pass_count,hold_count,total)
  check('all 36 demos and required files ('+str(width)+')',pass_count==52 and hold_count==0 and total==52,f'{pass_count}/{total} HOLD {hold_count}')
  check('48 working catalog items '+str(width),page.locator('#verification-results').inner_text().find('업종별 48개 시연 기능 정의')>=0)
  check('V74 correctly reported '+str(width),page.locator('#observed-version').inner_text()=='V74 (기본 V65)')
  check('mobile no horizontal overflow '+str(width),page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+3'))
  page.screenshot(path=str(SCREEN/('public_proof_'+str(width)+'.png')),full_page=True)
  with page.expect_download() as event:page.locator('#proof-save').click()
  dl=event.value;target=SCREEN/('public_proof_'+str(width)+'.txt');dl.save_as(str(target))
  txt=target.read_bytes().decode('utf-8-sig')
  check('TXT save matches full 52 results '+str(width),'전체 52' in txt and '업종별 48개 시연 기능 정의' in txt and '실제 이메일 송수신' in txt)
  # Faults: current release lacking V74 marker, unknown page returning a 200 homepage,
  # and actual non-existent demo path must all produce HOLD, not false PASS.
  if width==1440:
   scenario['stale']=True
   p0,h0,t0=run(page,False)
   check('reject stale public release',h0>=1 and page.locator('#release-summary').inner_text()=='배포 확인 필요',f'{p0}/{t0}')
   scenario['stale']=False
   scenario['fake']=True
   p1,h1,t1=run(page,True)
   check('reject 200 homepage replacing demo HTML',h1>=1 and page.locator('#release-summary').inner_text()=='배포 확인 필요',f'{p1}/{t1}')
   scenario['fake']=False
   scenario['missing']='demo/manufacturing/modern/index.html'
   p2,h2,t2=run(page,True)
   check('reject missing 404 demo',h2>=1,f'{p2}/{t2}')
   scenario['missing']=None
  page.close()
 browser.close()
REPORT.write_text('\n'.join(['V74 모의 동일출처 브라우저 검사 (실제 공개 Cloudflare 접속 아님)','LOCAL_STATIC_SOURCE '+str(R),'PUB_VERIFICATION HOLD: external access denied','']+LOG)+'\n',encoding='utf-8')
print('checks',sum(x.startswith('PASS')for x in LOG),'/',len(LOG),'report',REPORT)
if any(x.startswith('FAIL') for x in LOG):raise SystemExit(1)