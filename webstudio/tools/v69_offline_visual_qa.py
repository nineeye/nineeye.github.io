#!/usr/bin/env python3
"""Self-contained Chromium UI checks using inline, original first-party assets.
NO claims about Cloudflare or HTTP/iframe. Restricted browser blocks local navigation.
"""
from pathlib import Path
import json, argparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
STYLES=['modern','premium','editorial']
SECTORS=['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event']
CSS=['demo.css','demo-v13.css','v23-industry.css','v66-distinct-designs.css','v69-artdirection.css']
SCRIPTS=['v23-industry.js','v66-sector-artdirection.js','v69-artdirection.js']
def page_source(sector,style):
 s=(ROOT/'demo'/sector/style/'index.html').read_text(encoding='utf-8')
 s=s.replace('<script src="../../../assets/demo.js" defer></script>','')
 s=s.replace('</head>','<style>'+''.join((ROOT/'assets'/name).read_text(encoding='utf-8') for name in CSS)+'</style></head>')
 return s

def run(out,shot_dir):
 checks=[]; screenshots=[]
 def check(label,condition,detail=None):checks.append({'case':label,'result':'PASS' if condition else 'FAIL','detail':detail})
 with sync_playwright() as playwright:
  browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  try:
   for width in [1440,768,390]:
    for sector in SECTORS:
     for style in STYLES:
      page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
      errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      try:
       page.set_content(page_source(sector,style),wait_until='domcontentloaded')
       for name in SCRIPTS:
        page.add_script_tag(content=(ROOT/'assets'/name).read_text(encoding='utf-8'))
       page.wait_for_function("document.body.dataset.v69Ready === 'true'",timeout=2000)
       stage=page.locator('.v23-hero-shell')
       mode=stage.evaluate('e=>getComputedStyle(e).display')
       columns=stage.evaluate('e=>getComputedStyle(e).gridTemplateColumns')
       signature=page.locator('.v69-hero-signature').count()
       cta=page.locator('.v23-hero-cta').count()
       ready=page.locator('body').get_attribute('data-v66-ready')
       check(f'{sector}/{style}/{width} V23 + V66 + V69 active',bool(ready=='true' and signature==1 and cta==1),[ready,signature,cta])
       check(f'{sector}/{style}/{width} no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.evaluate('[document.documentElement.scrollWidth,innerWidth]'))
       check(f'{sector}/{style}/{width} no JS exceptions',not errors,errors[:2])
       if width==1440 and sector=='manufacturing':
        assert shot_dir
        p=shot_dir/f'{style}_desktop.png';page.screenshot(path=str(p),full_page=False);screenshots.append(str(p))
       if width==390 and sector=='manufacturing':
        p=shot_dir/f'{style}_mobile.png';page.screenshot(path=str(p),full_page=False);screenshots.append(str(p))
       if width==1440 and sector=='manufacturing':
        check(f'{style} actual rendered desktop layout signature',(
          style=='premium' and mode=='grid' and len(columns.split(' '))<=2
          or style=='modern' and mode=='grid' and len(columns.split(' '))>=2
          or style=='editorial' and mode=='grid' and len(columns.split(' '))>=2
        ),{'mode':mode,'columns':columns})
      except Exception as e:check(f'{sector}/{style}/{width} load',False,str(e))
      finally:page.close()
  finally:browser.close()
 report={'release':'V69', 'scope':'about:blank inline-first-party CSS/JS. Not network, Cloudflare or full public browser.',
         'cases':len(checks),'passed':sum(c['result']=='PASS' for c in checks),'failed':sum(c['result']=='FAIL' for c in checks),
         'screenshots':screenshots,'checks':checks,'public_deployment_verified':False,'real_customer_mail_verified':False}
 out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 return report
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--out',default=str(ROOT.parent/'EVIDENCE/V69_INLINE_VISUAL_QA.json'));ap.add_argument('--shots',default=str(ROOT.parent/'EVIDENCE/V69_PREVIEW_SCREENSHOTS'));a=ap.parse_args()
 folder=Path(a.shots);folder.mkdir(parents=True,exist_ok=True)
 r=run(Path(a.out),folder);print(json.dumps({k:v for k,v in r.items() if k!='checks'},ensure_ascii=False,indent=2));exit(1 if r['failed'] else 0)