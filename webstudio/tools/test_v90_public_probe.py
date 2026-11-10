from pathlib import Path
import unittest
import v90_public_probe as P
R=Path(__file__).resolve().parents[1]
class V90PublicProbeContract(unittest.TestCase):
 def local(self,p):return (R/p).read_text('utf-8-sig')
 def test_all_local_source_markers(self):
  r=P.check(getter=self.local);self.assertEqual((r['passed'],r['total']),(6,6))
 def test_failed_source_does_not_pass(self):
  def fake(p):return '<html>200 fallback</html>' if p=='project-process-v90.html' else self.local(p)
  self.assertEqual(P.check(getter=fake)['status'],'HOLD_V90_PUBLIC')
 def test_old_home_does_not_pass(self):
  def fake(p):return (R/'home-archive-v88.html').read_text('utf-8') if p=='index.html' else self.local(p)
  self.assertEqual(P.check(getter=fake)['status'],'HOLD_V90_PUBLIC')
 def test_missing_js_does_not_pass(self):
  def fake(p):
   if p.endswith('v90-process.js'):raise FileNotFoundError('missing script')
   return self.local(p)
  self.assertEqual(P.check(getter=fake)['passed'],5)
 def test_allowlist_prevents_wrong_origin(self):
  for x in ('http://allfileone-webstudio.pages.dev/','https://example.com','https://nineeye.github.io/'):
   with self.assertRaises(ValueError):P.check(origin=x,getter=self.local)
 def test_legitimate_canonical_redirect(self):
  self.assertEqual(P.norm('/webstudio/index.html'),P.norm('/webstudio/'))
  self.assertNotEqual(P.norm('/webstudio/index.html'),P.norm('/webstudio/project-process-v90.html'))
if __name__=='__main__':unittest.main()
