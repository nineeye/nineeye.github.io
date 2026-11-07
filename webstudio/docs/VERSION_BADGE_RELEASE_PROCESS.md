# WebStudio — 화면 최상단 버전 표기 운영 규칙

작성: 2026-11-07 · 기존 V29 핫픽스. 목표: V29가 '버전'이라고만 표시되는 문제 해결 및 앞으로 자동 갱신.

## 왜 문제가 발생했는가
- 이전 `index.html`은 최상단 화면에 숫자 없는 기본 문자열 `버전`만 포함했다.
- 버전 숫자는 HTML 문서 맨 끝의 *인라인 자바스크립트*만 갱신했다.
- 이 스크립트가 실행되지 않거나 페이지 HTML이 먼저 표시되면 버전 번호가 보이지 않는다.
- GitHub `main`의 최신 소스 버전과 Cloudflare Pages에서 실제 응답한 버전은 반드시 구분해야 한다.

## 적용한 수정
1. `index.html`: JavaScript가 없어도 보이는 기본값을 `V29`로 변경.
2. `assets/version-badge.js`: 독립적인 외부 스크립트로 분리. DOM 준비 후 HTML 메타데이터에서 현재 버전을 읽고, 서버의 `assets/current-release.json`으로 확인된 새 번호가 있을 때 표시를 갱신.
3. `assets/current-release.json`: 현재 버전 **하나만** 기록하는 가벼운 파일. 같은 도메인에서 `cache:'no-store'`로 읽어 현재 공개된 파일의 버전을 표시.
4. `assets/v25-audit.js`: 운영 자가진단 페이지에서 버전 포인터와 배지 스크립트를 검사.

## 다음 버전으로 올라갈 때 반드시 수행할 작업 (무료/무의존성)
- [ ] `assets/current-release.json`의 `version`, `release_id`, `release_date`를 새 버전에 맞게 갱신
- [ ] `index.html`의 새 버전 `<meta name="webstudio-release-vNN" ...>`을 추가
- [ ] `index.html`의 **HTML 기본 버전 텍스트**도 새 번호로 변경 (JS 차단 환경용)
- [ ] `assets/v25-audit.js` 및 `site-check.html`의 기대 버전을 새 버전으로 변경
- [ ] GitHub 병합 후 배포 URL의 `/assets/current-release.json`과 `/site-check.html`을 별도로 확인
- [ ] 실제 상담/예약/결제 동작은 버전 표시로 증명할 수 없음을 안내

## QA 완료
- 기존 메타데이터 V22, V25, V27, V28, V29에서 V29 추출: PASS
- 새 포인터 V30으로 변경 시 브라우저 스크립트가 V30 표시: PASS (모의 응답)
- V28의 구버전 포인터가 오더라도 V29에서 역행하지 않음: PASS
- 잘못된 product/release_id 거부: PASS
- 네트워크 차단 시 HTML의 V29 기본값 유지: PASS
- 스크립트 실행 없이 HTML에서 V29를 확인 가능: PASS

> **검증 범위:** GitHub의 소스 및 JS 모의 실행. Cloudflare 공개 사이트가 이 파일을 실제로 제공하는지는 별도 검사 필요. HTML 기본값과 원격 포인터는 실제 서비스 작동 상태를 증명하지 않는다.
