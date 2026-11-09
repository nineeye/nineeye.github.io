# -*- coding: utf-8 -*-
"""V84 showroom proof source integrity and fail-closed negative tests; offline only."""
import sys
import json
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import v84_public_showroom_probe as M

ROOT=Path(__file__).resolve().parents[1]

class V84PublicShowroom(unittest.TestCase):
    def test_actual_local_full_seven_of_seven(self):
        report=M.check_public(getter=lambda path:(ROOT/path).read_text('utf-8'))
        self.assertEqual(report['result'],'PASS_V84_PUBLIC_FILES_ONLY')
        self.assertEqual((report['passed'],report['total']),(7,7))
        self.assertEqual(report['customer_email_receipt'],'NOT_VERIFIED')
        self.assertEqual(report['real_desktop_mobile_clicks'],'NOT_VERIFIED')
        self.assertEqual(report['paid_api_calls'],0)

    def test_broken_new_page_is_hold(self):
        def missing(path):
            if path=='design-studio-v84.html':raise FileNotFoundError(path)
            return (ROOT/path).read_text('utf-8')
        report=M.check_public(getter=missing)
        self.assertEqual((report['passed'],report['total']),(6,7))
        self.assertEqual(report['result'],'HOLD_V84_PUBLIC')

    def test_homepage_fallback_does_not_masquerade_as_new_design(self):
        home=(ROOT/'index.html').read_text('utf-8')
        report=M.check_public(getter=lambda path:home if path=='design-studio-v84.html' else (ROOT/path).read_text('utf-8'))
        self.assertEqual(report['result'],'HOLD_V84_PUBLIC')
        self.assertEqual(report['records'][1]['state'],'HOLD')

    def test_wrong_demo_body_fails_even_when_page_is_http_200(self):
        def bad(path):
            if path.startswith('demo/'):return 'a good looking homepage, no sector or style markers'
            return (ROOT/path).read_text('utf-8')
        self.assertEqual(M.check_public(getter=bad)['result'],'HOLD_V84_PUBLIC')

    def test_reports_written_and_never_claim_mail(self):
        r=M.check_public(getter=lambda path:(ROOT/path).read_text('utf-8'))
        with tempfile.TemporaryDirectory() as d:
            js,txt=M.write_report(r,Path(d))
            self.assertEqual(json.loads(js.read_text('utf-8'))['customer_email_receipt'],'NOT_VERIFIED')
            self.assertIn('실제 브라우저',txt.read_text('utf-8-sig'))

    def test_no_side_effect_methods(self):
        s=Path(M.__file__).read_text('utf-8')
        for forbidden in ['method="POST"','Request(data=','smtplib.SMTP','send_email(','openai.com/api']:
            self.assertNotIn(forbidden,s)

if __name__=='__main__':
    unittest.main()
