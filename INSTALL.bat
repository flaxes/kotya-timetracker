@echo off
call npm install --omit=dev
call node ./cli/install
echo Installed! Open RUN.bat
pause