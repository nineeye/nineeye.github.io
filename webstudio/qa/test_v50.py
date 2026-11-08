#!/usr/bin/env python3
"""Isolated Chromium mock response testing: NO actual Cloudflare/email/indexing verified."""
from __future__ import annotations
from pathlib import Path
import json,re,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
PAGE=ROOT/'webstudio/owner-launch.html';CSS=ROOT/'webstudio/assets/v50-owner-launch.css';JS=ROOT/'webstudio/assets/v50-owner-launch.js'
html=PAGE.read_text('utf-8');css=CSS.read_text('utf-8');js=JS.read_text('utf-8')
BASE='https://allfileone-webstudio.pages.dev/'
markup=re.sub(r'<script[^>]*src=["\'][^"\']+["\'][^>]*></script>', '', html)
markup=re.sub(r'<link[^>]*rel=["\']stylesheet["\'][^>]*>', '', markup)
markup=markup.replace('</head>','<base href="'+BASE+'"></head>')
MOCK='''data => { window.__mockData=data; window.__requests=[]; window.fetch=async (url,options={})=>{ window.__requests.push({url:String(url),method:options.method||'GET'}); const key=new URL(url).pathname.slice(1); const exists=Object.prototype.hasOwnProperty.call(window.__mockData,key); return Object.defineProperty(new Response(exists?window.__mockData[key]:'not found',{status:exists?200:404}), 'url', {value:String(url)}); }; }'''

TESTS=[]
def ok(label,value):
 TESTS.append({'label':label,'pass':bool(value)})
 if not value: print('FAIL',label)
# Clearly fictional same-origin fixtures to exercise client-side checks, NOT real production data.
def fixtures():
 d={'assets/current-release.json':json.dumps({'product':'AllFileOne WebStudio','version':'V50'}),
    'index.html':'for-manufacturing.html for-academy.html for-interior.html',
    'quick-inquiry.html':'<form id="v49-form"></form><script src="v49-quick-inquiry.js"></script><button id="v49-mailto"></button>',
    'assets/v49-quick-inquiry.js':'v49-download mailto:',
    'contact.html':'id="brief-form" v47-mail-packet.js',
    'launch-kit.html':'v46-handoff.js id="checklist"',
    'sitemap.xml':'for-manufacturing.html for-academy.html for-interior.html quick-inquiry.html',
    'robots.txt':'Sitemap: https://allfileone-webstudio.pages.dev/sitemap.xml'}
 for sector in ['manufacturing','academy','interior']:
  d['for-'+sector+'.html']='launch-kit.html quick-inquiry.html rel="canonical"'
 return d
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in (320,360,390,768,1024,1440):
  context=browser.new_context(viewport={'width':width,'height':840},accept_downloads=True)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  fx=fixtures()
  page.set_content(markup)
  page.add_style_tag(content=css)
  page.evaluate(MOCK,fx)
  page.add_script_tag(content=js)
  ok(f'{width}px page title',page.title()=='첫 고객 수주 준비도 점검 | 올파일원 웹스튜디오')
  ok(f'{width}px no JS errors',not errors)
  ok(f'{width}px no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
  ok(f'{width}px 10 checkboxes',page.locator('#manual-list input').count()==10)
  ok(f'{width}px none checked initially',page.locator('#manual-count').inner_text()=='0/10 자체 확인')
  ok(f'{width}px no auto success before click',page.locator('#auto-count').inner_text()=='검사 전')
  page.locator('#auto-run').click();page.wait_for_function("document.querySelector('#auto-count').textContent.includes('파일 검사')")
  ok(f'{width}px 11 verified fixtures',page.locator('#auto-count').inner_text()=='11/11 파일 검사')
  ok(f'{width}px 11 ordered results',page.locator('#auto-results li').count()==11)
  ok(f'{width}px no actual email claim','실제 메일 수신·검색 색인은 미검증' in page.locator('#auto-status').inner_text())
  ok(f'{width}px only GET static fetch',page.evaluate('window.__requests.every(x=>x.method === "GET")'))
  page.locator('#manual-list input').nth(0).check()
  page.locator('#manual-list input').nth(3).check()
  ok(f'{width}px manual count separate',page.locator('#manual-count').inner_text()=='2/10 자체 확인')
  page.locator('#report-preview').click()
  rep=page.locator('#report-text').inner_text()
  ok(f'{width}px report includes correct verified status','공개 파일 확인: 11/11' in rep)
  ok(f'{width}px report manual disclosed','운영자 직접 확인: 2/10' in rep and '[미확인]' in rep)
  ok(f'{width}px no send claim','자동 확인 아님' in rep and '실제 메일 수신' in rep)
  with page.expect_download() as d:page.locator('#report-download').click()
  obj=d.value
  ok(f'{width}px expected filename',obj.suggested_filename=='AllFileOne_V50_Owner_Readiness.txt')
  f=ROOT/'webstudio/qa'/f'_v50_{width}.txt';obj.save_as(f);actual=f.read_text(encoding='utf-8-sig');f.unlink()
  ok(f'{width}px TXT content', '11/11' in actual and '2/10' in actual and '색인' in actual)
  ok(f'{width}px no storage writes','localStorage' not in js and 'sessionStorage' not in js)
  if width==390:page.screenshot(path=str(ROOT/'webstudio/qa/V50_mobile_preview.png'),full_page=True)
  if width==1440:page.screenshot(path=str(ROOT/'webstudio/qa/V50_desktop_preview.png'),full_page=True)
  context.close()
 # Negative case: unavailable quick inquiry -> visible HOLD, no false full pass.
 context=browser.new_context(viewport={'width':375,'height':780});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 fx=fixtures();del fx['quick-inquiry.html']
 page.set_content(markup)
 page.add_style_tag(content=css)
 page.evaluate(MOCK,fx)
 page.add_script_tag(content=js)
 page.locator('#auto-run').click()
 page.wait_for_function("document.querySelector('#auto-count').textContent.includes('파일 검사')")
 ok('404 causes 10/11 not green',page.locator('#auto-count').inner_text()=='10/11 파일 검사')
 ok('404 row HOLD visible',page.locator('#auto-results .hold').count()==1)
 ok('404 detailed reason', 'HTTP 404' in page.locator('#auto-results').inner_text())
 ok('no JS errors under 404',not errors)
 context.close();browser.close()
report={'release':'V50','scope':'Isolated Chromium with simulated same-origin responses: NOT real Cloudflare/email/search','tests':len(TESTS),'pass':sum(x['pass'] for x in TESTS),'fail':sum(not x['pass'] for x in TESTS),'results':TESTS}
(ROOT/'webstudio/qa/V50_BROWSER_QA_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print('V50 BROWSER QA',report['pass'],'/',report['tests'],'PASS')
sys.exit(bool(report['fail']))
