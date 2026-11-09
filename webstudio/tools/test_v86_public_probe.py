# -*- coding: utf-8 -*-
import unittest, tempfile, json
from pathlib import Path
import v86_public_probe as M
ROOT=Path(__file__).resolve().parents[1]
if (ROOT/'site').is_dir():ROOT=ROOT/'site'

def source(path):return (ROOT/path).read_text('utf-8')
class PublicV86Proof(unittest.TestCase):
 def test_all_18_actual_source_matches(self):
  r=M.inspect(get=source)
  self.assertEqual((r['passed'],r['total']),(18,18))
  self.assertEqual(r['status'],'PASS_V86_PUBLIC_FILES_ONLY')
  self.assertEqual(r['customer_inbox_received'],'NOT_VERIFIED')
 def test_no_homepage_fallback_as_200_false_pass(self):
  fake=(ROOT/'index.html').read_text('utf-8')
  r=M.inspect(get=lambda path:fake if path=='industry-guide/clinic.html' else source(path))
  self.assertEqual(r['status'],'HOLD_V86_PUBLIC')
  self.assertEqual(r['passed'],17)
 def test_missing_one_guide_is_hold(self):
  def getter(path):
   if path=='industry-guide/event.html':raise FileNotFoundError(path)
   return source(path)
  r=M.inspect(get=getter)
  self.assertEqual((r['passed'],r['total']),(17,18))
 def test_unrelated_origin_never_passes(self):
  for origin in ('http://nineeye.github.io/webstudio/','https://foo.example.com/','https://nineeye.github.io/'):
   with self.subTest(origin=origin),self.assertRaises(ValueError):M.inspect(origin=origin,get=source)
 def test_guide_one_fake_feature_is_hold(self):
  body=source('industry-guide/manufacturing.html')
  r=M.inspect(get=lambda p:body.replace('data-v86-feature=', 'data-broken=') if p=='industry-guide/manufacturing.html' else source(p))
  self.assertEqual(r['status'],'HOLD_V86_PUBLIC')
 def test_report_is_read_only_and_clear(self):
  r=M.inspect(get=source)
  with tempfile.TemporaryDirectory() as folder:
   js,ko=M.write_report(r,folder)
   self.assertEqual(json.loads(js.read_text('utf-8'))['customer_inbox_received'],'NOT_VERIFIED')
   self.assertIn('이메일',ko.read_text('utf-8-sig'))
if __name__=='__main__':unittest.main()
