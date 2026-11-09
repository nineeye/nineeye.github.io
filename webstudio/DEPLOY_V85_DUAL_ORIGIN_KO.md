# 올파일원 웹스튜디오 V85 — Cloudflare 정체 대비 실제 공개 우회

## 확인된 로그 (2026-11-09)
- GitHub main 병합 PR #94 / SHA `c6818939fa36772ff6dda1f60889435e7debfff8`.
- Actions 공개 파일 검사 #42635143599: **40/44 PASS, 4 HOLD**. Cloudflare 도메인의 index.html에 V85 링크가 없고 V85 HTML/CSS/JS 3파일은 HTTP 404. 기존 V82/V84 공개 파일은 계속 PASS. 즉 Cloudflare는 이전판을 제공 중이며 최신 V85 배포 성공을 주장할 수 없음.
- GitHub Pages 기본 프로젝트의 같은 commit 배포 #42635141035: build/deploy 단계 SUCCESS, environment URL `https://nineeye.github.io/`. **이 성공만으로 하위 V85 경로의 HTTP 응답·브라우저 작동을 입증하지는 않음.**

## 이번 해결 방법
- 실제 사용자 소유 GitHub Pages 주소 `https://nineeye.github.io/webstudio/`를 독립적인 정적 홈페이지 대체 공개 원점으로 검사.
- Cloudflare가 404일 때 GitHub Pages를 `44/44` 실제 HTTP 본문으로 별도 증명한 경우에만 Windows Edge 브라우저 검증에 사용. 한 원점의 성공을 다른 원점 성공으로 잘못 주장하지 않음.
- 공개 프로브와 브라우저 프로브는 정확히 두 개의 소유자 공개 HTTPS 원점만 허용. 엉뚱한 도메인·리디렉션·잘못된 본문·홈페이지 200 fallback은 거절.
- Windows Edge에서는 12개 업종×3디자인×PC/모바일 선택 및 대표 샘플 iframe의 실제 내부 업종/스타일 식별값, 레이아웃과 PNG 캡처를 확인.
- 공개 확인이 실패해도 한글 JSON/TXT/ZIP 및 SHA 증거를 저장; 새로운 유료 API/로그인/외부 계약·실고객 이메일 전송 없음.

## Cloudflare 별도 원인확인
1. Cloudflare → Workers & Pages → 기존 `allfileone-webstudio` 프로젝트 → Deployments. 최신 **Production**의 배포시각·GitHub commit SHA가 `c681893...`와 일치하는지 확인.
2. `main` 자동 배포 활성화·GitHub Git Integration 설치/권한 유효 상태 확인.
3. Build command `exit 0`, output directory `webstudio`, root directory가 저장소 루트인지 확인. Cloudflare 빌드 로그로 실제 설정을 검증.
4. Cloudflare는 Git 연동 프로젝트에서 대시보드 Direct Upload로 단순 전환할 수 없으므로, 기존 프로젝트를 무단 변경·삭제하거나 유료 API를 호출하지 않음.

공식 가이드: https://developers.cloudflare.com/pages/configuration/git-integration/ , https://developers.cloudflare.com/pages/configuration/git-integration/troubleshooting/ .

※ GitHub Pages 공개 URL은 GitHub가 제공하는 독립 주소이며 `allfileone.co.kr` 커스텀 도메인 연결 확인을 의미하지 않습니다.
