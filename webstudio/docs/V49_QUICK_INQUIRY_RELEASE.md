# 올파일원 웹스튜디오 V49 — 1분 빠른 제작 문의

2026-11-08 / no paid API / self-authored code

## 무엇이 추가되었나
- 3개 업종(제조·도매/학원·교육/인테리어·시공)의 기능·자료 규모별 1분 문의 작성.
- 업종별 기능 필드 4종·규모 4종, 희망 일정·예산·240자 메모를 사용한 이메일 문안 생성.
- 수동 `mailto:` 초안 열기, 이메일 본문 복사, TXT 저장, 웹메일 이동 및 받는 사람 주소 복사.
- 실제 메일 발송/수신/서버 접수 없음. 실거래·예약·견적 승인도 없음.
- 기존 V48 웹스튜디오 메인/3개 판매페이지/상세 상담서에 빠른 문의 링크 추가.
- 메인 36개 디자인·기존 기능 48개 및 V46·V47 상담 흐름은 삭제하지 않음.

## 소스 구성
- `webstudio/quick-inquiry.html`: 반응형 새 문의 페이지
- `webstudio/assets/v49-quick-inquiry.css`: 자체 작성 디자인
- `webstudio/assets/v49-quick-inquiry.js`: 자체 작성 문의 문안 생성기
- `webstudio/assets/v49-entry.css`: 기존 5개 판매/문의 화면 연결 스타일
- `webstudio/tools/apply_v49.py`: 기존 V48 체크·멱등 적용기. 기본 실행은 읽기 전용 검사, `--apply`일 때만 적용.
- `webstudio/qa/`: 브라우저·정적·패치 QA 코드와 결과

## 적용 전 필수
이 ZIP은 전체 홈페이지를 대체하지 않는 **V48 소스에 대한 델타 업데이트**입니다. 반드시 기존 GitHub `nineeye/nineeye.github.io`의 V48 파일이 있는 폴더에 추가 적용하세요. `webstudio/assets/v48-sales-audit.js`가 없는 환경에서는 적용을 거부합니다. 기존 파일을 삭제하지 않고 신규 파일 4개와 기존 파일 7개(메인·3 업종·상담·사이트맵·릴리스 기록)만 변경합니다.

`python webstudio/tools/apply_v49.py --target-root C:\path\to\repo --package-root C:\path\to\V49_Extracted`
`python webstudio/tools/apply_v49.py --target-root C:\path\to\repo --package-root C:\path\to\V49_Extracted --apply`

또는 GitHub PR의 변경 내용을 사용할 수 있습니다. 서버에 로그인해서 추가 요금을 내거나 PowerShell 정책을 바꿀 필요가 없습니다.

## 자체 QA 경계
- 6종(320, 360, 390, 768, 1024, 1440px) Chromium으로 실제 신규 HTML/CSS/JS를 격리 실행: 160/160 PASS.
- Python stdlib 코드 검사: 39/39 PASS.
- 멱등 적용·보존·오류 거부 테스트: 28/28 PASS.
- 격리 브라우저는 운영 Cloudflare 서버가 아니라 `about:blank` 테스트로, 실제 배포/메일 수신/네이버·구글 색인 확인을 의미하지 않습니다.
- GitHub PR·공식 Cloudflare Check가 뒤따르면 그 시점의 상태로 별도 확인하며, 해당 결과를 이 패키지 제작 시점에 앞질러 주장하지 않습니다.

## 사용권·보안
- HTML/CSS/JS/Python 코드는 이 차수에서 새로 작성. 외부 유료·저작권 불명 UI 라이브러리 미포함.
- 폼에서는 쿠키·로컬스토리지·네트워크 API·백엔드 저장·자동 발송·계정 생성 사용하지 않음.
- 이미지 자산 다운로드 및 외부 폰트 사용 없음. 기존 로컬 파비콘만 참조.
- 고객의 텍스트는 `textContent`로 표시하고 URL에는 고객 메모를 넣지 않음. 이메일 앱 실행은 사용자의 직접 클릭으로만 이루어짐.
- 고객은 자신의 이메일 앱에서 직접 `보내기`를 눌러야 하며, 실제 수신 시험은 별도 확인 필요.

## 다음 작업
- 운영 도메인의 실제 동일출처 화면 이동/모바일 UI 확인.
- 소유자 계정에서 네이버 서치어드바이저 및 Google Search Console 사이트맵 등록·색인 확인.
- 이메일 실송수신 확인 및 첫 수주 프로세스·계약서·납품·운영 고지 정리.


# 올파일원 웹스튜디오 로드맵 (V49)
- [x] 36개 업종×스타일 데모와 3개 대표 업종 판매 페이지(V37~V43)
- [x] 구매자 FAQ 및 검색 기본 마크업(V44)
- [x] 고객 시작키트 3업종×10개(V45)
- [x] 시작키트→상세 상담서 1회 안전 연결(V46)
- [x] 상세 상담서 전체 수동 메일 패키지(V47)
- [x] 고객 판매 동선 16개 공개 파일 검사(V48)
- [x] 신규 1분 문의 생성기·3업종 연결·모바일 6폭 QA(V49)
- [ ] V49 공식 Cloudflare Pages 배포 성공 및 실제 브라우저 HTTP 표시 확인
- [ ] 실제 이메일 송수신 확인(수동 발송까지 포함)
- [ ] Naver Search Advisor/Google Search Console 소유확인·사이트맵·색인 분석
- [ ] 첫 유료 고객 수주·계약·납품 근거 확보

목표: 차별화된 디자인과 실제 동작하는 업종별 기능을 통해 국내 첫 제작 수주. 고객 파일럿/유료 외부 검증 없이 개발 가능한 영역부터 완료.
