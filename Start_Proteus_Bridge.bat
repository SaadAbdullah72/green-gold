@echo off
setlocal enabledelayedexpansion
title GreenGold OS - Proteus Hardware Telemetry Bridge Launcher
color 0A

:: Navigate to project directory
cd /d "%~dp0"

:MENU
cls
echo ==============================================================================
echo    🌿 GREENGOLD OS - PROTEUS HARDWARE TELEMETRY BRIDGE
echo ==============================================================================
echo.
echo  Target Cloud API : https://green-gold-dusky.vercel.app/api/iot/telemetry
echo.
echo  [1] Start Proteus Serial Bridge (COM2 - 9600 Baud)  [DEFAULT]
echo  [2] Start Demo Simulation Mode (Auto-generates telemetry, no Proteus needed)
echo  [3] Start Proteus with Custom Port (e.g. COM1, COM3, COM4)
echo  [4] Run with Local Backend (http://localhost:5000/api/iot/telemetry)
echo  [5] Exit
echo.
echo ==============================================================================
set /p choice="Select an option [1-5] (Press Enter for 1): "

if "%choice%"=="" set choice=1
if "%choice%"=="1" goto START_DEFAULT
if "%choice%"=="2" goto START_DEMO
if "%choice%"=="3" goto START_CUSTOM
if "%choice%"=="4" goto START_LOCAL
if "%choice%"=="5" goto EXIT_PROG

echo.
echo [!] Invalid selection. Please choose 1, 2, 3, 4, or 5.
timeout /t 2 >nul
goto MENU

:CHECK_PYTHON
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    py --version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Python is not found in your PATH.
        echo Please install Python and make sure "Add Python to PATH" is checked.
        echo.
        pause
        goto MENU
    ) else (
        set PYCMD=py
    )
) else (
    set PYCMD=python
)
goto :eof

:START_DEFAULT
call :CHECK_PYTHON
cls
echo ==============================================================================
echo  [*] Connecting to Virtual Serial Port COM2 (9600 Baud)...
echo  [*] Cloud API: https://green-gold-dusky.vercel.app/api/iot/telemetry
echo  [*] Press Ctrl+C in this window to stop and return to menu.
echo ==============================================================================
echo.
%PYCMD% scripts\proteus_bridge.py --port COM2 --baud 9600 --api https://green-gold-dusky.vercel.app/api/iot/telemetry
echo.
echo [!] Bridge session finished.
pause
goto MENU

:START_DEMO
call :CHECK_PYTHON
cls
echo ==============================================================================
echo  [*] Running in Demo Simulation Mode...
echo  [*] Press Ctrl+C to stop and return to menu.
echo ==============================================================================
echo.
%PYCMD% scripts\proteus_bridge.py --demo --api https://green-gold-dusky.vercel.app/api/iot/telemetry
echo.
echo [!] Demo session finished.
pause
goto MENU

:START_CUSTOM
call :CHECK_PYTHON
echo.
set /p custom_port="Enter COM Port name (e.g. COM1, COM3): "
if "%custom_port%"=="" set custom_port=COM2
set /p custom_baud="Enter Baud Rate (Default 9600): "
if "%custom_baud%"=="" set custom_baud=9600
cls
echo ==============================================================================
echo  [*] Connecting to %custom_port% (%custom_baud% Baud)...
echo ==============================================================================
echo.
%PYCMD% scripts\proteus_bridge.py --port %custom_port% --baud %custom_baud% --api https://green-gold-dusky.vercel.app/api/iot/telemetry
echo.
echo [!] Bridge session finished.
pause
goto MENU

:START_LOCAL
call :CHECK_PYTHON
cls
echo ==============================================================================
echo  [*] Connecting to COM2 -> Local Backend (http://localhost:5000)...
echo ==============================================================================
echo.
%PYCMD% scripts\proteus_bridge.py --port COM2 --baud 9600 --api http://localhost:5000/api/iot/telemetry
echo.
echo [!] Bridge session finished.
pause
goto MENU

:EXIT_PROG
exit /b 0
