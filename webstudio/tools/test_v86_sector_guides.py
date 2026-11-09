# -*- coding: utf-8 -*-
"""V86 first party sales guide integrity. No paid services or external network."""
import unittest, re, json, subprocess
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote

ROOT=Path(__file__).resolve().parents[1]/'site' if (Path(__file__).resolve().parents[1]/'site').is_dir() else Path(__file__).resolve().parents[1]
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')

class Elements(HTMLParser):
 def __init__(self):super().__init__();self.tags=[]
 def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))

class V86Source(unittest.TestCase):
 def test_twelve_unique_accessible_industry_files(self):
  d=ROOT/'industry-guide'
  self.assertEqual(len(list(d.glob('*.html'))),13)
  for s in SECTORS:
   p=d/(s+'.html');text=p.read_text('utf-8')
   self.assertIn('data-v86-industry="'+s+'"',text)
   self.assertIn('aria-label="목표 선택"',text)
   self.assertIn('고객',text)
   self.assertIn('실제 운영',text)
   self.assertIn('/industry-guide/'+s+'.html',text)
   self.assertIn('id="v86-download"',text)
   self.assertNotIn('실제 고객 납품 성공',text)
 def test_goals_three_distinct_and_no_missing_function(self):
  for s in SECTORS:
   parser=Elements();parser.feed((ROOT/'industry-guide'/f'{s}.html').read_text('utf-8'))
   buttons=[attrs for tag,attrs in parser.tags if tag=='button' and 'data-v86-goal' in attrs]
   self.assertEqual(len(buttons),3,s)
   self.assertEqual({attrs['data-v86-goal'] for attrs in buttons}, {'0','1','2'})
   for b in buttons:
    indices={int(x) for x in b['data-v86-highlight'].split(',')}
    self.assertEqual(len(indices),3,s)
    self.assertTrue(indices<=set(range(7)),s)
   self.assertEqual(sum('data-v86-feature' in attrs for _,attrs in parser.tags),7,s)
   self.assertEqual(sum('data-v86-style' in attrs for _,attrs in parser.tags),3,s)
   self.assertEqual(sum('data-v86-check' in attrs for _,attrs in parser.tags),4,s)
 def test_every_referenced_local_asset_and_anchor_resolves(self):
  for file in [ROOT/'index.html',ROOT/'experience-v85.html',ROOT/'industry-guide'/'index.html']+list((ROOT/'industry-guide').glob('*.html')):
   parser=Elements();parser.feed(file.read_text('utf-8'))
   for tag,attrs in parser.tags:
    for key in ('href','src'):
     value=attrs.get(key,'')
     if not value or value.startswith(('#','mailto:','tel:','data:','https:','http:','javascript:')):continue
     path=unquote(urlsplit(value).path)
     target=(file.parent/path).resolve()
     self.assertTrue(target.is_relative_to(ROOT.resolve()), f'path escape {file}: {value}')
     self.assertTrue(target.is_file() or (target.is_dir() and (target/'index.html').is_file()),f'missing {file}:{value}')
 def test_sitemap_and_buyer_navigation(self):
  index=(ROOT/'index.html').read_text('utf-8');showroom=(ROOT/'experience-v85.html').read_text('utf-8')
  site=(ROOT/'sitemap.xml').read_text('utf-8')
  self.assertIn('industry-guide/index.html',index)
  self.assertIn('industry-guide/index.html',showroom)
  for s in SECTORS:self.assertIn('industry-guide/'+s+'.html',site)
 def test_guide_links_actual_samples_only(self):
  for s in SECTORS:
   text=(ROOT/'industry-guide'/(s+'.html')).read_text('utf-8')
   for t in ('modern','premium','editorial'):
    self.assertIn('../demo/'+s+'/'+t+'/index.html',text)
    self.assertIn('assets/v13-shots/'+s+'-'+t+'.svg',text)
   self.assertIn('feature-lab-v80.html?industry='+s,text)
 def test_no_sensitive_data_or_real_transaction_claims(self):
  js=(ROOT/'assets/v86-guide.js').read_text('utf-8')
  for banned in ('fetch(', 'XMLHttpRequest','sendBeacon','localStorage','method="POST"','smtplib','openai.com/api'):
   self.assertNotIn(banned,js)
  self.assertIn('URL.createObjectURL',js)
  self.assertIn('replaceState',js)
 def test_javascript_parses(self):
  script=ROOT/'assets/v86-guide.js'
  proc=subprocess.run(['node','--check',str(script)],capture_output=True,text=True)
  self.assertEqual(proc.returncode,0,proc.stderr)

if __name__=='__main__':unittest.main(verbosity=2)
