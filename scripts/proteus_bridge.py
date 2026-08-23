"""
==============================================================================
GreenGold OS - Proteus Serial Telemetry Bridge
==============================================================================
This script bridges Proteus Simulation (via COMPIM Virtual Serial Port)
with the live GreenGold OS Web Application Backend.

Prerequisites:
  1. Virtual Serial Ports Pair (e.g. COM1 <-> COM2 using com0com or VSPD)
  2. Proteus COMPIM set to COM1, Baud: 9600
  3. This script connected to COM2, Baud: 9600
  4. GreenGold OS Backend running on http://localhost:5000

Usage:
  python scripts/proteus_bridge.py --port COM2 --baud 9600 --api http://localhost:5000/api/iot/telemetry
==============================================================================
"""

import sys
import time
import json
import argparse
import urllib.request
import urllib.error

def send_telemetry_to_api(api_url, payload_dict):
    try:
        data = json.dumps(payload_dict).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=data,
            headers={'Content-Type': 'application/json', 'User-Agent': 'GreenGold-ProteusBridge/1.0'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            return True, res_json
    except urllib.error.URLError as e:
        return False, f"Backend connection failed: {e}"
    except Exception as e:
        return False, str(e)

def main():
    parser = argparse.ArgumentParser(description="GreenGold OS Proteus Telemetry Bridge")
    parser.add_argument("--port", default="COM2", help="Serial port to listen on (e.g. COM2)")
    parser.add_argument("--baud", type=int, default=9600, help="Baud rate (default: 9600)")
    parser.add_argument("--api", default="http://localhost:5000/api/iot/telemetry", help="GreenGold OS Backend API URL")
    parser.add_argument("--demo", action="store_true", help="Run in mock/demo mode without physical/virtual COM port")

    args = parser.parse_args()

    print("=" * 70)
    print(" 🌿 GREENGOLD OS - PROTEUS HARDWARE TELEMETRY BRIDGE")
    print("=" * 70)
    print(f" Target API   : {args.api}")
    print(f" Serial Port  : {args.port}")
    print(f" Baud Rate    : {args.baud}")
    print("=" * 70)

    if args.demo:
        print("[INFO] Running in Demo Mode (Simulating Proteus Serial stream)...")
        modes = [
            {"binId": "BIN-001", "fillLevel": 45, "weightKg": 1.80, "gasPpm": 120, "maintenance": False, "status": "NORMAL"},
            {"binId": "BIN-001", "fillLevel": 70, "weightKg": 3.20, "gasPpm": 180, "maintenance": False, "status": "ALMOST FULL"},
            {"binId": "BIN-001", "fillLevel": 92, "weightKg": 4.50, "gasPpm": 210, "maintenance": False, "status": "FULL"},
            {"binId": "BIN-001", "fillLevel": 92, "weightKg": 4.50, "gasPpm": 210, "maintenance": True, "faultReason": "LID_JAMMED / TILT_DETECTED", "status": "MAINTENANCE_REQUIRED"},
            {"binId": "BIN-001", "fillLevel": 0, "weightKg": 0.0, "gasPpm": 90, "maintenance": False, "rfidTag": "COLLECTOR-STAFF-01", "status": "NORMAL"},
        ]
        idx = 0
        while True:
            sample = modes[idx % len(modes)]
            print(f"\n[Proteus Demo Stream -> Serial TX]: {json.dumps(sample)}")
            success, res = send_telemetry_to_api(args.api, sample)
            if success:
                print(f"✅ [API 200 OK] Server Processed: Status={sample.get('status')} | AlertTriggered={res.get('alertTriggered')}")
            else:
                print(f"❌ [API Error] {res}")
            idx += 1
            time.sleep(4)

    # Physical / Virtual Serial Port Mode
    try:
        import serial
    except ImportError:
        print("\n[!] 'pyserial' library not found. Installing via pip...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyserial"])
        import serial

    try:
        ser = serial.Serial(args.port, args.baud, timeout=2)
        print(f"✅ Serial connection established on {args.port}.")
        print("⚡ Waiting for Proteus UART JSON transmissions (Press Ctrl+C to stop)...")
    except Exception as e:
        print(f"\n❌ Could not open serial port {args.port}: {e}")
        print("\n💡 TIP: If you do not have com0com virtual ports installed yet,")
        print("   you can test the bridge in demo mode using:")
        print(f"   python {sys.argv[0]} --demo")
        return

    buffer = ""
    while True:
        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if not line:
                continue

            print(f"[Proteus Raw Serial]: {line}")

            if line.startswith('{') and line.endswith('}'):
                try:
                    payload = json.loads(line)
                    success, res = send_telemetry_to_api(args.api, payload)
                    if success:
                        print(f"  ↳ ✅ Dispatched to GreenGold OS API! Status: {payload.get('status')} | Response: {res.get('message')}")
                    else:
                        print(f"  ↳ ❌ API Dispatch Failed: {res}")
                except json.JSONDecodeError:
                    print("  ↳ ⚠️ Incomplete or invalid JSON line received, skipping...")

        except KeyboardInterrupt:
            print("\n[INFO] Stopped by user.")
            ser.close()
            break
        except Exception as e:
            print(f"[Error]: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
