# 올파일원 11개 프로젝트·웹스튜디오 통합 소스 본파일 V5

기록일: 2026-11-08 (Asia/Seoul) · **검증된 소스만 재사용 / 소스 원본 불변**

## 최신 본파일 (현재 라이브러리에 저장됨)

- Library: `/WebStudio_Releases/AllFileOne_Source_Master_V5_33Archives_11Projects_LATEST.zip`
- 크기: **200,511,329 bytes (191.2 MiB)**, 사용자 설정 제한 500MB 이하
- SHA256: `b2e44ef77b15d5e98da695d5de4920b2ee728ef0d71dbf42f930210a2eb0f6af`
- 자료: **원본 소스 ZIP 33개**, 원본 SHA/CRC 기록, 오프라인 HTML 검색 카탈로그, CSV/JSON 원장, V4 공통 Source Guard, QA 증거
- 원본 저장소 최상위 라이선스 분류: CC0 12개, Unlicense 21개 (별도 의존성의 상업 사용권을 의미하지 않음)
- 라이브러리 업로드 → 재목록 → 재다운로드 → 파일 SHA256 일치, ZIP CRC PASS, 내부 SHA 원장 53개 일치

## 분야별 분류

- `WEB_TEMPLATES` 7 — 에이전시·개인·관리자·헬프데스크·스타터·One-File-Tools
- `WEB_REFERENCE` 4 — MDN HTML/CSS/JS/Web Components 예제
- `WEB_UI_ASSETS` 4 — UI 컴포넌트·CSS3 버튼·SVG 아이콘·QR/바코드
- `FILE_INTEGRITY` 9 — 백업, 폴더/해시 비교, 중복 탐색, 파일 정리
- `CAD_AND_DOCUMENT` 4 — DXF, PDF 처리, Python 도구상자
- `MEDIA_AND_CONVERTERS` 4 — 이미지 변환·워터마크·PDF·영상 메타데이터
- `WINDOWS_UTILITIES` 1 — Win32 CPU/RAM/GPU HUD

## 이번 추가 2개

1. `File-backup-app-main.zip` (`mvvmmv/File-backup-app`): Unlicense 원본. `functions.py`에 `os.remove`와 `shutil.copy`가 있음. **원본 삭제·덮어쓰기 위험으로 실행 및 기존 백업 코드 통합 HOLD**. 변경 감지/비교 구조만 검토.
2. `win_perf_view-main.zip` (`sisyphusend/win_perf_view`): Unlicense 원본. MSVC/MinGW 빌드 스크립트 포함, Win32/GDI/PDH/DXGI 방식. **QA 로봇 1호 리소스 모니터 후보**. 실제 사용자 Windows 빌드·성능·DPI 검증 전 HOLD.

## QA

- 33/33 원본 ZIP CRC·상대경로·ZIP 심볼릭 링크·파일명 충돌 검사 PASS
- Python 소스 AST **46 PASS, 1 HOLD** (기존 Python 2 `py_quick_hash`; 실행하지 않음)
- Source Guard V4 **47/47** 회귀 시험 PASS
- V5 통합 카탈로그 **12/12** 시험 PASS
- Chromium 360/390/768/1280px 화면에서 33개 카드, 검색, 프로젝트 필터, 분야 필터·가로 넘침 없음, 네트워크 0건, JS 오류 0건. 이 시험은 격리된 페이지 콘텐츠 렌더링으로 수행; 보안 정책상 `file://` 실제 URL 통합시험은 미수행
- 사용자의 실제 Windows GUI, 11개 제품 소스에 대한 동작 결합, 라이선스/실제 판매/Cloudflare 실배포는 **미검증**

## 작업 규칙

1. **원본 33개 ZIP은 변경하지 않는다.** `SOURCE_ARCHIVES`는 연구 목적의 원본 보관이며 판매 제품에 통째로 복사하지 않는다.
2. 재사용 코드에는 외부 라이브러리·폰트·사진·브랜드·코덱·모델의 별도 사용권과 비용 검증을 의무화한다.
3. 원본 삭제·이동·덮어쓰기 코드는 비파괴 보호 시험 전 차단한다.
4. 11개 자체 프로그램 중 각 제품 담당, QA1, BXPRO 역할을 구분한다.
5. 500MB 미만, ChatGPT Plus 외 추가 비용 0원, 한글 Windows 11 사전검증, 결과 ZIP SHA/CRC를 유지한다.
6. 웹스튜디오 현행 운영 V35 코드는 이번 릴리스에서 수정하지 않는다.

## 다음 단계

- [x] 사용자 제공 원본 소스 ZIP **33개** 통합 분류
- [x] 검색 가능한 CSV/JSON/오프라인 HTML 카탈로그
- [x] R4 공통 Source Guard 소스·QA 인계
- [x] 라이브러리 저장 및 재다운로드 무결성 확인
- [ ] Windows 실기 성능 모니터 컴파일·GUI/화면 DPI 테스트
- [ ] 백업 프로그램 원본 삭제 경로를 차단한 안전한 변경 리포트 개념 검증
- [ ] 선택한 3~5개 유효 소스를 QA1/파일딜리버리/안심보안과 독립 통합 시험
- [ ] 이미지/동영상/CAD/문서 엔진의 최종 제3자 라이선스·용량·배포 검토
