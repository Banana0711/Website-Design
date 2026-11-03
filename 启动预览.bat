@echo off
cd /d "%~dp0"
start "hohai-server" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0hohai-server.ps1" -Root "%~dp0." -Port 8080
ping -n 2 127.0.0.1 >nul
start "" http://localhost:8080/
echo Server started: http://localhost:8080/
echo To stop the server, close the minimized "hohai-server" window.
timeout /t 4 >nul
