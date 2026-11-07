@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "OUTPUT=%USERPROFILE%\Downloads"
if not exist "%OUTPUT%" mkdir "%OUTPUT%" 2>nul
set "LOG=%OUTPUT%\ALLFILEONE_WEBSTUDIO_LIVE_CONSOLE_LATEST.txt"
echo [AllFileOne] Self-Preflight started. > "%LOG%"
echo [AllFileOne] Read-only HTTPS check. No admin, secrets, PowerShell policy edits, or paid APIs. >> "%LOG%"

where py >nul 2>nul
if not errorlevel 1 (
    py -3.14 -c "import sys" >nul 2>nul
    if not errorlevel 1 (
        py -3.14 "%~dp0live_verify.py" --out "%OUTPUT%" >> "%LOG%" 2>&1
        goto :END
    )
    py -3.13 -c "import sys" >nul 2>nul
    if not errorlevel 1 (
        py -3.13 "%~dp0live_verify.py" --out "%OUTPUT%" >> "%LOG%" 2>&1
        goto :END
    )
    py -3 -c "import sys" >nul 2>nul
    if not errorlevel 1 (
        py -3 "%~dp0live_verify.py" --out "%OUTPUT%" >> "%LOG%" 2>&1
        goto :END
    )
)
where python >nul 2>nul
if not errorlevel 1 (
    python "%~dp0live_verify.py" --out "%OUTPUT%" >> "%LOG%" 2>&1
    goto :END
)
echo ERROR: Python not detected by py launcher or PATH. >> "%LOG%"
:END
echo. >> "%LOG%"
echo Log=%LOG% >> "%LOG%"
echo Result=%OUTPUT%\ALLFILEONE_WEBSTUDIO_LIVE_STATUS_LATEST.zip >> "%LOG%"
endlocal
