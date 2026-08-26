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
    parser.add_argument("--api", default="https://green-gold-dusky.vercel.app/api/iot/telemetry", help="GreenGold OS Backend API URL")
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
        print("\n🎮 [INTERACTIVE DEMO CONTROLLER ACTIVATED]")
        print("Choose an event to send to GreenGold OS Backend:")
        print("  [1] 🟢 Send NORMAL State (Fill: 40%, Weight: 1.8kg)")
        print("  [2] 🔴 Send BIN FULL Alert (Fill: 95%, Weight: 8.5kg) -> Triggers Waste Collector Ticket in Management")
        print("  [3] 🟡 Send MAINTENANCE Fault (Lid Jammed / Tilt) -> Triggers Technical Team Ticket in Management")
        print("  [4] 🎫 Send RFID Staff Scan (Bin Emptied -> Reset 0%)")
        print("  [5] 🔄 Auto-Loop Mode (Cycles all modes every 4s)")
        print("  [q] Quit")
        print("=" * 70)

        while True:
            try:
                choice = input("\n👉 Enter choice [1, 2, 3, 4, 5, or q]: ").strip()
            except (KeyboardInterrupt, EOFError):
                print("\n[INFO] Exiting...")
                break

            if choice == '1':
                sample = {"binId": "BIN-001", "fillLevel": 40, "weightKg": 1.80, "gasPpm": 120, "maintenance": False, "status": "NORMAL"}
            elif choice == '2':
                sample = {"binId": "BIN-001", "fillLevel": 95, "weightKg": 8.50, "gasPpm": 210, "maintenance": False, "status": "FULL"}
            elif choice == '3':
                sample = {"binId": "BIN-001", "fillLevel": 60, "weightKg": 3.00, "gasPpm": 150, "maintenance": True, "faultReason": "LID_JAMMED / TILT_DETECTED", "status": "MAINTENANCE_REQUIRED"}
            elif choice == '4':
                sample = {"binId": "BIN-001", "fillLevel": 0, "weightKg": 0.0, "gasPpm": 80, "maintenance": False, "rfidTag": "COLLECTOR-STAFF-01", "status": "NORMAL"}
            elif choice == '5':
                print("[INFO] Starting Auto-Loop Mode (Press Ctrl+C to stop)...")
                loop_modes = [
                    {"binId": "BIN-001", "fillLevel": 45, "weightKg": 1.80, "gasPpm": 120, "maintenance": False, "status": "NORMAL"},
                    {"binId": "BIN-001", "fillLevel": 95, "weightKg": 8.50, "gasPpm": 210, "maintenance": False, "status": "FULL"},
                    {"binId": "BIN-001", "fillLevel": 60, "weightKg": 3.00, "gasPpm": 150, "maintenance": True, "faultReason": "LID_JAMMED / TILT_DETECTED", "status": "MAINTENANCE_REQUIRED"},
                    {"binId": "BIN-001", "fillLevel": 0, "weightKg": 0.0, "gasPpm": 80, "maintenance": False, "rfidTag": "COLLECTOR-STAFF-01", "status": "NORMAL"}
                ]
                try:
                    for s in loop_modes:
                        print(f"\n[Proteus TX]: {json.dumps(s)}")
                        success, res = send_telemetry_to_api(args.api, s)
                        if success:
                            extra = f" | AutoTicket: {res.get('generatedRequestType')}" if res.get('generatedRequestId') else ""
                            print(f"  ↳ ✅ Dispatched! Status: {s.get('status')}{extra}")
                        else:
                            print(f"  ↳ ❌ Failed: {res}")
                        time.sleep(4)
                except KeyboardInterrupt:
                    print("\n[INFO] Auto-Loop stopped.")
                continue
            elif choice.lower() == 'q':
                print("[INFO] Exiting demo.")
                break
            else:
                print("⚠️ Invalid choice! Please enter 1, 2, 3, 4, 5, or q.")
                continue

            print(f"\n[Proteus Simulated Serial TX]: {json.dumps(sample)}")
            success, res = send_telemetry_to_api(args.api, sample)
            if success:
                extra = f" | AutoTicket Created: {res.get('generatedRequestType')} (ID: {res.get('generatedRequestId')})" if res.get('generatedRequestId') else ""
                print(f"✅ [API 200 OK] Backend Received: Status={sample.get('status')}{extra}")
                if choice == '2':
                    print("  👉 Check Management Dashboard -> 'Assign Logistics' Tab to assign a Collector!")
                elif choice == '3':
                    print("  👉 Check Management Dashboard -> 'Bin Requests' Tab to assign a Technical Worker!")
            else:
                print(f"❌ [API Error] {res}")

        return

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

            print(f"\n[Proteus Raw Serial]: {line}", flush=True)

            # Clean up line and extract JSON content
            cleaned_line = line.replace('\\:', ':').replace('\\,', ',').replace('\\"', '"').replace('\\}', '}').replace('\\{', '{')
            
            payload = None
            if '{' in cleaned_line and '}' in cleaned_line:
                start_idx = cleaned_line.find('{')
                end_idx = cleaned_line.rfind('}') + 1
                json_candidate = cleaned_line[start_idx:end_idx]
                
                try:
                    payload = json.loads(json_candidate)
                except json.JSONDecodeError:
                    # Regex fallback extractor
                    import re
                    fill_m = re.search(r'fillLevel[\"\':\s]+(\d+)', cleaned_line, re.I)
                    weight_m = re.search(r'weightKg[\"\':\s]+([\d\.]+)', cleaned_line, re.I)
                    status_m = re.search(r'status[\"\':\s]+[\"\']?([A-Z_ ]+)[\"\']?', cleaned_line, re.I)
                    bin_m = re.search(r'binId[\"\':\s]+[\"\']?([A-Z0-9\-_]+)[\"\']?', cleaned_line, re.I)
                    maint_m = re.search(r'maintenance[\"\':\s]+(true|false)', cleaned_line, re.I)

                    if fill_m or status_m:
                        fill_val = int(fill_m.group(1)) if fill_m else 0
                        status_val = status_m.group(1).strip() if status_m else ("FULL" if fill_val >= 86 else "NORMAL")
                        payload = {
                            "binId": bin_m.group(1) if bin_m else "BIN-001",
                            "fillLevel": fill_val,
                            "weightKg": float(weight_m.group(1)) if weight_m else 0.0,
                            "gasPpm": 120,
                            "maintenance": maint_m.group(1).lower() == "true" if maint_m else False,
                            "status": status_val
                        }

            if payload:
                success, res = send_telemetry_to_api(args.api, payload)
                if success:
                    extra_info = ""
                    if isinstance(res, dict) and res.get("generatedRequestId"):
                        extra_info = f" | AutoTicket: {res.get('generatedRequestType')} (ID: {res.get('generatedRequestId')})"
                    print(f"  ↳ ✅ Dispatched to GreenGold OS API! Status: {payload.get('status')}{extra_info}")
                else:
                    print(f"  ↳ ❌ API Dispatch Failed: {res}")
            else:
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
