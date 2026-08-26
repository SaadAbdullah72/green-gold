@echo off
title GreenGold OS - Proteus Hardware Telemetry Bridge
color 0A

echo ======================================================================
echo    🌿 GREENGOLD OS - PROTEUS HARDWARE TELEMETRY BRIDGE LAUNCHER
echo ======================================================================
echo.
echo [*] Target API   : https://green-gold-dusky.vercel.app/api/iot/telemetry
echo [*] Serial Port  : COM2
echo [*] Baud Rate    : 9600
echo.
echo [*] Connecting to Virtual Serial Port COM2...
echo.

cd /d "c:\Users\Hp\Desktop\GreenGold Os"

python scripts\proteus_bridge.py --port COM2 --baud 9600 --api https://green-gold-dusky.vercel.app/api/iot/telemetry

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Error: Python script exited with code %ERRORLEVEL%.
    pause
)
