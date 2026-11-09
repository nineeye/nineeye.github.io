"""V88 contract tests: source, privacy, free runtime, and fail-closed manual proof."""
from pathlib import Path
import re, unittest
R=Path(__file__).resolve().parents[1]
class V88Source(unittest.TestCase):
 def test_linked_assets(self):
  for name in ('v88-launch-check.js','v88-launch-check.css','v88-mail-fallback.js','v88-mail-fallback.css'):self.assertTrue((R/'assets'/name).is_file())
 def test_exact_30_checks(self):
  s=(R/'launch-readiness-v88.html').read_text('utf-8');self.assertEqual(len(re.findall(r'data-v88-check="\d+-\d+"',s)),30)
 def test_independent_check_groups(self):
  s=(R/'launch-readiness-v88.html').read_text('utf-8');self.assertEqual(s.count('class="v88-group"'),5)
 def test_no_self_certification(self):
  s=(R/'assets/v88-launch-check.js').read_text('utf-8');self.assertIn('외부 증거는 별도',s);self.assertIn('미확인',s)
 def test_no_password_inputs(self):
  s=(R/'launch-readiness-v88.html').read_text('utf-8');self.assertNotIn('type="password"',s)
 def test_no_auto_send(self):
  for f in ('v88-launch-check.js','v88-mail-fallback.js'):
   s=(R/'assets'/f).read_text('utf-8');self.assertNotRegex(s,r'\bfetch\s*\(|XMLHttpRequest|localStorage\s*\.|sessionStorage\s*\.|sendBeacon\s*\(')
 def test_only_owner_clicks(self):
  s=(R/'assets/v88-launch-check.js').read_text('utf-8');self.assertIn("addEventListener('click'",s)
 def test_sitemap_not_owner(self):
  self.assertNotIn('launch-readiness-v88', (R/'sitemap.xml').read_text('utf-8'))
 def test_owner_page_noindex(self):
  self.assertIn('noindex,nofollow,noarchive',(R/'launch-readiness-v88.html').read_text('utf-8'))
 def test_owner_not_private(self):
  s=(R/'launch-readiness-v88.html').read_text('utf-8');self.assertIn('공개',s);self.assertNotIn('관리자 로그인',s)
 def test_v87_source_unchanged_script(self):
  self.assertIn('window.AFO_V87_INQUIRY_READY=true',(R/'assets/v87-inquiry.js').read_text('utf-8'))
 def test_v88_manual_escape(self):
  s=(R/'start-project-v87.html').read_text('utf-8');self.assertIn('id="v88-manual-wrap"',s);self.assertIn('id="v88-copy-body"',s);self.assertIn('v88-mail-fallback.js',s)
 def test_sender_address_canonical(self):
  for f in ('start-project-v87.html','launch-readiness-v88.html','assets/v88-mail-fallback.js'):self.assertIn('nineeyes@naver.com',(R/f).read_text('utf-8'))
 def test_no_confirmed_contract_claim(self):
  s=(R/'README_V88_KO.md').read_text('utf-8');self.assertIn('남은 업무',s)
 def test_contact_link(self):
  self.assertIn('start-project-v87.html#v88-helper-heading',(R/'contact.html').read_text('utf-8'))
 def test_existing_ops_link(self):
  self.assertIn('launch-readiness-v88.html',(R/'ops-check.html').read_text('utf-8'))
 def test_no_real_booking_claim(self):
  s=(R/'ROADMAP_V88_KO.md').read_text('utf-8');self.assertIn('미완료',s)
if __name__=='__main__':unittest.main()
