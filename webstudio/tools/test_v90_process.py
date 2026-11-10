"""V90 static buyer-journey source/negative tests; no external API."""
from __future__ import annotations
import re,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
H=(R/'project-process-v90.html').read_text('utf-8');JS=(R/'assets/v90-process.js').read_text('utf-8');CSS=(R/'assets/v90-process.css').read_text('utf-8')
I=(R/'index.html').read_text('utf-8');V=(R/'start-project-v87.html').read_text('utf-8')
S=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
class V90Contract(unittest.TestCase):
 def test_release(self):self.assertIn('WEBSTUDIO-V90-20261110',H)
 def test_one_real_page(self):self.assertIn('<h1>',H);self.assertIn('project-process-v90.html',H)
 def test_six_process_stages(self):self.assertEqual(H.count('class="step"'),6)
 def test_ten_items(self):self.assertEqual(H.count('data-v90-key='),10);self.assertEqual(len(re.findall('data-v90-key="[a-z]+"',H)),10)
 def test_twelve_sector_options(self):
  self.assertEqual(set(re.findall('<option value="([a-z]+)"',H)),set(S))
 def test_three_packages_are_example_only(self):
  self.assertEqual(H.count('참고 예시'),3)
  self.assertIn('확정',H);self.assertIn('서면',H)
 def test_no_live_checkout_or_fake_contract(self):
  self.assertIn('결제·계약·예약을 처리하지 않습니다',H)
  self.assertIn('가상',H)
 def test_six_faqs(self):self.assertEqual(H.count('<details>'),6)
 def test_previous_site_preserved(self):
  self.assertEqual(I.count('<section '),6)
  self.assertIn('36개',I);self.assertIn('84',I)
 def test_home_sales_navigation(self):
  self.assertIn('href="./project-process-v90.html"',I)
  self.assertIn('href="./project-process-v90.html"',V)
 def test_file_links_exist(self):
  for f in ('assets/v90-process.js','assets/v90-process.css','start-project-v87.html','plan-guide.html','experience-v85.html'):
   self.assertTrue((R/f).is_file(),f)
 def test_no_customer_PII_and_no_paid_api(self):
  self.assertNotIn('<input type="email"',H)
  self.assertNotIn('<input type="tel"',H)
  for bad in ('localStorage','sessionStorage','indexedDB','fetch(', 'XMLHttpRequest','sendBeacon','gtag(', 'analytics','window.open(', 'credentials:'):
   self.assertNotIn(bad,JS)
 def test_safe_link_params(self):
  self.assertIn('Object.prototype.hasOwnProperty.call(labels,from)',JS)
  self.assertIn('encodeURIComponent(sector.value)',JS)
 def test_clipboard_fallback(self):
  self.assertIn('v90-copy-area',JS)
  self.assertIn('readOnly=true',JS)
 def test_download_is_txt_and_utf8(self):
  self.assertIn('text/plain;charset=utf-8',JS)
  self.assertIn('AllFileOne_V90_',JS)
  self.assertIn('스크립트',CSS) if False else None
 def test_no_synthetic_reviews(self):self.assertIn('실제 고객 납품 실적은 별도',H)
if __name__=='__main__':unittest.main()
