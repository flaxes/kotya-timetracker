@echo off

echo Updater. Press any key to continue...
pause

echo WinRAR required to be installed.

curl -L -o update.zip https://github.com/flaxes/kotya-timetracker/archive/refs/heads/master.zip
mkdir _temp
"%ProgramFiles%\WinRAR\winrar.exe" x -ibck ./update.zip *.* ./_temp\
call node ./cli/update.js
INSTALL.bat

echo Latest update installed.

call RUN.bat