from pathlib import Path
from html.parser import HTMLParser
import unittest, re, hashlib
R=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=[];self.sections=[];self.nav=[];self.innav=0;self.images=[];self.meta={}
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if 'id' in d:self.ids.append(d['id'])
  if tag=='section':self.sections.append(d)
  if tag=='nav':self.innav+=1
  if tag=='a':
   self.links.append(d.get('href',''))
   if self.innav:self.nav.append(d)
  if tag=='img':self.images.append(d)
  if tag=='meta' and d.get('name'):self.meta[d['name']]=d.get('content','')
 def handle_endtag(self,tag):
  if tag=='nav':self.innav-=1
class V89Landing(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.s=(R/'index.html').read_text('utf8');cls.p=Parser();cls.p.feed(cls.s)
 def test_compressed(self):
  self.assertEqual(len(self.p.sections),6)
  self.assertEqual(len(self.p.nav),4)
 def test_assets_present(self):
  for x in ('assets/v89-home.css','assets/v89-home.js','assets/v89-social-card.png',
    'assets/v89-preview-manufacturing.webp','assets/v89-preview-academy.webp','assets/v89-preview-interior.webp','home-archive-v88.html'):
   self.assertTrue((R/x).is_file(),x)
 def test_all_internal_links_exist(self):
  for url in self.p.links:
   if url.startswith('#'):
    self.assertIn(url[1:],self.p.ids,url)
   elif url.startswith('./'):
    path=url[2:].split('?',1)[0].split('#',1)[0]
    self.assertTrue((R/path).is_file(),path)
 def test_no_fake_reviews_or_customers(self):
  self.assertIn('가상 시연',self.s)
  self.assertIn('실제 고객 납품 실적을 뜻하지 않습니다',self.s)
  self.assertIn('확정 판매가격이 아닙니다',self.s)
  self.assertIn('실제 접수는 고객이 메일을 보내야',self.s)
  self.assertNotIn('이미 450건',' '.join([self.s]))
 def test_legacy_immutable(self):
  a=(R/'home-archive-v88.html').read_text('utf8')
  self.assertIn('noindex,nofollow',a)
  self.assertGreater(len(a),len(self.s))
 def test_search_social(self):
  self.assertEqual(self.p.meta['site-current-version'],'WEBSTUDIO-V89-20261110')
  self.assertIn('og:image',self.s)
 def test_12_industry_options(self):
  self.assertEqual(self.s.count('<option value='),12)
 def test_user_links(self):
  for s in ('./experience-v85.html','./start-project-v87.html','./plan-guide.html','./feature-scope-v81.html','./industry-guide/index.html','./design-studio-v84.html'):
   self.assertIn(s,self.s)
 def test_source_only_no_external_behavior(self):
  s=(R/'assets/v89-home.js').read_text('utf8')
  for w in ('fetch(', 'XMLHttpRequest','sendBeacon','localStorage','sessionStorage','navigator.clipboard','innerHTML'):
   self.assertNotIn(w,s)
 def test_sample_images_are_real_pngs(self):
  for x in self.p.images:
   path=(R/x['src'].removeprefix('./'));self.assertTrue(path.is_file())
   self.assertEqual(path.read_bytes()[:4],b'RIFF');self.assertEqual(path.read_bytes()[8:12],b'WEBP')
if __name__=='__main__':unittest.main()
