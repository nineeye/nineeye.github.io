@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
echo [올파일원 웹스튜디오] V83 공개 배포 진단 / 읽기 전용 / 추가 API 비용 없음
if not exist "%USERPROFILE%\Downloads" mkdir "%USERPROFILE%\Downloads" >nul 2>&1
set "AFO_OUTPUT=%USERPROFILE%\Downloads\AFO_WebStudio_V83_Public_Diagnostic"
if not exist "%AFO_OUTPUT%" mkdir "%AFO_OUTPUT%" >nul 2>&1
set "AFO_PY="
for %%V in (3.14 3.12 3.11) do (
  if not defined AFO_PY (
    py -%%V -c "import sys; print(sys.version)" >nul 2>&1
    if not errorlevel 1 set "AFO_PY=%%V"
  )
)
if not defined AFO_PY (
  echo ERROR: Python 3.14, 3.12 또는 3.11을 시작하지 못했습니다. python313.dll 없는 실행기를 사용하지 않습니다.
  echo 설치 확인: py -0p
  > "%AFO_OUTPUT%\AFO_V83_BOOT_LATEST_KO.txt" echo HOLD: Python 3.14/3.12/3.11 실행 환경이 없어 진단 시작 실패. py -0p 로 확인하세요.
  timeout /t 10 /nobreak >nul
  exit /b 10
)
echo 사용 Python: %AFO_PY% ^| 결과 저장: %AFO_OUTPUT%
py -%AFO_PY% "tools\v83_public_diagnostics.py" --output "%AFO_OUTPUT%" --include-owned-domain
set "AFO_CODE=%ERRORLEVEL%"
if "%AFO_CODE%"=="0" echo 공개 V82 파일 검사 PASS. 브라우저/실제 이메일 수신은 여전히 미검증입니다.
if "%AFO_CODE%"=="3" echo 공개 배포 확인 HOLD. Downloads의 한국어 보고서에서 원인을 확인하세요.
if not "%AFO_CODE%"=="0" if not "%AFO_CODE%"=="3" echo 실행 오류 %AFO_CODE%. Python 또는 ZIP 경로를 확인하세요.
echo 보고서: %AFO_OUTPUT%\AFO_V83_PUBLIC_DIAGNOSTIC_KO.txt
(
  echo V83 진단 종료코드: %AFO_CODE%
  echo 사용한 Python: %AFO_PY%
  echo 한국어 진단 보고서: %AFO_OUTPUT%\AFO_V83_PUBLIC_DIAGNOSTIC_KO.txt
) > "%AFO_OUTPUT%\AFO_V83_BOOT_LATEST_KO.txt"
timeout /t 10 /nobreak >nul
exit /b %AFO_CODE%