@echo off
setlocal
cd /d "%~dp0"
title Katherine’s Eye API Key Setup

cls
echo Katherine’s Eye API Key Setup
echo ============================
echo.
echo This will create or update the .env file in this folder.
echo.
echo Paste your OpenAI API key below, then press Enter.
echo.
echo Tip: In this window, right-click usually pastes.
echo.

set "OPENAI_KEY_INPUT="
set /p "OPENAI_KEY_INPUT=OpenAI API key: "

if "%OPENAI_KEY_INPUT%"=="" (
  echo.
  echo No key was entered. Nothing was changed.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$envPath = Join-Path (Get-Location) '.env'; $key = $env:OPENAI_KEY_INPUT; if ([string]::IsNullOrWhiteSpace($key)) { exit 2 }; $line = 'OPENAI_API_KEY=' + $key.Trim(); if (Test-Path -LiteralPath $envPath) { $lines = Get-Content -LiteralPath $envPath; $found = $false; $newLines = foreach ($existingLine in $lines) { if ($existingLine -match '^OPENAI_API_KEY=') { $found = $true; $line } else { $existingLine } }; if (-not $found) { $newLines += $line }; Set-Content -LiteralPath $envPath -Value $newLines -Encoding ASCII } else { Set-Content -LiteralPath $envPath -Value $line -Encoding ASCII }"

if errorlevel 1 (
  echo.
  echo Something went wrong while saving the API key.
  echo Please try again.
  echo.
  pause
  exit /b 1
)

echo.
echo Done. Your API key was saved to:
echo %~dp0.env
echo.
echo Next step:
echo Restart the app by double-clicking START_LISTING_ENGINE.bat
echo.
pause
