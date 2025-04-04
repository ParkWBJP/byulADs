@echo off
setlocal

:: 날짜 포맷 (예: 2025-04-03)
for /f %%A in ('powershell -Command "Get-Date -Format yyyy-MM-dd"') do set TODAY=%%A

:: 원본 폴더 경로
set BACKUP_SRC=C:\Users\Gun\Desktop\byulDB_Backup_Firebase\backup_%TODAY%

:: zip 저장 경로
set BACKUP_ZIP=C:\Users\Gun\Desktop\byulDB_Backup_Firebase\firebase_%TODAY%.zip

:: zip 압축
powershell Compress-Archive -Path "%BACKUP_SRC%" -DestinationPath "%BACKUP_ZIP%"

:: 7일 이상 된 zip 자동 삭제
forfiles /p "C:\Users\Gun\Desktop\byulDB_Backup_Firebase" /s /m *.zip /D -7 /C "cmd /c del @path"

endlocal
