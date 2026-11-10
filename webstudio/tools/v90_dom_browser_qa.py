"""Actual isolated Chromium/browser interactions using full source DOM; sandbox network is blocked."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,argparse,datetime,re
R=Path(__file__).resolve().parents[1]
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
def test(out):
 out.mkdir(parents=True,exist_ok=True);checks=[];shots=[]
 def ck(label,ok,detail=''):checks.append({'check':label,'pass':bool(ok),'detail':str(detail)[:240]})
 # Network-free complete DOM fixture: no local HTTP permitted by this sandbox.
 html=(R/'project-process-v90.html').read_text('utf-8')
 html=re.sub(r'<script[^>]+src=[^>]+></script>','',html)
 html=re.sub(r'<link[^>]+rel="stylesheet"[^>]+>','',html)
 with sync_playwright() as p:
   browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
   for width in (1280,390):
    page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load')
    page.add_style_tag(content=(R/'assets/v90-process.css').read_text('utf-8'))
    page.add_script_tag(content=(R/'assets/v90-process.js').read_text('utf-8'))
    ck(f'{width}:ready',page.evaluate('window.AFO_V90_PROCESS_READY===true'))
    ck(f'{width}:6 steps',page.locator('.step').count()==6)
    ck(f'{width}:3 packages',page.locator('.package-grid article').count()==3)
    ck(f'{width}:6 faqs',page.locator('.faq-grid details').count()==6)
    ck(f'{width}:4 nav',page.locator('header nav a').count()==4)
    ck(f'{width}:initial unchecked',page.locator('input[data-v90-key]:checked').count()==0)
    ck(f'{width}:initial score',page.locator('#v90-count').inner_text()=='0')
    ck(f'{width}:no overflow start',page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'))
    for sector in SECTORS:
     page.locator('#v90-sector').select_option(sector)
     ck(f'{width}/{sector} select',page.locator('#v90-sector').input_value()==sector)
     ck(f'{width}/{sector} request url',page.locator('#v90-request').get_attribute('href')==f'./start-project-v87.html?industry={sector}')
     page.locator('input[data-v90-key]').first.check()
     ck(f'{width}/{sector} 1/10 score',page.locator('#v90-count').inner_text()=='1')
     ck(f'{width}/{sector} progress aria',page.locator('#v90-progress').get_attribute('aria-valuenow')=='1')
     page.locator('input[data-v90-key]').nth(1).check()
     ck(f'{width}/{sector} 2/10 score',page.locator('#v90-count').inner_text()=='2')
     page.locator('#v90-reset').click()
     ck(f'{width}/{sector} cleared',page.locator('input[data-v90-key]:checked').count()==0)
     ck(f'{width}/{sector} reset score',page.locator('#v90-count').inner_text()=='0')
     ck(f'{width}/{sector} no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'))
    page.locator('#v90-sector').select_option('manufacturing')
    for i in range(10):page.locator('input[data-v90-key]').nth(i).check()
    ck(f'{width}:all10',page.locator('#v90-count').inner_text()=='10')
    ck(f'{width}:all10 summary','모든 질문' in page.locator('#v90-summary').inner_text())
    with page.expect_download() as dl:page.locator('#v90-download').click()
    payload=dl.value.path().read_bytes()
    ck(f'{width}:download utf8',payload.startswith(b'\xef\xbb\xbf'))
    ck(f'{width}:download user sector',b'manufacturing' not in payload and '제조·도매'.encode() in payload)
    ck(f'{width}:download 10 items',b'10/10' in payload)
    ck(f'{width}:download warnings','기획 참고'.encode() in payload and '자동 전송되지'.encode() in payload)
    page.evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:undefined})')
    page.locator('#v90-copy').click()
    ck(f'{width}:clipboard fallback visible',page.locator('#v90-copy-area').count()==1)
    ck(f'{width}:fallback text',len(page.locator('#v90-copy-area').input_value())>150)
    ck(f'{width}:JS exception free',not errors,str(errors))
    # Take a fresh, unscrolled screenshot to show the actual top-of-page design.
    fresh=browser.new_page(viewport={'width':width,'height':900})
    fresh.set_content(html,wait_until='load')
    fresh.add_style_tag(content=(R/'assets/v90-process.css').read_text('utf-8'))
    fresh.add_script_tag(content=(R/'assets/v90-process.js').read_text('utf-8'))
    fn='V90_PROCESS_PC_1280.png' if width==1280 else 'V90_PROCESS_MOBILE_390.png';fresh.screenshot(path=str(out/fn),full_page=False);fresh.close();shots.append(fn)
    page.close()
   browser.close()
 passed=sum(x['pass'] for x in checks)
 report={'scope':'LOCAL_ISOLATED_CHROMIUM_REAL_DOM_NO_PUBLIC_HTTP','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'passed':passed,'total':len(checks),'failed':len(checks)-passed,'status':'PASS_LOCAL_BROWSER_ONLY' if passed==len(checks) else 'HOLD_LOCAL_BROWSER','checks':checks,'screenshots':shots,'email_received':'NOT_VERIFIED','paid_api':0}
 (out/'V90_LOCAL_BROWSER.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),'utf-8')
 (out/'V90_LOCAL_BROWSER_KO.txt').write_text('V90 로컬 Chromium 실제 클릭 점검\n'+f"결과: {report['status']} {passed}/{len(checks)}\n"+'\n'.join(x['check'] for x in checks if not x['pass'])+'\n','utf-8-sig')
 print(report['status'],passed,'/',len(checks));return 0 if report['status']=='PASS_LOCAL_BROWSER_ONLY' else 3
if __name__=='__main__':
 x=argparse.ArgumentParser();x.add_argument('--output',type=Path,required=True);a=x.parse_args();raise SystemExit(test(a.output))
