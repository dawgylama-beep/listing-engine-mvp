@echo off
cd /d "%~dp0"
echo Restarting Katherine’s Eye...
echo.
echo Keep this window open while using the app.
echo Open http://localhost:5175 in your browser.
echo.
echo Stopping any old Katherine’s Eye server on port 5175...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$processIds = (Get-NetTCPConnection -LocalPort 5175 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique; foreach ($processId in $processIds) { if ($processId) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue } }"
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
