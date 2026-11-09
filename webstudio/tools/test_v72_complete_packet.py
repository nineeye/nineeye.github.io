# -*- coding: utf-8 -*-
"""V72: existing contact CTAs now export the current complete packet, not stale 700 chars."""
from pathlib import Path
import unittest,subprocess
R=Path(__file__).resolve().parents[1]
H=(R/'contact.html').read_text('utf8')
JS=(R/'assets/v72-complete-contact.js').read_text('utf8')
CSS=(R/'assets/v72-complete-contact.css').read_text('utf8')
class V72Packet(unittest.TestCase):
 def test_script_installed_after_importer(self):
  self.assertEqual(H.count('assets/v72-complete-contact.js'),1)
  self.assertLess(H.index('v653-sales-bridge.js'),H.index('v72-complete-contact.js'))
  self.assertIn('assets/v72-complete-contact.css',H)
 def test_complete_current_form_data_merged_with_original(self):
  for v in ('const seed=pre.textContent','standard.textContent','function packet()',"form.addEventListener('input'", "form.addEventListener('change'",'queueMicrotask(refresh)','pre.textContent=packet()'):
   with self.subTest(v=v):self.assertIn(v,JS)
 def test_override_all_ctas(self):
  for v in ("'brief-copy','brief-download','brief-email'",'capture(buttons[0],copyFull)','capture(buttons[1],saveFull)', 'capture(baseButtons[0],copyFull)','capture(baseButtons[1],saveFull)','capture(baseButtons[2]', 'event.stopImmediatePropagation()'):
   with self.subTest(v=v):self.assertIn(v,JS)
 def test_download_contains_bom_and_no_truncate(self):
  for v in ("['\\ufeff',packet()]", 'AllFileOne_V72_Complete_Consultation.txt','setTimeout(()=>URL.revokeObjectURL(url),4000)', 'navigator.clipboard.writeText(packet())'):
   with self.subTest(v=v):self.assertIn(v,JS)
 def test_mailto_no_claimed_receipt(self):
  self.assertIn('mailto:nineeyes@naver.com?subject=',JS)
  self.assertIn('if(uri.length>1750)',JS)
  self.assertIn('이메일은 자동 전송되지 않았으며 직접 보내야 합니다',JS)
  for bad in ('fetch(', 'XMLHttpRequest','sendBeacon(', 'localStorage.', 'sessionStorage.', 'eval(', 'api.openai.com'):
   with self.subTest(v=bad):self.assertNotIn(bad,JS)
 def test_malformed_or_unimported_safe_noop(self):
  self.assertIn('if(!form||!imported||!pre||!actions||!standard||imported.dataset.v72Ready)return;',JS)
  self.assertIn("imported.dataset.v72Ready='true'",JS)
 def test_accessible_mobile_export(self):
  self.assertIn('@media(max-width:560px)',CSS)
  self.assertIn('aria-label',JS)
  self.assertEqual(subprocess.run(['node','--check',str(R/'assets/v72-complete-contact.js')],capture_output=True).returncode,0)
if __name__=='__main__':unittest.main(verbosity=2)