# -*- coding: utf-8 -*-
"""V76 source contracts: no former copy/export/print path can truncate an imported quote."""
import unittest
from pathlib import Path
import json,subprocess
ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/'assets/v76-contact-unification.js').read_text('utf-8')
CSS=(ROOT/'assets/v76-contact-unification.css').read_text('utf-8')
HTML=(ROOT/'contact.html').read_text('utf-8')
class V76ContactUnification(unittest.TestCase):
 def test_scripts_in_right_order(self):
  self.assertIn('assets/v76-contact-unification.js',HTML)
  self.assertLess(HTML.index('assets/v72-complete-contact.js'),HTML.index('assets/v76-contact-unification.js'))
 def test_legacy_buttons_use_one_authoritative_packet(self):
  for control in ('v42-copy-complete','v47-copy-all','v47-download-all','v47-show-all','brief-print'):
   with self.subTest(control=control):self.assertIn(control,JS)
  self.assertIn("authoritative.textContent.trim()",JS)
  self.assertIn('v46-full-report',JS)
  self.assertIn('current.includes(kit)',JS)
  self.assertIn('stopImmediatePropagation',JS)
 def test_fail_closed_if_not_imported(self):
  self.assertIn("imported.dataset.v72Ready!=='true'",JS)
  self.assertIn('form.checkValidity()',JS)
  self.assertIn('MAX_CHARS=100000',JS)
 def test_print_full_not_preview(self):
  self.assertIn('body[data-v76-unified="true"] #v653-full-brief',CSS)
  self.assertIn('body[data-v76-unified="true"] .preview',CSS)
  self.assertIn('max-height:none!important',CSS)
 def test_no_auto_send_or_external_ai(self):
  for forbidden in ('fetch(', 'XMLHttpRequest', 'sendBeacon(', 'requests.post', 'new WebSocket', 'localStorage', 'sessionStorage', 'ExecutionPolicy Bypass'):
   with self.subTest(term=forbidden):self.assertNotIn(forbidden,JS)
  self.assertIn('아직 메일이 발송되지는 않았습니다.',JS)
 def test_valid_javascript(self):
  self.assertEqual(subprocess.run(['node','--check',str(ROOT/'assets/v76-contact-unification.js')],capture_output=True).returncode,0)
 def test_version_truthfulness(self):
  m=json.loads((ROOT/'assets/current-release.json').read_text('utf-8'))
  self.assertEqual(m['v76_contact_unification_version'],'V76-20261109')
  self.assertTrue(m['v76_legacy_copy_save_print_uses_complete_packet'])
  self.assertFalse(m['v76_mail_auto_sent'])
  self.assertFalse(m['v76_live_cloudflare_verified'])
  self.assertFalse(m['v76_customer_email_receipt_verified'])
 def test_original_production_36_demos_and_contacts_preserved(self):
  inds=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
  for industry in inds:
   for style in ('modern','premium','editorial'):
    with self.subTest(industry=industry,style=style):self.assertTrue((ROOT/'demo'/industry/style/'index.html').is_file())
  self.assertIn('nineeyes@naver.com',HTML)
if __name__=='__main__':unittest.main(verbosity=2)