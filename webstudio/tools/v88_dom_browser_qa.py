#!/usr/bin/env python3
"""Zero-cost V88 live Chromium on isolated loopback HTTP; no public network claims."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import argparse, json, os, socket, time, sys, re

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 a.output.mkdir(parents=True,exist_ok=True);fail=[];count=0
 def check(condition,tag):
  nonlocal count
  count+=1
  if not condition:fail.append(tag)
 # Production navigation is blocked in this sandbox: real Chromium runs exact source DOM/CSS/JS.
 # This mode does NOT prove public HTTPS or external assets.
 def mount(page,name,css,scripts):
  markup=(a.root/name).read_text('utf-8')
  markup=re.sub(r'<script\b[^>]*\bsrc="[^"]*"[^>]*></script>','',markup,flags=re.I)
  markup=re.sub(r'<link\b[^>]*\brel="(?:stylesheet|icon)"[^>]*>','',markup,flags=re.I)
  markup=markup.replace('<head>','<head><base href="https://fixture.invalid/webstudio/">',1)
  page.set_content(markup,wait_until='load')
  for f in css:page.add_style_tag(content=(a.root/'assets'/f).read_text('utf-8'))
  for f in scripts:page.add_script_tag(content=(a.root/'assets'/f).read_text('utf-8'))
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
   keys=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
   styles=('modern','premium','editorial')
   for width in (390,1366):
    context=browser.new_context(viewport={'width':width,'height':900},accept_downloads=True,permissions=['clipboard-read','clipboard-write'])
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    mount(page,'launch-readiness-v88.html',['v88-launch-check.css'],['v88-launch-check.js']);page.wait_for_function('window.AFO_V88_LAUNCH_READY===true')
    check(page.locator('[data-v88-check]').count()==30,f'owner {width} 30 checks')
    check(page.locator('#v88-count').inner_text()=='0 / 30',f'owner {width} all initially unverified')
    check(page.evaluate('document.documentElement.scrollWidth <= innerWidth+3'),f'owner {width} no overflow')
    check(page.locator('meta[name=robots]').get_attribute('content')=='noindex,nofollow,noarchive',f'owner {width} noindex')
    for i in range(30):page.locator('[data-v88-check]').nth(i).check(force=True)
    check(page.locator('#v88-count').inner_text()=='30 / 30',f'owner {width} 30 marked')
    check('외부 증거는 별도' in page.locator('#v88-result').inner_text(),f'owner {width} no fake PASS')
    with page.expect_download() as d:page.locator('#v88-download').click()
    data=d.value.path().read_bytes();check(data.startswith(b'\xef\xbb\xbf') and data.count('[운영자 직접 체크]'.encode('utf-8'))==30,f'owner {width} 30 text evidences')
    page.locator('#v88-clear').click();check(page.locator('#v88-count').inner_text()=='0 / 30',f'owner {width} clear')
    page.evaluate('window.scrollTo(0,0)')
    page.screenshot(path=str(a.output/f'V88_OWNER_{width}.png'),full_page=False)
    mount(page,'start-project-v87.html',['v87-inquiry.css','v88-mail-fallback.css'],['v28-catalog.js','v67-industry-data.js','v77-feature-data.js','v87-inquiry.js','v88-mail-fallback.js']);page.evaluate('window.__copy="";Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:(v)=>{window.__copy=v;return Promise.resolve()}}})');page.wait_for_function('window.AFO_V88_MANUAL_MAIL_READY===true && window.AFO_V87_INQUIRY_READY===true')
    check(page.locator('#v88-copy-to').count()==1 and page.locator('#v88-copy-subject').count()==1 and page.locator('#v88-copy-body').count()==1,f'buyer {width} three fallback buttons')
    check(page.evaluate('document.documentElement.scrollWidth <= innerWidth+3'),f'buyer {width} no overflow')
    for sector in keys:
     page.select_option('#v87-industry',sector)
     for style in styles:
      page.locator('[data-style="'+style+'"]').click()
      link=page.locator('#v87-email').get_attribute('href')
      report=page.locator('#v87-report').inner_text()
      selection=page.locator('#v87-selection').inner_text()
      check(link.startswith('mailto:nineeyes@naver.com?') and '%40' not in link[:40],f'{width}/{sector}/{style} mail recipient')
      check('디자인: ' in report and style in page.locator('#v87-demo').get_attribute('href'),f'{width}/{sector}/{style} correct report')
      check(page.locator('[data-style="'+style+'"]').get_attribute('aria-pressed')=='true',f'{width}/{sector}/{style} style selected')
      check(page.locator('#v87-features label').count()==8,f'{width}/{sector}/{style} 8 tools')
      if style=='editorial':
       page.locator('#v88-copy-subject').click();check('복사했습니다' in page.locator('#v88-copy-status').inner_text(),f'{width}/{sector} copied subject')
       clipboard=page.evaluate('window.__copy');check('홈페이지 제작 상담' in clipboard,f'{width}/{sector} clipboard subject')
       page.locator('#v88-copy-body').click();clipboard=page.evaluate('window.__copy');check('메일 앱에서 직접 발송' in clipboard and len(clipboard)>30,f'{width}/{sector} clipboard body')
    # Force disabled clipboard and check truthful manual fallback
    page.evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>Promise.reject(Error("blocked"))}})')
    page.locator('#v88-copy-body').click();check(not page.locator('#v88-manual-wrap').is_hidden(),f'buyer {width} manual text fallback visible')
    check('홈페이지 제작 상담' in page.locator('#v88-manual-text').input_value(),f'buyer {width} manual content present')
    check('아직 미발송' in page.locator('#v88-copy-status').inner_text(),f'buyer {width} no false sent')
    page.locator('.v88-fallback').scroll_into_view_if_needed()
    page.screenshot(path=str(a.output/f'V88_BUYER_{width}.png'),full_page=False)
    check(not errors,f'{width} browser JS errors: {errors[:2]}')
    context.close()
   browser.close()
 finally:
  pass
 report={'version':'V88','mode':'isolated_real_chromium_source_dom_not_public_network','checks':count,'pass':count-len(fail),'failed':len(fail),'examples':fail[:30],'customer_mail_sent':False,'customer_mail_received':'NOT_VERIFIED'}
 (a.output/'V88_DOM_BROWSER.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
 print('V88',report['pass'],'/',report['checks'],'failed',report['failed'])
 if fail:print('FAILURES',fail[:20]);return 1
 return 0
if __name__=='__main__':raise SystemExit(main())
