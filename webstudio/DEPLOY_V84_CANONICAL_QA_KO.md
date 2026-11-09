# 올파일원 웹스튜디오 V84 공개 검증 보정 / 실제 원인 해결

## 확인한 실제 실행 증거 (2026-11-09)
- GitHub main SHA `fb4cb46a80c41a6c0bf63ffed3f4d179b558466f`, Windows Actions [run 42627969267](https://github.com/nineeye/nineeye.github.io/actions/runs/42627969267).
- 전체 소스 자동 회귀 274/274 PASS, 정적 배포 ZIP 440개 파일 PASS, 단 기존 진단 11/47 결과는 `demo/*/*/index.html` 총 36개에 동일한 `다른 경로로 리디렉션` 오류가 발생한 상태입니다.
- 원인 분석: 기존 `norm_route`가 `/demo/X/style/index.html`을 `/demo/X/style/index`로 바꾼 후 Cloudflare가 제공하는 `/demo/X/style/`과 잘못 비교합니다. 이것은 실화면 불량 여부를 입증하지 못합니다.
- 이에 동일 출처 및 **동일 디렉터리**의 `/index.html` ↔ `/` 캐노니컬 경로만 동등 인정합니다. 다른 디렉터리로 이동, 홈페이지 fallback, 다른 출처, 잘못된 표식은 기존대로 HOLD합니다.
- V83 진단 결과가 HOLD일 때 종료코드 3을 예상대로 증거 저장 후 통과시키도록 GitHub Actions PowerShell 단계 마지막에 명시적인 `exit 0`을 추가했습니다. 전체 공개 검증 단계는 여전히 실패하면 HOLD입니다.

## V84 공개 검증 추가
- `tools/v84_public_showroom_probe.py` — public HTTPS read-only 7개 파일의 **버전별 실제 본문 표식** 검사. 기존 홈 CTA·새 전시관·12업종·원본 카탈로그·추가 기능 카탈로그·원형 시연·추가 시연을 별도로 확인합니다.
- `tools/test_v84_public_showroom.py` — localhost/외부 접속 없는 실제 소스 7/7 확인 및 200 fallback/없는 파일/잘못된 시연 거절.
- GitHub Actions는 V83과 V84 증거를 **비차단 방식으로 수집**한 다음 기존 V82 47개 확인 및 최종 V84 7개 공개 게이트를 각각 판정합니다. 이미 존재한 유료 트래픽 요금이나 서버 API 신규 사용은 없습니다.

## 공개 결과 판정 유의
- GitHub Pages `pages build and deployment` 성공은 Cloudflare Pages 공개 성공 증거가 아닙니다.
- 47/47, V84 7/7이 확인되어도 **이는 파일 본문** 검증이지 실제 PC/mobile 모든 클릭·이메일 수신·예약·결제·계약의 증거가 아닙니다.
- Naver 메일 수신·Cloudflare Production SHA·실제 고객 계약은 별도 확인해야 합니다.
- 실공개 파일이 최신이 아니면 `HOLD`가 정답이며, 고객에게 허위로 '실제 예약·결제 가능'이라 표시하지 않습니다.
