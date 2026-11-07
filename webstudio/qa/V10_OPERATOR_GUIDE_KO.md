# 올파일원 웹스튜디오 V10 — 운영 진단 및 자동 잠금
기준일: 2026-11-07

## 매번 복창하는 4대 작업 규칙
1. 자료가 필요하면 정확한 직접 다운로드 주소를 안내한다.
2. 상업적 사용 가능한 무료 소스를 먼저 조사하고, 부족한 부분만 개발한다.
3. 관련 개선 여러 개를 한 차수에 묶어서 작업한다.
4. 좋은 아이디어는 적극 검토·검증 후 실제 코드에 반영한다.

## 목표 / 상태
- 목표: 이미 배포된 올파일원 웹스튜디오의 파일·API·보안 상태를 운영자가 한 번에 확인하고 실수 없이 D1 접수를 준비한다.
- 배포: GitHub `nineeye/nineeye.github.io`, `main`, Cloudflare Pages 프로젝트 `allfileone-webstudio`, build output `webstudio`.
- 새 페이지: `/ops-check.html`; 고객 개인정보나 관리자 비밀 키를 입력하지 않는 공개 점검 도구.
- V9 실제 D1 연결·Turnstile·서버 비밀 키·법적 승인은 아직 미확인/미완료. 진단 페이지로는 실제 고객 데이터 저장 성공을 입증할 수 없다.

## V10 주요 개선 항목
1. 운영 진단 페이지 UI 2. 정적 홈페이지 응답 검사 3. 포트폴리오 검사 4. 시안 제작기 검사
5. 기능 30종 설계실 검사 6. 고객 문의 폼 검사 7. 관리자 화면 제공 검사 8. 문의 CSS 검사
9. 문의 JS 검사 10. 사이트맵 검사 11. 실제 접수 API 상태 JSON 파싱 12. D1 스키마 미준비 분류
13. 비밀 변수 설정 미완료 분류 14. 관리자 비인증 접근 차단 검증 15. 잘못된 HTTP GET 접수 거부 검증
16. CSP 검사 17. nosniff 검사 18. 프레임 삽입 제한 검사 19. 요청별 9.5초 제한
20. 재검사 버튼 21. 정상·주의·실패 개수 22. 항목별 원인 설명 23. 비밀 값 없는 TXT 다운로드
24. 원본 소스·설정·법적 승인 체크리스트 25. 비활성화 기본값 안내 26. 무료 사용량 한도 및 Fail closed 권고
27. 반응형 PC/태블릿/모바일 디자인 28. 키보드 초점 표시 29. reduced motion 대응
30. 관리자 화면 15분 무활동 자동 잠금 31. 잠금 시 토큰·문의내용 화면 제거 32. 창으로 돌아올 때 만료 재확인
33. 로그인 후 비밀번호 입력칸 비움 34. 관리자 화면에서 진단 페이지 직접 이동.

## V9 서버와 V10 진단 구분
- V9 백엔드: `/functions/api/inquiries.js`, `/functions/api/admin/inquiries.js`.
- V9 데이터 스키마: `migrations/0001_inquiries.sql`.
- Cloudflare Pages 정적 빌드 출력: `webstudio`.
- `webstudio/_routes.json`의 `include=["/api/*"]`: 정적 페이지를 Functions 호출에서 제외해 무료 정적 트래픽을 유지.
- V10은 **의도적으로 실고객 POST, 관리자 토큰 인증, 실DB 쓰기/삭제를 자동 수행하지 않음.** 무인 데이터 생성이나 개인정보 접근을 막기 위한 안전설계.
- 실제 운영 활성화 전에는 접수 성공 안내가 나와서는 안 됨.

## Cloudflare 계정에서만 할 수 있는 필수 준비 (아직 미완료)
1. Cloudflare `Workers & Pages` → `D1`에서 무료 한도·요금 조건을 확인한 뒤 DB를 생성한다.
2. DB 콘솔 또는 Wrangler로 `migrations/0001_inquiries.sql`을 적용한다.
3. Pages `allfileone-webstudio` → `Settings > Bindings`에서 `INQUIRIES_DB` 변수에 D1 연결한다.
4. `Settings > Variables and Secrets`에서 `STUDIO_ADMIN_TOKEN` (충분히 랜덤한 43자 이상, git에 저장 금지), `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`를 설정한다.
5. Turnstile 위젯의 도메인에 `allfileone-webstudio.pages.dev`를 등록한다. 프리뷰 배포 호스트를 사용할 경우 서버의 `TURNSTILE_ALLOWED_HOSTS`를 점검한다.
6. 실제 사업자/개인정보처리방침/보존·삭제·민원 대응을 확인한 후에만 `PRIVACY_POLICY_APPROVED=1`, `PUBLIC_INBOX_ENABLED=1`을 설정한다.
7. `Settings > Runtime`에서 Functions 한도 소진 시 **Fail closed** 정책을 점검한다.
8. Pages 재배포 후 `/ops-check.html`에서 공개 상태를 재점검한다.
9. 별도 테스트 개인정보로 **실제** 1건의 접수/DB/관리자 조회·변경·삭제를 확인한다. 테스트 직후 해당 기록을 삭제한다.

> V10 자동 진단 결과가 13/13 정상이어도 실제 D1 쓰기·복구·법적 검증을 대신하지 않는다.
> 공개 페이지에서 비밀 토큰이나 비밀번호를 입력하지 않는다. 관리자 토큰은 관리자 페이지 입력에만 사용한다.

## 무료 오픈소스 조사 (이번 V10에는 번들 없음)
- Tabler 관리 UI: MIT, 공식 저장소 https://github.com/tabler/tabler
- 소스 ZIP 바로 다운로드 https://github.com/tabler/tabler/archive/refs/heads/dev.zip
- 라이선스 https://tabler.io/license
- **의사결정:** 무료 Tabler 전체 패키지에는 제3자 라이브러리와 별도 라이선스의 ApexCharts가 포함될 수 있어, 현재 경량 관리자 화면에 전체 통합하지 않음. 기존 HTML/CSS/JS를 개선하는 편이 무료·경량·배포 안전에 유리.

## 공식 기술 참조
- Pages Functions 시작: https://developers.cloudflare.com/pages/functions/get-started/
- Pages Functions 라우팅: https://developers.cloudflare.com/pages/functions/routing/
- Pages D1 Bindings: https://developers.cloudflare.com/pages/functions/bindings/
- D1 사용: https://developers.cloudflare.com/d1/get-started/
- Turnstile: https://developers.cloudflare.com/turnstile/get-started/

## 검증 정보
- V10 오프라인 Chromium 브라우저 인터랙션 38/38 PASS (실제 Cloudflare 대신 가짜 공개 응답을 주입한 UI 시험)
- V10 정적 HTML/CSS/JS·보안 구조 시험 57/57 PASS
- V9 회귀 SQLite/Node 통합 50/50 PASS
- V9 회귀 정적 50/50 PASS
- V9 회귀 Chromium 85/85 PASS
- 합계 280개 PASS (새 V10 95개 + V9 회귀 185개). 숫자는 서로 다른 검사 항목의 합계이며 실운영 성공률이 아니다.

## 다음 상용화 단계
- [x] 42개 체험 사이트 및 기능형 포트폴리오 보존
- [x] 고객용 맞춤 HTML 시안 제작기
- [x] 30개 기능 조합 설계실
- [x] V9 DB 접수·관리자 API 개발, 오프라인 통합시험
- [x] V10 안전 운영 진단·관리자 자동 잠금 개발
- [ ] Cloudflare 실제 배포 상태와 GET API 확인
- [ ] 사용자 계정 D1 마이그레이션/바인딩/비밀 설정
- [ ] 실제 개인정보 공지·사업자 정보 확인과 명시 승인
- [ ] Cloudflare 공개 서비스에서 실제 접수 → 관리자 조회/변경/삭제 실증
- [ ] 복원·백업·운영 장애 대응과 고객별 납품 QA
