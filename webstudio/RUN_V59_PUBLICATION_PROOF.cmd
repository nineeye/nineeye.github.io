@echo off
setlocal EnableExtensions
set "SCRIPT=%~dp0tools\v59_publication_proof.py"
set "OUT=%USERPROFILE%\Downloads"
if not exist "%OUT%" mkdir "%OUT%" 2>nul
set "LOG=%OUT%\WebStudio_V59_Run_Log_KO.txt"
if not exist "%SCRIPT%" (
  > "%LOG%" echo HOLD: V59 Python source not found: "%SCRIPT%"
  exit /b 3
)
set "PYRUN="
py -3.14 -c "import sys; sys.exit(0)" >nul 2>&1 && set "PYRUN=py -3.14"
if not defined PYRUN py -3.13 -c "import sys; sys.exit(0)" >nul 2>&1 && set "PYRUN=py -3.13"
if not defined PYRUN py -3 -c "import sys; sys.exit(0)" >nul 2>&1 && set "PYRUN=py -3"
if not defined PYRUN python -c "import sys; sys.exit(0)" >nul 2>&1 && set "PYRUN=python"
if not defined PYRUN (
  > "%LOG%" echo HOLD: Python not found. No changes made. Python 3.13 or 3.14 required.
  exit /b 3
)
> "%LOG%" echo WebStudio V59: Read-only preflight PASS. Runner: %PYRUN%
%PYRUN% "%SCRIPT%" --output-dir "%OUT%" >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
>> "%LOG%" echo ExitCode: %RC%
>> "%LOG%" echo Report: %OUT%\WebStudio_V59_Deployment_Proof_KO.txt
if exist "%OUT%\WebStudio_V59_Deployment_Proof_KO.txt" start "" notepad "%OUT%\WebStudio_V59_Deployment_Proof_KO.txt"
exit /b %RC%