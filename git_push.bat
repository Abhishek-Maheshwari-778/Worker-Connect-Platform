@echo off
echo =======================================================
echo   Pushing code to GitHub: Labor-Connect-Platform
echo =======================================================

:: Check if git is installed
git --version >_null 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Please install it from https://git-scm.com/
    pause
    exit /b
)

:: Initialize git if needed
if not exist .git (
    echo Initializing git repository...
    git init
)

:: Configure remote if not already set
git remote add origin https://github.com/Abhishek-Maheshwari-778/Labor-Connect-Platform.git 2>_null
git remote set-url origin https://github.com/Abhishek-Maheshwari-778/Labor-Connect-Platform.git

:: Add and commit changes
echo Staging files...
git add .
echo Committing changes...
git commit -m "Update: Added automation scripts and enhanced dummy data / seed script"

:: Force Push to GitHub (Overwriting old data as requested)
echo.
echo =======================================================
echo   FORCE PUSHING TO GITHUB (OVERWRITING)...
echo =======================================================
git push origin main --force 2>_null
if %errorlevel% neq 0 (
    git push origin master --force
)

echo.
echo =======================================================
echo   Done! Your repository has been overwritten.
echo =======================================================
pause
