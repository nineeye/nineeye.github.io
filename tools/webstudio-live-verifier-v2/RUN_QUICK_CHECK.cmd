@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "OUTPUT=%USERPROFILE%\Downloads"
if not exist "%OUTPUT%" mkdir "%OUTPUT%" 2>nul
set "LOG=%OUTPUT%\ALLFILEONE_WEBSTUDIO_LIVE_CONSOLE_LATEST.txt"
echo [AllFileOne Quick] Self-Preflight and static check > "%LOG%"
where py >nul 2>nul
if not errorlevel 1 (
    py -3 "%~dp0live_verify.py" --quick --out "%OUTPUT%" >> "%LOG%" 2>&1
    goto :END
)
where python >nul 2>nul
if not errorlevel 1 (
    python "%~dp0live_verify.py" --quick --out "%OUTPUT%" >> "%LOG%" 2>&1
    goto :END
)
echo ERROR: No available Python interpreter. >> "%LOG%"
:END
endlocal
