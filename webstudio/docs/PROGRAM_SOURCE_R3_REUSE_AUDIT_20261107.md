# 올파일원 웹스튜디오 — 프로그램 소스 무료 후보 조사 R3

날짜 2026-11-07, 작성 범위: **읽기 전용**, Windows 프로그램 실행·빌드 아님

## 업로드 아카이브 9개 검증

- QR/바코드 생성기: Unlicense, ZIP 구조 PASS, 외부 CDN 의존. 판매 홈페이지의 실제 기능으로 직접 편입 보류
- VideoCleaner: Unlicense, ZIP 구조 PASS, FFmpeg/ExifTool 의존. 무비에디트 검증 후보
- PDF_TOOLKIT: CC0, ZIP 구조 PASS, PyQt5/PyPDF2 별도 라이선스. 문서안심 직접 이식 보류
- toolbox-py: Unlicense, ZIP 구조 PASS, 다수 Python 외부 패키지. 11개 제품별로 함수/아이디어만 선별
- DxfViewer: Unlicense, ZIP 구조 PASS, DxfLib submodule 미포함, Qt5 의존. CADReview 빌드 보류
- pdf_tools: Unlicense, ZIP 구조 PASS, pypdf/PyPDF2 의존. 57종 변환기 참고
- ImagesConverter: Unlicense, ZIP 구조 PASS, Rust/Tauri2/image/ORT 의존. 사진한결 이미지 변환기 후보
- Image-To-PDF-Converter-with-GUI: Unlicense, ZIP 구조 PASS, Pillow 의존. 개별변환기 GUI 참고
- Image-Watermarking-Desktop-App: CC0, ZIP 구조 PASS, Pillow 의존. 사진한결 참고

실제 검사: **ZIP CRC 9/9 PASS**, ZIP 상대 경로/링크 위험 0건, **Python AST 문법 37/37 PASS**.
원본 사용자 ZIP은 실행하거나 수정하지 않음. 소스 저장소 라이선스는 외부 라이브러리/모델/기타 에셋에 자동 확장되지 않음.

## 신규 다운로드 후보 — 모두 500MB 미만의 GitHub 표시 저장소 규모

| 우선 | 소스 | 표시 라이선스 | 직접 ZIP 다운로드 | 주의 |
|---|---|---|---|---|
| 1 | dsaghliani/dir-compare | Unlicense | https://github.com/dsaghliani/dir-compare/archive/refs/heads/main.zip | Rust std-only, 큰 파일 메모리 사용 주의 |
| 2 | paulbaucom/RecursiveFileCompare | Unlicense | https://github.com/paulbaucom/RecursiveFileCompare/archive/refs/heads/main.zip | .NET 10, archived 저장소 |
| 3 | victordremov/file-deduplicator | Unlicense | https://github.com/victordremov/file-deduplicator/archive/refs/heads/master.zip | 제삼자 Rust crates 별도 라이선스 |
| 4 | ben-dow/EasyFileOrganizer | Unlicense | https://github.com/ben-dow/EasyFileOrganizer/archive/refs/heads/master.zip | 구형 동작, 파일 이동과 입력 프롬프트 |
| 5 | mkutilities/file_organizer | CC0 | https://github.com/mkutilities/file_organizer/archive/refs/heads/main.zip | logs 경로 누락 가능 |
| 6 | bearpaw7/py_quick_hash | Unlicense | https://github.com/bearpaw7/py_quick_hash/archive/refs/heads/master.zip | Python 2.7 레거시 |
| 7 | jwansek/tkFileBrowser | Unlicense | https://github.com/jwansek/tkFileBrowser/archive/refs/heads/master.zip | pypiwin32/Pillow/matplotlib 등 외부 의존성 |
| 8 | fer-moreira/files-organizer-python | Unlicense | https://github.com/fer-moreira/files-organizer-python/archive/refs/heads/main.zip | 파일 덮어쓰기 원본 보호 필요 |

**주의:** 크기는 GitHub 저장소 표시 크기이며 실제 ZIP 크기는 직접 검사 전 미확정. CC0/Unlicense 여부는 저장소 최상위 소스 라이선스 기준.

## 프로젝트별 통합 우선순위

1. 파일딜리버리/안심보안/QA1: SHA/CRC·원본 불변·폴더 비교의 소형 코드·테스트 우선 검토
2. 사진한결/개별변환기: 이미지 인코딩 및 워터마크 구성 참고 후 외부 엔진의 공인 사용권 검증
3. 문서안심: PDF 변환 도구별 별도 패키지 라이선스와 한글/멀티페이지 QA
4. 캐드리뷰: DXF submodule 취득권·동적 링크 검증 전 코드 직접 포함 금지
5. 무비에디트: FFmpeg/ExifTool 및 사용된 코덱 별 라이선스/크기 검토
6. 발주브릿지/웹스튜디오: QR 기능의 CDN 의존을 제거한 코드만 단계적 실증
7. BXPRO: 소스 통합은 승인된 고정 해시 경로로만 진행

기존 웹스튜디오 V30에서 확보한 12개 재사용 시연 기능과 중복으로 카운트하지 않는다.
새로운 프로그램 완성·판매 가능·실제 Windows 실행을 주장하지 않는다. 외부 유료 API/코덱스 비용 0원 원칙 유지.
