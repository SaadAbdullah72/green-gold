"""
==============================================================================
GreenGold OS - Proteus Serial Telemetry Bridge v2.1
==============================================================================
This script bridges Proteus Simulation (via COMPIM Virtual Serial Port)
with the live GreenGold OS Web Application Backend.

STEP 1: Fetches REAL active deployed bins from backend database
STEP 2: User selects Bin Type (Metal=01, Plastic=02, Organic=03)
STEP 3: Sends telemetry with correct wasteType to management dashboard

Prerequisites:
  1. Virtual Serial Ports Pair (e.g. COM1 <-> COM2 using com0com or VSPD)
  2. Proteus COMPIM set to COM1, Baud: 9600
  3. This script connected to COM2, Baud: 9600

Usage:
  python scripts/proteus_bridge.py --demo
  python scripts/proteus_bridge.py --port COM2 --baud 9600
==============================================================================
"""

import sys
import time
import json
import argparse
import urllib.request
import urllib.error

# ============================================================================
# BIN TYPE DEFINITIONS (Metal=01, Plastic=02, Organic=03)
# ============================================================================
BIN_TYPES = [
    {"code": "01", "label": "Metal Bin",           "waste_type": "Metal",           "icon": "[Metal]"},
    {"code": "02", "label": "Plastic Bin",          "waste_type": "Plastic",         "icon": "[Plastic]"},
    {"code": "03", "label": "Organic / Compost Bin", "waste_type": "Organic/Compost", "icon": "[Organic]"},
]


def send_telemetry_to_api(api_url, payload_dict):
    try:
        data = json.dumps(payload_dict).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=data,
            headers={'Content-Type': 'application/json', 'User-Agent': 'GreenGold-ProteusBridge/2.1'},
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


def fetch_active_bins_from_api(api_url):
    """Fetch REAL active deployed bins from backend database."""
    try:
        base_api = api_url.replace('/telemetry', '/active-bins')
        req = urllib.request.Request(
            base_api,
            headers={'User-Agent': 'GreenGold-ProteusBridge/2.1'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            if res_json.get('success') and res_json.get('bins'):
                return res_json['bins']
    except Exception as e:
        print(f"  [WARNING] Could not fetch bins from backend: {e}")
    return []


def select_site(db_bins):
    """
    STEP 1: Interactive site selector — fetches REAL deployed bins from backend.
    Returns selected bin dict from database.
    """
    print("\n" + "=" * 70)
    print("  STEP 1: SELECT SERVICE AREA (LIVE FROM DATABASE)")
    print("=" * 70)

    if db_bins and len(db_bins) > 0:
        # Group bins by organization to avoid duplicates
        seen_orgs = {}
        unique_sites = []
        for b in db_bins:
            org = b.get('organizationName', 'Unknown')
            if org not in seen_orgs:
                seen_orgs[org] = True
                unique_sites.append(b)

        for idx, site in enumerate(unique_sites, 1):
            org = site.get('organizationName', 'Unknown')
            bin_id = site.get('binId', 'N/A')
            town = site.get('town', '')
            city = site.get('city', '')
            address = site.get('address', '')
            location_str = f"{town}, {city}" if town else city
            print(f"  [{idx}] {org}")
            print(f"      Bin: {bin_id} | Location: {address}, {location_str}")
            print()

        custom_idx = len(unique_sites) + 1
        print(f"  [{custom_idx}] Enter Custom Bin ID manually")
        print("-" * 70)

        try:
            choice = input("  Select site [number]: ").strip()
        except (KeyboardInterrupt, EOFError):
            choice = "1"

        try:
            num = int(choice)
            if 1 <= num <= len(unique_sites):
                selected = unique_sites[num - 1]
                print(f"  >> Selected: {selected.get('organizationName')} ({selected.get('binId')})")
                return selected
            elif num == custom_idx:
                try:
                    custom_id = input("  Enter Bin ID (e.g. BIN-01-01): ").strip().upper()
                except (KeyboardInterrupt, EOFError):
                    custom_id = "BIN-01-01"
                return {
                    "binId": custom_id or "BIN-01-01",
                    "organizationName": f"Custom Facility ({custom_id})",
                    "town": "Islamabad",
                    "city": "Islamabad",
                    "address": "Custom Location"
                }
        except ValueError:
            if choice.upper().startswith("BIN-"):
                return {
                    "binId": choice.upper(),
                    "organizationName": f"Custom Facility ({choice.upper()})",
                    "town": "Islamabad",
                    "city": "Islamabad",
                    "address": "Custom Location"
                }

        # Default to first
        selected = unique_sites[0]
        print(f"  >> Defaulting to: {selected.get('organizationName')}")
        return selected

    else:
        print("  [!] No active bins found in database.")
        print("  [!] Please register a bin deployment via Management Dashboard first.")
        print()
        print("  Falling back to manual entry...")
        try:
            custom_id = input("  Enter Bin ID (e.g. BIN-01-01): ").strip().upper()
        except (KeyboardInterrupt, EOFError):
            custom_id = "BIN-01-01"
        return {
            "binId": custom_id or "BIN-01-01",
            "organizationName": f"Custom Facility ({custom_id})",
            "town": "Islamabad",
            "city": "Islamabad",
            "address": "Custom Location"
        }


def select_bin_type():
    """STEP 2: Interactive bin type selector — returns bin type dict."""
    print("\n" + "=" * 70)
    print("  STEP 2: SELECT BIN TYPE (WASTE STREAM)")
    print("=" * 70)
    for idx, bt in enumerate(BIN_TYPES, 1):
        print(f"  [{idx}] {bt['icon']} {bt['label']}  (Code: {bt['code']})  ->  {bt['waste_type']} Waste")
    print("-" * 70)

    try:
        choice = input("  Select bin type [1-3]: ").strip()
    except (KeyboardInterrupt, EOFError):
        choice = "1"

    try:
        num = int(choice)
        if 1 <= num <= len(BIN_TYPES):
            selected = BIN_TYPES[num - 1]
            print(f"  >> Selected: {selected['label']} ({selected['waste_type']} Waste)")
            return selected
    except ValueError:
        pass

    print("  >> Defaulting to: Metal Bin")
    return BIN_TYPES[0]


def build_bin_id(bin_type, unit=1):
    """Generate bin ID: BIN-{type_code}-{unit:02d}  e.g. BIN-01-01, BIN-02-03"""
    return f"BIN-{bin_type['code']}-{unit:02d}"


def main():
    parser = argparse.ArgumentParser(description="GreenGold OS Proteus Telemetry Bridge v2.1")
    parser.add_argument("--port", default="COM2", help="Serial port to listen on (e.g. COM2)")
    parser.add_argument("--baud", type=int, default=9600, help="Baud rate (default: 9600)")
    parser.add_argument("--api", default="https://green-gold-dusky.vercel.app/api/iot/telemetry", help="GreenGold OS Backend API URL")
    parser.add_argument("--bin-id", default=None, help="Override Bin ID (skips selection)")
    parser.add_argument("--demo", action="store_true", help="Run in demo mode without COM port")

    args = parser.parse_args()

    print("=" * 70)
    print("  GREENGOLD OS - PROTEUS HARDWARE TELEMETRY BRIDGE v2.1")
    print("=" * 70)
    print(f"  Backend API : {args.api}")
    print(f"  Serial Port : {args.port} @ {args.baud} Baud")
    print("=" * 70)

    # ---------------------------------------------------------------
    # Fetch REAL active bins from backend database
    # ---------------------------------------------------------------
    print("\n  [*] Fetching active deployed bins from GreenGold OS database...")
    db_bins = fetch_active_bins_from_api(args.api)
    if db_bins:
        print(f"  [*] Found {len(db_bins)} active bin(s) in database.")
    else:
        print("  [*] No bins found in database (or backend offline).")

    # ---------------------------------------------------------------
    # STEP 1: Select Service Area (from REAL database)
    # ---------------------------------------------------------------
    selected_site = select_site(db_bins)

    # ---------------------------------------------------------------
    # STEP 2: Select Bin Type (Metal=01, Plastic=02, Organic=03)
    # ---------------------------------------------------------------
    bin_type = select_bin_type()

    # ---------------------------------------------------------------
    # Build Bin ID and metadata
    # ---------------------------------------------------------------
    if args.bin_id:
        target_bin_id = args.bin_id
    else:
        # Use the bin ID from selected site, or generate from bin type
        site_bin_id = selected_site.get('binId', '')
        if site_bin_id:
            target_bin_id = site_bin_id
        else:
            target_bin_id = build_bin_id(bin_type)

    target_client_name = selected_site.get('organizationName', 'Smart Bin Facility')
    target_waste_type = bin_type["waste_type"]
    target_town = selected_site.get('town', 'Islamabad')
    target_city = selected_site.get('city', 'Islamabad')
    target_address = selected_site.get('address', 'Main Campus')

    print("\n" + "=" * 70)
    print(f"  TARGET BIN ID    : {target_bin_id}")
    print(f"  FACILITY CLIENT  : {target_client_name}")
    print(f"  LOCATION         : {target_address}, {target_town}, {target_city}")
    print(f"  BIN TYPE         : {bin_type['label']}")
    print(f"  WASTE STREAM     : {target_waste_type}")
    print(f"  BACKEND API      : {args.api}")
    print("=" * 70)

    # ---------------------------------------------------------------
    # DEMO (INTERACTIVE SIMULATION) MODE
    # ---------------------------------------------------------------
    if args.demo:
        print("\n" + "=" * 70)
        print("  INTERACTIVE DEMO CONTROLLER ACTIVATED")
        print("=" * 70)
        print(f"  Simulating: {target_client_name} ({target_bin_id})")
        print(f"  Waste Type: {target_waste_type}")
        print(f"  Location  : {target_address}, {target_town}")
        print("-" * 70)
        print(f"  [1] NORMAL State        (Fill: 40%, Weight: 1.8kg)")
        print(f"  [2] BIN FULL Alert      (Fill: 95%, Weight: 8.5kg)  -> Dispatches {target_waste_type} Collection")
        print(f"  [3] MAINTENANCE Fault   (Lid Jammed / Tilt)         -> Dispatches Tech Team")
        print(f"  [4] RFID Staff Scan     (Bin Emptied -> Reset 0%)")
        print(f"  [5] Auto-Loop Mode      (Cycles all modes every 4s)")
        print(f"  [q] Quit")
        print("=" * 70)

        while True:
            try:
                choice = input("\n  Enter choice [1, 2, 3, 4, 5, or q]: ").strip()
            except (KeyboardInterrupt, EOFError):
                print("\n  [INFO] Exiting...")
                break

            base_payload = {
                "binId": target_bin_id,
                "wasteType": target_waste_type,
                "facilityName": target_client_name,
            }

            if choice == '1':
                sample = {**base_payload, "fillLevel": 40, "weightKg": 1.80,
                    "gasPpm": 120, "maintenance": False, "status": "NORMAL"}
            elif choice == '2':
                sample = {**base_payload, "fillLevel": 95, "weightKg": 8.50,
                    "gasPpm": 210, "maintenance": False, "status": "FULL"}
            elif choice == '3':
                sample = {**base_payload, "fillLevel": 60, "weightKg": 3.00,
                    "gasPpm": 150, "maintenance": True,
                    "faultReason": "LID_JAMMED / TILT_DETECTED", "status": "MAINTENANCE_REQUIRED"}
            elif choice == '4':
                sample = {**base_payload, "fillLevel": 0, "weightKg": 0.0,
                    "gasPpm": 80, "maintenance": False,
                    "rfidTag": "COLLECTOR-STAFF-01", "status": "NORMAL"}
            elif choice == '5':
                print(f"  [INFO] Starting Auto-Loop Mode for {target_bin_id} (Press Ctrl+C to stop)...")
                loop_modes = [
                    {**base_payload, "fillLevel": 45, "weightKg": 1.80, "gasPpm": 120, "maintenance": False, "status": "NORMAL"},
                    {**base_payload, "fillLevel": 95, "weightKg": 8.50, "gasPpm": 210, "maintenance": False, "status": "FULL"},
                    {**base_payload, "fillLevel": 60, "weightKg": 3.00, "gasPpm": 150, "maintenance": True, "faultReason": "LID_JAMMED / TILT_DETECTED", "status": "MAINTENANCE_REQUIRED"},
                    {**base_payload, "fillLevel": 0, "weightKg": 0.0, "gasPpm": 80, "maintenance": False, "rfidTag": "COLLECTOR-STAFF-01", "status": "NORMAL"},
                ]
                try:
                    for s in loop_modes:
                        print(f"\n  [Proteus TX - {target_bin_id}]: {json.dumps(s)}")
                        success, res = send_telemetry_to_api(args.api, s)
                        if success:
                            extra = f" | AutoTicket: {res.get('generatedRequestType')}" if res.get('generatedRequestId') else ""
                            print(f"    >> Dispatched! Status: {s.get('status')} | Waste: {target_waste_type}{extra}")
                        else:
                            print(f"    >> API Dispatch Failed: {res}")
                        time.sleep(4)
                except KeyboardInterrupt:
                    print("\n  [INFO] Auto-Loop stopped.")
                continue
            elif choice.lower() == 'q':
                print("  [INFO] Exiting...")
                break
            else:
                print("  [!] Invalid option, enter 1, 2, 3, 4, 5, or q.")
                continue

            print(f"\n  [Proteus TX - {target_bin_id}]: {json.dumps(sample)}")
            success, res = send_telemetry_to_api(args.api, sample)
            if success:
                print(f"  [API Success] {res.get('message', 'Telemetry recorded')}")
                if choice == '2':
                    print(f"    >> {target_waste_type} Waste Collection Request sent to Management Dashboard!")
                    print(f"    >> Check Management Dashboard -> Waste Collection tab ({target_client_name})")
                elif choice == '3':
                    print(f"    >> Maintenance/Tech Team Request sent to Management Dashboard!")
                    print(f"    >> Check Management Dashboard -> Bin Requests tab ({target_client_name})")
            else:
                print(f"  [API Error] {res}")

        return

    # ---------------------------------------------------------------
    # PHYSICAL / VIRTUAL SERIAL PORT MODE
    # ---------------------------------------------------------------
    try:
        import serial
    except ImportError:
        print("\n  [!] 'pyserial' library not found. Installing via pip...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyserial"])
        import serial

    try:
        ser = serial.Serial(args.port, args.baud, timeout=2)
        print(f"  Serial connection established on {args.port}.")
        print(f"  Simulating Target: {target_client_name} ({target_bin_id}) | {target_waste_type}")
        try:
            ser.write(f'{{"setBinId":"{target_bin_id}","wasteType":"{target_waste_type}"}}\n'.encode())
        except Exception:
            pass
        print("  Waiting for Proteus UART JSON transmissions (Press Ctrl+C to stop)...")
    except Exception as e:
        print(f"\n  Could not open serial port {args.port}: {e}")
        print(f"\n  TIP: Test in demo mode using:")
        print(f"  python {sys.argv[0]} --demo")
        return

    while True:
        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if not line:
                continue

            print(f"\n  [Proteus Raw Serial]: {line}", flush=True)

            cleaned_line = line.replace('\\:', ':').replace('\\,', ',').replace('\\"', '"').replace('\\}', '}').replace('\\{', '{')
            
            payload = None
            if '{' in cleaned_line and '}' in cleaned_line:
                start_idx = cleaned_line.find('{')
                end_idx = cleaned_line.rfind('}') + 1
                json_candidate = cleaned_line[start_idx:end_idx]
                
                try:
                    payload = json.loads(json_candidate)
                except json.JSONDecodeError:
                    import re
                    fill_m = re.search(r'fillLevel[\"\':\s]+(\d+)', cleaned_line, re.I)
                    weight_m = re.search(r'weightKg[\"\':\s]+([\d\.]+)', cleaned_line, re.I)
                    status_m = re.search(r'status[\"\':\s]+[\"\']+([A-Z_ ]+)[\"\']+', cleaned_line, re.I)
                    maint_m = re.search(r'maintenance[\"\':\s]+(true|false)', cleaned_line, re.I)

                    if fill_m or status_m:
                        fill_val = int(fill_m.group(1)) if fill_m else 0
                        status_val = status_m.group(1).strip() if status_m else ("FULL" if fill_val >= 86 else "NORMAL")
                        payload = {
                            "fillLevel": fill_val,
                            "weightKg": float(weight_m.group(1)) if weight_m else 0.0,
                            "gasPpm": 120,
                            "maintenance": maint_m.group(1).lower() == "true" if maint_m else False,
                            "status": status_val
                        }

            if payload:
                # Always inject our selected metadata
                payload["binId"] = target_bin_id
                payload["wasteType"] = target_waste_type
                payload["facilityName"] = target_client_name

                success, res = send_telemetry_to_api(args.api, payload)
                if success:
                    extra_info = ""
                    if isinstance(res, dict) and res.get("generatedRequestId"):
                        extra_info = f" | AutoTicket: {res.get('generatedRequestType')} (ID: {res.get('generatedRequestId')})"
                    print(f"    >> Dispatched! Site: {target_client_name} ({target_bin_id}) | Waste: {target_waste_type} | Status: {payload.get('status')}{extra_info}")
                else:
                    print(f"    >> API Dispatch Failed: {res}")
            else:
                print("    >> Incomplete or invalid JSON line received, skipping...")

        except KeyboardInterrupt:
            print("\n  [INFO] Stopped by user.")
            ser.close()
            break
        except Exception as e:
            print(f"  [Error]: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
