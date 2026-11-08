# 올파일원 웹스튜디오 V40 — 배포 증거 확보와 문의 누락 방지

2026-11-08 | 본래 목표: 고객이 업종별 시연을 보고 믿고 실제 제작을 의뢰할 수 있는 사이트.

## 확실하게 확인된 새 성과
- GitHub `main` V39 커밋 `99bab3557ee6ed31c6da354b714cd5fa8af64072`의 공식 `Cloudflare Pages` 검사: completed / **success** / “Deployed successfully”.
- 증거: https://github.com/nineeye/nineeye.github.io/runs/128624522505
- 해당 미리보기: https://fb267a3a.allfileone-webstudio.pages.dev
- Cloudflare/GitHub 공식 가이드: GitHub 연결은 commit check-run으로 빌드·배포 상태를 확인할 수 있음.
- **V39 빌드 성공**과 **정식 도메인의 HTTP·실제 화면 정상 표시/메일 수신**은 별개다. 후자를 검증했다고 주장하지 않는다.

## V40 수정 코드
- `site-check.html`: 오래된 V33/V35 하드코딩 제거, 동적 공개 릴리스 ID 표시, 오프라인 테스트와 운영 웹 검증을 구분.
- `assets/v40-live-audit.js`: 기존 V25/V35 점검 스크립트 대신 현재 `assets/current-release.json`과 11개 핵심 파일, 선택 시 36개 실제 HTML 시연을 **동일 출처**에서 확인. 검사 누락은 HOLD, 성공도 실제 이메일 수신 증거는 아님.
- `contact.html`, `assets/v40-mail-fallback.js`, `assets/v40-mail-fallback.css`: 기본 메일 앱이 없는 고객이 수신 주소 `nineeyes@naver.com`과 준비서 내용을 복사하여 직접 웹메일로 보낼 수 있게 보완. 자동 수집/발송/개인정보 저장 없음.
- `tools/check_cloudflare_github.py`: GitHub 공개 REST API에서 `main` SHA 확인 후 Cloudflare 공식 check-run을 판단. 앱 이름, 커밋, status, conclusion 교차확인. 비공식/실패/누락 상태는 성공으로 표시하지 않음.
- V39 업종별 선택·상담·메일 초안 기능, V38 판매 3페이지, V37 36개 시연 등 기존 코드 유지.

## QA
- 73/73 격리 Chromium pass: 320~1280px, core/36개 데모 가상 fixture, V39 구버전 미인식/경로 누락/네트워크 실패, 메일주소 복사 허용/차단, 중복 UI 예방.
- 12/12 deployment checker Python unit pass: SHA·발행 앱·체크 이름/상태/결론의 정상 및 반례.
- GitHub 작업 브랜치 소스 구조 22/22 pass: 실제 V40 소스 연결, 36개 기존 데모 파일 존재, 비용과 개인정보 전송 없음.
- Node V40 JS --check PASS, tinycss2 CSS parser PASS.
- 위 Chromium 시험은 **실제 네트워크가 아닌 가상 응답**으로 동작한 테스트이며 Cloudflare 공개 서버의 HTTP 200 확인이 아니다.
- V40 Cloudflare **새 커밋 자체의 공식 배포 결과는 병합 후 별도 확인**; 이 문서 시점의 V39 공식 성공을 V40 성공으로 확대하지 않는다.

## 로드맵
- [x] 3 업종 판매 랜딩/36개 가상 시연/선택 기능 상담서 인계
- [x] 기존 메일 앱 초안+TXT/클립보드 인계
- [x] 브라우저 공개 파일 점검의 과거 버전 고정 오류 제거
- [x] 무료 웹메일 사용자를 위한 주소 복사 대안
- [x] 공식 Cloudflare 검사 기록과 안전한 검증 방법 확보
- [ ] V40 병합 커밋에 대한 공식 Cloudflare 성공 검사 확보
- [ ] 실제 공개 주소의 파일 렌더링/상담 경로 개별 화면 검증
- [ ] 소유자 수신 메일 확인 및 첫 실제 제작 의뢰 확보
- [ ] 개인정보·사업자·계약·유지보수/호스팅 조건의 최종 운영 준비
