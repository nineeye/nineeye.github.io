# 올파일원 웹스튜디오 V9 — 실제 문의 접수·관리자 엔진 (기반 소스)

## 4대 필수 작업 규칙
1. 필요한 자료가 있으면 바로 다운로드 가능한 정확한 주소를 안내한다.
2. 무료 공개 소스를 먼저 찾고 부족한 부분만 개발한다.
3. 한두 개씩이 아니라 다양한 기능과 검증을 한 번에 묶어 작업한다.
4. 좋은 아이디어는 사업성·보안·비용을 검토한 뒤 적극 반영한다.

## 정직한 완료 범위
- Cloudflare Pages Functions + D1 문의 저장 API와 관리자 API **구현**
- 새 고객용 페이지 / 관리자 페이지 / JS / CSS, 데이터베이스 스키마 구현
- 보안 검증: Cloudflare Turnstile 서버 토큰 검증, 동일 출처, 입력 크기, 허용값, 보안 헤더, 5회/시간/IP 해시 제출 제한, 비밀 토큰 인증, 변경 버전 충돌 검증
- 문의 보관 만료 90일, API 요청 시 만료 자료 정리, 수동 삭제. *백그라운드/정기 독립 삭제는 아님*
- Node SQLite 통합시험, Chromium UI 가상 API 시험, 정적 QA 완료
- 기존 정적 요청을 무료로 유지하도록 /api/*로만 Functions 호출 범위 제한

**이 소스만 업로드한다고 실제 고객 문의 수신이 자동 활성화되는 것은 아닙니다.** 사용자 계정의 D1 DB 생성·스키마 적용, Pages binding, Turnstile 키, 관리자 토큰, 법적 고지 확인 후 수동 활성화가 필요합니다. 계정 접근이 없는 상태에서 이를 완료했다고 말할 수 없습니다.

## 배포 위치
- `functions/api/inbox-status.js`, `functions/api/inquiries.js`, `functions/api/admin/inquiries.js`: 프로젝트 루트 `functions` 디렉터리. `webstudio` 정적 출력 폴더 안이 아닙니다.
- `server/inbox-core.mjs`: 공용 서버 모듈 (함수 import 번들에 포함)
- `migrations/0001_inquiries.sql`: Cloudflare D1에서 최초 1회 실행할 SQL
- `webstudio/inquiry.html`, `webstudio/admin-inbox.html`: 정적 고객/관리자 UI
- `webstudio/_routes.json`: `{"version":1,"include":["/api/*"],"exclude":[]}`

## 단계별 활성화 (추가 유료 결제 불필요: 무료 한도 내 사용)
1. Cloudflare `allfileone-webstudio` 프로젝트는 GitHub 자동 배포 유지. 기존 output dir `webstudio` (프로젝트 root는 저장소 root) 확인.
2. Cloudflare Dashboard > D1 > Create database: 예 `allfileone-webstudio-inquiries`. 운영 고객정보를 쓰기 전 접근 통제·법적 안내 확정.
3. D1 Dashboard의 SQL/Console에서 `migrations/0001_inquiries.sql` 내용을 적용. **실제 데이터베이스만** 생성하며 SQLite 파일은 저장소에 커밋하지 않음.
4. Pages 프로젝트 > Settings > Bindings > Add > D1, Variable name `INQUIRIES_DB`, 위 DB 지정 후 배포.
5. Turnstile 위젯 생성. 허용 도메인에 실제 Pages hostname 등록. 프로젝트 환경변수(가능하면 Secret 저장):
   - `TURNSTILE_SITE_KEY`: 공개 위젯 site key
   - `TURNSTILE_SECRET_KEY`: 서버용 secret (**절대 GitHub에 기록 금지**)
   - `TURNSTILE_ALLOWED_HOSTS`: `allfileone-webstudio.pages.dev` 또는 실 도메인 목록
   - `STUDIO_ADMIN_TOKEN`: 안전한 무작위 영숫자/밑줄/하이픈 43자 이상, 사이트 어디에도 공개 금지. Python `secrets.token_urlsafe(48)` 등으로 로컬에서 생성.
6. **실제 개인정보 처리 안내와 사업자/관리자 정보가 정확한지 확인한 후** `PRIVACY_POLICY_APPROVED=1`로 설정. 검토 전 `0` 유지.
7. 테스트 레코드로 로컬/미리보기에서 GET `/api/inbox-status` 응답 확인. 운영 활성화 전 `PUBLIC_INBOX_ENABLED=0` 유지.
8. 준비 후 `PUBLIC_INBOX_ENABLED=1`로 설정, Pages 재배포 및 실제 브라우저에서 제출→D1 저장→관리자 조회→상태 변경→삭제 회귀시험 통과 시에만 실운영으로 인정.
9. 운영 중 Worker/D1 무료 한도 모니터링. 한도 초과 시 동적 문의가 실패할 수 있으나 정적 홈페이지는 계속 제공될 수 있게 `/api/*`로 제한.

## 실제 수신·알림에 관한 제한
- 문의는 D1에 저장합니다. **이메일이 자동 전송되지는 않습니다.** 방문자에게 접수번호가 나오면 DB 저장 성공을 의미하며 관리자 확인은 `admin-inbox.html`에서 합니다.
- 네이버 메일 주소 `nineeyes@naver.com`은 수신 채널/삭제 요청 연락처로 표시합니다. 자동 이메일 전송은 별도 무료·유료 연동의 실제 검증 후에만 약속할 수 있습니다.
- 관리자 토큰은 브라우저 메모리에서만 사용하며 localStorage/cookie에 저장하지 않습니다. 접속한 브라우저를 닫으면 다시 입력해야 합니다.
- D1 만료 데이터는 POST/관리자 GET 시 정리됩니다. 아무 접속도 없으면 자동 삭제가 지연될 수 있으므로 정기 독립 삭제를 약속하지 않습니다.
- 수집 항목은 담당자 이름·이메일·업종·제작 목적·선택 회사명입니다. 전화번호/첨부파일은 수집하지 않습니다.

## 검증·상용화 로드맵
- [x] 견적 접수 API 작성
- [x] D1 스키마, 보관 기간 및 rate limit
- [x] 관리자 상태 조회·변경·삭제
- [x] Turnstile 서버 검증 + 보안 실패 차단
- [x] 5개 화면 크기의 UI 동작 자동시험
- [x] 기존 정적 트래픽 비용 보호 `_routes.json`
- [ ] Cloudflare 실제 D1 바인딩/비밀 설정
- [ ] 사업자 정보·개인정보 처리 고지 검토 및 승인
- [ ] 실제 사이트 공개 배포, 외부 네트워크 E2E 검증
- [ ] 운영 데이터 보안 및 복구/정기 삭제 자동화
- [ ] 고객에게 납품할 독립형 운영 패키지

## 공식 무료 자료
- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/get-started/
- D1 시작하기: https://developers.cloudflare.com/d1/get-started/
- Pages D1 Binding: https://developers.cloudflare.com/pages/functions/bindings/
- Turnstile 서버 검증: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Functions 라우팅: https://developers.cloudflare.com/pages/functions/routing/
