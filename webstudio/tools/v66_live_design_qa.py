#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V66 actual Windows Edge public acceptance: 36 page-wide styles, 12 working industries.
Runs read-only synthetic clicks on public static demos. No email or customer data.
"""
import argparse,json,time,sys,tempfile
from pathlib import Path
from datetime import datetime
import v65_edge_live_qa as base
from v652_live_demo_qa import SECTORS,STYLES,same_demo_route
ORIGIN=base.BASE

def now():return datetime.now().astimezone().isoformat(timespec='seconds')
def audit(cdp):
 rows=[]
 def mark(label,ok,detail=''):
  rows.append({'check':label,'pass':bool(ok),'detail':str(detail)[:225]})
 cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable')
 cdp.call('Network.setCacheDisabled',{'cacheDisabled':True})
 def js(expr):return cdp.evaluate(expr)
 def browse(sector,style,width):
  cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':width<=440})
  url=ORIGIN+f'demo/{sector}/{style}/index.html'
  resp=cdp.call('Page.navigate',{'url':url},seconds=15)
  if resp.get('errorText'):raise RuntimeError(resp['errorText'])
  deadline=time.monotonic()+14
  state=None
  while time.monotonic()<deadline:
   try:
    state=js("""(()=>({
      url:location.href,ready:document.readyState,v66:document.body?.dataset.v66Ready,
      v28:document.body?.dataset.v28Ready,v652:document.body?.dataset.v652Ready,
      cards:document.querySelectorAll('.v66-sector-card').length,
      count:window.AFO_V66_SECTOR_COUNT||0,
      heading:document.querySelector('.hero h1')?.textContent||'',
      styles:document.querySelectorAll('link[data-v66-stylesheet]').length,
      scripts:document.querySelectorAll('script[data-v66-script]').length,
      actions:document.querySelectorAll('.v37-style-links a').length,
      overflow:document.documentElement.scrollWidth-innerWidth,
      cols:getComputedStyle(document.querySelector('.service-grid')).gridTemplateColumns.split(/\s+/).length,
      spotlight:getComputedStyle(document.querySelector('#v66-sector-first')).backgroundColor,
      nav:getComputedStyle(document.querySelector('#demo-nav')).display,
      menu:getComputedStyle(document.querySelector('.mobile-menu')).display,
      s:document.body.dataset.v13Style,i:document.body.dataset.industry
      }))()""")
   except (base.BrowserError,TypeError,KeyError):
    state=None
   if (state and state.get('ready')=='complete' and state.get('v66')=='true'
        and state.get('v28')=='true' and state.get('v652')=='true' and
        same_demo_route(state['url'],url)):return state
   time.sleep(.09)
  raise RuntimeError('not fully loaded '+sector+'/'+style+' '+str(state)[:160])
 stylesBySector={}
 for width in (390,1280):
  for sector in SECTORS:
   for style in STYLES:
    key=f'{sector}/{style}/{width}'
    try:
     v=browse(sector,style,width)
     mark('actual 36-page sector identity '+key,
          v['count']==12 and v['i']==sector and v['s']==style and v['styles']==1 and v['scripts']==1 and v['actions']==3,
          str({k:v[k] for k in ('count','i','s','actions')}))
     mark('four distinct front-door working tools '+key,
          v['cards']==4 and v['v28']=='true' and v['v652']=='true',
          str(v['cards']))
     mark('responsive overflow '+key,v['overflow']<=3,str(v['overflow']))
     if width==1280:
      expected={'modern':12,'premium':3,'editorial':1}[style]
      mark('actually different whole-page service layout '+key,v['cols']==expected,str(v['cols'])+' expected '+str(expected))
      stylesBySector.setdefault(sector,{})[style]=v['heading']
      result=js("""(()=>{const item=document.querySelectorAll('.v66-sector-card')[1];item.click();
             return {selected:document.getElementById('v28-tools')?.dataset.v28Active||'',
             scrolled:Math.abs(document.getElementById('v28-tools')?.getBoundingClientRect().top||5000)<150,
             title:document.querySelector('#v28-panel h3')?.textContent||''}})()""")
      # The tool tab changes synchronously, but viewport layout may settle
      # on the next frame even when the browser is asked for instant scrolling.
      time.sleep(.12)
      scroll_state=js("""(()=>({top:document.getElementById('v28-tools')?.getBoundingClientRect().top,
          active:document.getElementById('v28-tools')?.dataset.v28Active||''}))()""") or {}
      top=scroll_state.get('top')
      mark('real linked V28 sector function 2 '+key,
           bool(result and result.get('selected')=='1' and scroll_state.get('active')=='1'
                and isinstance(top,(int,float)) and abs(top)<160),
           str({'clicked':result,'settled':scroll_state}))
    except Exception as e:
     mark('V66 public page '+key,False,str(e))
  if width==390:
   # All 36 pages were checked for no mobile overflow.
   pass
 for sector,d in stylesBySector.items():
  mark('3 different textual brand hero stories '+sector,len(d)==3 and len(set(d.values()))==3,json.dumps(d,ensure_ascii=False))
 # Screenshot-specific top-header overlap regression at the reported midwidth.
 for style in STYLES:
  try:
   v=browse('manufacturing',style,940)
   mark('tablet navigation collapsed instead of overlapping '+style,
        v.get('menu')!='none' and v.get('nav')=='none' and v['overflow']<=3,
        str((v.get('menu'),v.get('nav'),v.get('overflow'))))
   cycle=js("""(()=>{const b=document.querySelector('.mobile-menu'),n=document.querySelector('#demo-nav');
      b.click();const opened={expanded:b.getAttribute('aria-expanded'),display:getComputedStyle(n).display};
      b.click();const closed={expanded:b.getAttribute('aria-expanded'),display:getComputedStyle(n).display};
      return {opened,closed};})()""")
   mark('tablet menu opens and closes '+style,
        cycle and cycle['opened']=={'expanded':'true','display':'grid'} and cycle['closed']=={'expanded':'false','display':'none'},
        str(cycle))
  except Exception as exc:mark('tablet header regression '+style,False,str(exc))
 return rows

def main():
 p=argparse.ArgumentParser();p.add_argument('--output',required=True);p.add_argument('--browser',default='')
 args=p.parse_args();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
 began=now();rows=[]
 with tempfile.TemporaryDirectory(prefix='afo-v66-') as temp:
  proc=log=cdp=None
  try:
   proc,log,cdp=base.launch_cdp(base.find_browser(args.browser),temp)
   rows=audit(cdp)
  except Exception as exc:rows=[{'check':'V66 public Edge init','pass':False,'detail':str(exc)[:400]}]
  finally:
   if cdp:
    try:cdp.close()
    except Exception:pass
   if proc:
    proc.terminate()
    try:proc.wait(timeout=4)
    except Exception:proc.kill()
   if log:log.close()
 passed=sum(int(v['pass']) for v in rows)
 result={'release':'V66','date':now(),'started':began,'public_site':ORIGIN,
  'checked':len(rows),'passed':passed,'failed':len(rows)-passed,
  'status':'PASS_PUBLIC_DESIGN_AND_SECTOR_SMOKE' if rows and passed==len(rows) else 'HOLD_V66_PUBLIC_DESIGN',
  'actual_customer_orders':'NOT_TESTED','revenue':'NOT_TESTED','real_reservations':'NOT_TESTED','checks':rows}
 (out/'V66_Real_Edge_Design.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
 lines=['올파일원 웹스튜디오 V66 — 36개 디자인/12 업종 기능/모바일 및 태블릿 실제 Edge 검사',
        f'{result["status"]} {passed}/{len(rows)} PASS, {len(rows)-passed} FAIL',
        '실예약/실주문/실결제/사용자 반응은 검증하지 않음.']
 for v in rows:
  if not v['pass']:lines.append('[HOLD] '+v['check']+' '+v['detail'])
 (out/'V66_Real_Edge_Design_KO.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
 print('V66_PUBLIC_REAL_EDGE',result['status'],f'{passed}/{len(rows)}')
 return 0 if rows and passed==len(rows) else 3
if __name__=='__main__':sys.exit(main())
