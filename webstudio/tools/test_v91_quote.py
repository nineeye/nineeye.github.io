"""V91 static source/contract safeguards. No customer network calls."""
from pathlib import Path
import json,re,unittest,subprocess
P=Path(__file__).resolve().parents[1];R=P if (P/'quote-scope-v91.html').is_file() else P/'SITE'
HTML=(R/'quote-scope-v91.html').read_text('utf-8')
JS=(R/'assets/v91-quote.js').read_text('utf-8')
CSS=(R/'assets/v91-quote.css').read_text('utf-8')
class QuoteContract(unittest.TestCase):
 def test_marker(self):self.assertIn('WEBSTUDIO-V91-20261110',HTML)
 def test_no_browser_network(self):
  for pat in ('fetch(', 'XMLHttpRequest','sendBeacon','navigator.serviceWorker','localStorage','sessionStorage','document.cookie','<form action=', 'method="post"','https://api.'):
   with self.subTest(pat=pat):self.assertNotIn(pat,JS if pat in ('localStorage','sessionStorage') else JS+HTML)
 def test_input_names_private_free(self):
  for word in ('type="email"','type="tel"','name="password"','name="phone"'):
   with self.subTest(word=word):self.assertNotIn(word,HTML)
 def test_twelve_sector_options(self):self.assertEqual(len(re.findall(r'<option value="(?:manufacturing|corporate|clinic|academy|interior|commerce|professional|association|franchise|stay|realestate|event)">',HTML)),12)
 def test_eight_optional_features(self):self.assertEqual(len(re.findall(r'type="checkbox" value=',HTML)),8)
 def test_unbuilt_integrations_disclosed(self):
  for x in ('실제 예약 연동','실제 결제 연동','회원·개인정보 관리','재고·CRM·외부 API','별도 구축'):
   with self.subTest(x=x):self.assertIn(x,HTML)
 def test_costs_not_set_contract(self):
  for x in ('참고','합의 전','확정 견적','서면','VAT'):
   with self.subTest(x=x):self.assertIn(x,HTML)
 def test_email_not_auto_sent(self):
  self.assertIn('mailto:nineeyes@naver.com',JS+HTML)
  self.assertIn('전송은 완료되지 않습니다',HTML)
 def test_exports_buttons(self):
  for id in ('v91-save','v91-copy','v91-print','v91-reset','v91-fallback','v91-mail','v91-feedback','v91-demo'):
   with self.subTest(id=id):self.assertIn('id="'+id+'"',HTML)
 def test_escape_html(self):self.assertIn('dd.textContent=v',JS)
 def test_only_safe_url_fields(self):self.assertIn("['industry','style','plan']",JS)
 def test_source_no_tracking(self):
  for x in ('gtag(', 'analytics.js', 'facebook.com/tr', 'pixel', 'tracker'):
   with self.subTest(x=x):self.assertNotIn(x,JS)
 def test_positive_price_validation(self):self.assertIn("numCost>=0&&numCost<=1e12",JS)
 def test_accessibility_labels(self):
  for x in ('<main>','<h1>', 'aria-live="polite"','class="skip"','<fieldset>'):
   with self.subTest(x=x):self.assertIn(x,HTML)
 def test_print_css(self):self.assertIn('@media print',CSS)
 def test_mobile_css(self):self.assertIn('@media(max-width:740px)',CSS)
 def test_existing_routes(self):
  for name in ('experience-v85.html','start-project-v87.html','project-process-v90.html','plan-guide.html'):
   with self.subTest(name=name):self.assertTrue((R/name).is_file())
 def test_main_menu_four_preserved(self):
  s=(R/'index.html').read_text('utf-8')
  self.assertIn('href="./quote-scope-v91.html"',s)
  self.assertEqual(len(re.findall(r'<nav class="nav"[^>]*>([\s\S]*?)</nav>',s)),1)
 def test_links_integrated(self):
  for p in ('index.html','project-process-v90.html','start-project-v87.html','sitemap.xml'):
   with self.subTest(p=p):self.assertIn('quote-scope-v91.html',(R/p).read_text('utf-8'))
 def test_node_syntax(self):
  p=subprocess.run(['node','--check',str(R/'assets/v91-quote.js')],capture_output=True,text=True)
  self.assertEqual(p.returncode,0,p.stderr)
if __name__=='__main__':unittest.main()
