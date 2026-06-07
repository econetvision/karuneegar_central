@echo off
echo Starting Karuneegar Central...

echo.
echo [1/2] Starting Flask API backend on port 5000...
start "Flask Backend" cmd /k "cd /d %~dp0backend && uv run python main.py"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React frontend on port 5173...
start "React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✓ App running at:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:5000
echo.
pause
