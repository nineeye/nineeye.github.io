#!/usr/bin/env python3
"""No-network Chromium CDP protocol and fail-closed evidence tests for V63.
No live Cloudflare result can be inferred from these fixture tests.
"""
import importlib.util
import json
import hashlib
import os
from pathlib import Path
import tempfile
import unittest
import zipfile
import base64

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=ROOT/'tools/v63_edge_live_qa.py'
spec=importlib.util.spec_from_file_location('v63_edge_qa',SCRIPT)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
SRC=SCRIPT.read_text(encoding='utf-8')

class ProtocolFixture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory(prefix='V63_CDP_TEST_')
        cls.proc,cls.log,cls.cdp=mod.launch_cdp(mod.find_browser(),cls.tmp.name)
        cls.cdp.call('Page.enable');cls.cdp.call('Runtime.enable')
        cls.frame=cls.cdp.call('Page.getFrameTree')['frameTree']['frame']['id']
    @classmethod
    def tearDownClass(cls):
        cls.cdp.close();cls.proc.terminate();cls.proc.wait(timeout=5);cls.log.close();cls.tmp.cleanup()
    def setUp(self):
        html='''<!doctype html><html lang="ko"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:12px;box-sizing:border-box;font-family:system-ui"><h1>테스트 전용 · 실제 공개 사이트 아님</h1><form id="v49-form"><label><input type="radio" name="industry" value="manufacturing">제조</label><label><input type="radio" name="industry" value="academy">학원</label><label><input type="radio" name="industry" value="interior">인테리어</label><label><input type="radio" name="industry" value="restaurant">음식점</label><label><input type="radio" name="industry" value="beauty">뷰티</label><label><input type="radio" name="industry" value="logistics">물류</label></form><pre id="v49-output" style="overflow-wrap:anywhere;white-space:pre-wrap"></pre><button type="button" id="v62-subject">제목 복사</button><button type="button" id="v62-body">본문 복사</button><p role="status" id="v49-status"></p></body></html>'''
        self.cdp.call('Page.setDocumentContent',{'frameId':self.frame,'html':html})
        self.cdp.evaluate('document.querySelector("#v49-output").textContent="받는 사람: nineeyes@naver.com\\n제목: V63 제목\\n\\nV63 테스트 본문"')
        self.cdp.evaluate((ROOT/'tools/fixture_webmail_v62.js').read_text(encoding='utf-8'))
    def test_cdp_runtime_can_read_actual_dom(self):
        self.assertEqual(self.cdp.evaluate('document.querySelector("h1").textContent'),'테스트 전용 · 실제 공개 사이트 아님')
    def test_six_sector_radio_interaction(self):
        for s in mod.SECTORS:
            with self.subTest(s=s):
                self.assertTrue(self.cdp.evaluate(f'(()=>{{let el=document.querySelector("input[value={s}]");el.click();return el.checked}})()'))
    def test_six_sector_inputs_present(self):
        self.assertEqual(self.cdp.evaluate('document.querySelectorAll("input[name=industry]").length'),6)
    def test_mobile_no_horizontal_overflow(self):
        self.cdp.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':820,'deviceScaleFactor':1,'mobile':True})
        self.assertTrue(self.cdp.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'))
    def test_pc_no_horizontal_overflow(self):
        self.cdp.call('Emulation.setDeviceMetricsOverride',{'width':1280,'height':820,'deviceScaleFactor':1,'mobile':False})
        self.assertTrue(self.cdp.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'))
    def test_chromium_screen_capture(self):
        data=self.cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data']
        self.assertTrue(base64.b64decode(data).startswith(b'\x89PNG\r\n\x1a\n'))
    def test_subject_copy_without_network(self):
        self.cdp.evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async s=>{window.__copied=s}}})')
        self.cdp.evaluate('document.querySelector("#v62-subject").click()')
        self.assertEqual(self.cdp.evaluate('window.__copied'), 'V63 제목')
    def test_body_copy_without_network(self):
        self.cdp.evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async s=>{window.__copied=s}}})')
        self.cdp.evaluate('document.querySelector("#v62-body").click()')
        self.assertEqual(self.cdp.evaluate('window.__copied'), 'V63 테스트 본문')
    def test_denied_clipboard_explicit_fallback(self):
        self.cdp.evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw Error("denied")}}})')
        self.cdp.evaluate('document.querySelector("#v62-body").click()')
        self.assertTrue(self.cdp.evaluate('Boolean(document.querySelector("#v62-manual-copy"))'))
    def test_no_customer_submit_controls(self):
        self.assertFalse(self.cdp.evaluate('Boolean(document.querySelector("button[type=submit], input[type=password]"))'))

class FailClosed(unittest.TestCase):
    def test_websocket_rejects_external_hosts(self):
        with self.assertRaises(mod.BrowserError):mod.WebSocket('ws://example.com/devtools/page/123')
    def test_websocket_rejects_tls_external(self):
        with self.assertRaises(mod.BrowserError):mod.WebSocket('wss://127.0.0.1/devtools/page/123')
    def test_explicit_missing_browser_fails(self):
        with self.assertRaises(mod.BrowserError):mod.find_browser('/nonexistent/v63-browser.exe')
    def test_default_release_exact(self):self.assertEqual(mod.EXPECTED,'V63')
    def test_six_sectors_fixed(self):self.assertEqual(len(mod.SECTORS),6)
    def test_no_automatic_form_post_in_source(self):self.assertNotIn('method\':\'POST',SRC)
    def test_no_pip_or_paid_service(self):
        self.assertNotIn('pip install',SRC)
        self.assertNotIn('OPENAI_API_KEY',SRC)
    def test_report_pass_restricted_scope_and_zip(self):
        with tempfile.TemporaryDirectory() as td:
            r=mod.write_reports(td,{'started':mod.now(),'base':mod.BASE,'browser':'TEST'},[{'check':'fixture-only','pass':True,'detail':'isolated'}],[])
            self.assertEqual(r['status'],'PASS_PUBLIC_BROWSER_SMOKE_ONLY')
            self.assertEqual(r['customer_email_received'],'NOT_TESTED')
            p=Path(td)/'V63_LIVE_BROWSER_EVIDENCE_LATEST.zip'
            with zipfile.ZipFile(p) as z:
                self.assertIsNone(z.testzip())
                self.assertIn('V63_SHA256_MANIFEST.json',z.namelist())
                m=json.loads(z.read('V63_SHA256_MANIFEST.json'))
                self.assertEqual(m['files']['V63_LIVE_BROWSER_RESULT.json']['sha256'],hashlib.sha256(z.read('V63_LIVE_BROWSER_RESULT.json')).hexdigest())
    def test_report_hold_on_failure(self):
        with tempfile.TemporaryDirectory() as td:
            r=mod.write_reports(td,{'started':mod.now(),'base':mod.BASE},[{'check':'network-blocked','pass':False,'detail':'blocked'}],[])
            self.assertEqual(r['status'],'HOLD_BROWSER_OR_NETWORK')
            self.assertEqual(r['failed'],1)
    def test_report_hold_on_zero_checks(self):
        with tempfile.TemporaryDirectory() as td:
            r=mod.write_reports(td,{'started':mod.now(),'base':mod.BASE},[],[])
            self.assertEqual(r['status'],'HOLD_BROWSER_OR_NETWORK')
    def test_live_target_no_external_user_supplied_url(self):
        self.assertEqual(mod.BASE,'https://allfileone-webstudio.pages.dev/')
    def test_live_report_requires_all_positive_checks(self):
        with tempfile.TemporaryDirectory() as td:
            records=[{'check':'public-ui','pass':True,'detail':'ok'}, {'check':'network-check','pass':False,'detail':'blocked'}]
            report=mod.write_reports(td,{'started':mod.now(),'base':mod.BASE},records,[])
            self.assertEqual(report['status'],'HOLD_BROWSER_OR_NETWORK')
            self.assertEqual(report['customer_email_received'],'NOT_TESTED')

if __name__=='__main__':unittest.main(verbosity=2)