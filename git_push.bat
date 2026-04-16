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

:: Pull first to ensure we don't overwrite "old data"
echo Pulling from remote to merge existing data...
git fetch origin
git merge origin/main --allow-unrelated-histories -m "Merge existing data" 2>_null
if %errorlevel% neq 0 (
    git merge origin/master --allow-unrelated-histories -m "Merge existing data" 2>_null
)

:: Push back to GitHub
echo.
echo =======================================================
echo   PUSHING TO GITHUB...
echo =======================================================
git push origin main 2>_null
if %errorlevel% neq 0 (
    git push origin master
)

echo.
echo =======================================================
echo   Done! Your changes are now on GitHub.
echo =======================================================
pause
