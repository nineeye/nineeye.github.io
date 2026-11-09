# -*- coding: utf-8 -*-
"""V73 regression: don't claim a previous sector/style quote applies after switching."""
from pathlib import Path
import unittest, subprocess, json
R=Path(__file__).resolve().parents[1]
JS=(R/'assets/v72-complete-contact.js').read_text('utf-8')
CSS=(R/'assets/v72-complete-contact.css').read_text('utf-8')
H=(R/'contact.html').read_text('utf-8')
J=json.loads((R/'assets/current-release.json').read_text('utf-8'))
class V73ScopeGuard(unittest.TestCase):
 def test_version_and_existing_compatibility(self):
  self.assertIn("window.AFO_V72_PACKET_VERSION='v72.0'",JS)
  self.assertIn("window.AFO_V73_SCOPE_GUARD='v73.0'",JS)
  self.assertEqual(J['v73_scope_guard_version'],'V73-20261109')
  self.assertTrue(J['v73_stale_quote_explicit_reference_only'])
  self.assertFalse(J['v73_auto_mail_submission'])
  self.assertIn('assets/v72-complete-contact.js',H)
 def test_original_scope_is_observed_not_assumed(self):
  for token in ('originalIndustry','originalStyle','isOriginalChoice','function packet()',"form.elements.namedItem('industry')","form.elements.namedItem('theme')"):
   with self.subTest(token=token):self.assertIn(token,JS)
 def test_mismatched_quote_is_explicit_reference(self):
  for token in ('현재 요청에 적용되지 않음','[참고 기록:',"if(!matched)","[B. 현재 고객이 선택하고",'v73-stale-import'):
   with self.subTest(token=token):self.assertIn(token,JS)
 def test_never_wipe_custom_customer_text(self):
  self.assertIn('detailsInput?.value===inheritedDetails',JS)
  self.assertIn("detailsInput.dispatchEvent(new Event('input',{bubbles:true}))",JS)
  self.assertIn("form.addEventListener('change',()=>{preventInheritedDetailsLeak()",JS)
 def test_accessibility_and_non_submission(self):
  self.assertIn("note.setAttribute('role','status')",JS)
  self.assertIn("note.setAttribute('aria-live','polite')",JS)
  self.assertIn('.v72-packet-note.v73-stale-import',CSS)
  self.assertIn('.v653-import .v71-full-actions button.v653-primary:hover',CSS)
  for bad in ('fetch(', 'XMLHttpRequest','sendBeacon(', 'sessionStorage.', 'localStorage.', 'eval('):
   with self.subTest(bad=bad):self.assertNotIn(bad,JS)
  self.assertEqual(subprocess.run(['node','--check',str(R/'assets/v72-complete-contact.js')],capture_output=True).returncode,0)
 def test_original_36_demos(self):
  for sector in ('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event'):
   for style in ('modern','premium','editorial'):
    with self.subTest(sector=sector,style=style):self.assertTrue((R/'demo'/sector/style/'index.html').is_file())
if __name__=='__main__':unittest.main(verbosity=2)