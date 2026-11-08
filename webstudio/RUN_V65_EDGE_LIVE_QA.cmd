@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
set "ROOT=%~dp0"
set "SCRIPT=%ROOT%webstudio\tools\v65_edge_live_qa.py"
if not exist "%SCRIPT%" set "SCRIPT=%ROOT%tools\v65_edge_live_qa.py"
set "OUT=%USERPROFILE%\Downloads"
if not exist "%OUT%" mkdir "%OUT%" 2>nul
if not exist "%SCRIPT%" (
  >"%OUT%\V65_LIVE_BROWSER_RESULT_KO.txt" echo HOLD: V65 QA source not found.
  start "" notepad.exe "%OUT%\V65_LIVE_BROWSER_RESULT_KO.txt"
  exit /b 3
)
set "PYEXE="
where py >nul 2>&1
if not errorlevel 1 (
  py -3.14 -c "import sys; sys.exit(0)" >nul 2>&1
  if not errorlevel 1 set "PYEXE=py -3.14"
)
if not defined PYEXE (
  where python >nul 2>&1
  if not errorlevel 1 set "PYEXE=python"
)
if not defined PYEXE (
  >"%OUT%\V65_LIVE_BROWSER_RESULT_KO.txt" echo HOLD: Python 3.14 or compatible Python not found. No installation attempted.
  start "" notepad.exe "%OUT%\V65_LIVE_BROWSER_RESULT_KO.txt"
  exit /b 3
)
%PYEXE% "%SCRIPT%" --output "%OUT%"
set "RETURN_CODE=%errorlevel%"
echo Evidence saved: "%OUT%\V65_LIVE_BROWSER_EVIDENCE_LATEST.zip"
echo Korean report: "%OUT%\V65_LIVE_BROWSER_RESULT_KO.txt"
if exist "%OUT%\V65_LIVE_BROWSER_RESULT_KO.txt" start "" notepad.exe "%OUT%\V65_LIVE_BROWSER_RESULT_KO.txt"
exit /b %RETURN_CODE%
