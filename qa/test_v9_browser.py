from pathlib import Path
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json

root=Path(__file__).resolve().parent.parent
qa=root/'qa'
qa.mkdir(exist_ok=True)
passed=[]
failed=[]

def chk(name,condition):
 (passed if condition else failed).append(name)
 if not condition: print('FAIL',name)


def page_render(browser,basename,jsname,viewport,frontend_mock):
 page=browser.new_page(viewport=viewport,device_scale_factor=1)
 html=(root/'webstudio'/basename).read_text(encoding='utf-8')
 soup=BeautifulSoup(html,'html.parser')
 for s in soup.find_all('script'):s.decompose()
 page.set_content(str(soup),wait_until='domcontentloaded')
 page.add_style_tag(content=(root/'webstudio/assets/inbox.css').read_text(encoding='utf-8'))
 page.evaluate(frontend_mock)
 page.add_script_tag(content=(root/'webstudio/assets'/jsname).read_text(encoding='utf-8'))
 return page

ready_disabled=r"""
()=>{ window.fetch=async (url)=>new Response(JSON.stringify({ready:false}),{status:200,headers:{'Content-Type':'application/json'}}); }
"""
ready_success=r"""
()=>{
window.__posts=[];
window.fetch=async (url,options={})=>{
 const path=String(url);
 if(path.includes('inbox-status'))return new Response(JSON.stringify({ready:true,siteKey:'site_public_abc123456',retentionDays:90}),{status:200,headers:{'Content-Type':'application/json'}});
 if(path.includes('/api/inquiries')){
  window.__posts.push(JSON.parse(options.body));
  return new Response(JSON.stringify({ok:true,id:'850b8fdd-46b3-4cb2-8132-3fc680c19417'}),{status:201,headers:{'Content-Type':'application/json'}});
 }
 return new Response('{}',{status:404});
};
window.turnstile={render(node, options){window.__ts=options;options.callback('good-token-12345');return 7},reset(){window.__ts.callback('good-token-12345')}};
const realAppend=document.head.append.bind(document.head);
document.head.append=(s)=>{ if(s.tagName==='SCRIPT' && s.src.includes('challenges.cloudflare.com')) {queueMicrotask(()=>s.onload?.());return s;}return realAppend(s);};
}
"""
ready_failure=ready_success.replace("return new Response(JSON.stringify({ok:true,id:'850b8fdd-46b3-4cb2-8132-3fc680c19417'}),{status:201", "return new Response(JSON.stringify({ok:false,code:'BOT_CHECK_FAILED'}),{status:403")
admin_mock=r"""
()=>{
window.__data={id:'850b8fdd-46b3-4cb2-8132-3fc680c19417',created_at:1762509000000,updated_at:1762509000000,company:'대량부품',contact_name:'테스트 구매자',contact_email:'buyer@example.org',industry:'제조·도매',details:'B2B 부품 견적 기능과 주문 목록을 원합니다.',budget:'50_to_100',timing:'asap',status:'new',owner_note:'',version:1};
window.__methods=[];
window.fetch=async(url, options={})=>{
 const method=options.method||'GET';window.__methods.push(method);
 const auth=options.headers?.Authorization||'';
 if(auth!=='Bearer '+'T'.repeat(48))return new Response(JSON.stringify({ok:false,code:'UNAUTHORIZED'}),{status:401});
 if(method==='GET')return new Response(JSON.stringify({ok:true,items:[window.__data],nextOffset:null}),{status:200});
 if(method==='PATCH'){
   const p=JSON.parse(options.body);window.__data={...window.__data,status:p.status,owner_note:p.owner_note,version:p.version+1};
   return new Response(JSON.stringify({ok:true,id:p.id,version:p.version+1}),{status:200});
 }
 if(method==='DELETE')return new Response(JSON.stringify({ok:true,deletedId:window.__data.id}),{status:200});
 return new Response(JSON.stringify({ok:false}),{status:500});
};
window.confirm=()=>true;
}
"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [1440,1024,768,390,320]:
  viewport={'width':width,'height':900}
  dis=page_render(browser,'inquiry.html','inquiry.js',viewport,ready_disabled)
  dis.wait_for_timeout(100)
  chk(f'no automatic inquiry while unconfigured {width}',dis.locator('#inbox-disabled').is_visible() and dis.locator('#inbox-form').is_hidden())
  chk(f'privacy note present {width}',dis.locator('.privacy').count()==1)
  chk(f'mobile fit public disabled {width}',dis.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'))
  if width==390:dis.screenshot(path=str(qa/'v9_inquiry_mobile_disabled.png'),full_page=True)
  dis.close()
  enabled=page_render(browser,'inquiry.html','inquiry.js',viewport,ready_success)
  enabled.wait_for_function("document.querySelector('#inbox-form').hidden === false",timeout=5000)
  chk(f'form enabled after ready config {width}',enabled.locator('#inbox-form').is_visible())
  chk(f'button cannot submit without consent {width}',enabled.locator('#inbox-submit').is_disabled())
  enabled.locator('[name="company"]').fill('부품제조 테스트')
  enabled.locator('[name="name"]').fill('홍길동')
  enabled.locator('[name="email"]').fill('buyer@example.org')
  enabled.locator('[name="industry"]').select_option(label='제조·도매')
  enabled.locator('[name="details"]').fill('실제 제품 400종을 검색하고 거래처별 견적서를 이메일로 접수하고 싶습니다.')
  enabled.locator('[name="consent"]').check()
  chk(f'button unlocked after token consent {width}',enabled.locator('#inbox-submit').is_enabled())
  chk(f'mobile fit public enabled {width}',enabled.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'))
  if width==1440:enabled.screenshot(path=str(qa/'v9_inquiry_pc.png'),full_page=True)
  if width==390:enabled.screenshot(path=str(qa/'v9_inquiry_mobile_ready.png'),full_page=True)
  enabled.locator('#inbox-submit').click()
  enabled.wait_for_function("document.querySelector('#inbox-success').hidden === false",timeout=6000)
  chk(f'success only after 201 receipt {width}',enabled.locator('#inbox-receipt').inner_text()=='850b8fdd-46b3-4cb2-8132-3fc680c19417')
  chk(f'consent and payload posted {width}',enabled.evaluate('window.__posts.length===1 && window.__posts[0].consent===true'))
  enabled.close()
  bad=page_render(browser,'inquiry.html','inquiry.js',viewport,ready_failure)
  bad.wait_for_function("document.querySelector('#inbox-form').hidden === false")
  bad.locator('[name="name"]').fill('홍길동')
  bad.locator('[name="email"]').fill('buyer@example.org')
  bad.locator('[name="industry"]').select_option(label='제조·도매')
  bad.locator('[name="details"]').fill('문의 접수 기능을 실제 고객의 업무에 적용해 주세요. 관리자도 원합니다.')
  bad.locator('[name="consent"]').check()
  bad.locator('#inbox-submit').click()
  bad.locator('#inbox-feedback').get_by_text('보안 확인이 만료됐거나 실패했습니다.',exact=False).wait_for(timeout=5000)
  chk(f'failure is not reported as success {width}',bad.locator('#inbox-success').is_hidden())
  bad.close()
  adm=page_render(browser,'admin-inbox.html','admin-inbox.js',viewport,admin_mock)
  chk(f'admin prelogin hidden {width}',adm.locator('#admin-dashboard').is_hidden())
  adm.locator('#admin-token').fill('T'*48)
  adm.locator('#login-form button').click()
  adm.wait_for_function("document.querySelector('#admin-dashboard').hidden === false",timeout=5000)
  chk(f'admin item displayed {width}',adm.locator('.admin-card').count()==1)
  chk(f'admin token cleared from input {width}',adm.locator('#admin-token').input_value()=='')
  chk(f'admin renders PII safely {width}',adm.locator('.admin-card').get_by_text('buyer@example.org').count()==1)
  chk(f'admin mobile fit {width}',adm.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'))
  if width==1440:adm.screenshot(path=str(qa/'v9_admin_pc.png'),full_page=True)
  if width==390:adm.screenshot(path=str(qa/'v9_admin_mobile.png'),full_page=True)
  adm.locator('.admin-edit select').select_option('reviewing')
  adm.locator('.admin-edit input').fill('견적 검토 완료')
  adm.locator('.admin-edit button').first.click()
  adm.locator('#admin-feedback').get_by_text('실제 데이터베이스에 저장됐습니다.',exact=False).wait_for(timeout=5000)
  chk(f'admin PATCH used {width}',adm.evaluate("window.__methods.includes('PATCH')"))
  adm.locator('.admin-edit button.danger').click()
  adm.locator('#admin-feedback').get_by_text('선택한 문의를 삭제했습니다.',exact=False).wait_for(timeout=5000)
  chk(f'admin DELETE used {width}',adm.evaluate("window.__methods.includes('DELETE')"))
  adm.close()
 browser.close()
result={'passed':len(passed),'failed':len(failed),'failures':failed,'checks':passed}
(qa/'V9_BROWSER_RESULTS.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('BROWSER_SUMMARY',len(passed),'PASS',len(failed),'FAIL')
if failed:raise SystemExit(1)
