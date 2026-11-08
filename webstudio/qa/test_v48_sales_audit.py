#!/usr/bin/env python3
"""Offline selftest of actual V48 code, mock origin server only (never claims production reachability)."""
from __future__ import annotations
import json, re, sys, tempfile, threading, functools, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=Path(__file__).resolve().parents[1]
RULES={
 'assets/current-release.json':json.dumps({'product':'AllFileOne WebStudio','version':'V47','release_id':'WEBSTUDIO-V47-20261108'}),
 'index.html':''.join(f'for-{x}.html' for x in ('manufacturing','academy','interior')),
 'for-manufacturing.html':'v43-industry-lab.js launch-kit.html contact.html rel="canonical" '+' class="v44-faq-item"'*4,
 'for-academy.html':'v43-industry-lab.js launch-kit.html contact.html rel="canonical"',
 'for-interior.html':'v43-industry-lab.js launch-kit.html contact.html rel="canonical"',
 'launch-kit.html':'id="checklist" v45-launch-kit.js v46-handoff.js',
 'assets/v45-launch-kit.js':'downloadTxt projectMemo selected()',
 'assets/v46-handoff.js':'sessionStorage.removeItem(KEY) source=startkit MAX_AGE_MS',
 'contact.html':'id="brief-form" v26-contact.js v46-handoff.js v47-mail-packet.js',
 'assets/v47-mail-packet.js':'v46-full-report v47-download-all nineeyes@naver.com',
 'assets/v42-webmail-guide.js':'https://mail.naver.com/ v42-copy-complete',
 'sitemap.xml':'for-manufacturing.html for-academy.html for-interior.html launch-kit.html',
 'robots.txt':'Sitemap: https://allfileone-webstudio.pages.dev/sitemap.xml\nDisallow: /demo/',
 'plan-guide.html':'29 59 99 확정 견적',
 'design-gallery-v13.html':'gallery-v13 demo',
}
checks=[]
def ok(name,value):
 checks.append({'name':name,'passed':bool(value)})
 if not value:print('FAIL',name)
js=(BASE/'assets/v48-sales-audit.js').read_text(encoding='utf-8')
css=(BASE/'assets/v48-sales-audit.css').read_text(encoding='utf-8')
for s in ('localStorage','navigator.sendBeacon','mailto:','eval(', 'innerHTML'):
 ok('no unsafe '+s,s not in js)
for t in ('v48-sales-audit','credentials:\'omit\'','cache:\'no-store\'','document.baseURI','AbortController','RULES','download'):
 ok('has '+t,t in js)
ok('styles contain small screen rule','@media(max-width:600px)' in css)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 # Restricted sandbox denies navigation, so only fetch responses are mocked. No production HTTP claims.
 url='https://allfileone-webstudio.pages.dev/site-check.html'
 document='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="https://allfileone-webstudio.pages.dev/site-check.html"></head><body style="margin:0;max-width:100%;box-sizing:border-box"><main><section id="v48-sales-audit"></section></main></body></html>'
 def build_page(width):
  p=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
  errors=[];p.on('pageerror',lambda ex:errors.append(str(ex)))
  p.set_content(document)
  p.add_style_tag(content=css)
  p.evaluate("""payload => {
   window.__fixture = payload;
   window.fetch = async function(input,options){
     const path = new URL(input).pathname.slice(1);
     const body = window.__fixture[path];
     if (body === undefined) return {ok:false,status:404,url:String(input),text:async()=>''};
     return {ok:true,status:200,url:String(input),text:async()=>body};
   }
 }""",RULES)
  p.add_script_tag(content=js)
  p.wait_for_function("!document.querySelector('#v48-save').disabled",timeout=10000)
  return p,errors
 for width in (360,768,1440):
  p,errors=build_page(width)
  text=p.locator('#v48-status').inner_text()
  ok(f'{width} 16/16 initial','16/16개 통과' in text)
  ok(f'{width} sixteen rows',p.locator('#v48-results li').count()==16)
  ok(f'{width} no JS errors',not errors)
  ok(f'{width} no horizontal overflow',p.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
  ok(f'{width} no customer input',p.locator('input, textarea').count()==0)
  ok(f'{width} no send action',p.locator('button').count()==3)
  ok(f'{width} provider links external and safe',p.locator('.v48-providers a').count()==2 and p.locator('.v48-providers a').first.get_attribute('rel')=='noopener noreferrer')
  with p.expect_download() as dl:
   p.locator('#v48-save').click()
  item=dl.value
  with tempfile.TemporaryDirectory() as tmp:
   saved=Path(tmp)/'report.txt';item.save_as(saved)
   report_txt=saved.read_text(encoding='utf-8-sig')
  ok(f'{width} TXT download',item.suggested_filename=='AllFileOne_WebStudio_V48_Sales_Audit.txt')
  ok(f'{width} report mock origin','allfileone-webstudio.pages.dev' in report_txt and 'V47' in report_txt)
  ok(f'{width} truthful scope','고객 문의 수신' in report_txt and '색인 등록' in report_txt)
  p.close()
 p,errors=build_page(360)
 p.evaluate("delete window.__fixture['contact.html']")
 p.locator('#v48-run').click()
 p.wait_for_function("!document.querySelector('#v48-save').disabled",timeout=10000)
 ok('broken contact yields hold','15/16개 통과' in p.locator('#v48-status').inner_text())
 ok('broken contact marked HOLD',p.locator('li.v48-hold').count()==1)
 ok('broken contact label','상담서·메일 패키지' in p.locator('li.v48-hold').inner_text())
 p.evaluate("window.__fixture['contact.html']='id=\"brief-form\" v26-contact.js v46-handoff.js v47-mail-packet.js'")
 p.locator('#v48-run').click();p.wait_for_function("!document.querySelector('#v48-save').disabled",timeout=10000)
 ok('rerun after repair','16/16개 통과' in p.locator('#v48-status').inner_text())
 p.close();browser.close()
report={'release':'V48','kind':'isolated Chromium set_content with mocked same-origin fetch (navigation blocked)','checks':len(checks),'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'public_cloudflare_verified':False,'real_email_receipt_verified':False,'search_engine_index_verified':False,'results':checks}
(BASE/'qa/V48_QA_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'V48 offline QA: {report["passed"]}/{report["checks"]} PASS')
if report['failed']:sys.exit(1)
