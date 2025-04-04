@echo off
setlocal enabledelayedexpansion

:: 날짜 + 시간
for /f %%A in ('wmic os get LocalDateTime ^| find "."') do set dt=%%A
set DATE=%dt:~0,4%%dt:~4,2%%dt:~6,2%
set TIME=%dt:~8,2%%dt:~10,2%
set TMPFOLDER=_backup_temp
set ZIPNAME=backup-%DATE%-%TIME%.zip

echo Creating temp folder...
rmdir /s /q %TMPFOLDER% >nul 2>&1
mkdir %TMPFOLDER%

:: 소스 파일 복사 (자기 자신 제외)
robocopy . %TMPFOLDER% /E /XD node_modules .git _backup_temp /XF backup.bat

:: 압축 대상과 결과 파일이 **다른 위치**에 있도록 주의!
powershell -Command "Compress-Archive -Path '%TMPFOLDER%\*' -DestinationPath '%ZIPNAME%' -Force"

:: 임시 폴더 삭제
rmdir /s /q %TMPFOLDER%

:: 7일 이상된 zip 삭제
forfiles /M *.zip /D -7 /C "cmd /c del @file"

:: 업로드
python upload_to_drive.py

echo ✅ Backup and upload complete: %ZIPNAME%
pause
