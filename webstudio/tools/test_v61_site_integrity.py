"""V61 zero-network static source integrity regression tests. stdlib unittest only."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

TOOL=Path(__file__).resolve().parents[1]/'tools'/'v61_site_integrity.py'
spec=importlib.util.spec_from_file_location('v61_site_integrity',TOOL)
mod=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=mod
spec.loader.exec_module(mod)

class Fixture(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)
        self.write('index.html', '<html><body><h1 id="hero">홈</h1><a href="detail.html#details">상세</a><a href="mailto:hello@example.com">메일</a><img alt="" src="assets/logo.svg"><link rel="stylesheet" href="assets/s.css"></body></html>')
        self.write('detail.html', '<html><body><main id="details">내용</main><a href="index.html">홈</a></body></html>')
        self.write('assets/s.css', '.a{background:url(logo.svg)}')
        self.write('assets/logo.svg','<svg xmlns="http://www.w3.org/2000/svg"></svg>')
        self.write('assets/current-release.json',json.dumps({'version':'V61','release_id':'WEBSTUDIO-V61-20261108'}))
        self.write('sitemap.xml','<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://allfileone-webstudio.pages.dev/index.html</loc></url></urlset>')
    def tearDown(self):self.tmp.cleanup()
    def write(self,path,value):
        p=self.root/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(value,encoding='utf-8')
    def audit(self):return mod.audit(self.root)
    def check_kind(self,kind):return any(x['kind']==kind for x in self.audit()['failures'])
    def test_valid_fixture(self):self.assertTrue(self.audit()['pass'])
    def test_two_html(self):self.assertEqual(self.audit()['html_total'],2)
    def test_one_css(self):self.assertEqual(self.audit()['css_total'],1)
    def test_html_link_count(self):self.assertGreaterEqual(self.audit()['counts']['html_url_pass'],4)
    def test_css_url_checked(self):self.assertEqual(self.audit()['counts']['css_url_checked'],1)
    def test_sitemap_resolved(self):self.assertEqual(self.audit()['counts']['sitemap_urls_pass'],1)
    def test_missing_html_link(self):
        self.write('index.html','<a href="nope.html">못찾음</a>')
        self.assertTrue(self.check_kind('MISSING_STATIC_FILE'))
    def test_missing_script(self):
        self.write('index.html','<script src="assets/missing.js"></script>')
        self.assertTrue(self.check_kind('MISSING_STATIC_FILE'))
    def test_wrong_fragment(self):
        self.write('index.html','<a href="detail.html#removed">사라짐</a>')
        self.assertTrue(self.check_kind('BROKEN_FRAGMENT'))
    def test_missing_current_fragment(self):
        self.write('detail.html','<a href="#missing">결과</a>')
        self.assertTrue(self.check_kind('BROKEN_FRAGMENT'))
    def test_duplicate_ids(self):
        self.write('detail.html','<p id="dup"></p><p id="dup"></p>')
        self.assertTrue(self.check_kind('DUPLICATE_ID'))
    def test_missing_img_alt_warning_only(self):
        self.write('detail.html','<div id="details"></div><img src="assets/logo.svg">')
        result=self.audit();self.assertTrue(result['pass']);self.assertTrue(any(w['kind']=='IMG_ALT_MISSING' for w in result['warnings']))
    def test_unsafe_parent_traversal(self):
        self.write('index.html','<a href="../secrets.txt">no</a>')
        self.assertTrue(self.check_kind('UNSAFE_REFERENCE'))
    def test_missing_css_asset(self):
        self.write('assets/s.css','p{background:url(missing.png)}')
        self.assertTrue(self.check_kind('MISSING_CSS_ASSET'))
    def test_css_data_uri_skipped(self):
        self.write('assets/s.css','p{background:url(data:image/svg+xml;base64,PHN2Zz4=)}')
        self.assertFalse(self.check_kind('MISSING_CSS_ASSET'))
    def test_external_origin_skipped(self):
        self.write('index.html','<a href="https://example.org/x">외부</a>')
        self.assertTrue(self.audit()['pass'])
    def test_mailto_skipped(self):
        self.write('index.html','<a href="mailto:a@b.co">메일</a>')
        self.assertTrue(self.audit()['pass'])
    def test_same_origin_absolute_link(self):
        self.write('index.html','<a href="https://allfileone-webstudio.pages.dev/detail.html">상세</a>')
        self.assertTrue(self.audit()['pass'])
    def test_directory_link_resolution(self):
        self.write('index.html','<a href="folder/">폴더</a>')
        self.write('folder/index.html','<h1>새 폴더</h1>')
        self.assertTrue(self.audit()['pass'])
    def test_extensionless_cloudflare_html(self):
        self.write('index.html','<a href="detail">상세</a>')
        self.assertTrue(self.audit()['pass'])
    def test_urlencoded_hash(self):
        self.write('detail.html','<p id="한글">본문</p>')
        self.write('index.html','<a href="detail.html#%ED%95%9C%EA%B8%80">한글</a>')
        self.assertTrue(self.audit()['pass'])
    def test_stale_manifest(self):
        self.write('assets/current-release.json',json.dumps({'version':'V60','release_id':'WEBSTUDIO-V60-20261108'}))
        self.assertTrue(self.check_kind('STALE_MANIFEST'))
    def test_missing_manifest(self):
        (self.root/'assets/current-release.json').unlink()
        self.assertTrue(self.check_kind('MANIFEST_MISSING'))
    def test_bad_manifest_json(self):
        self.write('assets/current-release.json','{"invalid"')
        self.assertTrue(self.check_kind('MANIFEST_INVALID'))
    def test_invalid_sitemap_url(self):
        self.write('sitemap.xml','<urlset><url><loc>https://allfileone-webstudio.pages.dev/nope.html</loc></url></urlset>')
        self.assertTrue(self.check_kind('SITEMAP_TARGET_MISSING'))
    def test_external_sitemap_host(self):
        self.write('sitemap.xml','<urlset><url><loc>https://other.example/index.html</loc></url></urlset>')
        self.assertTrue(self.check_kind('SITEMAP_WRONG_HOST'))
    def test_malformed_sitemap(self):
        self.write('sitemap.xml','<urlset><url>')
        self.assertTrue(self.check_kind('SITEMAP_INVALID'))
    def test_missing_sitemap(self):
        (self.root/'sitemap.xml').unlink()
        self.assertTrue(self.check_kind('SITEMAP_MISSING'))
    def test_cli_writes_reports(self):
        out=self.root/'out';x=subprocess.run([sys.executable,str(TOOL),'--root',str(self.root),'--output',str(out)],capture_output=True,text=True)
        self.assertEqual(x.returncode,0,x.stderr)
        self.assertTrue((out/'AllFileOne_WebStudio_V61_SourceIntegrity.json').exists())
        self.assertTrue((out/'AllFileOne_WebStudio_V61_SourceIntegrity_KO.txt').exists())
    def test_cli_hold_nonzero(self):
        self.write('index.html','<a href="missing.html">X</a>')
        x=subprocess.run([sys.executable,str(TOOL),'--root',str(self.root),'--output',str(self.root/'out')],capture_output=True,text=True)
        self.assertEqual(x.returncode,3)
    def test_cli_miss_root_nonzero(self):
        x=subprocess.run([sys.executable,str(TOOL),'--root',str(self.root/'nonexistent'),'--output',str(self.root/'out')],capture_output=True,text=True)
        self.assertEqual(x.returncode,3)

if __name__=='__main__':unittest.main(verbosity=2)
