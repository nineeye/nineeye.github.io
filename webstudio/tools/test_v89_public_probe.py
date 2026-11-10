from pathlib import Path
import unittest
import v89_public_probe as P
R=Path(__file__).resolve().parents[1]
class ProbeQA(unittest.TestCase):
 def local(self,p):return (R/p).read_bytes()
 def test_local_all_files(self):
  p=P.check(getter=self.local)
  self.assertEqual((p['passed'],p['total']),(10,10))
 def test_bad_200_fallback_rejected(self):
  def fake(p):
   if p=='assets/v89-home.js':return (R/'index.html').read_bytes()
   return self.local(p)
  self.assertEqual(P.check(getter=fake)['status'],'HOLD_V89_PUBLIC')
 def test_wrong_image_body_rejected(self):
  def fake(p):
   if p.endswith('v89-social-card.png'):return b'<html>fallback</html>'
   return self.local(p)
  self.assertEqual(P.check(getter=fake)['status'],'HOLD_V89_PUBLIC')
 def test_missing_file_holds(self):
  def fake(p):
   if p=='home-archive-v88.html':raise FileNotFoundError('missing archive')
   return self.local(p)
  self.assertEqual(P.check(getter=fake)['status'],'HOLD_V89_PUBLIC')
 def test_only_owner_hosts(self):
  for origin in ('http://allfileone-webstudio.pages.dev/','https://example.com/','https://nineeye.github.io/'):
   with self.assertRaises(ValueError):P.check(getter=self.local,origin=origin)
 def test_nested_index_url_normalize(self):
  self.assertEqual(P.normalized('/webstudio/index.html'),P.normalized('/webstudio/'))
  self.assertNotEqual(P.normalized('/webstudio/index.html'),P.normalized('/webstudio/demo/'))
if __name__=='__main__':unittest.main()
