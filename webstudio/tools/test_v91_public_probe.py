"""Fail-closed public V91 origin/route/marker tests with offline synthetic getter."""
from pathlib import Path
import unittest
import v91_public_probe as M
P=Path(__file__).resolve().parents[1];R=P if (P/'quote-scope-v91.html').is_file() else P/'SITE'
class V91Public(unittest.TestCase):
 def test_7_files(self):self.assertEqual(len(M.CHECKS),7)
 def test_both_origins_independent(self):
  for origin in M.ALLOWED:
   with self.subTest(origin=origin):
    r=M.check(origin,getter=lambda p:(R/p).read_text('utf-8'))
    self.assertEqual(r['status'],'PASS_V91_PUBLIC_FILES_ONLY',r['rows'])
    self.assertEqual(r['passed'],7)
    self.assertEqual(r['naver_mail_receipt'],'NOT_VERIFIED')
 def test_fake_200_fallback_rejected(self):
  r=M.check(getter=lambda p:'<html>this page loads, but wrong content</html>')
  self.assertEqual(r['passed'],0);self.assertEqual(r['status'],'HOLD_V91_PUBLIC')
 def test_missing_asset_holds(self):
  def broken(p):
   if p=='assets/v91-quote.js':raise FileNotFoundError('missing')
   return (R/p).read_text('utf-8')
  r=M.check(getter=broken)
  self.assertEqual(r['passed'],6)
 def test_wrong_origin_rejected(self):
  for u in ('https://example.com/','https://nineeye.github.io/','http://nineeye.github.io/webstudio/','https://allfileone-webstudio.pages.dev/other/'):
   with self.subTest(u=u),self.assertRaises(ValueError):M.check(u,getter=lambda p:'')
 def test_nested_index_canonical(self):self.assertEqual(M.norm('/demo/manufacturing/modern/index.html'),'/demo/manufacturing/modern')
 def test_wrong_route(self):self.assertNotEqual(M.norm('/quote-scope-v91.html'),M.norm('/index.html'))
if __name__=='__main__':unittest.main()
