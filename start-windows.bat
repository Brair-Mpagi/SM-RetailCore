@echo off
TITLE Project Runner (WAMP Version)

echo ==============================================
echo Starting Mackie Project Services (Windows)
echo ==============================================
echo.

:: 1. Start WAMP (Apache and MySQL)
echo [1/3] Starting WAMP...

if exist "C:\wamp64\wampmanager.exe" (
    start "" "C:\wamp64\wampmanager.exe"
    echo WAMP launched successfully.

    echo Please ensure:
    echo - Apache is GREEN in system tray
    echo - MySQL is GREEN in system tray

    :: Give WAMP time to initialize services
    timeout /t 8 /nobreak > nul
) else (
    echo [WARNING] WAMP not found at C:\wamp64\wampmanager.exe
    echo Please start WAMP manually from Start Menu or installation folder.
    echo Make sure Apache and MySQL are running before continuing.
    pause
)

echo.

:: 2. Start Backend
echo [2/3] Starting Backend Server...

if exist "backend\package.json" (
    cd backend
    start "Backend API (Node.js)" cmd /k "echo Starting Backend... && npm install && npm run dev"
    cd ..
    echo Backend terminal opened.
) else (
    echo [ERROR] Backend folder not found.
)

echo.

:: 3. Start Frontend
echo [3/3] Starting Frontend Server...

if exist "package.json" (
    start "Frontend UI (Vite)" cmd /k "echo Starting Frontend... && npm install && npm run dev"
    echo Frontend terminal opened.
) else (
    echo [ERROR] Frontend package.json not found.
)

echo.
echo ==============================================
echo All services have been launched!
echo ==============================================
echo WAMP: Apache + MySQL should be running (green icon)
echo Backend: http://localhost:3000 (or your configured port)
echo Frontend: http://localhost:5173 (Vite default)
echo ==============================================
echo You can safely close this launcher window.
pause