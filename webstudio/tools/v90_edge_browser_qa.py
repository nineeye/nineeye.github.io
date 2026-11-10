#!/usr/bin/env python3
"""V90 actual public Windows Edge via Chrome DevTools. Read-only, no customer data."""
from __future__ import annotations
import argparse,base64,datetime,hashlib,json,sys,tempfile,time,zipfile
from pathlib import Path
from urllib.parse import urlsplit
from v65_edge_live_qa import find_browser,launch_cdp,BrowserError
from v90_public_probe import ALLOWED,norm
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
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
   cdp.events.clear();url=origin.rstrip('/')+'/project-process-v90.html';x=cdp.call('Page.navigate',{'url':url},seconds=18)
   if x.get('errorText'):raise BrowserError('navigation: '+x['errorText'])
   until=time.monotonic()+17
   while time.monotonic()<until:
    if cdp.evaluate('document.readyState==="complete"&&window.AFO_V90_PROCESS_READY===true'):break
    time.sleep(.16)
   else:raise BrowserError('V90 real public interactive page NOT_READY')
   observed=cdp.evaluate('({url:location.href,v:document.body.dataset.v90,nav:document.querySelectorAll("header nav a").length,steps:document.querySelectorAll(".step").length,items:document.querySelectorAll("input[data-v90-key]").length,packs:document.querySelectorAll(".package-grid article").length,w:document.documentElement.scrollWidth})')
   responses=[e.get('params',{}).get('response',{}) for e in cdp.events if e.get('method')=='Network.responseReceived' and e.get('params',{}).get('type')=='Document']
   status=[r.get('status') for r in responses if same(r.get('url',''),url)]
   ck(f'{width}/exact-public-HTTP',status and status[-1]==200,status)
   ck(f'{width}/exact-origin-route',same(observed['url'],url),observed['url'])
   ck(f'{width}/release-marker',observed['v']=='WEBSTUDIO-V90-20261110',observed['v'])
   ck(f'{width}/nav4-steps6-packs3-check10',observed['nav']==4 and observed['steps']==6 and observed['packs']==3 and observed['items']==10,observed)
   ck(f'{width}/no-overflow',observed['w']<=width+3,observed['w'])
   for sector in SECTORS:
    script=f'''(()=>{{const el=document.getElementById('v90-sector');el.value={json.dumps(sector)};el.dispatchEvent(new Event('change',{{bubbles:true}}));const c=document.querySelector('input[data-v90-key]');c.checked=true;c.dispatchEvent(new Event('change',{{bubbles:true}}));return {{v:el.value,url:document.getElementById('v90-request').getAttribute('href'),score:document.getElementById('v90-count').textContent,aria:document.getElementById('v90-progress').getAttribute('aria-valuenow'),w:document.documentElement.scrollWidth}};}})()'''
    r=cdp.evaluate(script)
    ck(f'{width}/{sector}/buyer-safe-handoff',r['v']==sector and r['url']==f'./start-project-v87.html?industry={sector}',r)
    ck(f'{width}/{sector}/interactive-score',r['score']=='1' and r['aria']=='1',r)
    r=cdp.evaluate('''(()=>{document.getElementById('v90-reset').click();return {score:document.getElementById('v90-count').textContent,checked:document.querySelectorAll('input[data-v90-key]:checked').length,body:document.documentElement.scrollWidth}})()''')
    ck(f'{width}/{sector}/reset',r['score']=='0' and r['checked']==0,r)
    ck(f'{width}/{sector}/layout',r['body']<=width+3,r['body'])
   r=cdp.evaluate('''(()=>{document.querySelectorAll('input[data-v90-key]').forEach(x=>{x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}))});return {score:document.getElementById('v90-count').textContent,aria:document.getElementById('v90-progress').getAttribute('aria-valuenow'),ready:window.AFO_V90_PROCESS_READY}})()''')
   ck(f'{width}/all-10-interaction',r['score']=='10' and r['aria']=='10' and r['ready'] is True,r)
   ck(f'{width}/actual-no-network-form',bool(cdp.evaluate('!document.querySelector("input[type=email],input[type=tel],form[action]")')))
   if screens:
    cdp.evaluate('window.scrollTo({top:0,behavior:"instant"})');time.sleep(.25)
    img=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False},seconds=16).get('data','')
    if img:
     name='V90_LIVE_PC_1280.png' if width==1280 else 'V90_LIVE_MOBILE_390.png';(out/name).write_bytes(base64.b64decode(img));shots.append(name)
  except Exception as e:ck(f'{width}/public-browser-exception',False,str(e))
 return rows,shots
def main(argv=None):
 p=argparse.ArgumentParser();p.add_argument('--origin',choices=ALLOWED,default=ALLOWED[0]);p.add_argument('--output',type=Path,required=True);p.add_argument('--browser',default='');p.add_argument('--no-screenshots',action='store_true');a=p.parse_args(argv)
 a.output.mkdir(parents=True,exist_ok=True);rows=[];shots=[]
 try:
  with tempfile.TemporaryDirectory(prefix='AFO_V90_EDGE_') as tmp:
   binary=find_browser(a.browser);proc=None;log=None;cdp=None
   try:proc,log,cdp=launch_cdp(binary,tmp);rows,shots=run(cdp,a.origin,a.output,not a.no_screenshots)
   finally:
    if cdp:cdp.close()
    if proc:
     proc.terminate()
     try:proc.wait(timeout=4)
     except Exception:proc.kill();proc.wait(timeout=3)
    if log:log.close()
 except Exception as e:rows.append({'check':'browser preflight','pass':False,'detail':str(e)[:250]})
 total=len(rows);passed=sum(x['pass'] for x in rows);status='PASS_V90_PUBLIC_EDGE_ONLY' if total and total==passed else 'HOLD_V90_PUBLIC_EDGE'
 r={'version':'V90','scope':'REAL_PUBLIC_WINDOWS_EDGE_BROWSING_INTERACTION_ONLY','origin':a.origin,'status':status,'passed':passed,'total':total,'checks':rows,'screenshots':shots,'customer_email_received':'NOT_VERIFIED','customer_contract_signed':'NOT_VERIFIED','personal_windows_pc':'NOT_TESTED','paid_api':0,'utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 j=a.output/'V90_EDGE.json';t=a.output/'V90_EDGE_KO.txt';j.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf-8');t.write_text('V90 공개 Windows Edge 점검\n'+a.origin+'\n'+status+f' {passed}/{total}\n'+'고객 메일 수신·계약·개인 PC 검증 아님\n'+'\n'.join(x['check']+' HOLD '+x['detail'] for x in rows if not x['pass'])+'\n','utf-8-sig')
 z=a.output/'V90_EDGE_EVIDENCE.zip';files=[j,t]+[a.output/n for n in shots]
 with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as f:
  for file in files:f.write(file,file.name)
 with zipfile.ZipFile(z) as f:
  if f.testzip():raise RuntimeError('evidence CRC failed')
 (a.output/(z.name+'.sha256')).write_text(hashlib.sha256(z.read_bytes()).hexdigest()+'  '+z.name+'\n','ascii')
 print(status,f'{passed}/{total}');return 0 if status=='PASS_V90_PUBLIC_EDGE_ONLY' else 3
if __name__=='__main__':raise SystemExit(main())
