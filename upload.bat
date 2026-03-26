@echo off
echo Cleaning inner git folders...
if exist "FoodLink\foodlink-expo\.git" rmdir /s /q "FoodLink\foodlink-expo\.git"
echo Initializing Git...
git init
echo Fixing submodule issue...
git rm -r --cached "FoodLink/foodlink-expo"
git add .
git commit -m "Initial commit: FoodLink Mobile and Backend (Fixed folder structure)"
git branch -M main
echo Adding remote...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/K-Tejaswini-05/IdeaSprint.git
echo Pushing to GitHub...
git push -u origin main --force
echo Done.
pause
