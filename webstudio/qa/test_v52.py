#!/usr/bin/env python3
"""V52 isolated Chromium smoke. Local navigation is intentionally not asserted; network is blocked here."""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,value):
    ok=bool(value);checks.append({'name':name,'pass':ok});
    if not ok:print('FAIL',name)
with sync_playwright() as p:
    chromium_binary=Path('/usr/bin/chromium')
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':str(chromium_binary)} if chromium_binary.is_file() else {}))
    for name in ('manufacturing','academy','interior'):
        html=(ROOT/'flagship'/f'{name}.html').read_text('utf-8')
        css=(ROOT/'assets'/'v52-flagship.css').read_text('utf-8')
        js=(ROOT/'assets'/f'v52-{name}.js').read_text('utf-8')
        for width in (320,390,768,1440):
            page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>','',html))
            page.add_style_tag(content=css)
            page.add_script_tag(content=js)
            prefix=f'{name}/{width}'
            check(prefix+' page no JS errors',not errors)
            check(prefix+' viewport overflow',page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'))
            check(prefix+' disclaimer',page.locator('.v52-demo-banner').count()==1)
            check(prefix+' return to real studio',page.locator('a[href*="quick-inquiry.html?industry="]').count()>=1)
            if name=='manufacturing':
                check(prefix+' eight products',page.locator('.m-product').count()==8)
                page.locator('#m-group').select_option('pipe')
                check(prefix+' product group filter',page.locator('.m-product').count()==3)
                page.locator('#m-group').select_option('all');page.locator('#m-material').select_option('aluminum')
                check(prefix+' material filter',page.locator('.m-product').count()==3)
                page.locator('#m-reset').click()
                page.locator('.m-product-foot button').first.click()
                check(prefix+' RFQ selection count',page.locator('#m-selected-count').inner_text()=='1개 선택')
                check(prefix+' quantity min',page.locator('[data-m-qty="MF-101"]').get_attribute('min')=='100')
                with page.expect_download() as d:page.locator('#m-download').click()
                check(prefix+' RFQ TXT save',d.value.suggested_filename=='AllFileOne_Manufacturing_RFQ_Demo.txt')
                page.locator('#m-clear').click()
                check(prefix+' clear RFQ',page.locator('#m-selected-count').inner_text()=='0개 선택')
            elif name=='academy':
                check(prefix+' 8 courses',page.locator('.a-course').count()==8)
                page.locator('[data-a-grade="high"]').click()
                check(prefix+' high school only',page.locator('.a-course').count()==2)
                page.locator('[data-a-grade="all"]').click()
                page.locator('.a-course-button').nth(0).click();page.locator('.a-course-button').nth(1).click()
                check(prefix+' selected 2',page.locator('#a-interest-count').inner_text()=='2개')
                check(prefix+' detects schedule conflict','겹침' in page.locator('#a-conflicts').inner_text())
                with page.expect_download() as d:page.locator('#a-download').click()
                check(prefix+' interest TXT save',d.value.suggested_filename=='AllFileOne_Academy_Course_Demo.txt')
                page.locator('#a-reset').click()
                check(prefix+' reset courses',page.locator('#a-interest-count').inner_text()=='0개')
            else:
                check(prefix+' six illustrated portfolio projects',page.locator('.i-card').count()==6)
                page.locator('[data-i-filter="office"]').click()
                check(prefix+' office filter',page.locator('.i-card').count()==2)
                page.locator('[data-i-filter="all"]').click()
                page.locator('#i-range').fill('82')
                check(prefix+' before/after slider',page.locator('#i-percent').inner_text()=='82%')
                page.locator('#i-area').fill('85')
                check(prefix+' brief updated','85㎡' in page.locator('#i-summary-text').inner_text())
                with page.expect_download() as d:page.locator('#i-download').click()
                check(prefix+' space TXT save',d.value.suggested_filename=='AllFileOne_Interior_Brief_Demo.txt')
                page.locator('#i-area').fill('2');page.locator('#i-download').click()
                check(prefix+' reject invalid area','5~500' in page.locator('#i-status').inner_text())
            page.close()
    browser.close()
results={'release':'V52','scope':'isolated Chromium with real new HTML/CSS/JS; no live Cloudflare navigation, sales, or email tests','total':len(checks),'passed':sum(x['pass'] for x in checks),'failed':sum(not x['pass'] for x in checks),'results':checks}
(ROOT/'qa'/'V52_QA_RESULTS.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print('RESULT',results['passed'],'/',results['total']);raise SystemExit(bool(results['failed']))
