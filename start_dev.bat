@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo Starting NutriVision AI in Dual-Server Development Mode
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo ============================================================
echo.

set "PY_EXE=python"
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PY_EXE=%~dp0.venv\Scripts\python.exe"
)

start "NutriVision Backend (FastAPI)" cmd /k ""%PY_EXE%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak > nul

cd /d "%~dp0frontend"
npm run dev
pause
