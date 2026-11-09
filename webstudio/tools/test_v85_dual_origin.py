# -*- coding: utf-8 -*-
"""GitHub Pages alternative cannot be mistaken for Cloudflare's production status."""
import unittest
import v85_public_probe as M

class DualOriginContract(unittest.TestCase):
 def test_exact_two_owned_origins_only(self):
  self.assertEqual(len(M.ALLOWED_ORIGINS),2)
  self.assertIn('https://allfileone-webstudio.pages.dev/',M.ALLOWED_ORIGINS)
  self.assertIn('https://nineeye.github.io/webstudio/',M.ALLOWED_ORIGINS)
 def test_wrong_host_not_permitted(self):
  for u in ('http://nineeye.github.io/webstudio/','https://nineeye.github.io/',
            'https://example.com/','https://allfileone-webstudio.pages.dev/evil/'):
   with self.subTest(origin=u),self.assertRaises(ValueError):
    M.check(getter=lambda path:'',origin=u)
 def test_two_origins_independent_and_no_false_email(self):
  from pathlib import Path
  root=Path(__file__).resolve().parents[1]
  for origin in M.ALLOWED_ORIGINS:
   result=M.check(getter=lambda path:(root/path).read_text('utf-8'),origin=origin)
   self.assertEqual(result['status'],'PASS_V85_PUBLIC_FILES_ONLY')
   self.assertEqual(result['origin'],origin)
   self.assertEqual(result['customer_email_received'],'NOT_VERIFIED')
if __name__=='__main__':unittest.main()
