# 올파일원 웹스튜디오 V82 배포 인계서

## 1. 정확한 소스와 배포 경로
- GitHub 정본: `nineeye/nineeye.github.io` 저장소의 `main` 브랜치 / `webstudio/` 폴더
- **기존 Cloudflare Pages Git 연동 프로젝트의 권장 설정:** Production branch=`main`, Build command=`exit 0`, Build output directory=`webstudio`
- 확인 위치: Cloudflare 대시보드 → Workers & Pages → 해당 Pages 프로젝트 → Settings → Builds/Deployments. 정확한 메뉴 이름은 시점에 따라 다를 수 있습니다.
- 파일에 포함된 `WEBSTUDIO_SITE_ONLY_V82.zip`은 루트에 `index.html`이 있습니다. **GitHub 연동 프로젝트에 ZIP을 업로드해서 기존 배포를 덮어쓸 수 있다는 뜻이 아닙니다.** Direct Upload 방식을 쓰는 별도의 프로젝트에서 사용할 배포용 사본입니다.
- Cloudflare 공식 문서: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/ , https://developers.cloudflare.com/pages/configuration/git-integration/.

## 2. 실제 성공 조건
1. Cloudflare Pages Deployments의 최신 Production 항목이 V82 GitHub 병합 SHA를 참조하고 성공해야 합니다.
2. 공개 URL `/assets/current-release.json`에 `version=V82`, `release_id=WEBSTUDIO-V82-20261109`가 실제로 제공돼야 합니다.
3. 공개 URL `/release-check-v82.html`에서 '실제 공개 파일 검사' 버튼을 눌러 PASS_PUBLIC_FILES_ONLY를 확인해야 합니다.
4. 36개 디자인을 PC/모바일에서 직접 클릭하고 문의 동선을 시험해야 합니다.
5. **실제 이메일 도착은 별도**입니다. 방문자가 메일앱에서 발송하고 운영자가 Naver 받은편지함/스팸함에서 수신해야 합니다. 검사 PASS가 수신을 증명하지 않습니다.

## 3. 공개 배포 문제가 지속될 때
- Production branch가 `main`인지, Project가 `nineeye/nineeye.github.io`에 연결됐는지 확인.
- Build output directory가 `webstudio`인지 확인. `.` 또는 `dist`로 잘못 설정되면 저장소 다른 사이트 또는 빈 폴더를 배포할 수 있습니다.
- Deployments → 최근 배포 선택 → View details → Build log에서 실패 원인 확인.
- 자동 빌드가 비활성화됐거나 GitHub Apps 설치가 해제된 경우 Cloudflare Pages Git 연동 상태를 확인.
- 이 환경에서 공개 Cloudflare 주소가 접근 불가이므로 **현재 실배포·실메일 수신 상태는 HOLD**입니다.

## 4. 비용·개인정보 및 계약
- 정적 웹사이트 파일과 사용자가 보는 시연은 유료 AI API를 요청하지 않습니다.
- 84개 가상 브라우저 시연은 운영 서버 기능이 아니며, 실제 예약/결제/회원/재고 연동은 고객별 별도 협의·구축 대상입니다.
- 29/59/99만원부터 표기는 기획 예시 시작가입니다. 최종 가격·부가세·도메인/호스팅·유료 외부 연동·수정 범위·유지보수는 서면 견적에서 결정.
- 새 D1/Workers/이메일 서버 배포, 유료 서비스·외부 고객 데이터 수집을 자동 활성화하지 않았습니다.