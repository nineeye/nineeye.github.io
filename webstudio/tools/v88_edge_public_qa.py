#!/usr/bin/env python3
"""V88 real Windows Edge public HTTPS browser checks, no outgoing mail or clipboard export."""
from __future__ import annotations
import argparse,base64,datetime as dt,hashlib,json,subprocess,sys,tempfile,time,zipfile
from pathlib import Path
from v65_edge_live_qa import find_browser,launch_cdp,BrowserError,same_public_route
from v85_public_probe import ALLOWED_ORIGINS,PRODUCTION_ORIGIN

def run(cdp,origin,out):
 cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable');cdp.call('Network.setCacheDisabled',{'cacheDisabled':True})
 rows=[];shots=[]
 def mark(label,pred,info=''):rows.append({'name':label,'pass':bool(pred),'detail':str(info)[:210]})
 def nav(page,width,check_ready):
  cdp.events.clear();url=origin+page
  r=cdp.call('Page.navigate',{'url':url},seconds=15)
  if r.get('errorText'):raise BrowserError(r['errorText'])
  until=time.monotonic()+18
  while time.monotonic()<until:
   if cdp.evaluate('document.readyState==="complete" && '+check_ready):break
   time.sleep(.2)
  else:raise BrowserError('V88 ready script not executed '+page)
  responses=[e.get('params',{}).get('response',{}) for e in cdp.events if e.get('method')=='Network.responseReceived' and e.get('params',{}).get('type')=='Document']
  exact=[x.get('status') for x in responses if same_public_route(x.get('url',''),url)]
  mark('HTTP 200 exact origin '+page+'/'+str(width),bool(exact) and exact[-1]==200,exact)
 for width in (390,1280):
  try:
   cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':width<=440})
   nav('launch-readiness-v88.html',width,'window.AFO_V88_LAUNCH_READY===true')
   obj=cdp.evaluate('''(()=>{const n=document.querySelectorAll('[data-v88-check]').length;const initial=document.getElementById('v88-count').textContent;const all=[...document.querySelectorAll('[data-v88-check]')];all[0].click();let one=document.getElementById('v88-count').textContent;document.getElementById('v88-clear').click();return {n,initial,one,reset:document.getElementById('v88-count').textContent,report:window.AFO_V88_LAUNCH_REPORT(),width:document.documentElement.scrollWidth,outer:innerWidth}})()''')
   mark('30 owner checks start unverified '+str(width),obj['n']==30 and '0 / 30' in obj['initial'],obj)
   mark('operator manually 1 then reset 0 '+str(width),'1 / 30' in obj['one'] and '0 / 30' in obj['reset'],obj)
   mark('owner report stays HOLD '+str(width),'판매 준비 HOLD' in obj['report'] and '고객 납품' in obj['report'],obj['report'][:80])
   mark('owner no horizontal overflow '+str(width),obj['width']<=obj['outer']+3,str(obj['width']))
   nav('start-project-v87.html',width,'window.AFO_V88_MANUAL_MAIL_READY===true && window.AFO_V87_INQUIRY_READY===true')
   # Mock clipboard directly in isolated browser test; prevents any external OS access
   result=cdp.evaluate('''(async()=>{let copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(s)=>{copied=s;return Promise.resolve()}}});
    document.querySelector('#v87-industry').value='clinic';document.querySelector('#v87-industry').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-style=premium]').click();
    const to=document.querySelector('#v88-copy-to'),subject=document.querySelector('#v88-copy-subject'),body=document.querySelector('#v88-copy-body');
    to.click();await new Promise(r=>setTimeout(r,0));const dest=copied;subject.click();await new Promise(r=>setTimeout(r,0));const sub=copied;body.click();await new Promise(r=>setTimeout(r,0));const msg=copied;
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('blocked'))}});body.click();await new Promise(r=>setTimeout(r,0));
    return {dest,sub,msg,manualVisible:!document.querySelector('#v88-manual-wrap').hidden,manualText:document.querySelector('#v88-manual-text').value,
    unsent:document.querySelector('#v88-copy-status').textContent,report:document.querySelector('#v87-report').textContent,
    width:document.documentElement.scrollWidth,outer:innerWidth,mailer:document.querySelector('#v87-email').getAttribute('href')};})()''')
   mark('V88 recipient copied '+str(width),result['dest']=='nineeyes@naver.com',result['dest'])
   mark('V88 selected clinic subject '+str(width),'병원' in result['sub'] or '의원' in result['sub'],result['sub'])
   mark('V88 selected clinic body '+str(width),'프리미엄' in result['msg'] and '메일 앱에서 직접 발송' in result['msg'],result['msg'][:150])
   mark('blocked clipboard manual fallback '+str(width),result['manualVisible'] and len(result['manualText'])>50,result['manualText'][:70])
   mark('no fictional mail receipt '+str(width),'미발송' in result['unsent'] and result['mailer'].startswith('mailto:nineeyes@naver.com?'),result['unsent'])
   mark('buyer no horizontal overflow '+str(width),result['width']<=result['outer']+3,str(result['width']))
   cdp.evaluate('document.querySelector(".v88-fallback").scrollIntoView({block:"start",behavior:"instant"})');time.sleep(.2)
   img=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False},seconds=12).get('data','')
   if img:
    p=Path(out)/('V88_LIVE_EDGE_BUYER_390.png' if width==390 else 'V88_LIVE_EDGE_BUYER_1280.png');p.write_bytes(base64.b64decode(img));shots.append(p.name)
  except Exception as e:mark('V88 real Edge public '+str(width),False,str(e))
 return rows,shots

def report(out,origin,rows,shots):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 passed=sum(x['pass'] for x in rows);expect=2*12
 state='PASS_V88_PUBLIC_EDGE_BROWSING_ONLY' if passed==len(rows)==expect else 'HOLD_V88_PUBLIC_EDGE'
 r={'version':'V88','status':state,'origin':origin,'pass':passed,'total':len(rows),'expected':expect,'rows':rows,'screenshots':shots,'actual_email_sent':'NOT_VERIFIED','actual_email_received':'NOT_VERIFIED','customer_contract':'NOT_VERIFIED','paid_api_calls':0,'checked_utc':dt.datetime.now(dt.timezone.utc).isoformat()}
 jf=out/'AFO_V88_WINDOWS_EDGE.json';tf=out/'AFO_V88_WINDOWS_EDGE_KO.txt';jf.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf-8');tf.write_text('\n'.join(['V88 실제 공개 Windows Edge 검증',state,origin,f"{passed}/{len(rows)}",'메일 실송수신/계약/실제 납품 증명 아님.']+[x['name']+' : '+x['detail'] for x in rows if not x['pass']])+'\n','utf-8-sig')
 with zipfile.ZipFile(out/'AFO_V88_WINDOWS_EDGE_EVIDENCE.zip','w',zipfile.ZIP_DEFLATED) as z:
  for f in [jf,tf]+[out/n for n in shots]:z.write(f,f.name)
 with zipfile.ZipFile(out/'AFO_V88_WINDOWS_EDGE_EVIDENCE.zip') as z:
  if z.testzip():raise RuntimeError('CRC fail')
 return r

def main():
 p=argparse.ArgumentParser();p.add_argument('--origin',choices=ALLOWED_ORIGINS,default=PRODUCTION_ORIGIN);p.add_argument('--output',type=Path,required=True);p.add_argument('--browser',default='');a=p.parse_args();rows=[];shots=[];a.output.mkdir(parents=True,exist_ok=True)
 try:
  browser=find_browser(a.browser)
  with tempfile.TemporaryDirectory(prefix='AFO_V88_EDGE_') as tmp:
   proc=log=cdp=None
   try:proc,log,cdp=launch_cdp(browser,tmp);rows,shots=run(cdp,a.origin,a.output)
   finally:
    if cdp:cdp.close()
    if proc:
     proc.terminate()
     try:proc.wait(timeout=4)
     except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=3)
    if log:log.close()
 except Exception as e:rows.append({'name':'Windows Edge launch','pass':False,'detail':str(e)[:300]})
 r=report(a.output,a.origin,rows,shots);print(r['status'],str(r['pass'])+'/'+str(r['total']));return 0 if r['status']=='PASS_V88_PUBLIC_EDGE_BROWSING_ONLY' else 3
if __name__=='__main__':sys.exit(main())
