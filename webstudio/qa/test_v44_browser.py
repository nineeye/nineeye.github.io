#!/usr/bin/env python3
"""AllFileOne WebStudio V44 offline QA. No HTTP requests / no modifications to source."""
from pathlib import Path
import json,re,sys
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
from html.parser import HTMLParser
BASE=Path(__file__).resolve().parents[1]
WEB=BASE/'source'/'webstudio'
INDS=['manufacturing','academy','interior']
WIDTHS=[320,360,390,768,1280,1440]
CHECKS=[]
def check(cond,desc):
    CHECKS.append((bool(cond),desc))
    if not cond: print('FAIL',desc)

def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        for ind in INDS:
            pagefile=WEB/f'for-{ind}.html'
            source=pagefile.read_text(encoding='utf-8')
            jsonld=re.search(r'<script type="application/ld\+json">(.*?)</script>',source,re.S)
            check(bool(jsonld),f'{ind} JSONLD present')
            schema=json.loads(jsonld.group(1))
            graph={d['@type']:d for d in schema['@graph']}
            canon='https://allfileone-webstudio.pages.dev/for-'+ind+'.html'
            check(graph['WebPage']['url']==canon,f'{ind} WebPage URL correct')
            check(graph['Service']['url']==canon,f'{ind} Service URL correct')
            check(graph['Service']['provider']['name']=='올파일원 웹스튜디오',f'{ind} provider present')
            check('FAQPage' not in source and not any(k in str(schema) for k in ('aggregateRating','reviewRating','streetAddress','telephone')),f'{ind} no unsupported claims')
            check(source.count('v44-faq-item')==4,f'{ind} exactly four unique questions')
            check(source.count('href="#faq"')==1,f'{ind} direct question link')
            check(source.count('href="./contact.html?source=sector&industry='+ind)==4,f'{ind} original four consultation links retained')
            check(source.count('href="./contact.html?source=sector&amp;industry='+ind)==2,f'{ind} existing and new FAQ consultation links')
            for width in WIDTHS:
                page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1,accept_downloads=True)
                errs=[];external=[]
                page.on('pageerror',lambda exc:errs.append(str(exc)))
                page.on('request',lambda req:external.append(req.url) if req.url.startswith(('http:','https:')) else None)
                # The harness blocks file:// and localhost, so use the actual V44 HTML via set_content.
                # Only source links are stripped; actual local CSS/JS bytes are injected unchanged.
                html_no_external = re.sub(r'<(?:link[^>]*rel="stylesheet"[^>]*|script[^>]*src="[^"]+"[^>]*></script>)', '', source)
                page.set_content(html_no_external, wait_until='load')
                for stylesheet in ['v38-solutions.css','v43-industry-lab.css','v44-sector-search.css']:
                    page.add_style_tag(content=(WEB/'assets'/stylesheet).read_text(encoding='utf-8'))
                for javascript in ['v38-solutions.js','v43-industry-lab.js']:
                    page.add_script_tag(content=(WEB/'assets'/javascript).read_text(encoding='utf-8'))
                page.wait_for_timeout(100)
                check(page.locator('.v44-faq-item').count()==4,f'{ind}/{width}: 4 FAQ details visible')
                check(page.locator('.v44-faq-item summary').first.is_visible(),f'{ind}/{width}: FAQ summary visible')
                check(page.locator('[data-v43-lab]').count()==1,f'{ind}/{width}: original lab retained')
                check(page.locator('[data-v38-planner] input[name="module"]').count()==4,f'{ind}/{width}: scope planner retained')
                check(page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'),f'{ind}/{width}: no horizontal overflow')
                check(not errs,f'{ind}/{width}: no JS error {errs[:2]}')
                check(not external,f'{ind}/{width}: no external HTTP {external[:2]}')
                check(page.locator('script[type="application/ld+json"]').count()==1,f'{ind}/{width}: schema DOM present')
                check(page.locator('a[href="#faq"]').count()==1,f'{ind}/{width}: FAQ jump intact')
                if width in (390,1280):
                    faq=page.locator('.v44-faq-item')
                    for idx in range(4):
                        item=faq.nth(idx)
                        check(not item.evaluate('(el) => el.open'),f'{ind}/{width}: FAQ {idx} starts closed')
                        item.locator('summary').click()
                        check(item.evaluate('(el) => el.open'),f'{ind}/{width}: FAQ {idx} opens')
                        check(item.locator('p').is_visible(),f'{ind}/{width}: FAQ {idx} answer visible')
                        item.locator('summary').click()
                        check(not item.evaluate('(el) => el.open'),f'{ind}/{width}: FAQ {idx} closes')
                    page.locator('.v44-faq-item summary').first.focus()
                    page.keyboard.press('Enter')
                    check(faq.first.evaluate('(el) => el.open'),f'{ind}/{width}: FAQ keyboard accessible')
                    page.screenshot(path=str(BASE/'qa/screenshots'/f'v44_{ind}_{width}.png'),full_page=False)
                page.close()
        browser.close()
    errors=[msg for yes,msg in CHECKS if not yes]
    report={'tested':'V44 source files under '+str(WEB),'automated_check_count':len(CHECKS),'pass':len(CHECKS)-len(errors),'fail':len(errors),'failures':errors,'viewports':WIDTHS,'industries':INDS,'scope':'Actual V44 HTML/CSS/JS in isolated Chromium via set_content and inline injection; original file:// access was blocked. No production HTTP, index, live email, or sales claims tested.'}
    (BASE/'qa/results').mkdir(parents=True,exist_ok=True)
    (BASE/'qa/results/V44_BROWSER_QA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return 1 if errors else 0
if __name__=='__main__':
    (BASE/'qa/screenshots').mkdir(parents=True,exist_ok=True)
    sys.exit(run())
