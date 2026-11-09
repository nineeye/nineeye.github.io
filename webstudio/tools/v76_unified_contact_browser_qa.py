#!/usr/bin/env python3
"""Isolated Chromium DOM/download contract, NOT live Cloudflare verification.
No network navigation, third-party assets, real email or customer information.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, tempfile
ROOT=Path(__file__).resolve().parents[1]
JS72=(ROOT/'assets/v72-complete-contact.js').read_text('utf-8')
JS76=(ROOT/'assets/v76-contact-unification.js').read_text('utf-8')
CSS=(ROOT/'assets/v76-contact-unification.css').read_text('utf-8')
INDUSTRIES=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
STYLES=('modern','premium','editorial')
assertions=0
HTML='''<!doctype html><html lang="ko"><meta charset="utf-8"><body>
<form id="brief-form">
<select name="industry" required><option value="">선택</option>__SECTORS__</select>
<select name="theme"><option value="modern">모던</option><option value="premium">프리미엄</option><option value="editorial">에디토리얼</option></select>
<select name="goal" required><option value="lead">문의</option></select>
<textarea name="details">__ORIGINAL_NOTE__</textarea>
</form>
<aside id="v653-import"><pre id="v653-full-brief">__ORIGINAL__</pre>
<div id="v71-full-actions"><button id="v71-full-copy">전체 복사</button><button id="v71-full-save">저장</button><a href="#" id="v71-mailto">메일</a></div>
<p class="v653-feedback"></p></aside>
<div class="brief-section"><div class="frame"><div class="workspace"><aside class="preview"><pre id="brief-output">업종: 제조업\n디자인: 모던\n현재 메모: 초기 값</pre>
<button id="brief-copy">메인 복사</button><button id="brief-download">메인 저장</button><button id="brief-email">메일</button><button id="brief-print">PDF</button><p id="brief-feedback"></p></aside></div></div></div>
<div id="v42-webmail-guide"><button id="v42-copy-complete">이전 복사</button><p id="v42-copy-feedback"></p></div>
<div id="v47-mail-packet"><button id="v47-copy-all">옛 전체 복사</button><button id="v47-download-all">옛 전체 저장</button><button id="v47-show-all">전체 보기</button>
<div id="v47-review" hidden><pre tabindex="0" id="v47-review-text"></pre></div><p id="v47-status"></p></div>
<pre id="v46-full-report">__KIT__</pre>
</body></html>'''

def main():
 global assertions
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
  try:
   for industry in INDUSTRIES:
    for style in STYLES:
     for width in (390,1440):
      page=browser.new_page(viewport={'width':width,'height':850},accept_downloads=True)
      sec=''.join(f'<option value="{v}">{v}</option>' for v in INDUSTRIES)
      html=HTML.replace('__SECTORS__',sec).replace('__ORIGINAL_NOTE__','이전 예시 견적에서 받은 문장')
      html=html.replace('__ORIGINAL__','[제작 상품] 원본 견적 '+('가상 견적 상세 데이터 ' * 75)).replace('__KIT__','시작키트 원본 절대 누락 금지')
      page.set_content(html)
      page.add_style_tag(content=CSS)
      page.evaluate("""() => {
        window.__copied=[];window.__prints=0;
        Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.__copied.push(t)}}});
        window.print=()=>window.__prints++;
      }""")
      page.add_script_tag(content=JS72)
      page.add_script_tag(content=JS76)
      check=page.evaluate("document.body.dataset.v76Unified==='true'");assert check,(industry,style,width,'activation');assertions+=1
      # Exercise changed industry/style and current request; old quote remains reference only.
      page.select_option('select[name=industry]',industry)
      page.select_option('select[name=theme]',style)
      page.locator('#brief-output').evaluate('(el,v)=>el.textContent="업종: "+v+"\\n마지막 수정 내용: LAST_EDIT_76"',industry)
      page.locator('#brief-form').evaluate('(el)=>el.dispatchEvent(new Event("input",{bubbles:true}))')
      page.evaluate('()=>new Promise(resolve=>queueMicrotask(resolve))')
      page.click('#v42-copy-complete')
      page.click('#v47-copy-all')
      copied=page.evaluate('window.__copied')
      assert len(copied)==2,(industry,style,width,'clipboard',len(copied));assertions+=1
      assert copied[0]==copied[1],(industry,style,width,'different clipboard text');assertions+=1
      for val in ('LAST_EDIT_76','가상 견적 상세 데이터','시작키트 원본 절대 누락 금지','받는 사람: nineeyes@naver.com'):
       assert val in copied[0],(industry,style,width,'missing '+val)
       assertions+=1
      if industry!='manufacturing' or style!='modern':
       assert '참고 기록: 이전 업종' in copied[0],(industry,style,width,'stale quote not labeled');assertions+=1
      with page.expect_download(timeout=5000) as d:
       page.click('#v47-download-all')
      downloaded=d.value
      assert downloaded.suggested_filename=='AllFileOne_V76_Complete_Inquiry.txt';assertions+=1
      with tempfile.TemporaryDirectory() as td:
       file=Path(td)/'download.txt';downloaded.save_as(file)
       data=file.read_bytes()
      assert data.startswith(b'\xef\xbb\xbf');assertions+=1
      assert data[3:].decode('utf-8')==copied[0];assertions+=1
      page.click('#v47-show-all')
      assert page.locator('#v47-review').is_visible();assertions+=1
      assert page.locator('#v47-review-text').inner_text()==copied[0];assertions+=1
      page.click('#brief-print')
      assert page.evaluate('window.__prints')==1;assertions+=1
      page.emulate_media(media='print')
      display=page.locator('.preview').evaluate('(el)=>getComputedStyle(el).display')
      assert display=='none',(industry,style,width,'not print full',display);assertions+=1
      displayed=page.locator('#v653-full-brief').evaluate('(el)=>getComputedStyle(el).display')
      assert displayed!='none',(industry,style,width,'full packet hidden');assertions+=1
      results.append({'industry':industry,'style':style,'width':width,'status':'PASS'})
      page.close()
  finally:browser.close()
 evidence={'qa':'V76 isolated actual DOM and TXT/print verification', 'results':results,'checks':assertions,'status':'PASS',
 'limitations':'No Cloudflare network access; no real email sent. Synthetic records only.'}
 folder=ROOT.parent/'EVIDENCE';folder.mkdir(exist_ok=True)
 (folder/'V76_DOM_QA_RESULT.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('V76 browser assertions',assertions,'PASS across',len(results),'case combinations')
if __name__=='__main__':main()