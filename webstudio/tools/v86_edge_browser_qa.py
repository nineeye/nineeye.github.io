#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V86 Windows Edge real-public PC/mobile guide smoke. No POST, customer data or paid API."""
from __future__ import annotations
import argparse, base64, datetime as dt, hashlib, json, subprocess, sys, tempfile, time, zipfile
from pathlib import Path
from v65_edge_live_qa import BrowserError,find_browser,launch_cdp,same_public_route
from v85_public_probe import ALLOWED_ORIGINS,PRODUCTION_ORIGIN
from v86_public_probe import SECTORS


def test(cdp,out,origin,screenshot=True):
 out=Path(out)
 out.mkdir(parents=True,exist_ok=True)  # Screenshot capture occurs before report writing.
 checks=[];screens=[]
 def save(name,passed,details=''):
  checks.append({'name':name,'pass':bool(passed),'detail':str(details)[:240]})
 cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable')
 cdp.call('Network.setCacheDisabled',{'cacheDisabled':True})
 for width in (390,1280):
  cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':880,'deviceScaleFactor':1,'mobile':width<=440})
  for sector in SECTORS:
   path='industry-guide/'+sector+'.html';url=origin+path
   try:
    cdp.events.clear()
    response=cdp.call('Page.navigate',{'url':url},seconds=16)
    if response.get('errorText'):raise BrowserError('navigation: '+response['errorText'])
    limit=time.monotonic()+13
    while time.monotonic()<limit:
     if cdp.evaluate('document.readyState==="complete" && window.AFO_V86_GUIDE_READY===true'):break
     time.sleep(.16)
    else:raise BrowserError('V86 script or DOM failed to initialize')
    documents=[ev.get('params',{}).get('response',{}) for ev in cdp.events
               if ev.get('method')=='Network.responseReceived' and ev.get('params',{}).get('type')=='Document']
    status=[r['status'] for r in documents if same_public_route(r.get('url',''),url)]
    save('public document HTTP 200 '+str(width)+'/'+sector, status and status[-1]==200,str(status))
    expr='''(()=>{const s=document.body.dataset.v86Industry;
      return {sector:s,goals:document.querySelectorAll('[data-v86-goal]').length,
        cards:document.querySelectorAll('[data-v86-feature]').length,
        planned:document.querySelectorAll('.feature.unbuilt').length,
        styles:document.querySelectorAll('[data-v86-style]').length,
        width:document.documentElement.scrollWidth,viewport:innerWidth}})()'''
    r=cdp.evaluate(expr)
    save('12업종·3목표·7/1·3디자인 '+str(width)+'/'+sector,
       r['sector']==sector and r['goals']==3 and r['cards']==7 and r['planned']==1 and r['styles']==3,r)
    save('PC/모바일 가로 넘침 없음 '+str(width)+'/'+sector,r['width']<=r['viewport']+3,str(r['width']))
    z=cdp.evaluate('''(()=>{document.querySelectorAll('[data-v86-goal]')[1].click();
      document.querySelector('[data-v86-style="premium"]').click();
      document.querySelector('[data-v86-check]').click();
      return {goal:document.querySelectorAll('[data-v86-goal][aria-pressed=true]').length,
        highlight:document.querySelectorAll('[data-v86-feature].is-highlight').length,
        style:document.querySelector('[data-v86-style="premium"]').getAttribute('aria-pressed'),
        target:document.getElementById('v86-to-scope').href,
        checklist:document.getElementById('v86-readiness-status').textContent.trim()};})()''')
    save('실제 목표·디자인·체크 클릭 '+str(width)+'/'+sector,
       z['goal']==1 and z['highlight']==3 and z['style']=='true' and
       'industry='+sector in z['target'] and 'style=premium' in z['target'] and '1/4' in z['checklist'],z)
    if screenshot and sector in ('manufacturing','clinic','commerce'):
     data=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False}).get('data')
     if data:
      file=out/('V86_EDGE_'+sector+'_'+str(width)+'.png')
      file.write_bytes(base64.b64decode(data));screens.append(file.name)
   except Exception as exc:
    save('V86 browser navigation '+str(width)+'/'+sector,False,type(exc).__name__+': '+str(exc))
 return checks,screens


def write_report(out,origin,rows,screens):
 out.mkdir(parents=True,exist_ok=True)
 passed=sum(x['pass'] for x in rows)
 ok=len(rows)==2*len(SECTORS)*4 and passed==len(rows)
 report={'product':'AllFileOne WebStudio','version':'V86','origin':origin,
         'status':'PASS_V86_REAL_PUBLIC_EDGE_INTERACTION_ONLY' if ok else 'HOLD_V86_PUBLIC_BROWSER',
         'passed':passed,'total':len(rows),'screenshots':screens,'checks':rows,
         'timestamp_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
         'real_customer_email_received':'NOT_VERIFIED','booking_and_payment':'NOT_IMPLEMENTED','paid_api_count':0}
 path=out/'AFO_V86_REAL_EDGE.json';txt=out/'AFO_V86_REAL_EDGE_KO.txt'
 path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
 lines=['올파일원 웹스튜디오 V86 실제 Windows Edge 공개 브라우저 체험','검증 원점: '+origin,
        '상태: '+report['status'],f"통과: {passed}/{len(rows)}",
        '고객 실메일 수신·예약·결제 확인이 아닙니다.','']
 lines += [x['name']+' / '+x['detail'] for x in rows if not x['pass']]
 txt.write_text('\n'.join(lines)+'\n','utf-8-sig')
 arc=out/'AFO_V86_REAL_EDGE_EVIDENCE.zip'
 with zipfile.ZipFile(arc,'w',zipfile.ZIP_DEFLATED) as z:
  for f in [path,txt]+[out/n for n in screens]:z.write(f,f.name)
 with zipfile.ZipFile(arc) as z:
  if z.testzip():raise RuntimeError('ZIP CRC failed')
 (out/'AFO_V86_REAL_EDGE_EVIDENCE.sha256').write_text(hashlib.sha256(arc.read_bytes()).hexdigest()+'  '+arc.name+'\n','ascii')
 return report


def main(argv=None):
 p=argparse.ArgumentParser(description='V86 standard Windows Edge CDP checks, read-only')
 p.add_argument('--origin',choices=ALLOWED_ORIGINS,default=PRODUCTION_ORIGIN)
 p.add_argument('--output',required=True,type=Path)
 p.add_argument('--browser',default='')
 p.add_argument('--no-screenshots',action='store_true')
 args=p.parse_args(argv)
 rows=[];screens=[];out=args.output
 try:
  browser=find_browser(args.browser)
  with tempfile.TemporaryDirectory(prefix='AFO_V86_EDGE_') as td:
   process=log=cdp=None
   try:
    process,log,cdp=launch_cdp(browser,td)
    rows,screens=test(cdp,out,args.origin,not args.no_screenshots)
   finally:
    if cdp:cdp.close()
    if process:
     process.terminate()
     try:process.wait(timeout=3)
     except subprocess.TimeoutExpired:process.kill();process.wait(timeout=3)
    if log:log.close()
 except Exception as exc:rows.append({'name':'V86 Edge startup','pass':False,'detail':str(exc)[:300]})
 r=write_report(out,args.origin,rows,screens)
 print(r['status'],str(r['passed'])+'/'+str(r['total']))
 return 0 if r['status']=='PASS_V86_REAL_PUBLIC_EDGE_INTERACTION_ONLY' else 3
if __name__=='__main__':sys.exit(main())
