# 올파일원 웹스튜디오 V46 — 상담 준비정보 유실 방지

2026-11-08 / V45 기본 소스에 병합하는 안전한 추가 기능

## 고객 문제가 무엇이었나?

V45의 제조·도매/학원·교육/인테리어·시공 준비 체크리스트에서 프로젝트명·목표·메모·준비한 자료를 입력해도, 하단 상담으로 이동할 때 **업종만 넘어갔습니다.** 고객이 이미 입력한 내용을 다시 적어야 했습니다.

## 구현

1. 기존 `launch-kit.html` 상담 링크를 **준비내용 포함하여 상담서 이동**으로 전환. V45 본래 체크리스트·TXT·복사·인쇄 기능은 그대로 유지.
2. 버튼을 일반 클릭했을 때만 프로젝트 이름(80자), 목표(40자), 메모(300자), 10개 자료의 준비/미준비 상태를 수집.
3. 사용자 입력을 URL 쿼리에 쓰지 않고, **같은 탭의 sessionStorage에 1회만 임시 보관**. 15분 이상 오래된 자료, 예상 스키마와 맞지 않는 자료, 업종 불일치 정보는 거부.
4. 기존 `contact.html`에서 데이터를 읽자마자 sessionStorage에서 삭제. `industry`, `goal`, `details`를 기존 V26 상담 준비서에 반영하고 `input` 이벤트로 미리보기를 갱신.
5. 상담서 우측의 700자 요청사항 칸은 글자 수를 넘기지 않도록 요약하고, 별도로 **전체 준비키트 복사** 제공. 내용이 생략된 경우 안내.
6. 텍스트는 `textContent`로 표시하여 사용자 입력이 HTML로 실행되지 않게 처리.
7. Ctrl/Meta/Shift/Alt 등 새 탭 이동은 오해를 막기 위해 같은 탭 클릭을 안내. 임시 저장이 차단되면 저장 실패를 알리고 기존 TXT/복사 흐름 제공.
8. 추가 사용자 추적, 서버 접수, 자동 메일 발송, 관리자 수신 DB, 유료 API는 **없음**.

## 검증 경계

- **격리 Chromium 91/91 PASS**: V45 실제 제작 시작키트의 HTML/CSS/JS + V46 추가 코드, 360/768/1440px, 요약/초기화, HTML 삽입 방지, 오래된·변조된 자료 거부, 반복 수입 금지, V45 동작 보존.
- 보안 격리 환경에서 실제 페이지 이동이 차단되어 `page.set_content`와 **임시 sessionStorage 흉내 객체**를 사용한 기능 검증임. **실제 도메인에서의 same-origin sessionStorage 실기, 실제 Cloudflare 최종 응답 및 이메일 수신은 미검증**.
- GitHub PR 병합/Cloudflare 공식 커밋 상태는 추가 확인 필요. CI 성공이 곧 사용자의 이메일 수신 성공은 아님.

## 상용화 목표

제작 시연 → 준비자산 점검 → 상담서 자동 구성 → (방문자가 메일에서 직접 발송) → 고객 요청 검토 → 유료 제작 계약.

우선업종: 제조·도매, 학원·교육, 인테리어·시공. 36개 디자인 가상 데모는 실제 납품 실적이라고 주장하지 않습니다.

## 무료 운영 및 SEO 참고 공식 문서

- 네이버 서치어드바이저: https://searchadvisor.naver.com/guide/faq-start-register
- 네이버 robots.txt: https://searchadvisor.naver.com/guide/seo-basic-robots
- Google 검색 구조화 데이터: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Cloudflare Pages 무료 플랜 제한: https://developers.cloudflare.com/pages/platform/limits/

검색 노출은 보장하지 않으며, 사이트 소유확인/검색 콘솔 연결은 실제 계정 권한으로 별도 진행해야 합니다.
