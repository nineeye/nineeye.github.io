# -*- coding: utf-8 -*-
"""V87 first-party safety/privacy + real 12-sector 8-function data contracts."""
import unittest,json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1];a=R/'assets'
class V87(unittest.TestCase):
 def test_new_page_semantic(self):
  s=(R/'start-project-v87.html').read_text('utf8')
  for mark in ['data-v87="WEBSTUDIO-V87-20261110"','v87-industry','v87-features','v87-email','v87-save','v87-copy','v87-report','v87-notes']:
   self.assertIn(mark,s)
 def test_legacy_data_dependent(self):
  s=(a/'v87-inquiry.js').read_text('utf8')
  for m in ['AFO_V67_INDUSTRIES','ALLFILEONE_V28_CATALOG','AFO_V77_FEATURE_EXTENSION','keys.length!==12','first.length!==4']:
   self.assertIn(m,s)
 def test_eight_is_simulation_and_unbuilt(self):
  s=(a/'v87-inquiry.js').read_text('utf8')
  self.assertIn("later.filter(x=>x.status==='simulated').length!==3",s)
  self.assertIn("later.filter(x=>x.status==='planned').length!==1",s)
  self.assertIn('가상 시연만 있음',s)
  self.assertIn('현재 미구현',s)
 def test_manual_email_not_backend(self):
  s=(a/'v87-inquiry.js').read_text('utf8')
  self.assertIn('mailto:nineeyes@naver.com?',s)
  self.assertNotRegex(s,r'\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage)\s*\(?')
  self.assertNotIn('form.submit(',s)
 def test_no_guarantee(self):
  s=(R/'start-project-v87.html').read_text('utf8')
  for word in ['29만원','59만원','99만원','예시 시작가','확정 견적','직접','서버','VAT','수정 횟수']:
   self.assertIn(word,s)
 def test_notes_limited(self):
  s=(R/'start-project-v87.html').read_text('utf8')
  self.assertIn('maxlength="500"',s)
  self.assertIn('개인정보 미입력 권장',s)
 def test_links_12_guide_pages(self):
  for k in ('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event'):
   s=(R/'industry-guide'/f'{k}.html').read_text('utf8')
   self.assertIn('id="v87-start"',s)
   self.assertIn('start-project-v87.html?industry='+k,s)
 def test_old_functionality_retained(self):
  self.assertIn('data-v85="WEBSTUDIO-V85-20261109"', (R/'experience-v85.html').read_text('utf8'))
  self.assertTrue((R/'feature-scope-v81.html').is_file())
 def test_current_release_not_falsified(self):
  self.assertIn('V82',(a/'current-release.json').read_text('utf8'))
 def test_site_map(self):
  self.assertIn('<loc>https://allfileone-webstudio.pages.dev/start-project-v87.html</loc>',(R/'sitemap.xml').read_text('utf8'))
if __name__=='__main__':unittest.main()
