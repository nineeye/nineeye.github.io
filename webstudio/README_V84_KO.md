# 올파일원 웹스튜디오 V84 — 고객 경험형 디자인 선택기

## 이번 변화
- 기존 main V83 전체 소스, 공개 고객 버전 V82와 12업종×3디자인, 84개의 가상 브라우저 기능을 변경·삭제하지 않았습니다.
- `design-studio-v84.html`를 추가하고 홈페이지 첫 화면의 디자인 CTA와 푸터에 연결했습니다.
- 모던(정보·벤토), 프리미엄(암색·시네마틱 중앙 무대), 에디토리얼(밝은 종이색·비대칭 잡지형) 간 **전면 레이아웃/타이포그래피 전환**을 구현했습니다. 색만 바꾸지 않습니다.
- 이미 있는 `assets/v28-catalog.js`, `assets/v67-industry-data.js`, `assets/v77-feature-data.js`를 재사용합니다.
- 12업종 중 하나를 선택하면 실제 V28 원형 4개 시연 + V78~V80 추가 3개 시연 + 아직 미구현 운영 기능 1개를 정확히 구분해 표시합니다.
- 4개 시연 링크는 `demo/{industry}/{style}/index.html?feature=...`이고, 추가 3개는 `feature-lab-v80.html?industry=...&feature=...`입니다.
- 실제 운영·예약·주문·결제·사용자 정보 보관·이메일 접수는 전혀 구현하지 않았습니다. 제작 옵션은 V81 범위 협의로 연결됩니다.
- 추가 유료 AI API, 회원가입, 외부 CDN 의존성이 없습니다.

## QA 및 한계
- 격리된 Chromium에서 390×844, 1440×960 화면, 12업종×3디자인, 버튼 상태·링크·7+1 기능 표시·가로 넘침·JS 오류에 대해 464회 PASS.
- 격리 테스트는 **테스트용 카탈로그 픽스처**를 사용하므로 GitHub 실제 전체 카탈로그 런타임, 기존 36개 시연 동작, 외부 Cloudflare Production은 별도 확인 대상입니다.
- 홈 링크 및 원본 HTML 검사를 GitHub CI 기존 회귀가 실행할 수 있지만, 실공개 HTTPS가 HOLD면 공개 PASS를 주장하지 않습니다.
- Cloudflare Pages Git 설정은 Production branch main / Build command `exit 0` / Output directory `webstudio`를 기준으로 확인해야 합니다.
- 고객 이메일은 `nineeyes@naver.com`에서 실제 수신 여부를 별도 확인해야 합니다.

## 로컬 실행
1. 기존 전체 GitHub 저장소 소스에서 `webstudio/design-studio-v84.html`을 실행합니다. HTML 한 파일만 분리하면 기존 assets/가 없어 시연 목록이 표시되지 않습니다.
2. 업종과 스타일을 바꾸고 `이 디자인 전체 체험` 및 `직접 조작하기`를 눌러 기존 시연을 엽니다.
3. 제작 범위를 검토한 뒤 기존 상담 창에서 이메일을 직접 발송합니다.

## 결과물
- 코드: `webstudio/design-studio-v84.html`, `webstudio/index.html`
- 본 문서, `ROADMAP_V84_KO.md`
- 이번 HTML SHA-256 (개별 로컬 테스트 정본): `ce0576a21e980cbf99125d022a2fa51a5b9306606dd71442a32d0a3c9fe4703b`
- V84만으로 공개 URL이 반영됐다고 판단하면 안 됩니다.
