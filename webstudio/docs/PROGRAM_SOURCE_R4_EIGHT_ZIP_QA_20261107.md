# 올파일원 웹스튜디오 및 11개 제품 — 프로그램 무료 소스 R4 실사

일자 2026-11-07 · 기준 R3(#30) 다음 · **읽기 전용 감사 / 원본 변조 없음**

## 실제 사용자 업로드 ZIP 8개 조사 완료

| 파일 | 내부 라이선스 | ZIP CRC·안전경로 | 소스/기능 판정 |
|---|---|---|---|
| dir-compare-main.zip | Unlicense | PASS | Rust 표준 라이브러리 위주, 폴더 구조 비교 우선 후보 |
| files-organizer-python-main.zip | Unlicense | PASS | `app.py:75` 파일 이동: 원본 보호 전 통합 보류 |
| tkFileBrowser-master.zip | Unlicense | PASS | `fileTreeBrowser.py:556` 삭제 호출: GUI/Windows 검증 전 보류 |
| py_quick_hash-master.zip | Unlicense | PASS | Python 2 `print` 구문: Python 3 AST FAIL, 새 코드로 대체 |
| file_organizer-main.zip | CC0-1.0 | PASS | `file_organizer.py:37` 파일 이동 및 로그 폴더 의존: 보류 |
| EasyFileOrganizer-master.zip | Unlicense | PASS | 대화형 조작/파일 복사, 비파괴 버전 설계 참고 |
| file-deduplicator-master.zip | Unlicense | PASS | README에서 중복 검색만 완료, 실제 삭제/합병 미구현 |
| RecursiveFileCompare-main.zip | Unlicense | PASS | Windows .NET 10 x64 GUI 아닌 콘솔, Windows 빌드 미검증 |

정적 검사: 8/8 ZIP PASS, Python AST 7 PASS/1 HOLD, 이동·삭제 유발 코드 검토 3건.
이것은 **악성코드 탐지 결과나 실제 제품 동작/판매 허가 검증이 아니다.**
제3자 DLL, Python 패키지, Rust crate 및 리소스의 라이선스는 별도 검사 필요.

## 실사용 공통 소스 검사기 V4

원본을 옮기거나 삭제하지 않는 독립 Python 3.10+ 프로그램을 작성:

1. ZIP SHA256 / CRC / ZIP 경로 이탈 / 심볼릭 링크 / Windows 이름 충돌 검사
2. 폴더 전수 SHA256 + 내용 중복 탐색, 링크/권한 에러 `PARTIAL_HOLD`
3. 스냅샷 전후의 신규/삭제/수정/동일 파일 각각 구분
4. 검사 결과는 지정한 별도 JSON 파일로만 기록. 원본 폴더 안/원본 입력 경로 덮어쓰기 금지
5. Windows CMD에서 필수 사전검증·47개 독립 합성 회귀시험·Downloads JSON 로그, 전역 PowerShell 실행 정책 변경 없음

**QA 결과: 47/47 Python 단위시험 PASS, 사용자 제공 8/8 ZIP 구조 PASS**, 합성 폴더 비교 1추가+1삭제+1수정+1동일 정확.
원본 8개 ZIP은 중복해 재배포하지 않는다. Python/Rust/C# 원본은 판매용 제품에 직접 연결하지 않았다.

- 통합 ZIP: `/WebStudio_Releases/AllFileOne_SourceGuard_V4_8Archives_11Projects_LATEST.zip`
- ZIP SHA256: `37c3b6805d3dac4ee79854f0ba097c07d552b0a6d85d5a846d6c46c216c33c02`
- 내부 단일 ZIP CRC 및 SHA256SUMS 모두 검증
- 외부 소스 사용권: Unlicense 7개, CC0 1개. **외부 종속 라이선스 추가 검증 전 재배포/병합 금지**.

## 다음 단계

- [x] 11개 자체 프로젝트 소스 수집 현황 R3 추적
- [x] 추가 업로드 8개 라이선스/코드 위험·호환성 정적 검사
- [x] 독립 재사용 검사기 구현 및 회귀 47/47 PASS
- [ ] QA1 실제 Windows에서 Python 3.14 / GUI / 폴더 스캔 증거 확보
- [ ] 파일딜리버리·안심보안 소스 계약과 새 검사기 병합 테스트
- [ ] 다른 제품용 변환/사진/CAD/미디어 엔진의 재배포 허용과 Windows 실행 QA
- [ ] Cloudflare 홈페이지에 보여줄 기능은 별도 구매/예약 API 검증 후 반영

운영 중인 웹스튜디오 V35의 디자인과 JS는 이번 변경에서 수정하지 않음. 공개 Cloudflare 배포 성공을 주장하지 않음.
