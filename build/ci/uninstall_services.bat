@echo off
echo Uninstalling Mail Sender services using NSSM...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as administrator...
    goto :main
) else (
    echo Requesting administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
:main
REM Check if NSSM is available in current directory
if not exist "%~dp0nssm.exe" (
    echo nssm.exe not found in current directory
    echo Please ensure nssm.exe is in the same directory as this script
    pause
    exit /b 1
)
echo.
echo Stopping and removing backend service...
"%~dp0nssm.exe" stop "MailSenderBackend" >nul 2>&1
timeout /t 5 /nobreak >nul
"%~dp0nssm.exe" remove "MailSenderBackend" confirm
if %ERRORLEVEL% EQU 0 (
    echo Backend service removed successfully
) else (
    echo Backend service may not exist or failed to remove
)
echo.
echo Stopping and removing nginx service...
"%~dp0nssm.exe" stop "MailSenderNginx" >nul 2>&1
timeout /t 5 /nobreak >nul
"%~dp0nssm.exe" remove "MailSenderNginx" confirm
if %ERRORLEVEL% EQU 0 (
    echo Nginx service removed successfully
) else (
    echo Nginx service may not exist or failed to remove
)
echo.
echo ========================================
echo Services uninstallation completed!
echo ========================================
echo Service logs will remain in the logs directory for your reference.
echo You can safely delete them if no longer needed.
exit /b 0
