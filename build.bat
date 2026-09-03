@echo off
echo =========================================
echo   TigerApp - Build Script
echo =========================================
echo.

REM Step 1: Build Frontend
echo Step 1: Building React Frontend...
cd tigerapp.client
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    exit /b 1
)
echo Frontend built successfully!
echo.

REM Step 2: Copy to wwwroot
echo Step 2: Copying to wwwroot...
cd ..
if exist src\TigerApp.Api\wwwroot rmdir /s /q src\TigerApp.Api\wwwroot
mkdir src\TigerApp.Api\wwwroot
xcopy /E /I /Y tigerapp.client\dist\* src\TigerApp.Api\wwwroot\
echo Files copied to wwwroot!
echo.

REM Step 3: Build Backend
echo Step 3: Building .NET Backend...
cd src\TigerApp.Api
dotnet build -q
if %errorlevel% neq 0 (
    echo Backend build failed!
    exit /b 1
)
echo Backend built successfully!
echo.

echo =========================================
echo   Build Complete!
echo =========================================
echo.
echo   Run: cd src\TigerApp.Api ^&^& dotnet run --urls http://localhost:5100
echo   Open: http://localhost:5100/login
echo.
