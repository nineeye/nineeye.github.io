@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Converter Mall Local Server

set "PORT=8000"
if not "%CONVERTER_MALL_PORT%"=="" set "PORT=%CONVERTER_MALL_PORT%"
set "HOST=127.0.0.1"
set "URL=http://localhost:%PORT%/"

where py >nul 2>nul
if %errorlevel%==0 (
  set "PYTHON_CMD=py"
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    set "PYTHON_CMD=python"
  ) else (
    echo [ERROR] Python is not installed or is not available in PATH.
    echo Install Python 3, then run this file again.
    echo.
    pause
    exit /b 1
  )
)

powershell -NoProfile -Command "$p=%PORT%; if (Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue) { exit 12 }"
if %errorlevel%==12 (
  echo [ERROR] Port %PORT% is already in use.
  echo Close the other server or choose another port:
  echo   set CONVERTER_MALL_PORT=5500
  echo   START_CONVERTER_MALL.bat
  echo.
  pause
  exit /b 12
)

echo ==============================================
echo   Converter Mall local server
echo   Address: %URL%
echo   Stop: Ctrl + C
 echo ==============================================
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 900; Start-Process '%URL%'"
%PYTHON_CMD% -m http.server %PORT% --bind %HOST%

set "EXIT_CODE=%errorlevel%"
echo.
if not "%EXIT_CODE%"=="0" echo [ERROR] Server stopped with code %EXIT_CODE%.
pause
exit /b %EXIT_CODE%
