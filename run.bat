@echo off
echo ============================================
echo  Quadre de Facturacio - Serveis de Banca
echo ============================================
echo.

:: Anar al directori on es troba aquest script
cd /d "%~dp0"

:: Comprovar si node_modules existeix, si no, instal.lar dependències
if not exist "node_modules" (
    echo Instal.lant dependencies...
    call npm install
    echo.
)

:: Alliberar el port 8080 si ja esta en us
echo Comprovant si el port 8080 esta lliure...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 "') do (
    echo Tancant proces %%a que usa el port 8080...
    taskkill /PID %%a /F >nul 2>&1
)
echo.

:: Iniciar el servidor i obrir el navegador
echo Iniciant servidor a http://127.0.0.1:8080 ...
echo Prem Ctrl+C per aturar el servidor.
echo.
call npx http-server ./www -o -p 8080

pause
