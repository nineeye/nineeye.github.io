#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AllFileOne WebStudio V65.2: read-only live Edge 36-demo QA; no customer PII.
Uses only Python standard library and the existing V65 CDP browser harness.
Does NOT send emails, submit bookings, create orders, or charge payments.
"""
import argparse
import json
import sys
import time
import tempfile
from pathlib import Path
from urllib.parse import urlsplit
from datetime import datetime
import v65_edge_live_qa as base

ORIGIN=base.BASE
SECTORS=("manufacturing","corporate","clinic","academy","interior","commerce",
         "professional","association","franchise","stay","realestate","event")
STYLES=("modern","premium","editorial")
WAIT=13

def now():return datetime.now().astimezone().isoformat(timespec="seconds")
def same_demo_route(found,expected):
    a,b=urlsplit(found),urlsplit(expected)
    if (a.scheme,a.netloc)!=(b.scheme,b.netloc):return False
    def normalize(path):
        p=path.rstrip("/")
        if p.endswith("/index.html"):p=p[:-11]
        elif p.endswith("/index"):p=p[:-6]
        return p.rstrip("/")
    return normalize(a.path)==normalize(b.path)

def accept(cdp,output):
    rows=[]
    def mark(label,passed,detail=""):
        rows.append({"check":label,"pass":bool(passed),"detail":str(detail)[:270]})
    cdp.call("Page.enable")
    cdp.call("Runtime.enable")
    cdp.call("Network.enable")
    cdp.call("Network.setCacheDisabled",{"cacheDisabled":True})
    def evaluate(expr):
        try:return cdp.evaluate(expr)
        except (base.BrowserError,KeyError,TypeError):return None
    def browse(path,width,condition):
        cdp.call("Emulation.setDeviceMetricsOverride",
                 {"width":width,"height":900,"deviceScaleFactor":1,"mobile":width<=440})
        goal=ORIGIN+path
        cdp.events.clear()
        response=cdp.call("Page.navigate",{"url":goal},seconds=15)
        if response.get("errorText"):raise RuntimeError(response["errorText"])
        deadline=time.monotonic()+WAIT
        while time.monotonic()<deadline:
            state=evaluate('''(()=>({url:location.href,ready:document.readyState,
                loaded:document.body?.dataset.v652Ready||'',
                v28:document.body?.dataset.v28Ready||'',
                kind:document.body?.dataset.industry||'',
                style:document.body?.dataset.v13Style||'',
                h1:document.querySelector('h1')?.textContent||'',
                cards:document.querySelectorAll('#v652-demand .v652-card').length,
                width:document.documentElement.scrollWidth,view:innerWidth,
                count:window.ALLFILEONE_V652_CAPABILITY_COUNT||0}))()''')
            if state and condition(state):break
            time.sleep(.12)
        else:raise RuntimeError("page not ready: "+path+" "+str(state)[:160])
        doc=[ev.get("params",{}).get("response",{}) for ev in cdp.events
             if ev.get("method")=="Network.responseReceived" and ev.get("params",{}).get("type")=="Document"]
        actual=[d for d in doc if same_demo_route(d.get("url",""),goal)]
        return state,actual[-1].get("status") if actual else None
    for width in (390,1280):
        for sector in SECTORS:
            for theme in STYLES:
                path="demo/"+sector+"/"+theme+"/index.html"
                label=sector+"/"+theme+" "+str(width)
                try:
                    state,http=browse(path,width,lambda x:
                         same_demo_route(x.get("url",""),ORIGIN+path) and
                         x.get("ready")=="complete" and x.get("loaded")=="true" and
                         x.get("v28")=="true")
                    mark("36페이지 실제 HTTP 2xx "+label,http is not None and 200<=http<300,str(http))
                    mark("업종별 요구 4개와 기존 기능 동작 "+label,
                         state["kind"]==sector and state["style"]==theme and state["cards"]==4 and state["count"]==48 and bool(state["h1"]),
                         state["kind"]+" "+str(state["cards"])+"/"+str(state["count"]))
                    mark("모바일·PC 가로 넘침 없음 "+label,state["width"]<=state["view"]+3,
                         str(state["width"])+"/"+str(state["view"]))
                    if theme=="modern":
                        # A different sector requirement opens its matching existing 48-tool tab.
                        tab=evaluate('''(()=>{const x=document.querySelectorAll('.v652-try')[1];x.click();
                         return {active:document.getElementById('v28-tools')?.dataset.v28Active,
                         text:document.getElementById('v28-title')?.textContent||''}})()''')
                        mark("관련 업종 기능 탭 연결 "+label,bool(tab and tab.get("active")=="1" and tab.get("text")),str(tab))
                        # Choose two features and a non-default size and timing, then real same-tab transfer.
                        action=evaluate('''(()=>{const box=document.querySelector('#v652-demand input[data-v652-item="1"]');
                            if(!box)return 'no second option';
                            box.click();
                            const scale=document.getElementById('v652-scale');
                            scale.value='2';scale.dispatchEvent(new Event('change',{bubbles:true}));
                            const when=document.getElementById('v652-when');
                            when.value='quarter';when.dispatchEvent(new Event('change',{bubbles:true}));
                            const memo=document.getElementById('v652-preview')?.textContent||'';
                            document.querySelector('#v652-demand .v652-primary').click();
                            return memo;})()''')
                        deadline=time.monotonic()+WAIT
                        imported=None
                        while time.monotonic()<deadline:
                            imported=evaluate('''(()=>({path:location.pathname,ready:document.readyState,
                                industry:document.querySelector('#brief-form select[name=industry]')?.value||'',
                                theme:document.querySelector('#brief-form select[name=theme]')?.value||'',
                                panel:!!document.querySelector('#v652-import'),
                                full:document.querySelector('#v652-full-brief')?.textContent||'',
                                cleared:sessionStorage.getItem('afo.webstudio.v652.industry-brief')===null,
                                flag:document.body?.dataset.v652Imported||''}))()''')
                            if imported and imported.get("ready")=="complete" and imported.get("path") in ("/contact","/contact.html"):
                                if imported.get("panel") and imported.get("flag")=="true":break
                            time.sleep(.12)
                        mark("업종 요구 1회 안전 상담 인계 "+label,
                             bool(imported and imported.get("panel") and imported.get("flag")=="true"
                                  and imported.get("industry")==sector and imported.get("theme")=="modern"
                                  and imported.get("cleared") and "제작 요구" in imported.get("full","")
                                  and "1~3개월 검토" in imported.get("full","")),
                             str(imported)[:240])
                        mark("상담 원문 유지 "+label,
                             bool(imported and "자료·운영 규모: " in imported.get("full","")
                                  and imported.get("full","").count("• ")==2 and action and "• " in action),
                             "2 selection source, full panel")
                except Exception as exc:
                    mark("예제 사이트/상담 동작 "+label,False,str(exc))
    return rows

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True)
    parser.add_argument("--browser",default="")
    args=parser.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    started=now();rows=[]
    with tempfile.TemporaryDirectory(prefix="webstudio-v652-") as temp:
        proc=log=cdp=None
        try:
            binary=base.find_browser(args.browser)
            proc,log,cdp=base.launch_cdp(binary,temp)
            rows=accept(cdp,out)
        except Exception as e: rows.append({"check":"Windows Edge browser launch or CDP","pass":False,"detail":str(e)[:300]})
        finally:
            if cdp:
                try:cdp.close()
                except Exception:pass
            if proc:
                proc.terminate()
                try:proc.wait(timeout=4)
                except Exception:proc.kill()
            if log:log.close()
    passed=sum(bool(x["pass"]) for x in rows);failed=len(rows)-passed
    report={"product":"AllFileOne WebStudio","scope":"36 DEMOS x 2 WIDTHS + 12 SAME-TAB CONSULTATION TRANSFERS",
            "started":started,"finished":now(),"public_site":ORIGIN,
            "checked":len(rows),"passed":passed,"failed":failed,
            "status":"PASS_PUBLIC_SECTOR_DEMO_SMOKE_ONLY" if rows and failed==0 else "HOLD_PUBLIC_SECTOR_DEMO",
            "orders_received":"NOT_TESTED","email_received":"NOT_TESTED","real_customer_bookings":"NOT_TESTED",
            "checks":rows}
    (out/"V652_Demo_Acceptance.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    lines=["올파일원 웹스튜디오 36개 예제사이트 업종별 실제 브라우저 검사",
           "대상: "+ORIGIN,"검사: 12개 업종 × 3디자인 × PC/모바일 + 업종별 상담 인계",
           f"결과: {report['status']} {passed}/{len(rows)} PASS, {failed} FAIL",
           "실제 이메일 수신/실제 예약/결제: 이 검사는 확인하지 않음",""]
    for i,row in enumerate(rows,1):
        if not row["pass"]:lines.append(f"{i} [HOLD] {row['check']} {row['detail']}")
    (out/"V652_Demo_Acceptance_KO.txt").write_text("\n".join(lines)+"\n",encoding="utf-8")
    print("V652_PUBLIC_36_DEMOS",report["status"],str(passed)+"/"+str(len(rows)))
    return 0 if failed==0 else 3

if __name__=="__main__":sys.exit(main())
