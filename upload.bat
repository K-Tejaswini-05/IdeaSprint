@echo off
echo Cleaning inner git folders...
if exist "FoodLink\foodlink-expo\.git" rmdir /s /q "FoodLink\foodlink-expo\.git"
echo Initializing Git...
git init
git add .
git commit -m "Initial commit: FoodLink Mobile and Backend"
git branch -M main
git remote add origin https://github.com/K-Tejaswini-05/IdeaSprint.git
git push -u origin main
echo Done.
pause
