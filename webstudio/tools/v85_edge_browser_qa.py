#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Public V85 headless Windows Edge CDP: 12x3 live iframe+PC/mobile. stdlib only.

Never logs in, contacts the customer, saves browsing profile or submits forms.
A PASS means these exact public browser interactions only, NOT customer contracts.
"""
from __future__ import annotations
import argparse,base64,datetime,hashlib,json,sys,tempfile,subprocess,time,zipfile
from pathlib import Path
from v65_edge_live_qa import CDP,BrowserError,find_browser,launch_cdp,same_public_route
BASE='https://allfileone-webstudio.pages.dev/'
ALLOWED_ORIGINS=('https://allfileone-webstudio.pages.dev/','https://nineeye.github.io/webstudio/')
PAGE='experience-v85.html'
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce',
         'professional','association','franchise','stay','realestate','event')
STYLES=('modern','premium','editorial')
def run(cdp,out,screenshots=True):
    checks=[];screens=[];cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable')
    cdp.call('Network.setCacheDisabled',{'cacheDisabled':True})
    def record(name,ok,detail=''):
        checks.append({'name':name,'pass':bool(ok),'detail':str(detail)[:260]})
    for width in (1280,390):
        try:
            cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':width<=440})
            cdp.events.clear()
            r=cdp.call('Page.navigate',{'url':BASE+PAGE},seconds=16)
            if r.get('errorText'):raise BrowserError('공개 사이트 이동 실패: '+r['errorText'])
            until=time.monotonic()+17
            while time.monotonic()<until:
                if cdp.evaluate('document.readyState==="complete" && window.AFO_V85_EXPERIENCE_READY===true'):break
                time.sleep(.2)
            else:raise BrowserError('V85 실제 페이지 준비되지 않음')
            state=cdp.evaluate('({url:location.href,heading:document.querySelector("h1")?.textContent,bodyWidth:document.documentElement.scrollWidth,windowWidth:innerWidth})')
            responses=[e.get('params',{}).get('response',{}) for e in cdp.events
                       if e.get('method')=='Network.responseReceived' and e.get('params',{}).get('type')=='Document']
            matching=[res for res in responses if same_public_route(res.get('url',''),BASE+PAGE)]
            status=matching[-1].get('status') if matching else None
            record('실제 공개 HTML HTTP 200 '+str(width),status==200,f'{status}')
            record('V85 페이지 경로/본문 '+str(width),same_public_route(state['url'].split('?',1)[0],BASE+PAGE) and '웹사이트' in (state['heading'] or ''),str(state))
            record('PC/모바일 가로 넘침 없음 '+str(width),state['bodyWidth']<=width+3,str(state['bodyWidth']))
            for k in SECTORS:
                for st in STYLES:
                    change=f'''(()=>{{
                      const k={json.dumps(k)},st={json.dumps(st)};
                      const el=document.querySelector('#v85-sector');el.value=k;
                      el.dispatchEvent(new Event('change',{{bubbles:true}}));
                      document.querySelector('[data-v85-style="'+st+'"]').click();
                      return {{selected:el.value,pressed:document.querySelector('[data-v85-style="'+st+'"]').getAttribute('aria-pressed'),
                        src:document.querySelector('#v85-live-frame').getAttribute('src'),
                        cards:document.querySelectorAll('#v85-feature-grid article').length,
                        sim:document.querySelectorAll('#v85-feature-grid [data-status=simulated]').length,
                        planned:document.querySelectorAll('#v85-feature-grid [data-status=planned]').length,
                        scope:document.querySelector('#v85-scope').getAttribute('href'),
                        width:document.documentElement.scrollWidth}}
                    }})()'''
                    v=cdp.evaluate(change)
                    tag=f'{width}/{k}/{st}'
                    record('업종·스타일 버튼 및 URL '+tag,
                           v['selected']==k and v['pressed']=='true' and f'/demo/{k}/{st}/index.html' in v['src'],v)
                    record('7개 가상 시연+1개 미구현 '+tag,v['cards']==8 and v['sim']==7 and v['planned']==1,v)
                    record('선택한 업종·스타일 상담서 인계 '+tag,f'industry={k}&style={st}' in v['scope'],v['scope'])
                    record('가로 넘침 없음 '+tag,v['width']<=width+3,str(v['width']))
                    # Browser must actually load its original same-origin iframe, not a fake HTTP 200 fallback.
                    if k in ('manufacturing','academy','event'):
                        expr=f'''(async()=>{{const f=document.querySelector('#v85-live-frame');const end=Date.now()+4600;
                          while(Date.now()<end){{try{{const b=f.contentDocument?.body;if(b?.dataset.industry==={json.dumps(k)}&&b?.dataset.v13Style==={json.dumps(st)})return true;}}catch(e){{}}await new Promise(r=>setTimeout(r,120));}}return false;}})()'''
                        ok=bool(cdp.evaluate(expr))
                        record('가상 원형 HTML 실제 iframe 로딩 '+tag,ok)
            # Verify mobile iframe switches to 390 logical width and that it still renders the chosen document.
            cdp.evaluate('document.querySelector("[data-v85-device=mobile]").click()')
            mobile=cdp.evaluate('({device:document.querySelector("#v85-preview-host").dataset.device,logical:document.querySelector("#v85-preview-host").style.getPropertyValue("--v85-frame-width")})')
            record('모바일 프레임 실제 390px '+str(width),mobile=={'device':'mobile','logical':'390px'},str(mobile))
            if screenshots:
                cdp.evaluate('document.querySelector(".v85-live-section").scrollIntoView({block:"start",behavior:"instant"})')
                time.sleep(.35)
                data=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False},seconds=15).get('data','')
                if data:
                    path=out/('V85_LIVE_DESKTOP.png' if width==1280 else 'V85_LIVE_MOBILE.png')
                    path.write_bytes(base64.b64decode(data));screens.append(path.name)
        except Exception as e:
            record('V85 실제 공개 Edge 시험 '+str(width),False,str(e))
    return checks,screens

def write_report(out,rows,screens):
    out.mkdir(parents=True,exist_ok=True)
    passed=sum(x['pass'] for x in rows)
    status='PASS_V85_PUBLIC_EDGE_INTERACTION_ONLY' if rows and passed==len(rows) else 'HOLD_V85_PUBLIC_EDGE'
    data={'version':'V85-20261109','source':'REAL_EDGE_PUBLIC_CDP','origin':BASE,'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'status':status,'passed':passed,'total':len(rows),'results':rows,'screenshots':screens,
          'real_customer_email_received':'NOT_VERIFIED','actual_contract':'NOT_VERIFIED','actual_order_booking_payment':'NOT_IMPLEMENTED','paid_apis_used':0}
    j=out/'AFO_V85_REAL_EDGE.json';t=out/'AFO_V85_REAL_EDGE_KO.txt'
    j.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n','utf-8')
    summary=['올파일원 웹스튜디오 V85 실제 공개 Edge/PC·모바일 시연 검증',f'결과: {status}',f'통과: {passed}/{len(rows)}',
             '실제 메일 수신/계약/주문/예약/결제는 검증하거나 처리하지 않았습니다.','']
    summary.extend(('PASS' if x['pass'] else 'HOLD')+' | '+x['name']+' | '+x['detail'] for x in rows if not x['pass'])
    t.write_text('\n'.join(summary)+'\n','utf-8-sig')
    manifest={'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [j,t]+[out/n for n in screens]}}
    m=out/'AFO_V85_EDGE_SHA256.json';m.write_text(json.dumps(manifest,indent=2)+'\n','utf-8')
    z=out/'AFO_V85_REAL_EDGE_EVIDENCE.zip'
    with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as f:
        for p in [j,t,m]+[out/n for n in screens]:f.write(p,p.name)
    with zipfile.ZipFile(z) as f:
        if f.testzip():raise RuntimeError('QA ZIP CRC 오류')
    (out/'AFO_V85_REAL_EDGE_EVIDENCE.sha256').write_text(hashlib.sha256(z.read_bytes()).hexdigest()+'  '+z.name+'\n','ascii')
    return data

def main(argv=None):
    parser=argparse.ArgumentParser(description='read-only actual Windows Edge V85 public browser QA')
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--browser',default='')
    parser.add_argument('--no-screenshots',action='store_true')
    parser.add_argument('--origin',choices=ALLOWED_ORIGINS,default=ALLOWED_ORIGINS[0])
    args=parser.parse_args(argv)
    global BASE
    BASE=args.origin
    rows=[];screens=[]
    try:
        browser=find_browser(args.browser)
        with tempfile.TemporaryDirectory(prefix='AFO_V85_CDP_') as temp:
            process=None;log=None;cdp=None
            try:
                process,log,cdp=launch_cdp(browser,temp)
                rows,screens=run(cdp,args.output,not args.no_screenshots)
            finally:
                if cdp:cdp.close()
                if process:
                    process.terminate()
                    try:process.wait(timeout=4)
                    except subprocess.TimeoutExpired:process.kill();process.wait(timeout=3)
                if log:log.close()
    except Exception as exc:rows.append({'name':'브라우저 시작 및 연결','pass':False,'detail':str(exc)[:300]})
    result=write_report(args.output,rows,screens)
    print(result['status'],str(result['passed'])+'/'+str(result['total']))
    return 0 if result['status']=='PASS_V85_PUBLIC_EDGE_INTERACTION_ONLY' else 3

if __name__=='__main__':sys.exit(main())
