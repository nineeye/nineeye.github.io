"""V91 offline real Chromium, PC and mobile, no public network assertion."""
from pathlib import Path
import argparse,json,sys,threading,functools,http.server
from playwright.sync_api import sync_playwright
P=Path(__file__).resolve().parents[1];R=P if (P/'quote-scope-v91.html').is_file() else P/'SITE';SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event');STYLES=('modern','premium','editorial')
def main():
 p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
 counts=[0,0];fail=[]
 def check(ok,tag):
  counts[0]+=1
  if not ok:fail.append(tag)
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(R)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  return _browse(a,counts,fail,check,server.server_port)
 finally:
  server.shutdown();server.server_close()

def _browse(a,counts,fail,check,port):
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (390,1280):
   page=b.new_page(viewport={'width':width,'height':900},accept_downloads=True);page.set_default_timeout(6000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   
   html=(R/'quote-scope-v91.html').read_text('utf-8')
   html=html.replace('<link rel="stylesheet" href="./assets/v91-quote.css">','<style>'+ (R/'assets/v91-quote.css').read_text('utf-8')+'</style>')
   html=html.replace('<script defer src="./assets/v91-quote.js"></script>','')
   html=html.replace('</body>','<script>'+ (R/'assets/v91-quote.js').read_text('utf-8')+'</script></body>')
   # Policy may block file:// or localhost navigation. Source HTML, CSS and JS are the actual files.
   page.set_content(html,wait_until='load')
   check(page.evaluate('window.AFO_V91_QUOTE_READY')=='V91-20261110',f'{width}:ready')
   check(page.locator('header nav a').count()==4,f'{width}:nav4')
   check(page.locator('#v91-features input').count()==8,f'{width}:features8')
   for sector in SECTORS:
    page.locator('#v91-industry').select_option(sector)
    for style in STYLES:
     page.locator('#v91-style').select_option(style)
     tag=f'{width}/{sector}/{style}'
     check(sector in page.locator('#v91-demo').get_attribute('href'),tag+':demo-sector')
     check(style in page.locator('#v91-demo').get_attribute('href'),tag+':demo-style')
     check('상태: 합의 전 초안' in page.evaluate('window.AFO_V91_DRAFT()'),tag+':status')
     check(page.locator('#v91-mail').get_attribute('href').startswith('mailto:nineeyes@naver.com?subject='),tag+':manual-mailto')
     check(page.locator('#v91-summary dt').count()==14,tag+':summary-14')
     check(page.evaluate('document.documentElement.scrollWidth <= innerWidth+3'),tag+':no-overflow')
   # Concrete worksheet verification, do not use any real customer data
   page.locator('#v91-industry').select_option('clinic')
   page.locator('#v91-style').select_option('premium')
   page.locator('#v91-pages').fill('6')
   page.locator('#v91-cost').fill('1200000')
   page.locator('#v91-vat').select_option('excluded')
   page.locator('#v91-payment').select_option('milestone')
   page.locator('#v91-revisions').select_option('two')
   page.locator('#v91-hosting').select_option('separate')
   page.locator('#v91-rights').select_option('customer')
   page.locator('#v91-maintenance').select_option('separate')
   page.locator('#v91-schedule').select_option('m2')
   page.locator('#v91-features input[value="payment"]').check()
   page.locator('#v91-features input[value="catalog"]').check()
   page.locator('#v91-notes').fill('<script>alert(1)</script> 고객 이름 없음')
   report=page.evaluate('window.AFO_V91_DRAFT()')
   check('1,200,000원' in report,f'{width}:formatted-cost')
   check('실제 결제 연동 (별도 구축)' in report,f'{width}:separate-feature')
   check('6쪽' in report,f'{width}:pages6')
   check('부가세 별도 여부 협의안' in report,f'{width}:VAT-proposal')
   check(page.locator('#v91-ready').inner_text()=='10',f'{width}:ten-ready')
   check(page.locator('#v91-summary script').count()==0,f'{width}:notes-escaped')
   check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),f'{width}:full-no-overflow')
   with page.expect_download() as d:page.locator('#v91-save').click()
   saved=d.value.path().read_bytes()
   check(saved.startswith(b'\xef\xbb\xbf') and '실제 결제 연동'.encode('utf-8') in saved,f'{width}:utf8-TXT')
   # Force clipboard denial to exercise manual selection fallback
   page.evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>Promise.reject(new Error("blocked"))}})')
   page.locator('#v91-copy').click()
   check(page.locator('#v91-fallback').is_visible(),f'{width}:copy-denied-fallback')
   check('올파일원 웹스튜디오 V91' in page.locator('#v91-fallback-text').input_value(),f'{width}:copy-fallback-full-text')
   check('고객이 직접' in page.locator('.mail-note').inner_text(),f'{width}:manual-send-honest')
   page.locator('#v91-reset').click()
   check(page.locator('#v91-ready').inner_text()=='0',f'{width}:reset-0')
   check(page.locator('#v91-features input:checked').count()==0,f'{width}:reset-features')
   check(page.locator('#v91-cost').input_value()=='',f'{width}:reset-cost')
   check(not errors,f'{width}:runtime-errors:{errors[:2]}')
   page.screenshot(path=str(a.output/f'V91_QUOTE_{width}.png'),full_page=True)
   page.close()
  b.close()
 passed=counts[0]-len(fail);result={'kind':'isolated_source_dom_chromium_not_live_customer','total':counts[0],'pass':passed,'hold':len(fail),'fails':fail[:80]};(a.output/'V91_LOCAL_BROWSER.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8');(a.output/'V91_LOCAL_BROWSER_KO.txt').write_text(f'V91 로컬 PC·모바일 Chromium {passed}/{counts[0]} 통과. 실제 공개 HTTPS·고객메일·계약 확인이 아님.\n'+'\n'.join(fail[:80])+'\n','utf-8-sig');print(json.dumps(result,ensure_ascii=False)[:800]);return 0 if not fail else 2
if __name__=='__main__':sys.exit(main())
