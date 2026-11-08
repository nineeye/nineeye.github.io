#!/usr/bin/env python3
"""Readonly SHA256 and file manifest verification for an extracted V51 delta package."""
from __future__ import annotations
import hashlib,json,sys,os
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).resolve().parents[2]).resolve()
report_path=Path(sys.argv[2]) if len(sys.argv)>2 else root/'V51_PREFLIGHT_REPORT_KO.txt'
lines=['[올파일원 웹스튜디오 V51 자체 사전검증]','검사 경로: '+str(root),'외부 통신·유료 API·프로그램 설치 없음']
errors=[]
try:
 ledger=json.loads((root/'FILE_MANIFEST.json').read_text('utf-8'))
 for record in ledger['files']:
  name=record['path'];f=(root/name).resolve()
  if not f.is_relative_to(root) or not f.is_file():errors.append('파일 누락/경로 거부: '+name);continue
  value=hashlib.sha256(f.read_bytes()).hexdigest()
  if value!=record['sha256'] or f.stat().st_size!=record['bytes']:errors.append('SHA 또는 크기 불일치: '+name)
 lines.append('파일 검증: '+str(len(ledger['files'])-len(errors))+'/'+str(len(ledger['files'])))
except Exception as ex:errors.append('매니페스트 검사 오류: '+type(ex).__name__+' '+str(ex))
lines.append('결과: '+('PASS' if not errors else 'HOLD'))
lines.extend(errors)
report_path.parent.mkdir(parents=True,exist_ok=True)
report_path.write_text('\n'.join(lines)+'\n','utf-8')
print('\n'.join(lines));sys.exit(bool(errors))
