@echo off
echo =======================================================
echo   Installing Frontend Dependencies ONLY
echo =======================================================
cd frontend
echo Running npm install in %CD%...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    echo Please try running 'npm install' manually in the frontend folder.
) else (
    echo [SUCCESS] Frontend dependencies installed!
)
pause
