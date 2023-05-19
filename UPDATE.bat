@echo off

curl -L -o update.zip https://github.com/flaxes/kotya-timetracker/archive/refs/heads/master.zip
mkdir _temp
"%ProgramFiles%\WinRAR\winrar.exe" x -ibck ./update.zip *.* ./_temp\
call node ./clear-dir.js

mv ./_temp/kotya-timetracker-master/**/* ./*