#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V65.3 production-readiness sale journey: real public Windows Edge.
24 transactions are synthetic *UI navigations only*. No form submission,
no email, no payment, no user data, no backend.
"""
import argparse
from datetime import datetime
import json
from pathlib import Path
import sys
import tempfile
import time
from urllib.parse import urlsplit, parse_qs
import v65_edge_live_qa as base
import v652_live_demo_qa as demo_qa

ROOT=base.BASE
INDUSTRIES=demo_qa.SECTORS
WAIT=17

def now():return datetime.now().astimezone().isoformat(timespec="seconds")
def path_ok(url,suffix):
    u=urlsplit(url);b=urlsplit(ROOT)
    if (u.scheme,u.hostname,u.port)!=(b.scheme,b.hostname,b.port):return False
    path=(u.path or '/').rstrip('/')
    if path.endswith('.html'):path=path[:-5]
    return path=='/'+suffix

def audit(cdp):
    rows=[]
    def record(name,ok,detail=''):
        rows.append({'check':name,'pass':bool(ok),'detail':str(detail)[:240]})
    cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable')
    cdp.call('Network.setCacheDisabled',{'cacheDisabled':True})
    def js(expr):
        return cdp.evaluate(expr)
    def navigate(path,width,flag=''):
        cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':width<=440})
        response=cdp.call('Page.navigate',{'url':ROOT+path},seconds=15)
        if response.get('errorText'):raise RuntimeError(response['errorText'])
        return wait(lambda x: x.get('ready')=='complete' and (not flag or x.get('flag')=='true'))
    def wait(condition,sec=WAIT):
        deadline=time.monotonic()+sec
        state={}
        while time.monotonic()<deadline:
            try:
                state=js("""(()=>({url:location.href,ready:document.readyState,flag:
                    document.body?.dataset.v653PlanReady||document.body?.dataset.v652Ready||document.body?.dataset.v653Imported||'',
                    status:document.body?.dataset.v653Imported||'',
                    width:document.documentElement.scrollWidth,viewport:innerWidth,
                    h1:document.querySelector('h1')?.textContent||'',
                    panel:!!document.getElementById('v653-import'),
                    count:document.querySelectorAll('#v653-requirements-list li').length,
                    industry:document.querySelector('#pg-form select[name=industry],#brief-form select[name=industry]')?.value||'',
                    theme:document.querySelector('#pg-form select[name=theme],#brief-form select[name=theme]')?.value||'',
                    keyOffer:sessionStorage.getItem('afo.webstudio.v653.offer')===null,
                    keyContact:sessionStorage.getItem('afo.webstudio.v653.contact')===null
                    }))()""") or {}
            except (base.BrowserError,KeyError,TypeError):time.sleep(.12);continue
            if condition(state):return state
            time.sleep(.12)
        raise RuntimeError('page/contract acceptance timeout: '+str(state)[:250])
    for width in (390,1280):
        for industry in INDUSTRIES:
            label=industry+'/'+str(width)
            try:
                home=navigate('demo/'+industry+'/modern/index.html',width,'true')
                if not demo_qa.same_demo_route(home['url'],ROOT+'demo/'+industry+'/modern/index.html'):
                    raise RuntimeError('demo wrong origin or route: '+home['url'])
                first=js("""(()=>{const x=document.getElementById('v653-to-plan');
                    if(!x)return {present:false};
                    document.querySelector('#v652-demand input[data-v652-item="1"]').click();
                    const scope=document.getElementById('v652-scale');scope.value='2';scope.dispatchEvent(new Event('change',{bubbles:true}));
                    const when=document.getElementById('v652-when');when.value='quarter';when.dispatchEvent(new Event('change',{bubbles:true}));
                    const preview=document.getElementById('v652-preview')?.textContent||'';
                    x.click();
                    return {present:true,source:preview}})()""") or {}
                if not first.get('present'):
                    raise RuntimeError('V65.3 sales comparison CTA absent from PUBLIC site; exact release may be stale')
                # A normal click triggers same-tab navigation after sessionStorage handoff.
                plan=wait(lambda x:path_ok(x.get('url',''),'plan-guide') and x.get('ready')=='complete' and x.get('flag')=='true')
                record('예제 기능 → 제작 상품 비교 이동 '+label,
                    first.get('present') is True and path_ok(plan['url'],'plan-guide')
                    and plan.get('industry')==industry and plan.get('theme')=='modern'
                    and plan.get('count')==2 and plan.get('keyOffer'),
                    str({k:plan[k] for k in ('industry','theme','count','keyOffer')}))
                url=urlsplit(plan['url']);qs=parse_qs(url.query,keep_blank_values=True)
                record('고객 개인정보 없이 공개 코드만 전달 '+label,
                    set(qs)=={'source','industry','theme'} and qs.get('source')==['demo-v653']
                    and qs.get('industry')==[industry] and qs.get('theme')==['modern'],str(qs))
                record('상품 비교 모바일 가로 넘침 없음 '+label,plan['width']<=plan['viewport']+3,
                    str(plan['width'])+'/'+str(plan['viewport']))
                preview=js("""document.querySelector('#v653-output')?.textContent||''""")
                record('업종별 요구와 별도 연동 비용 고지 '+label,
                    '업종별 실운영 연동 별도 협의' in preview
                    and '예시 가격표 항목의 계산 합계' in preview
                    and '별도 확인: 부가세' in preview,
                    preview[-160:] if isinstance(preview,str) else '')
                before=js("""(()=>{const form=document.getElementById('pg-form');
                    form.querySelector('input[name="plan"][value="advanced"]').click();
                    const addon=form.querySelector('input[name="addon"][value="catalog"]');if(!addon.checked)addon.click();
                    const materials=document.querySelector('#v653-term-materials');
                    materials.value='ready';materials.dispatchEvent(new Event('change',{bubbles:true}));
                    const text=document.getElementById('v653-output').textContent;
                    const n=document.querySelector('#v653-ready-count')?.textContent||'';
                    document.querySelector('#v653-buyer .v653-primary').click();
                    return {amount: text.includes('1,240,000원'),ready:n.includes('1/8'),plan:text.includes('업무 기능형')};})()""") or {}
                contact=wait(lambda x:path_ok(x.get('url',''),'contact') and x.get('ready')=='complete' and x.get('status')=='true')
                full=js("""document.getElementById('v653-full-brief')?.textContent||''""") or ''
                record('상품 견적 → 실제 상담서 1회 인계 '+label,
                    bool(before.get('amount') and before.get('ready') and before.get('plan'))
                    and contact.get('industry')==industry and contact.get('theme')=='modern'
                    and contact.get('panel') and contact.get('keyContact')
                    and '1,240,000원' in full and '자료 준비' in full
                    and '계약 전 8개 확인 조건' in full,
                    {'plan':before,'contact':{k:contact[k] for k in ('industry','theme','panel','keyContact')}})
                record('인계된 업종별 기능 2개와 상담 원문 유지 '+label,
                    full.count(' • ')>=2 and '1~3개월 검토' in full
                    and '자료·운영 규모:' in full
                    and '업종별 요구사항' in full,
                    'safely received 2 sector demands')
                record('상담서 모바일 가로 넘침 없음 '+label,
                    contact['width']<=contact['viewport']+3,
                    str(contact['width'])+'/'+str(contact['viewport']))
                if industry=='manufacturing':
                    # A consumed record is not replayed on reload, even if the URL is retained.
                    cdp.call('Page.reload',{'ignoreCache':True})
                    replay=wait(lambda x:path_ok(x.get('url',''),'contact') and x.get('ready')=='complete')
                    record('상담 인계 1회 사용 후 재방문 거부 '+label,
                        not replay.get('panel') and replay.get('keyContact'),str(replay.get('panel')))
            except Exception as exc:
                record('판매 여정 실브라우저 '+label,False,str(exc))
    return rows

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',required=True)
    parser.add_argument('--browser',default='')
    opts=parser.parse_args()
    out=Path(opts.output);out.mkdir(parents=True,exist_ok=True)
    started=now();rows=[]
    with tempfile.TemporaryDirectory(prefix='afo-v653-browser-') as temp:
        proc=log=cdp=None
        try:
            proc,log,cdp=base.launch_cdp(base.find_browser(opts.browser),temp)
            rows=audit(cdp)
        except Exception as e:
            rows.append({'check':'V65.3 launch','pass':False,'detail':str(e)[:260]})
        finally:
            if cdp:
                try:cdp.close()
                except Exception:pass
            if proc:
                proc.terminate()
                try:proc.wait(timeout=4)
                except Exception:proc.kill()
            if log:log.close()
    passed=sum(int(x['pass']) for x in rows)
    result={'product':'AllFileOne WebStudio','suite':'LIVE_EDGE_V65_3_BUYER_JOURNEY',
       'started':started,'finished':now(),'origin':ROOT,
       'checked':len(rows),'passed':passed,'failed':len(rows)-passed,
       'status':'PASS_PUBLIC_BUYER_FLOW_SMOKE_ONLY' if rows and passed==len(rows) else 'HOLD_PUBLIC_BUYER_FLOW',
       'real_contract':'NOT_TESTED','real_customer_email_received':'NOT_TESTED',
       'real_booking_or_payment':'NOT_TESTED','checks':rows}
    (out/'V653_Buyer_Real_Edge.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    lines=['올파일원 웹스튜디오 V65.3 Windows Edge 공개사이트 구매자 여정 검사',
        f'결과: {result["status"]} / {passed}/{len(rows)} PASS',
        '계약 성사, 실메일 수신, 예약·결제는 이 검사의 대상이 아닙니다.']
    for x in rows:
        if not x['pass']:lines.append('[HOLD] '+x['check']+' '+x['detail'])
    (out/'V653_Buyer_Real_Edge_KO.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print('V653_BUYER_REAL_EDGE',result['status'],str(passed)+'/'+str(len(rows)))
    return 0 if passed==len(rows) and rows else 3

if __name__=='__main__':sys.exit(main())
