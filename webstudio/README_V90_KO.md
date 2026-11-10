# 올파일원 웹스튜디오 V90 — 실제 계약 전 투명성 강화

- V89 홈페이지 4메뉴·6핵심영역과 기존 12업종/36 HTML/84가상 기능 시연 유지.
- 새 `project-process-v90.html`: 제안 제작 절차 6단계, 3가지 제작 유형·참고 시작가, 서면 합의 10항목, FAQ 6개.
- 체크리스트 10개, 업종 12개, TXT 저장·복사 실패 시 직접 복사 fallback·초기화. 브라우저에서만 처리하며 개인정보 입력, 서버 전송, 추적·결제·유료 API 없음.
- 기존 홈페이지의 가격·상담 동선, V87 요청서에서 새 가이드를 연결.
- **아직 불확정:** 실제 고객 납품 실적, 운영자 이메일 왕복, 확정 29/59/99만원 가격과 VAT/수정/제작 기간/도메인/유지보수, 사업자 정보. 사용자 승인·계약 전에 확정처럼 기재하지 않음.
- 로컬 QA: `python -m unittest discover -s webstudio/tools -p test_v90*.py -v`, `python webstudio/tools/v90_dom_browser_qa.py --output ./QA/V90`, GitHub-hosted Windows Edge/public-asset probe separate.
- 이 문서는 법률·세무 자문을 대체하지 않으며 실제 계약용 조항은 당사자 합의 및 전문가 검토 필요.
