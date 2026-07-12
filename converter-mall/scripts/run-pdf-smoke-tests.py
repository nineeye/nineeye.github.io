#!/usr/bin/env python3
from pathlib import Path
import argparse, http.server, socketserver, threading, urllib.request, time, json
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(); parser.add_argument('--port',type=int,default=0); args=parser.parse_args()
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
    def copyfile(self, source, outputfile):
        try: super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError): pass
class QuietTCPServer(socketserver.TCPServer):
    allow_reuse_address=True
    def handle_error(self, request, client_address):
        # 브라우저나 검사기가 응답을 다 읽기 전에 연결을 닫아도 실패로 취급하지 않는다.
        return
handler=lambda *a,**k: Quiet(*a,directory=str(ROOT),**k)
server=QuietTCPServer(('127.0.0.1',args.port),handler)
port=server.server_address[1]
th=threading.Thread(target=server.serve_forever,daemon=True); th.start(); time.sleep(.2)
checks=['/','/pdf-tools/','/pdf-runtime-check/','/assets/js/pdf-tools/PDFRuntimeLoader.js','/assets/js/pdf-tools/PDFToolApp.js']
checks += [f'/converters/{p.parent.name}/' for p in sorted((ROOT/'converters').glob('pdf-*/index.html'))]
errors=[]
for path in checks:
    try:
        req=urllib.request.Request(f'http://127.0.0.1:{port}{path}',headers={'User-Agent':'ConverterMall-QA/1.41.1'})
        with urllib.request.urlopen(req,timeout=5) as r:
            if r.status!=200: errors.append(f'{path}: HTTP {r.status}')
            else: r.read(64)
    except Exception as e: errors.append(f'{path}: {e}')
server.shutdown(); server.server_close()
print(json.dumps({'ok':not errors,'checked':len(checks),'errors':errors},ensure_ascii=False,indent=2))
raise SystemExit(1 if errors else 0)
