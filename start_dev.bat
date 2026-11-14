@echo off
echo ============================================================
echo Starting NutriVision AI in Dual-Server Development Mode
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo ============================================================
echo.

start "NutriVision Backend (FastAPI)" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak > nul

cd /d "%~dp0frontend"
node node_modules\vite\bin\vite.js --port 5173 --host
pause
