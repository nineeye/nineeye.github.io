@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
set "AFO_DOWNLOADS=%USERPROFILE%\Downloads"
if not exist "%AFO_DOWNLOADS%" mkdir "%AFO_DOWNLOADS%" 2>nul
set "AFO_PY="
for %%V in (3.14 3.12 3.11) do (
  if not defined AFO_PY (
    py -%%V -c "import sys; print(sys.version_info[:2])" >nul 2>&1
    if not errorlevel 1 set "AFO_PY=%%V"
  )
)
if not defined AFO_PY (
  echo [HOLD] Python 3.14, 3.12 or 3.11 was not found as a working runtime.
  echo Python 3.13 DLL error is not used by this launcher.
  echo [HOLD] Working Python 3.14, 3.12 or 3.11 required. > "%AFO_DOWNLOADS%\AFO_WebStudio_V75_BOOT_HOLD.txt"
  echo Save location: "%AFO_DOWNLOADS%\AFO_WebStudio_V75_BOOT_HOLD.txt"
  pause
  exit /b 3
)
echo [V75] Windows public QA using Python %AFO_PY%
echo [V75] Actual Cloudflare HTTP and Edge/CDP; no simulated PASS.
py -%AFO_PY% "%~dp0tools\v75_public_owner_qa.py" --output "%AFO_DOWNLOADS%"
set "AFO_CODE=%ERRORLEVEL%"
echo.
echo Results: "%AFO_DOWNLOADS%\AFO_WebStudio_V75_PUBLIC_QA_LATEST_KO.txt"
echo Archive: "%AFO_DOWNLOADS%\AFO_WebStudio_V75_PUBLIC_QA_LATEST.zip"
echo ExitCode: %AFO_CODE%
pause
exit /b %AFO_CODE%