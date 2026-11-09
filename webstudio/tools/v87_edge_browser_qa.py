#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Windows Edge public V87 UI test. No personal data, no POST, no external paid services."""
from __future__ import annotations
import argparse,base64,datetime as dt,hashlib,json,subprocess,sys,tempfile,time,zipfile
from pathlib import Path
from v65_edge_live_qa import BrowserError,find_browser,launch_cdp,same_public_route
from v85_public_probe import ALLOWED_ORIGINS,PRODUCTION_ORIGIN
from v87_public_probe import SECTORS
STYLES=('modern','premium','editorial')
def test(cdp,out,origin,screenshots=True):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 rows=[];shots=[]
 def save(label,ok,details=''):rows.append({'check':label,'pass':bool(ok),'detail':str(details)[:260]})
 cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable')
 cdp.call('Network.setCacheDisabled',{'cacheDisabled':True})
 for width in (390,1280):
  try:
   cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':width<=440})
   cdp.events.clear();url=origin+'start-project-v87.html'
   resp=cdp.call('Page.navigate',{'url':url},seconds=16)
   if resp.get('errorText'):raise BrowserError('navigation error '+resp['errorText'])
   deadline=time.monotonic()+18
   while time.monotonic()<deadline:
    if cdp.evaluate('document.readyState==="complete" && window.AFO_V87_INQUIRY_READY===true'):break
    time.sleep(.16)
   else:raise BrowserError('V87 client did not initialize')
   doc=[e.get('params',{}).get('response',{}) for e in cdp.events if e.get('method')=='Network.responseReceived' and e.get('params',{}).get('type')=='Document']
   status=[x.get('status') for x in doc if same_public_route(x.get('url',''),url)]
   save('public document HTTP 200 '+str(width),bool(status) and status[-1]==200,status)
   for k in SECTORS:
    for st in STYLES:
     expr=f'''(()=>{{const sector={json.dumps(k)},style={json.dumps(st)};
      const el=document.querySelector('#v87-industry');el.value=sector;el.dispatchEvent(new Event('change',{{bubbles:true}}));
      document.querySelector('[data-style="'+style+'"]').click();
      const f=document.querySelectorAll('.feature-item input');f[0].click();
      const single=document.querySelector('#v87-feature-summary').textContent;
      document.querySelector('#v87-select-all').click();
      const all=document.querySelector('#v87-feature-summary').textContent;
      const report=document.querySelector('#v87-report').textContent;
      document.querySelector('#v87-clear-all').click();
      return {{chosen:el.value,style:document.querySelector('[data-style="'+style+'"]').getAttribute('aria-pressed'),
        count:f.length,planned:document.querySelectorAll('.feature-item.is-planned').length,
        selected1:single,selected8:all,selected0:document.querySelector('#v87-feature-summary').textContent,
        reportHasPlanned:report.includes('현재 미구현'),
        demo:document.querySelector('#v87-demo').href,
        mail:document.querySelector('#v87-email').href,
        width:document.documentElement.scrollWidth,viewport:innerWidth}}}})()'''
     result=cdp.evaluate(expr);tag=f'{width}/{k}/{st}'
     save('industry, style and 8 function catalog '+tag,result['chosen']==k and result['style']=='true' and result['count']==8 and result['planned']==1,result)
     save('1→8→0 click and honest unbuilt marker '+tag,'1/8' in result['selected1'] and '8/8' in result['selected8'] and '0/8' in result['selected0'] and result['reportHasPlanned'],result)
     save('real demo selection URL + mailto draft '+tag,('industry='+k+'&style='+st) in result['demo'] and result['mail'].startswith('mailto:nineeyes@naver.com?'),result)
     save('mobile/desktop no horizontal overflow '+tag,result['width']<=result['viewport']+3,str(result['width'])+' / '+str(result['viewport']))
   # End-to-end sample: real typed text -> client-only report, note not in URL
   evidence=cdp.evaluate('''(()=>{const el=document.querySelector('#v87-notes');el.value='샘플 제품 문의 흐름을 설계';el.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-confirm]').click();return {report:document.querySelector('#v87-report').textContent, href:location.href, mail:document.querySelector('#v87-email').href, confirmed:document.querySelector('#v87-confirm-status').textContent}})()''')
   save('scope summary text and no customer notes in URL '+str(width),'샘플 제품 문의 흐름' in evidence['report'] and '샘플 제품' not in evidence['href'] and '1개 확인' in evidence['confirmed'],{'confirmed':evidence['confirmed'],'request_contents_verified':True})
   if screenshots:
    cdp.evaluate('document.querySelector(".finish").scrollIntoView({block:"start",behavior:"instant"})');time.sleep(.22)
    data=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False}).get('data')
    if data:
     p=out/('V87_PUBLIC_EDGE_390.png' if width==390 else 'V87_PUBLIC_EDGE_1280.png')
     p.write_bytes(base64.b64decode(data));shots.append(p.name)
  except Exception as e:save('V87 browser setup/check '+str(width),False,type(e).__name__+': '+str(e))
 return rows,shots

def report(out,origin,rows,shots):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 n=sum(x['pass'] for x in rows);total=len(rows);expected=2*(1+len(SECTORS)*len(STYLES)*4+1)
 state='PASS_V87_PUBLIC_WINDOWS_EDGE_INTERACTIONS_ONLY' if total==expected and n==total else 'HOLD_V87_WINDOWS_EDGE'
 obj={'version':'V87','origin':origin,'status':state,'passed':n,'total':total,'expected':expected,'rows':rows,
      'screenshots':shots,'time_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
      'actual_customer_email_received':'NOT_VERIFIED','actual_contract':'NOT_VERIFIED','paid_api_calls':0}
 j=out/'AFO_V87_WINDOWS_EDGE.json';t=out/'AFO_V87_WINDOWS_EDGE_KO.txt'
 j.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n','utf8')
 t.write_text('\n'.join(['올파일원 웹스튜디오 V87 실제 공개 Windows Edge 테스트',
  '대상: '+origin,'결과: '+state,f'통과: {n}/{total}','실메일 수신·납품·결제 검증이 아닙니다.','']+
  [x['check']+' | '+x['detail'] for x in rows if not x['pass']])+'\n','utf-8-sig')
 z=out/'AFO_V87_WINDOWS_EDGE_EVIDENCE.zip'
 with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as arc:
  for p in [j,t]+[out/n for n in shots]:arc.write(p,p.name)
 with zipfile.ZipFile(z) as arc:
  if arc.testzip():raise RuntimeError('CRC error')
 (out/'AFO_V87_WINDOWS_EDGE_EVIDENCE.sha256').write_text(hashlib.sha256(z.read_bytes()).hexdigest()+'  '+z.name+'\n','ascii')
 return obj

def main(argv=None):
 p=argparse.ArgumentParser();p.add_argument('--origin',choices=ALLOWED_ORIGINS,default=PRODUCTION_ORIGIN)
 p.add_argument('--output',type=Path,required=True);p.add_argument('--browser',default='');p.add_argument('--no-screenshots',action='store_true');a=p.parse_args(argv)
 rows=[];shots=[]
 try:
  binary=find_browser(a.browser)
  with tempfile.TemporaryDirectory(prefix='AFO_V87_PUBLIC_EDGE_') as d:
   proc=log=cdp=None
   try:
    proc,log,cdp=launch_cdp(binary,d);rows,shots=test(cdp,a.output,a.origin,not a.no_screenshots)
   finally:
    if cdp:cdp.close()
    if proc:
     proc.terminate()
     try:proc.wait(timeout=4)
     except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=3)
    if log:log.close()
 except Exception as e:rows.append({'check':'browser setup','pass':False,'detail':str(e)[:300]})
 r=report(a.output,a.origin,rows,shots);print(r['status'],str(r['passed'])+'/'+str(r['total']))
 return 0 if r['status']=='PASS_V87_PUBLIC_WINDOWS_EDGE_INTERACTIONS_ONLY' else 3
if __name__=='__main__':sys.exit(main())
