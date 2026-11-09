#!/usr/bin/env python3
"""Isolated browser fixture QA. Does not assert that Cloudflare public site is reachable."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent/'EVIDENCE'/'V82'
OUT.mkdir(parents=True,exist_ok=True)
ORIGIN='https://allfileone-webstudio.pages.dev/'
paths=['assets/current-release.json','release-check-v82.html','assets/v82-release-check.js',
       'index.html','feature-scope-v81.html','contact.html','assets/demo.js',
       'assets/v80-simulator.js','industry-features-v77.html']
source={path:(ROOT/path).read_text('utf-8') for path in paths}
html=(ROOT/'release-check-v82.html').read_text('utf-8').replace('<head>','<head><base href="'+ORIGIN+'">',1).replace('<link rel="stylesheet" href="assets/v82-release-check.css">','').replace('<script defer src="assets/v82-release-check.js"></script>','')
css=(ROOT/'assets/v82-release-check.css').read_text('utf-8')
js=(ROOT/'assets/v82-release-check.js').read_text('utf-8')

def page_ready(ctx,fixture):
    pg=ctx.new_page();pg.set_content(html,wait_until='domcontentloaded');pg.add_style_tag(content=css)
    pg.evaluate('''data=>{window.fetch=async url=>{const path=(new URL(url)).pathname.slice(1);const item=data[path];if(item===undefined)return {ok:false,status:404,url:String(url),text:async()=>''};return {ok:true,status:200,url:String(url),text:async()=>item}}}''',fixture)
    pg.add_script_tag(content=js)
    return pg

def main():
    checks=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        for width,height in ((1366,900),(390,844)):
            ctx=browser.new_context(viewport={'width':width,'height':height},accept_downloads=True)
            page=page_ready(ctx,source)
            page.locator('#run-v82').click()
            page.locator('#probe-state').get_by_text('PASS_PUBLIC_FILES_ONLY',exact=False).wait_for(timeout=12000)
            text=page.locator('#probe-state').inner_text();pcount=page.locator('#pass').inner_text();hold=page.locator('#hold').inner_text()
            assert '9/9' in text and pcount=='9' and hold=='0',(text,pcount,hold)
            width_ok=page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2')
            assert width_ok,'horizontal overflow '+str(width)
            with page.expect_download(timeout=5000) as d:page.locator('#save').click()
            download=d.value
            content=Path(OUT/f'V82_PUBLIC_REPORT_{width}.txt')
            download.save_as(content)
            lines=content.read_text('utf-8-sig')
            assert 'PASS: 9' in lines and 'HOLD: 0' in lines and '실제 이메일 수신' in lines
            page.screenshot(path=str(OUT/f'V82_proof_{width}.png'),full_page=True)
            checks.append({'case':'successful_mock_public_'+str(width),'pass':True,'count':9,'no_overflow':True,'download':content.name})
            page.close();ctx.close()
        # Negative stale release and missing asset must fail closed.
        for case,fixture in [('old_version',{**source,'assets/current-release.json':json.dumps({'product':'AllFileOne WebStudio','version':'V81'})}),('missing_asset',{k:v for k,v in source.items() if k!='assets/v80-simulator.js'})]:
            ctx=browser.new_context(viewport={'width':390,'height':844})
            page=page_ready(ctx,fixture)
            page.locator('#run-v82').click()
            page.locator('#probe-state').get_by_text('HOLD_PUBLIC_DEPLOY',exact=False).wait_for(timeout=12000)
            count=int(page.locator('#hold').inner_text())
            assert count>0,(case,count)
            checks.append({'case':case,'pass':True,'detected_holds':count})
            page.close();ctx.close()
        browser.close()
    (OUT/'V82_BROWSER_QA.json').write_text(json.dumps({'fixture_based_not_public':True,'checks':checks,'status':'4/4 PASS'},ensure_ascii=False,indent=2)+'\n','utf-8')
    print('V82 local Chromium 4/4 fixtures PASS; no real Cloudflare claim')
if __name__=='__main__':main()