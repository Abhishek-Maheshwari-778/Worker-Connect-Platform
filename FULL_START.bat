@echo off
echo =======================================================
echo   Worker Connect - FULL AUTOMATED SETUP AND RUN
echo =======================================================

echo [1/5] Installing Backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 ( echo [FAIL] Backend install failed. & pause & exit /b )
cd ..

echo [2/5] Seeding Database with dummy users...
cd backend
:: Note: Assumes MongoDB is running
node data/seedUsers.js
if %errorlevel% neq 0 ( echo [WARN] Seeding failed. Check if MongoDB is running. )
cd ..

echo [3/5] Installing Frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 ( echo [FAIL] Frontend install failed. & pause & exit /b )
cd ..

echo [4/5] Starting Backend Server...
start "Backend" cmd /k "cd backend && echo Starting Backend... && npm run dev"

echo [5/5] Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && echo Starting Frontend... && npm run dev"

echo.
echo =======================================================
echo   Done! Check the separate windows for logs.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo =======================================================
pause
