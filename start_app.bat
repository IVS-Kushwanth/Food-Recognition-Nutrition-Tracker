@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo Starting NutriVision AI: Food Recognition ^& Nutrition Tracker
echo Full-Stack Application (Backend API + Production UI)
echo ============================================================
echo.

set "PY_EXE=python"
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PY_EXE=%~dp0.venv\Scripts\python.exe"
)

echo Initializing server on http://127.0.0.1:8000 ...
echo Press Ctrl+C to stop.
echo.

start "" "http://127.0.0.1:8000"
"%PY_EXE%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
