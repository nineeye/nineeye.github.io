#!/usr/bin/env python3
"""V89 public Windows Edge Chrome DevTools smoke, no customer transactions.
Runs on standard GitHub-hosted Windows Edge. Python stdlib and legacy v65 CDP helper only.
"""
from __future__ import annotations
import argparse,base64,datetime,hashlib,json,sys,tempfile,time,zipfile
from pathlib import Path
from urllib.parse import urlsplit
from v65_edge_live_qa import CDP,BrowserError,find_browser,launch_cdp
from v89_public_probe import ALLOWED
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')

def route_same(a,b):
 x,y=urlsplit(a),urlsplit(b)
 def norm(s):
  p=s or '/'
  if p.endswith('/index.html'):p=p[:-10]
  elif p.endswith('.html'):p=p[:-5]
  return p.rstrip('/') or '/'
 return (x.scheme,x.netloc,norm(x.path))==(y.scheme,y.netloc,norm(y.path))

def run(cdp,origin,out,screens=True):
 cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable')
 cdp.call('Network.setCacheDisabled',{'cacheDisabled':True})
 results=[];shots=[]
 def ck(label,pass_,detail=''):
  results.append({'check':label,'pass':bool(pass_),'detail':str(detail)[:220]})
 for width in (1280,390):
  try:
   cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':860,'deviceScaleFactor':1,'mobile':width<500})
   cdp.events.clear()
   url=origin.rstrip('/')+'/index.html';nav=cdp.call('Page.navigate',{'url':url},seconds=17)
   if nav.get('errorText'):raise BrowserError('navigation failure: '+nav['errorText'])
   until=time.monotonic()+18
   while time.monotonic()<until:
    if cdp.evaluate('document.readyState==="complete" && window.AFO_V89_HOME_READY===true'):break
    time.sleep(.14)
   else:raise BrowserError('V89 DOM not ready')
   doc=cdp.evaluate('({url:location.href,heading:document.querySelector("h1")?.textContent||"",meta:document.querySelector("meta[name=site-current-version]")?.content||"",nav:document.querySelectorAll("nav.nav a").length,sections:document.querySelectorAll("main section").length,body:document.documentElement.scrollWidth,view:innerWidth,imgs:[...document.querySelectorAll(".sample-image img")].map(x=>({ok:x.complete&&x.naturalWidth>0,w:x.naturalWidth}))})')
   response=[e['params']['response'] for e in cdp.events if e.get('method')=='Network.responseReceived' and e.get('params',{}).get('type')=='Document']
   matching=[res for res in response if route_same(res.get('url',''),url)]
   status=matching[-1].get('status') if matching else None
   ck(f'{width}/public-http-200',status==200,status)
   ck(f'{width}/exact-origin-route',route_same(doc['url'].split('?',1)[0],url),doc['url'])
   ck(f'{width}/release-marker',doc['meta']=='WEBSTUDIO-V89-20261110',doc['meta'])
   ck(f'{width}/homepage-h1',('홈페이지' in doc['heading'] and len(doc['heading'])>12),doc['heading'])
   ck(f'{width}/4-menu-6-sections',doc['nav']==4 and doc['sections']==6,f"{doc['nav']}/{doc['sections']}")
   ck(f'{width}/no-overflow',doc['body']<=doc['view']+3,f"{doc['body']}/{doc['view']}")
   ck(f'{width}/3-images-real-body',len(doc['imgs'])==3 and all(x['ok'] for x in doc['imgs']),doc['imgs'])
   for sector in SECTORS:
    code=f'''(()=>{{const e=document.getElementById('v89-sector');e.value={json.dumps(sector)};e.dispatchEvent(new Event('change',{{bubbles:true}}));return {{v:e.value,head:document.getElementById('v89-sector-head').textContent,demo:document.getElementById('v89-sector-demo').getAttribute('href'),guide:document.getElementById('v89-sector-guide').getAttribute('href'),w:document.documentElement.scrollWidth}};}})()'''
    v=cdp.evaluate(code)
    ck(f'{width}/{sector}/select',v['v']==sector and bool(v['head']))
    ck(f'{width}/{sector}/links',v['demo']==f'./experience-v85.html?industry={sector}' and v['guide']==f'./industry-guide/{sector}.html',str(v))
    ck(f'{width}/{sector}/no-overflow',v['w']<=width+3,str(v['w']))
   if screens:
    cdp.evaluate('document.getElementById("v89-sector").value="manufacturing"')
    data=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False},seconds=16).get('data','')
    if data:
     name='V89_LIVE_PC_1280.png' if width==1280 else 'V89_LIVE_MOBILE_390.png'
     (out/name).write_bytes(base64.b64decode(data));shots.append(name)
  except Exception as e:ck(f'{width}/browser-exception',False,str(e))
 return results,shots

def main(argv=None):
 p=argparse.ArgumentParser();p.add_argument('--origin',choices=ALLOWED,default=ALLOWED[0]);p.add_argument('--output',required=True,type=Path);p.add_argument('--browser',default='');p.add_argument('--no-screenshots',action='store_true');a=p.parse_args(argv)
 a.output.mkdir(parents=True,exist_ok=True)
 records=[];shots=[]
 try:
  binary=find_browser(a.browser)
  with tempfile.TemporaryDirectory(prefix='AFO_V89_BROWSER_') as tmp:
   proc=None;log=None;cdp=None
   try:
    proc,log,cdp=launch_cdp(binary,tmp)
    records,shots=run(cdp,a.origin,a.output,not a.no_screenshots)
   finally:
    if cdp:cdp.close()
    if proc:
     proc.terminate()
     try:proc.wait(timeout=3)
     except Exception:proc.kill();proc.wait(timeout=3)
    if log:log.close()
 except Exception as e:records.append({'check':'browser-preflight','pass':False,'detail':str(e)[:350]})
 total=len(records);passed=sum(x['pass'] for x in records)
 report={'scope':'V89_REAL_PUBLIC_EDGE_BROWSER_NAV_SELECT_IMAGES_ONLY','origin':a.origin,'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'status':'PASS_V89_PUBLIC_EDGE' if total and passed==total else 'HOLD_V89_EDGE','passed':passed,'total':total,'checks':records,'screenshots':shots,
 'email_received':'NOT_VERIFIED','custom_domain_bound':'NOT_VERIFIED','actual_payments':'NOT_IMPLEMENTED','paid_api_calls':0}
 j=a.output/'V89_PUBLIC_EDGE.json';t=a.output/'V89_PUBLIC_EDGE_KO.txt';j.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
 t.write_text('올파일원 웹스튜디오 V89 실제 공용 Windows Edge QA\n'+'주소: '+a.origin+'\n결과: '+report['status']+'\n'+f'통과: {passed}/{total}\n'+'문의 메일 수신/결제/계약/사용자 개인 Windows PC 증명이 아님\n'+'\n'.join('PASS' if x['pass'] else 'HOLD '+x['check']+' '+str(x.get('detail')) for x in records)+'\n','utf-8-sig')
 z=a.output/'V89_WINDOWS_EDGE_EVIDENCE.zip';files=[j,t]+[a.output/n for n in shots]
 with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as f:
  for x in files:f.write(x,x.name)
 with zipfile.ZipFile(z) as f:
  if f.testzip():raise RuntimeError('corrupt proof ZIP')
 (a.output/'V89_WINDOWS_EDGE_EVIDENCE.zip.sha256').write_text(hashlib.sha256(z.read_bytes()).hexdigest()+'  '+z.name+'\n','ascii')
 print(report['status'],str(passed)+'/'+str(total));return 0 if report['status']=='PASS_V89_PUBLIC_EDGE' else 3
if __name__=='__main__':raise SystemExit(main())
