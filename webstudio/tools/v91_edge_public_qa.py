#!/usr/bin/env python3
"""True live V91 Windows Edge CDP screenshot and click smoke; no customer data, account or POST."""
from __future__ import annotations
import argparse,base64,datetime,hashlib,json,sys,tempfile,time,zipfile
from pathlib import Path
from urllib.parse import urlsplit
from v65_edge_live_qa import find_browser,launch_cdp,BrowserError
from v91_public_probe import ALLOWED,norm
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
STYLES=('modern','premium','editorial')
def same(got,want):
 a,b=urlsplit(got),urlsplit(want)
 return (a.scheme,a.netloc,norm(a.path))==(b.scheme,b.netloc,norm(b.path))
def run(cdp,origin,out,screens=True):
 rows=[];shots=[]
 def ck(n,ok,detail=''):rows.append({'check':n,'pass':bool(ok),'detail':str(detail)[:220]})
 cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable')
 cdp.call('Network.setCacheDisabled',{'cacheDisabled':True})
 for width in (1280,390):
  try:
   cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':width<500})
   cdp.events.clear();url=origin.rstrip('/')+'/quote-scope-v91.html'
   response=cdp.call('Page.navigate',{'url':url},seconds=18)
   if response.get('errorText'):raise BrowserError('navigation '+response['errorText'])
   until=time.monotonic()+18
   while time.monotonic()<until:
    if cdp.evaluate('document.readyState==="complete"&&window.AFO_V91_QUOTE_READY==="V91-20261110"'):break
    time.sleep(.2)
   else:raise BrowserError('V91 actual live page not ready')
   q=cdp.evaluate('({u:location.href,marker:document.body.dataset.v91,nav:document.querySelectorAll("header nav a").length,features:document.querySelectorAll("#v91-features input").length,industry:document.querySelectorAll("#v91-industry option").length,w:document.documentElement.scrollWidth})')
   documents=[e.get('params',{}).get('response',{}) for e in cdp.events if e.get('method')=='Network.responseReceived' and e.get('params',{}).get('type')=='Document']
   statuses=[e.get('status') for e in documents if same(e.get('url',''),url)]
   ck(f'{width}/HTTP-200',bool(statuses and statuses[-1]==200),statuses)
   ck(f'{width}/exact-route',same(q['u'],url),q['u'])
   ck(f'{width}/12-sectors-4nav-8features',q['marker']=='WEBSTUDIO-V91-20261110' and q['nav']==4 and q['features']==8 and q['industry']==12,q)
   ck(f'{width}/initial-no-horizontal-overflow',q['w']<=width+3,q['w'])
   for k in SECTORS:
    for style in STYLES:
     x=cdp.evaluate(f'''(()=>{{const sector={json.dumps(k)},style={json.dumps(style)};
       const i=document.querySelector('#v91-industry');i.value=sector;i.dispatchEvent(new Event('change',{{bubbles:true}}));
       const s=document.querySelector('#v91-style');s.value=style;s.dispatchEvent(new Event('change',{{bubbles:true}}));
       return {{sector:i.value,style:s.value,link:document.querySelector('#v91-demo').getAttribute('href'),
       mail:document.querySelector('#v91-mail').getAttribute('href'),len:document.querySelectorAll('#v91-summary dt').length,
       report:window.AFO_V91_DRAFT().slice(0,150),width:document.documentElement.scrollWidth}};}})()''')
     tag=f'{width}/{k}/{style}'
     ck(tag+'/selector-and-deep-link',x['sector']==k and x['style']==style and 'industry='+k in x['link'] and 'style='+style in x['link'],x['link'])
     ck(tag+'/safe-mailto',x['mail'].startswith('mailto:nineeyes@naver.com?subject='),x['mail'][:80])
     ck(tag+'/draft-not-contract',x['len']==14 and '합의 전 초안' in x['report'],x['report'])
     ck(tag+'/no-overflow',x['width']<=width+3,x['width'])
   v=cdp.evaluate('''(()=>{document.querySelector('#v91-pages').value='6';document.querySelector('#v91-pages').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#v91-cost').value='1200000';document.querySelector('#v91-cost').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#v91-features input[value=payment]').click();return {text:window.AFO_V91_DRAFT(),w:document.documentElement.scrollWidth}})()''')
   ck(f'{width}/price-is-proposal',('1,200,000원' in v['text']) and ('확정가 아님' in v['text']),v['text'][:100])
   ck(f'{width}/real-payment-integration-excluded','실제 결제 연동 (별도 구축)' in v['text'])
   ck(f'{width}/dynamic-no-overflow',v['w']<=width+3,v['w'])
   ck(f'{width}/no-POST-form',bool(cdp.evaluate('!document.querySelector("form[action],input[type=email],input[type=tel]")')))
   if screens:
    cdp.evaluate('window.scrollTo({top:0,behavior:"instant"})');time.sleep(.23)
    data=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False},seconds=15).get('data','')
    if data:
     f=out/('V91_PUBLIC_PC_1280.png' if width==1280 else 'V91_PUBLIC_MOBILE_390.png');f.write_bytes(base64.b64decode(data));shots.append(f.name)
  except Exception as e:ck(f'{width}/real-browser-exception',False,str(e))
 return rows,shots
def main(argv=None):
 p=argparse.ArgumentParser();p.add_argument('--origin',choices=ALLOWED,default=ALLOWED[0]);p.add_argument('--output',type=Path,required=True);p.add_argument('--browser',default='');p.add_argument('--no-screenshots',action='store_true');a=p.parse_args(argv)
 a.output.mkdir(parents=True,exist_ok=True);rows=[];shots=[]
 try:
  with tempfile.TemporaryDirectory(prefix='AFO_V91_EDGE_') as temp:
   binary=find_browser(a.browser);proc=None;log=None;cdp=None
   try:proc,log,cdp=launch_cdp(binary,temp);rows,shots=run(cdp,a.origin,a.output,not a.no_screenshots)
   finally:
    if cdp:cdp.close()
    if proc:
     proc.terminate()
     try:proc.wait(timeout=4)
     except Exception:proc.kill();proc.wait(timeout=3)
    if log:log.close()
 except Exception as e:rows.append({'check':'browser-preflight','pass':False,'detail':str(e)[:280]})
 total=len(rows);passed=sum(x['pass'] for x in rows);status='PASS_V91_PUBLIC_EDGE_ONLY' if total and total==passed else 'HOLD_V91_PUBLIC_EDGE'
 r={'release':'V91','scope':'REAL_PUBLIC_WINDOWS_EDGE_BROWSING_ONLY','origin':a.origin,'status':status,'passed':passed,'total':total,'rows':rows,'screenshots':shots,'owner_Naver_mail_receipt':'NOT_VERIFIED','signed_sales':'NOT_VERIFIED','personal_PC':'NOT_TESTED','paid_api':0,'utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 j=a.output/'V91_EDGE.json';t=a.output/'V91_EDGE_KO.txt';j.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf-8');t.write_text('V91 공개 Windows Edge 실제 시연 검사\n'+a.origin+'\n'+status+f' {passed}/{total}\n고객 메일 수신·계약·사용자 PC 실제 동작을 증명하지 않음\n'+'\n'.join(x['check']+' HOLD '+x['detail'] for x in rows if not x['pass'])+'\n','utf-8-sig')
 archive=a.output/'V91_EDGE_EVIDENCE.zip';with_files=[j,t]+[a.output/x for x in shots]
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
  for f in with_files:z.write(f,f.name)
 with zipfile.ZipFile(archive) as z:
  if z.testzip():raise RuntimeError('V91 evidence CRC fail')
 (a.output/(archive.name+'.sha256')).write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n','ascii')
 print(status,f'{passed}/{total}');return 0 if status=='PASS_V91_PUBLIC_EDGE_ONLY' else 3
if __name__=='__main__':raise SystemExit(main())
