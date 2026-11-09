from pathlib import Path
import unittest,v88_public_probe as M
R=Path(__file__).resolve().parents[1]
class Public(unittest.TestCase):
 def test_exact_nine(self):self.assertEqual(len(M.CHECKS),9)
 def test_source_fixture(self):
  for origin in M.ALLOWED_ORIGINS:
   r=M.check(origin=origin,getter=lambda p:(R/p).read_text('utf-8'))
   self.assertEqual(r['passed'],9,str(r['rows']))
   self.assertEqual(r['mail_received'],'NOT_VERIFIED')
 def test_missing_fails(self):
  r=M.check(getter=lambda p:'')
  self.assertEqual(r['passed'],0);self.assertEqual(r['status'],'HOLD_V88_PUBLIC_FILES')
 def test_one_asset_missing(self):
  r=M.check(getter=lambda p: '' if p.endswith('v88-launch-check.js') else (R/p).read_text('utf-8'))
  self.assertEqual(r['passed'],8)
 def test_wrong_source_rejected(self):
  with self.assertRaises(ValueError):M.check(origin='https://example.net/')
if __name__=='__main__':unittest.main()
