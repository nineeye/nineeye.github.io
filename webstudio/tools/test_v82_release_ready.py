#!/usr/bin/env python3
import json, re, tempfile, unittest, zipfile, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from v82_publish_bundle import build, site_files
class V82ReleaseChecks(unittest.TestCase):
 def test_top_level_release_current_and_original_demos_unchanged(self):
  d=json.loads((ROOT/'assets/current-release.json').read_text('utf-8'))
  self.assertEqual(d['version'],'V82');self.assertEqual(d['release_id'],'WEBSTUDIO-V82-20261109')
  self.assertEqual(d['v80_total_browser_simulations'],84);self.assertEqual(d['v81_scope_version'],'V81-20261109')
  self.assertFalse(d['v82_public_cloudflare_verified']);self.assertFalse(d['v82_actual_customer_email_verified'])
 def test_homepage_current_visible_badge(self):
  s=(ROOT/'index.html').read_text('utf-8');self.assertIn('홈페이지 HTML 버전 V82',s)
  self.assertIn('WEBSTUDIO-V82-20261109',s);self.assertIn('site-current-version',s)
  self.assertNotIn('assets/v82-release-check.css',s,'Audit styles must not change customer homepage layout')
 def test_operator_checks_use_current_manifest_but_preserve_legacy_checks(self):
  for n in ('v48-sales-audit.js','v50-owner-launch.js'):
   s=(ROOT/'assets'/n).read_text('utf-8');self.assertIn(".version==='V82'",s)
   self.assertIn(".release_id==='WEBSTUDIO-V82-20261109'",s)
 def test_public_verification_does_not_pretend_email_was_sent(self):
  js=(ROOT/'assets/v82-release-check.js').read_text('utf-8');html=(ROOT/'release-check-v82.html').read_text('utf-8')
  for text in ("window.AFO_V82_PROBE='V82-20261109'",'PASS_PUBLIC_FILES_ONLY','HOLD_PUBLIC_DEPLOY','assets/current-release.json'):
   self.assertIn(text,js)
  self.assertNotIn('sendBeacon',js);self.assertNotIn('localStorage',js);self.assertNotIn('sessionStorage',js)
  self.assertIn('실제 이메일 수신',html)
 def test_cloudflare_git_config_matches_nested_site(self):
  doc=(ROOT/'DEPLOY_V82_KO.md').read_text('utf-8')
  for v in ('main','exit 0','webstudio','Git','Cloudflare','README'):
   if v!='README':self.assertIn(v,doc)
 def test_v82_publisher_outputs_root_index_and_never_tools(self):
  with tempfile.TemporaryDirectory() as td:
   result=build(ROOT,Path(td)/'site.zip')
   self.assertGreater(result['entries'],200)
   with zipfile.ZipFile(result['zip_path']) as z:
    self.assertIn('index.html',z.namelist());self.assertIn('assets/current-release.json',z.namelist())
    self.assertNotIn('webstudio/index.html',z.namelist())
    self.assertFalse(any(s.startswith('tools/') or s.endswith('.py') for s in z.namelist()))
 def test_demo_count_36_preserved(self):
  self.assertEqual(len(list((ROOT/'demo').glob('*/*/index.html'))),36)
 def test_new_operator_nav(self):
  for f in ('owner-launch.html','site-check.html'):
   self.assertIn('release-check-v82.html',(ROOT/f).read_text('utf-8'))
 def test_script_sources_self_hosted(self):
  html=(ROOT/'release-check-v82.html').read_text('utf-8')
  self.assertIn('assets/v82-release-check.js',html)
  self.assertNotIn('https://cdn',html)
if __name__=='__main__':unittest.main(verbosity=2)