# 올파일원 소스 통합 본파일 V6 — 재사용 엔진, 11개 프로젝트 인계

**기록일** 2026-11-08 (Asia/Seoul) · 앞 버전: SOURCE_MASTER_V5_33_ARCHIVES_20261108.md

## 현재 유효한 단일 최신 통합 본파일

- Library: `/WebStudio_Releases/AllFileOne_Source_Master_V6_33Archives_11Projects_LATEST.zip`
- 크기: **200,562,742 bytes (191.3 MiB)**, **500 MB 미만**.
- SHA-256: `19b4ac9dcef51db22a06a7351cd63ebe65369986b7e7bc3fe39a7c021d039085`
- **33개 원본 ZIP 전부 V5와 개별 SHA-256 동일**. 어떤 원본도 변형·삭제하지 않음.
- Library 업로드 → 재목록 → 재다운로드 SHA-256 일치; 통합 ZIP CRC PASS; **내부 62개 파일 SHA 62/62 PASS**.
- 포함물: 기존 V5 오프라인 검색 카탈로그/원본 33개/V4 SourceGuard + 신규 `ENGINE/afo_source_bridge.py` + `QA/test_source_bridge.py` + `RUN_WINDOWS_SOURCE_BRIDGE.cmd` + 11개 프로젝트 인계 + 독립 검토용 소스 3개/12파일.

## 이번 실제 코드 작업

Python 표준 라이브러리만 사용해 **원본을 실행·추출·수정하지 않는** 자동 Source Bridge V6 작성.

1. V5/V6 통합본에서 `CATALOG/MASTER_CATALOG.json`을 읽고 33개 소스 후보와 각 프로젝트 제안 목록을 작성.
2. 별도 **소형 3개** 후보 `dir-compare-main.zip`, `RecursiveFileCompare-main.zip`, `win_perf_view-main.zip`을 원본 SHA-256 확인 후 ZIP 안전 경로·엔트리 수·라이선스 본문·코드 확장자 점검.
3. 첫 번째 단계로 **12개 코드/문서만** `REVIEW_ONLY/REVIEW_ONLY_VALID_SOURCE_CANDIDATES.zip`에 복사. 이미지·바이너리·벤더 코드 자동 포함 금지.
4. `QA1`, `FILEDELIVERY`, `ANSIMBOAN`, `BXPRO` 등으로 연결할 JSON 인계 보고서를 생성. 일부 프로젝트의 카탈로그 후보는 0개이며 꾸며내지 않음.
5. Windows CMD에서 Python 3.14/3.13/3 등 사전검증 후 2개 시험 묶음과 리포트 생성. PowerShell 실행 정책 변경·pip 설치·추가 AI API 사용 금지.

### 검증 범위

- 새 Source Bridge 유닛·반례 **53/53 PASS**
- 기존 SourceGuard V4 회귀시험 **47/47 PASS**
- **합계 100/100 PASS** (Python 3.13에서 실행)
- 실제 V5 33개 본파일 입력 **3/3 PASS_REVIEW_ONLY**, V6 자체 본파일 입력 **3/3 PASS_REVIEW_ONLY**
- Windows 네이티브/GUI/PC 성능/판매 가능 판정/11개 제품 실제 병합/Cloudflare 실배포는 **NOT_TESTED**.

`PASS_REVIEW_ONLY`는 소스 검토용 수집 성공이며 제품이나 EXE 완성·악성코드 부재·상업 판매권 보증 아님. 각각의 DLL, Rust crate, Qt/CAD/FFmpeg/Pillow, 폰트/이미지 등 제3자 의존성은 따로 검증. 유료 서비스는 연결하지 않음.

## 다음 제품 개발 순서

- [x] ~~33개 무료 소스 원본·카탈로그 통합~~
- [x] ~~SourceGuard 독립 읽기 전용 검증~~
- [x] ~~Source Bridge V6 선택 3종 / 12파일 / 자동 100시험~~
- [x] ~~500MB 제한 및 Library 재다운로드 SHA/CRC 검증~~
- [ ] QA1의 사용자 Windows 실기에서 사전검증·동시 큐·출력·로그 확인
- [ ] 파일딜리버리·안심보안에서 새 비교 엔진의 읽기 전용 기능 통합시험
- [ ] BXPRO에서 Win32 성능 모니터 소스 Windows 빌드/실제 GUI 시험
- [ ] 웹스튜디오 신뢰성 강화용 실제 동작 데모에 검증된 기능만 선택적으로 연결
- [ ] 사진/문서/CAD/영상 엔진의 별도 사용권·라이선스·판매 적합성 확인

기존 웹사이트 V35 홈페이지 코드 변경 없음. 기존 PR #32의 V5 본파일 기록은 이력으로 보존하며, 신규 작업은 V6로 이어감.
