#!/usr/bin/env python3
"""Safe, idempotent V49 WebStudio additive installer, Python stdlib only.

No execution-policy changes. Defaults to --check (read-only). --apply is explicit.
Expected target: root containing a preexisting webstudio folder (V48).
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

FILES = (
    'webstudio/quick-inquiry.html',
    'webstudio/assets/v49-quick-inquiry.css',
    'webstudio/assets/v49-quick-inquiry.js',
    'webstudio/assets/v49-entry.css',
)
SECTORS=('manufacturing','academy','interior')


def once(text: str, needle: str, addition: str, path: str) -> str:
    if addition in text: return text
    if text.count(needle) != 1:
        raise ValueError(f'{path}: expected exactly one anchor {needle!r}; found {text.count(needle)}')
    return text.replace(needle, addition+needle, 1)


def compute(target: Path, package: Path) -> dict[str,str]:
    site=target/'webstudio'
    if not site.is_dir(): raise FileNotFoundError('Target webstudio/ directory not found. Nothing changed.')
    manifest=site/'assets/current-release.json'
    release=json.loads(manifest.read_text('utf-8'))
    if release.get('version') not in {'V48','V49'}:
        raise ValueError('Expected V48 or V49 base; refuse modifications to another release')
    if not (site/'assets/v48-sales-audit.js').is_file():
        raise ValueError('V48 sales audit missing; refuse partial upgrade')
    changes={}
    for relative in FILES:
        src=package/relative
        if not src.is_file():raise FileNotFoundError(str(src))
        data=src.read_text('utf-8')
        dst=target/relative
        if dst.is_file() and dst.read_text('utf-8')!=data:
            raise ValueError(f'{relative}: existing file differs; refuse overwrite')
        if not dst.is_file():changes[relative]=data
    head='<link rel="stylesheet" href="./assets/v49-entry.css">\n'
    home='webstudio/index.html'
    text=(target/home).read_text('utf-8')
    text=once(text,'</head>',head,home)
    link='<a class="v49-cta-home" href="./quick-inquiry.html">1분 빠른 제작 문의 <span aria-hidden="true">↗</span></a>'
    text=once(text,'<div class="v22-actions">', '<!-- v49 quick route -->\n',home) if 'v49 quick route' not in text else text
    marker='<div class="v22-actions">'
    if link not in text:
        if text.count(marker)!=1:raise ValueError('Home quick CTA anchor mismatch')
        text=text.replace(marker,marker+'\n'+link,1)
    changes[home]=text
    for sector in SECTORS:
        p=f'webstudio/for-{sector}.html'
        html=(target/p).read_text('utf-8')
        html=once(html,'</head>',head,p)
        link=f'<a class="v49-cta-sector" href="./quick-inquiry.html?industry={sector}">1분 빠른 문의 초안 <span aria-hidden="true">↗</span></a>'
        marker='<div class="hero-actions">'
        if link not in html:
            if html.count(marker)!=1: raise ValueError(f'{p}: quick CTA anchor mismatch')
            html=html.replace(marker, marker+link,1)
        changes[p]=html
    contact='webstudio/contact.html';html=(target/contact).read_text('utf-8')
    html=once(html,'</head>',head,contact)
    shortcut='<div class="v49-shortcut"><span>간단히 시작하고 싶으신가요? 업종·필요 기능·규모만 선택해 보세요.</span><a href="./quick-inquiry.html">1분 빠른 문의 ↗</a></div>\n'
    html=once(html,'<section id="brief"',shortcut,contact)
    changes[contact]=html
    path='webstudio/sitemap.xml';xml=(target/path).read_text('utf-8')
    entry=' <url><loc>https://allfileone-webstudio.pages.dev/quick-inquiry.html</loc><lastmod>2026-11-08</lastmod><priority>0.9</priority></url>\n'
    xml=once(xml,'</urlset>',entry,path)
    changes[path]=xml
    release['previous_release']='V48'
    release['version']='V49'
    release['release_id']='WEBSTUDIO-V49-20261108'
    release['release_date']='2026-11-08'
    release['release_note']='V49 adds no-cost three-industry 1-minute inquiry draft, manual copy/TXT/mailto, top-three hero + home + existing contact entry. All older demos and detailed consultation preserved.'
    release['verification']='V49_LOCAL_ISOLATED_BROWSER_QA; V49_GITHUB_AND_CLOUDFLARE_PENDING; REAL_EMAIL_RECEIPT_NOT_TESTED; SEARCH_INDEX_NOT_VERIFIED'
    release['quick_inquiry_url']='/quick-inquiry.html'
    release['quick_inquiry_industries']=3
    release['quick_inquiry_server_submission']=False
    release['quick_inquiry_external_paid_apis']=0
    changes['webstudio/assets/current-release.json']=json.dumps(release,ensure_ascii=False,indent=2)+'\n'
    return {path:value for path,value in changes.items() if not (target/path).is_file() or (target/path).read_text('utf-8')!=value}


def apply(target:Path,package:Path,write:bool=False):
    changes=compute(target,package)
    if write:
        for p,data in changes.items():
            dst=target/p;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(data,encoding='utf-8')
    return {'mode':'APPLY' if write else 'CHECK','changes':sorted(changes),'count':len(changes)}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--target-root',type=Path,required=True);parser.add_argument('--package-root',type=Path,default=Path(__file__).resolve().parents[2]);parser.add_argument('--apply',action='store_true',help='Modify local sources after checks')
    a=parser.parse_args();print(json.dumps(apply(a.target_root,a.package_root,a.apply),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
