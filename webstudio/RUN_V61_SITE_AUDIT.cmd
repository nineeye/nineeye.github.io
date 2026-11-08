@echo off
setlocal EnableExtensions DisableDelayedExpansion
rem AllFileOne WebStudio V61 - public GitHub source QA, no paid API and no PowerShell policy bypass.
set "DOWNLOADS=%USERPROFILE%\Downloads"
if not exist "%DOWNLOADS%" mkdir "%DOWNLOADS%" >nul 2>&1
set "REPORT=%DOWNLOADS%\AllFileOne_WebStudio_V61_Run_KO.txt"
set "STAGE=%TEMP%\AFO_V61_PUBLIC_QA_%RANDOM%_%RANDOM%"
set "GIT_TERMINAL_PROMPT=0"
set "RC=3"
mkdir "%STAGE%" >nul 2>&1
> "%REPORT%" echo 올파일원 웹스튜디오 V61 / Windows 로컬 소스 검증
>>"%REPORT%" echo 소스: https://github.com/nineeye/nineeye.github.io
>>"%REPORT%" echo 전제: Git, Python 3.x, 무료 인터넷 연결 / 추가 결제 없음
>>"%REPORT%" echo 주의: Cloudflare 공개 사이트 접속 및 실제 문의 수신 검증은 아님
where git >nul 2>&1
if errorlevel 1 (
  >>"%REPORT%" echo HOLD: Git 실행 파일을 찾을 수 없습니다.
  goto finish
)
where py >nul 2>&1
if errorlevel 1 (
  >>"%REPORT%" echo HOLD: Python Launcher(py.exe)를 찾을 수 없습니다.
  goto finish
)
>>"%REPORT%" echo 단계 1: GitHub 최신 main 공개 소스 읽기 전용 복제
git -c credential.interactive=never clone --depth 1 --single-branch --branch main https://github.com/nineeye/nineeye.github.io.git "%STAGE%\repo" >"%STAGE%\git.log" 2>&1
if errorlevel 1 (
  >>"%REPORT%" echo HOLD: 공개 GitHub 소스 내려받기 실패. 인터넷/GitHub 연결을 확인하세요.
  type "%STAGE%\git.log" >>"%REPORT%"
  goto finish
)
for /f "delims=" %%s in ('git -C "%STAGE%\repo" rev-parse HEAD') do set "SOURCE_COMMIT=%%s"
>>"%REPORT%" echo GitHub 소스 커밋: %SOURCE_COMMIT%
>>"%REPORT%" echo 단계 2: 현재 WebStudio HTML/CSS/링크/사이트맵 정적 검사
set "PY_VER=-3.14"
py -3.14 -c "import sys; sys.exit(0)" >nul 2>&1
if errorlevel 1 set "PY_VER=-3"
py %PY_VER% "%~dp0tools\v61_site_integrity.py" --root "%STAGE%\repo\webstudio" --expected-version V61 --output "%DOWNLOADS%"
set "RC=%ERRORLEVEL%"
if "%RC%"=="0" (
 >>"%REPORT%" echo PASS: GitHub 최신 main 로컬 정적 파일 검사를 통과했습니다.
) else (
 >>"%REPORT%" echo HOLD: 소스 감사에서 오류가 발견됐습니다. 다운로드 폴더의 SourceIntegrity_KO.txt를 확인하세요.
)
:finish
>>"%REPORT%" echo 결과 폴더: %DOWNLOADS%
>>"%REPORT%" echo 주의: 승인 없는 별도 결제/API/Actions/Cloudflare 설정 변경 없음
if exist "%STAGE%\" rmdir /s /q "%STAGE%" >nul 2>&1
type "%REPORT%"
rem Keep a visible summary without requesting keyboard input; details are always in Downloads.
timeout /t 4 /nobreak >nul 2>&1
exit /b %RC%
