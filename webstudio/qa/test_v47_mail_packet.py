#!/usr/bin/env python3
"""V47 isolated browser+static tests; no live emails or production access.
Run from ZIP root: python webstudio/qa/test_v47_mail_packet.py
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/'assets/v47-mail-packet.js').read_text(encoding='utf-8')
CSS=(ROOT/'assets/v47-mail-packet.css').read_text(encoding='utf-8')
checks=[]
def ok(label,condition):
    checks.append({'name':label,'pass':bool(condition)})
    if not condition: print('FAIL',label)
for s in ('fetch(', 'XMLHttpRequest','sendBeacon','localStorage','innerHTML','https://api.', 'eval('):
    ok('does not use '+s, s not in JS)
for s in ('v47-copy-all','v47-download-all','v47-show-all','v46-full-report','brief-output','brief-form','aria-live','checkValidity'):
    ok('required token '+s,s in JS)
fixture='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><main style="max-width:900px;margin:auto;padding:10px;box-sizing:border-box"><section id="brief"><form id="brief-form"><select name="industry" required><option value="">선택</option><option value="academy">학원 · 교육</option><option value="manufacturing">제조 · 도매</option></select><select name="goal" required><option value="">선택</option><option value="lead">견적 문의</option></select><textarea name="details">기본 문의</textarea><pre id="brief-output" style="white-space:pre-wrap;overflow-wrap:anywhere">[상담 준비서]\n제조 고객 정보</pre></form><div id="v42-webmail-guide">기존 이메일 도움말</div></section><section id="v46-import"><pre id="v46-full-report">[제작 준비키트 전체 내용]\n미준비 품목: 상세 자료 10종\n고객 메모: &lt;img src=x onerror=alert(7)&gt;</pre></section></main></body></html>'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width in (360,768,1440):
        page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(fixture)
        page.add_style_tag(content=CSS)
        page.add_script_tag(content=JS)
        ok(f'{width} panel created',page.locator('#v47-mail-packet').count()==1)
        ok(f'{width} 4 actions',page.locator('#v47-mail-packet button, #v47-mail-packet a').count()==4)
        ok(f'{width} initial no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        ok(f'{width} external link safe',page.locator('#v47-mail-packet a').get_attribute('rel')=='noopener noreferrer')
        ok(f'{width} no errors',len(errors)==0)
        page.locator('#v47-copy-all').click()
        ok(f'{width} required check', '업종과 제작 목적' in page.locator('#v47-status').inner_text())
        page.locator('[name=industry]').select_option('academy')
        page.locator('[name=goal]').select_option('lead')
        page.locator('#v47-show-all').click()
        full=page.locator('#v47-review-text').inner_text()
        ok(f'{width} preview visible',page.locator('#v47-review').is_visible())
        ok(f'{width} correct recipient','nineeyes@naver.com' in full)
        ok(f'{width} correct subject','학원 · 교육 홈페이지 제작 문의' in full)
        ok(f'{width} consultation body','제조 고객 정보' in full)
        ok(f'{width} V46 original preserved','미준비 품목: 상세 자료 10종' in full)
        ok(f'{width} no HTML injection',page.locator('#v47-review img').count()==0)
        page.locator('#v47-show-all').click()
        ok(f'{width} preview closes',page.locator('#v47-review').is_hidden())
        with page.expect_download() as download_info:
            page.locator('#v47-download-all').click()
        dl=download_info.value
        ok(f'{width} download name',dl.suggested_filename=='AllFileOne_Complete_Inquiry_V47.txt')
        dpath=ROOT/'qa'/('_v47_tmp_'+str(width)+'.txt');dl.save_as(dpath)
        data=dpath.read_text(encoding='utf-8-sig');dpath.unlink()
        ok(f'{width} downloaded whole packet',data==full)
        ok(f'{width} no auto submission','mailto:' not in page.url and page.url=='about:blank')
        page.locator('#v47-show-all').click()
        page.locator('[name=details]').fill('변경된 문의')
        ok(f'{width} stale preview hides',page.locator('#v47-review').is_hidden())
        page.add_script_tag(content=JS)
        ok(f'{width} repeated script idempotent',page.locator('#v47-mail-packet').count()==1)
        ok(f'{width} final no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        page.close()
    # When V46 is absent, V47 must work as normal consultation email pack.
    p0=browser.new_page(viewport={'width':360,'height':900},accept_downloads=True)
    p0.set_content(fixture.replace('<section id="v46-import"><pre id="v46-full-report">[제작 준비키트 전체 내용]\n미준비 품목: 상세 자료 10종\n고객 메모: &lt;img src=x onerror=alert(7)&gt;</pre></section>',''))
    p0.add_style_tag(content=CSS);p0.add_script_tag(content=JS)
    p0.locator('[name=industry]').select_option('manufacturing');p0.locator('[name=goal]').select_option('lead')
    p0.locator('#v47-show-all').click()
    value=p0.locator('#v47-review-text').inner_text()
    ok('no V46 report graceful','미준비 품목' not in value and '제조 · 도매' in value)
    ok('no V46 report no error',p0.locator('#v47-mail-packet').count()==1)
    p0.close();browser.close()
summary={'release':'V47','type':'isolated Chromium with real HTML/JS/CSS widget and synthetic V26+V46 fixture','passed':sum(x['pass'] for x in checks),'failed':sum(not x['pass'] for x in checks),'total':len(checks),'live_site_tested':False,'real_email_receipt_tested':False,'results':checks}
(ROOT/'qa'/'V47_QA_RESULTS.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'V47 isolated QA {summary["passed"]}/{summary["total"]} PASS, {summary["failed"]} FAIL')
if summary['failed']: sys.exit(1)
