#!/usr/bin/env python3
# AllFileOne WebStudio V61 — local static integrity audit. Python standard library only.
# No network, credential collection, cookies, APIs, or mutation of production files.
"""Validate local WebStudio HTML/CSS links, anchors, image alt and release metadata.

This checks source files ONLY. It does not prove Cloudflare deployment, browser execution,
email receipt, accessibility compliance or search indexing.
"""
from __future__ import annotations
import argparse
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
import pathlib
import posixpath
import re
import sys
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

SITE_HOST = 'allfileone-webstudio.pages.dev'
VERSION = 'V61'
CSS_URL = re.compile(r'url\(\s*([\'\"]?)(.*?)\1\s*\)', re.I)

@dataclass(frozen=True)
class Edge:
    tag: str
    attr: str
    value: str
    line: int

class SourceParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids: set[str] = set()
        self.duplicate_ids: list[tuple[str,int]] = []
        self.edges: list[Edge] = []
        self.images_without_alt: list[int] = []
    def handle_starttag(self, tag, attrs):
        self._inspect(tag, attrs)
    def handle_startendtag(self, tag, attrs):
        self._inspect(tag, attrs)
    def _inspect(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]
        if a.get('id'):
            if a['id'] in self.ids:
                self.duplicate_ids.append((a['id'], line))
            self.ids.add(a['id'])
        if tag == 'img' and 'alt' not in a:
            self.images_without_alt.append(line)
        for attr in ('href','src','action','poster'):
            if a.get(attr) is not None:
                self.edges.append(Edge(tag, attr, a[attr], line))

def is_html(path: pathlib.Path) -> bool:
    return path.suffix.lower() in ('.html', '.htm')

def safe_resolve(current: str, raw: str, files: set[str]) -> tuple[str, str, str]:
    """Return (kind, relative file, anchor). kinds: skip, local, blocked.

    The current path is relative to the output webstudio/ folder, POSIX style.
    Unknown protocols and links to third-party origins are intentionally not crawled.
    """
    raw = (raw or '').strip()
    if not raw or raw == '#' or raw.startswith(('mailto:', 'tel:', 'data:', 'blob:', 'javascript:', '//')):
        return 'skip', '', ''
    try:
        u = urlsplit(raw)
    except ValueError:
        return 'blocked', raw, ''
    if u.scheme and u.scheme not in ('http','https'):
        return 'skip', '', ''
    if u.scheme or u.netloc:
        if u.hostname != SITE_HOST:
            return 'skip', '', ''
        src = u.path.lstrip('/')
    elif u.path.startswith('/'):
        if u.path.startswith('/api/'):
            return 'skip', '', ''  # Cloudflare Pages Functions endpoint, not an asset.
        src = u.path.lstrip('/')
    elif not u.path:
        src = current
    else:
        src = posixpath.join(posixpath.dirname(current), u.path)
    # File URLs may legally have escaped Korean names. Do not let unquote introduce traversal.
    src = unquote(src)
    stack = []
    for p in src.split('/'):
        if p in ('', '.'): continue
        if p == '..':
            if not stack:
                return 'blocked', src, ''
            stack.pop()
        else:
            stack.append(p)
    target = '/'.join(stack)
    if not target or u.path.endswith('/'):
        target = target + ('/' if target else '') + 'index.html'
    if target not in files and not posixpath.splitext(target)[1]:
        if target + '.html' in files:
            target += '.html'
        elif target + '/index.html' in files:
            target += '/index.html'
    return 'local', target, unquote(u.fragment)

def audit(root: pathlib.Path, expected_version: str = VERSION) -> dict:
    root = root.resolve()
    if not root.is_dir():
        raise FileNotFoundError(f'정적 파일 폴더가 없습니다: {root}')
    files = {f.relative_to(root).as_posix(): f for f in root.rglob('*') if f.is_file()}
    htmls = {p: f for p, f in files.items() if is_html(f)}
    css = {p: f for p, f in files.items() if p.lower().endswith('.css')}
    found, warnings, checks = [], [], Counter()
    def issue(kind, source, detail, line=0, severity='FAIL'):
        (found if severity=='FAIL' else warnings).append({'kind':kind,'file':source,'line':line,'detail':detail})
    parsed: dict[str, SourceParser] = {}
    for name, path in sorted(htmls.items()):
        try:
            data = path.read_text(encoding='utf-8-sig')
            p = SourceParser(); p.feed(data); p.close(); parsed[name] = p
            checks['html_parsed'] += 1
            for dup,line in p.duplicate_ids:
                issue('DUPLICATE_ID',name,dup,line)
            for line in p.images_without_alt:
                issue('IMG_ALT_MISSING',name,'img 태그에 alt 속성 누락',line, 'WARN')
        except (UnicodeError, OSError, ValueError) as exc:
            issue('HTML_PARSE_ERROR', name, str(exc))
    for name, p in parsed.items():
        for edge in p.edges:
            kind, target, fragment = safe_resolve(name, edge.value, set(files))
            if kind == 'skip':
                continue
            checks['html_url_checked'] += 1
            if kind == 'blocked':
                issue('UNSAFE_REFERENCE',name,edge.value,edge.line)
            elif target not in files:
                issue('MISSING_STATIC_FILE',name,f'{edge.value} -> {target}',edge.line)
            elif fragment and fragment.lower() != 'top' and target in parsed and fragment not in parsed[target].ids:
                issue('BROKEN_FRAGMENT',name,f'{edge.value} -> #{fragment}',edge.line)
            else:
                checks['html_url_pass'] += 1
    for name, path in sorted(css.items()):
        try:
            text = path.read_text(encoding='utf-8-sig')
            checks['css_parsed'] += 1
        except (UnicodeError,OSError) as exc:
            issue('CSS_READ_ERROR',name,str(exc)); continue
        for m in CSS_URL.finditer(text):
            url = m.group(2).strip()
            kind,target,fragment = safe_resolve(name, url, set(files))
            if kind=='skip': continue
            line=text.count('\n',0,m.start())+1
            checks['css_url_checked'] += 1
            if kind=='blocked': issue('UNSAFE_CSS_REFERENCE',name,url,line)
            elif target not in files: issue('MISSING_CSS_ASSET',name,f'{url} -> {target}',line)
            else:checks['css_url_pass'] += 1
    if 'sitemap.xml' in files:
        try:
            tree=ET.parse(files['sitemap.xml'])
            for loc in tree.findall('.//{*}loc'):
                value=(loc.text or '').strip()
                kind,target,frag=safe_resolve('sitemap.xml',value,set(files))
                if kind=='skip':
                    issue('SITEMAP_WRONG_HOST','sitemap.xml',value)
                elif kind!='local' or target not in files:
                    issue('SITEMAP_TARGET_MISSING','sitemap.xml',f'{value} -> {target}')
                else: checks['sitemap_urls_pass']+=1
        except (ET.ParseError,OSError) as exc:
            issue('SITEMAP_INVALID','sitemap.xml',str(exc))
    else: issue('SITEMAP_MISSING','sitemap.xml','검색 사이트맵 없음')
    manifest=files.get('assets/current-release.json')
    if manifest:
        try:
            data=json.loads(manifest.read_text(encoding='utf-8-sig'))
            if data.get('version')!=expected_version or data.get('release_id')!=f'WEBSTUDIO-{expected_version}-20261108':
                issue('STALE_MANIFEST','assets/current-release.json',f"기대 {expected_version}, 발견 {data.get('version')}")
            else: checks['release_manifest_pass']+=1
        except (OSError,ValueError) as exc:issue('MANIFEST_INVALID','assets/current-release.json',str(exc))
    else:issue('MANIFEST_MISSING','assets/current-release.json','릴리스 파일 없음')
    return {
      'tool':'AllFileOne WebStudio V61 Source Integrity',
      'expected_release':expected_version,
      'scope':'LOCAL_SOURCE_ONLY_NO_PUBLIC_HTTP_OR_MAIL',
      'counts':dict(checks),
      'file_total':len(files),'html_total':len(htmls),'css_total':len(css),
      'pass':len(found)==0,'failure_count':len(found),'warning_count':len(warnings),
      'failures':found,'warnings':warnings,
      'not_verified':['Cloudflare live HTTP','browser click behavior','live email delivery','search indexing','contractual readiness']
    }

def main(argv=None):
    parser=argparse.ArgumentParser(description='올파일원 웹스튜디오 V61 정적 홈페이지 링크·자료·앵커 사전검사')
    parser.add_argument('--root',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1],help='webstudio 폴더 경로')
    parser.add_argument('--output',type=pathlib.Path,help='결과 폴더 (기본: 사용자 Downloads)')
    parser.add_argument('--expected-version',default=VERSION)
    args=parser.parse_args(argv)
    out=args.output or pathlib.Path.home()/'Downloads'
    out.mkdir(parents=True,exist_ok=True)
    try:result=audit(args.root,args.expected_version)
    except Exception as exc:
        result={'tool':'V61','scope':'LOCAL_SOURCE_ONLY','pass':False,'failure_count':1,'failures':[{'kind':'PRECHECK_ERROR','detail':str(exc)}],'warnings':[],'counts':{}}
    result['generated_at_utc']=datetime.now(timezone.utc).isoformat()
    json_path=out/'AllFileOne_WebStudio_V61_SourceIntegrity.json'
    txt_path=out/'AllFileOne_WebStudio_V61_SourceIntegrity_KO.txt'
    json_path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['올파일원 웹스튜디오 V61 · 로컬 소스 무결성 검사',
      '판정: '+('PASS (로컬 정적 파일)' if result['pass'] else 'HOLD (오류 확인 필요)'),
      '검사 폴더: '+str(args.root),'검사 시각(UTC): '+result['generated_at_utc'],
      '파일 수: '+str(result.get('file_total','미확인')),
      'HTML/CSS: '+str(result.get('html_total','?'))+'/'+str(result.get('css_total','?')),
      '오류: '+str(result['failure_count'])+' / 경고: '+str(len(result['warnings'])),
      '', '중요: GitHub 소스의 정적 링크·앵커·자료 존재 여부만 검사합니다.',
      'Cloudflare 실제 접속, 동적 링크·브라우저 작동, 이메일 발송·수신은 검사하지 않습니다.','']
    lines += ['검사 항목: '+k+'='+str(v) for k,v in result['counts'].items()]
    for item in result['failures']:
        lines.append('FAIL | '+item['kind']+' | '+item.get('file','')+' | '+item['detail'])
    for item in result['warnings']:
        lines.append('WARN | '+item['kind']+' | '+item.get('file','')+' | '+item['detail'])
    txt_path.write_text('\n'.join(lines)+'\n',encoding='utf-8-sig')
    print('V61 소스 점검:', 'PASS' if result['pass'] else 'HOLD',f"FAIL={result['failure_count']} WARN={len(result['warnings'])}")
    print('결과 JSON:',json_path,'\n결과 TXT:',txt_path)
    return 0 if result['pass'] else 3
if __name__ == '__main__':
    raise SystemExit(main())
