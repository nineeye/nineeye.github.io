#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Make a *site-only* static zip with index.html in ZIP root for a new Direct Upload project.

Existing Git-integrated Cloudflare Pages project: keep deploying from main/webstudio,
never assume this zip can replace its deployment through Direct Upload.
Pure Python stdlib, no network calls or paid services.
"""
from __future__ import annotations
import argparse, hashlib, json, stat, zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ('index.html','contact.html','feature-scope-v81.html','release-check-v82.html',
            'assets/current-release.json','assets/release-v82.json','assets/v82-release-check.js',
            'assets/v82-release-check.css','assets/v81-production-scope.js','_headers','sitemap.xml')
SECTORS = ('manufacturing','corporate','clinic','academy','interior','commerce',
           'professional','association','franchise','stay','realestate','event')
STYLES = ('modern','premium','editorial')

def sha256(data: bytes) -> str: return hashlib.sha256(data).hexdigest()

def site_files(root:Path):
    required = REQUIRED + tuple(f'demo/{s}/{t}/index.html' for s in SECTORS for t in STYLES)
    absent=[r for r in required if not (root/r).is_file()]
    if absent: raise RuntimeError('필수 공개 파일 누락: '+', '.join(absent[:10]))
    all_files=[]
    for p in sorted(root.rglob('*')):
        rel=p.relative_to(root)
        if p.is_symlink(): raise RuntimeError('사이트 심볼릭 링크 금지: '+str(rel))
        if not p.is_file():continue
        if any(part in ('tools','__pycache__','.git','.github') for part in rel.parts):continue
        if p.name.startswith(('README_','ROADMAP_','RUN_')) or p.suffix.lower() in ('.py','.pyc','.cmd','.ps1'):continue
        if (not rel.parts or PurePosixPath(rel.as_posix()).is_absolute() or '..' in rel.parts):raise RuntimeError('안전하지 않은 경로')
        all_files.append((rel.as_posix(),p))
    return all_files

def build(root:Path,output:Path):
    root=root.resolve();output.parent.mkdir(parents=True,exist_ok=True)
    release=json.loads((root/'assets/current-release.json').read_text('utf-8'))
    if not (release.get('version')=='V82' and release.get('release_id')=='WEBSTUDIO-V82-20261109'):
        raise RuntimeError('정확한 V82 버전이 아니므로 배포 중단')
    files=site_files(root)
    manifest={}
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
        for path,p in files:
            data=p.read_bytes();manifest[path]={'sha256':sha256(data),'bytes':len(data)}
            zi=zipfile.ZipInfo(path,date_time=(2026,11,9,0,0,0));zi.compress_type=zipfile.ZIP_DEFLATED
            zi.external_attr=(stat.S_IFREG|0o644)<<16
            z.writestr(zi,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=7)
    with zipfile.ZipFile(output) as z:
        if z.testzip():raise RuntimeError('ZIP CRC 불일치')
        names=z.namelist()
        if 'index.html' not in names or 'webstudio/index.html' in names:raise RuntimeError('배포 ZIP 구조 오류')
        for name,record in manifest.items():
            if sha256(z.read(name))!=record['sha256']:raise RuntimeError('ZIP 내부 SHA 오류: '+name)
    return {'release':'V82','source_root':str(root),'zip_path':str(output),'zip_sha256':sha256(output.read_bytes()),
            'zip_bytes':output.stat().st_size,'entries':len(manifest),'site_source_files':manifest,
            'cloudflare_git_branch':'main','cloudflare_git_build_output_directory':'webstudio',
            'direct_upload_new_project_only':True,'live_cloudflare':'HOLD_NOT_OBSERVED','real_email':'HOLD_NOT_OBSERVED'}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',type=Path,default=ROOT)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--report',type=Path)
    args=parser.parse_args();result=build(args.root,args.output)
    print('V82 site-only ZIP PASS',result['entries'],'files',result['zip_sha256'])
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')

if __name__=='__main__': main()