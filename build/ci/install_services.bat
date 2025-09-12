@echo off
echo Installing Mail Sender services using NSSM...
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
REM Create logs directory if it doesn't exist
if not exist "%~dp0logs" mkdir "%~dp0logs"
REM Create nginx temp directories if they don't exist
if not exist "%~dp0nginx\logs" mkdir "%~dp0nginx\logs"
if not exist "%~dp0nginx\temp" mkdir "%~dp0nginx\temp"
if not exist "%~dp0nginx\temp\client_body_temp" mkdir "%~dp0nginx\temp\client_body_temp"
if not exist "%~dp0nginx\temp\proxy_temp" mkdir "%~dp0nginx\temp\proxy_temp"
if not exist "%~dp0nginx\temp\fastcgi_temp" mkdir "%~dp0nginx\temp\fastcgi_temp"
if not exist "%~dp0nginx\temp\uwsgi_temp" mkdir "%~dp0nginx\temp\uwsgi_temp"
if not exist "%~dp0nginx\temp\scgi_temp" mkdir "%~dp0nginx\temp\scgi_temp"
echo.
echo Installing Go backend service using NSSM...
REM Remove existing service if it exists
echo Removing existing backend service if present...
"%~dp0nssm.exe" remove "MailSenderBackend" confirm >nul 2>&1
REM Install the backend service
echo Installing backend service...
"%~dp0nssm.exe" install "MailSenderBackend" "%~dp0server.exe"
if %ERRORLEVEL% EQU 0 (
    echo Backend service created successfully
    
    REM Set service display name
    "%~dp0nssm.exe" set "MailSenderBackend" DisplayName "Mail Sender Backend"
    
    REM Set service description
    "%~dp0nssm.exe" set "MailSenderBackend" Description "Mail Sender Go Backend Service"
    
    REM Set startup type to automatic
    "%~dp0nssm.exe" set "MailSenderBackend" Start SERVICE_AUTO_START
    
    REM Configure restart behavior
    "%~dp0nssm.exe" set "MailSenderBackend" AppExit Default Restart
    "%~dp0nssm.exe" set "MailSenderBackend" AppRestartDelay 5000
    
    REM Set stdout and stderr logging
    "%~dp0nssm.exe" set "MailSenderBackend" AppStdout "%~dp0logs\backend_output.log"
    "%~dp0nssm.exe" set "MailSenderBackend" AppStderr "%~dp0logs\backend_error.log"
    
    REM Rotate logs daily to prevent them from growing too large
    "%~dp0nssm.exe" set "MailSenderBackend" AppStdoutCreationDisposition 4
    "%~dp0nssm.exe" set "MailSenderBackend" AppStderrCreationDisposition 4
    
    echo Backend service configuration completed
) else (
    echo Failed to create backend service
)
echo.
echo Installing Nginx service using NSSM...
REM Remove existing nginx service if it exists
echo Removing existing nginx service if present...
"%~dp0nssm.exe" remove "MailSenderNginx" confirm >nul 2>&1
REM Install the nginx service
echo Installing nginx service...
"%~dp0nssm.exe" install "MailSenderNginx" "%~dp0nginx\nginx.exe"
if %ERRORLEVEL% EQU 0 (
    echo Nginx service created successfully
    
    REM Set service display name
    "%~dp0nssm.exe" set "MailSenderNginx" DisplayName "Mail Sender Nginx"
    
    REM Set service description
    "%~dp0nssm.exe" set "MailSenderNginx" Description "Mail Sender Frontend Web Server"
    
    REM Set startup type to automatic
    "%~dp0nssm.exe" set "MailSenderNginx" Start SERVICE_AUTO_START
    
    REM Configure restart behavior
    "%~dp0nssm.exe" set "MailSenderNginx" AppExit Default Restart
    "%~dp0nssm.exe" set "MailSenderNginx" AppRestartDelay 5000
    
    REM Set stdout and stderr logging
    "%~dp0nssm.exe" set "MailSenderNginx" AppStdout "%~dp0logs\nginx_output.log"
    "%~dp0nssm.exe" set "MailSenderNginx" AppStderr "%~dp0logs\nginx_error.log"
    
    REM Rotate logs daily to prevent them from growing too large
    "%~dp0nssm.exe" set "MailSenderNginx" AppStdoutCreationDisposition 4
    "%~dp0nssm.exe" set "MailSenderNginx" AppStderrCreationDisposition 4
    
    echo Nginx service configuration completed
) else (
    echo Failed to create nginx service
)
echo.
echo Starting services...
"%~dp0nssm.exe" start "MailSenderBackend"
if %ERRORLEVEL% EQU 0 (
    echo Backend service started successfully
) else (
    echo Warning: Backend service installed but failed to start. You can start it manually.
)
timeout /t 5 /nobreak >nul
"%~dp0nssm.exe" start "MailSenderNginx"
if %ERRORLEVEL% EQU 0 (
    echo Nginx service started successfully
) else (
    echo Warning: Nginx service installed but failed to start. You can start it manually.
    echo Testing nginx configuration...
    "%~dp0nginx\nginx.exe" -t -c "%~dp0nginx\conf\nginx.conf"
)
echo.
echo ========================================
echo Services installation completed!
echo ========================================
echo Backend service: MailSenderBackend (auto-restart enabled)
echo Nginx service: MailSenderNginx (auto-restart enabled)
echo Access your application at: http://localhost
echo.
echo Service logs location: %~dp0logs\
echo   - backend_output.log / backend_error.log
echo   - nginx_output.log / nginx_error.log
echo.
echo Useful NSSM commands:
echo   Check backend status:  "%~dp0nssm.exe" status MailSenderBackend
echo   Check nginx status:    "%~dp0nssm.exe" status MailSenderNginx
echo   Stop backend:          "%~dp0nssm.exe" stop MailSenderBackend
echo   Stop nginx:            "%~dp0nssm.exe" stop MailSenderNginx
echo   Start backend:         "%~dp0nssm.exe" start MailSenderBackend
echo   Start nginx:           "%~dp0nssm.exe" start MailSenderNginx
echo   Restart backend:       "%~dp0nssm.exe" restart MailSenderBackend
echo   Restart nginx:         "%~dp0nssm.exe" restart MailSenderNginx
echo   View backend config:   "%~dp0nssm.exe" get MailSenderBackend
echo   View nginx config:     "%~dp0nssm.exe" get MailSenderNginx
echo ========================================
exit /b 0
