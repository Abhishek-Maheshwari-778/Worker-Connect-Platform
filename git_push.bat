@echo off
echo =======================================================
echo   Pushing code to: Worker-Connect-Platform
echo =======================================================

:: Check if git is installed
git --version >_null 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed.
    pause
    exit /b
)

:: Initialize git and set branch
if not exist .git (
    echo Initializing git repository...
    git init
)
git branch -M main

:: Add remote
echo Setting remote URL...
git remote remove origin >_null 2>&1
git remote add origin https://github.com/Abhishek-Maheshwari-778/Worker-Connect-Platform.git

:: Add and commit
echo Staging and Committing...
git add .
git commit -m "Initial commit for Worker Connect Platform"

:: Push
echo.
echo =======================================================
echo   PUSHING TO GITHUB (MAIN)...
echo =======================================================
git push -u origin main

echo.
echo =======================================================
echo   Done! Your code is now live on GitHub.
echo =======================================================
pause
