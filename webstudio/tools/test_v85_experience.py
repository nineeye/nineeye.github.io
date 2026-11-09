# -*- coding: utf-8 -*-
"""Source-only V85 and negative release tests; never claim real customer booking/email."""
import importlib.util,json,re,sys,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
P=Path(__file__).with_name('v85_public_probe.py')
sys.path.insert(0,str(P.parent))
import v85_public_probe as M
class V85SourceQA(unittest.TestCase):
 def test_source_44_of_44(self):
  out=M.check(getter=lambda p:(R/p).read_text('utf-8'))
  self.assertEqual((out['pass'],out['total']),(44,44))
  self.assertEqual(out['customer_email_received'],'NOT_VERIFIED')
 def test_expected_path_count_unique(self):
  paths=[p for _,p,_ in M.CHECKS]
  self.assertEqual(len(paths),44)
  self.assertEqual(len(set(paths)),44)
  self.assertEqual(len([x for x in paths if x.startswith('demo/')]),36)
 def test_missing_new_page_must_hold(self):
  def broken(p):
   if p=='experience-v85.html':raise FileNotFoundError('missing')
   return (R/p).read_text('utf-8')
  self.assertEqual(M.check(getter=broken)['status'],'HOLD_V85_PUBLIC')
 def test_html_200_homepage_fallback_must_hold(self):
  home=(R/'index.html').read_text('utf-8')
  def fallback(p):return home if p=='experience-v85.html' else (R/p).read_text('utf-8')
  out=M.check(getter=fallback)
  self.assertEqual(out['status'],'HOLD_V85_PUBLIC')
  self.assertEqual(out['records'][1]['state'],'HOLD')
 def test_wrong_industry_or_style_never_accepted(self):
  a=(R/'demo/manufacturing/modern/index.html').read_text('utf-8')
  def wrong(p):return a if p=='demo/clinic/editorial/index.html' else (R/p).read_text('utf-8')
  self.assertEqual(M.check(getter=wrong)['status'],'HOLD_V85_PUBLIC')
 def test_explicit_no_real_backend_and_safe_links(self):
  h=(R/'experience-v85.html').read_text('utf-8');s=(R/'assets/v85-experience.js').read_text('utf-8')
  self.assertIn('가상 데이터',h)
  self.assertIn('실제 고객 납품 실적',h)
  self.assertIn('feature-scope-v81.html',s)
  self.assertIn('textContent',s)
  self.assertNotIn('innerHTML',s)
  for bad in ('fetch(',"method:'POST'",'smtplib','openai.com/api','automaticPayment('):self.assertNotIn(bad,s)
 def test_three_styles_twelve_sectors_original_catalogue(self):
  self.assertEqual(len(M.STYLES),3);self.assertEqual(len(M.SECTORS),12)
  self.assertEqual((R/'experience-v85.html').read_text('utf-8').count('data-v85-style-card='),3)
  for sector in M.SECTORS:
   for style in M.STYLES:
    self.assertTrue((R/f'demo/{sector}/{style}/index.html').is_file())
 def test_local_report_not_claim_browser_or_email(self):
  import tempfile
  with tempfile.TemporaryDirectory() as d:
   out=M.check(getter=lambda p:(R/p).read_text('utf-8'))
   j,t=M.save(out,d)
   self.assertEqual(json.loads(j.read_text('utf-8'))['customer_email_received'],'NOT_VERIFIED')
   self.assertIn('실제 예약',t.read_text('utf-8-sig'))
if __name__=='__main__':unittest.main()
