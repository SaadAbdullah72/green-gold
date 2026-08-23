"""
==============================================================================
GreenGold OS - Interactive Smart Bin Hardware Simulator GUI
==============================================================================
This GUI simulates the physical smart bin hardware controls (Potentiometers,
Fault Switch, RFID tap) and instantly sends live telemetry to the GreenGold OS API.
==============================================================================
"""

import tkinter as tk
from tkinter import ttk, messagebox
import urllib.request
import urllib.error
import json
import threading
import time

API_URL = "http://localhost:5000/api/iot/telemetry"

class SmartBinHardwareSimulator:
    def __init__(self, root):
        self.root = root
        self.root.title("🌿 GreenGold OS - Smart Bin Hardware Simulator")
        self.root.geometry("540x620")
        self.root.resizable(False, False)
        self.root.configure(bg="#0f172a")

        self.auto_sync = tk.BooleanVar(value=True)
        self.maintenance_var = tk.BooleanVar(value=False)

        self._build_ui()
        self._start_sync_thread()

    def _build_ui(self):
        style = ttk.Style()
        style.theme_use('clam')

        # Header
        header = tk.Frame(self.root, bg="#1e293b", padx=16, pady=12)
        header.pack(fill="x")
        
        lbl_title = tk.Label(header, text="🌿 SMART BIN HARDWARE EMULATOR", font=("Arial", 14, "bold"), fg="#10b981", bg="#1e293b")
        lbl_title.pack(anchor="w")
        
        lbl_sub = tk.Label(header, text="Proteus / ESP32 Hardware Telemetry Sync Interface", font=("Arial", 9), fg="#94a3b8", bg="#1e293b")
        lbl_sub.pack(anchor="w")

        # Container
        body = tk.Frame(self.root, bg="#0f172a", padx=20, pady=14)
        body.pack(fill="both", expand=True)

        # 1. Fill Level (Ultrasonic Potentiometer)
        tk.Label(body, text="1. Fill Level Sensor (Ultrasonic HC-SR04 / Potentiometer RV1):", font=("Arial", 10, "bold"), fg="#e2e8f0", bg="#0f172a").pack(anchor="w", pady=(4, 2))
        self.fill_val_lbl = tk.Label(body, text="65%", font=("Arial", 12, "bold"), fg="#38bdf8", bg="#0f172a")
        self.fill_val_lbl.pack(anchor="e")
        self.fill_slider = tk.Scale(body, from_=0, to=100, orient="horizontal", bg="#1e293b", fg="#e2e8f0", highlightthickness=0, troughcolor="#334155", command=self._on_fill_change)
        self.fill_slider.set(65)
        self.fill_slider.pack(fill="x", pady=(0, 10))

        # 2. Weight Sensor (Load Cell Potentiometer)
        tk.Label(body, text="2. Weight Sensor (Load Cell HX711 / Potentiometer RV2):", font=("Arial", 10, "bold"), fg="#e2e8f0", bg="#0f172a").pack(anchor="w", pady=(4, 2))
        self.weight_val_lbl = tk.Label(body, text="3.2 kg", font=("Arial", 12, "bold"), fg="#38bdf8", bg="#0f172a")
        self.weight_val_lbl.pack(anchor="e")
        self.weight_slider = tk.Scale(body, from_=0, to=15, resolution=0.1, orient="horizontal", bg="#1e293b", fg="#e2e8f0", highlightthickness=0, troughcolor="#334155", command=self._on_weight_change)
        self.weight_slider.set(3.2)
        self.weight_slider.pack(fill="x", pady=(0, 10))

        # 3. Gas / Smoke Sensor
        tk.Label(body, text="3. Gas / Air Quality Sensor (MQ-135 / Potentiometer RV3):", font=("Arial", 10, "bold"), fg="#e2e8f0", bg="#0f172a").pack(anchor="w", pady=(4, 2))
        self.gas_val_lbl = tk.Label(body, text="120 ppm (Normal)", font=("Arial", 10, "bold"), fg="#10b981", bg="#0f172a")
        self.gas_val_lbl.pack(anchor="e")
        self.gas_slider = tk.Scale(body, from_=50, to=800, orient="horizontal", bg="#1e293b", fg="#e2e8f0", highlightthickness=0, troughcolor="#334155", command=self._on_gas_change)
        self.gas_slider.set(120)
        self.gas_slider.pack(fill="x", pady=(0, 10))

        # 4. Hardware Fault / Maintenance Trigger Switch
        fault_frame = tk.Frame(body, bg="#1e293b", padx=12, pady=10, relief="groove", bd=1)
        fault_frame.pack(fill="x", pady=(6, 12))
        
        chk_maint = tk.Checkbutton(fault_frame, text="⚠️ TRIGGER HARDWARE FAULT (Lid Jammed / Maintenance Ticket)", variable=self.maintenance_var, font=("Arial", 10, "bold"), fg="#f87171", bg="#1e293b", selectcolor="#0f172a", activebackground="#1e293b", activeforeground="#f87171", command=self.send_telemetry)
        chk_maint.pack(anchor="w")

        # 5. RFID Tap Button
        btn_rfid = tk.Button(body, text="💳 TAP RFID COLLECTOR CARD (Empty Bin)", font=("Arial", 11, "bold"), bg="#10b981", fg="#ffffff", activebackground="#059669", activeforeground="#ffffff", relief="flat", padx=10, pady=8, cursor="hand2", command=self._tap_rfid)
        btn_rfid.pack(fill="x", pady=(4, 10))

        # 6. Status Log Bar
        self.status_bar = tk.Label(self.root, text="Ready. Backend: " + API_URL, font=("Consolas", 9), fg="#94a3b8", bg="#020617", padx=10, pady=6, anchor="w")
        self.status_bar.pack(fill="x", side="bottom")

    def _on_fill_change(self, val):
        self.fill_val_lbl.config(text=f"{val}%")
        self.send_telemetry()

    def _on_weight_change(self, val):
        self.weight_val_lbl.config(text=f"{val} kg")
        self.send_telemetry()

    def _on_gas_change(self, val):
        val_int = int(val)
        if val_int > 400:
            self.gas_val_lbl.config(text=f"{val_int} ppm (HIGH/SMOKE)", fg="#ef4444")
        else:
            self.gas_val_lbl.config(text=f"{val_int} ppm (Normal)", fg="#10b981")
        self.send_telemetry()

    def _tap_rfid(self):
        self.fill_slider.set(0)
        self.weight_slider.set(0.0)
        self.maintenance_var.set(False)
        self.send_telemetry(rfid="COLLECTOR-CARD-88", event="COLLECTOR EMPTIED BIN VIA RFID")

    def send_telemetry(self, rfid=None, event=None):
        fill = int(self.fill_slider.get())
        weight = float(self.weight_slider.get())
        gas = int(self.gas_slider.get())
        is_maint = self.maintenance_var.get()

        status = "NORMAL"
        if is_maint:
            status = "MAINTENANCE_REQUIRED"
        elif fill >= 86:
            status = "FULL"
        elif fill >= 61:
            status = "ALMOST FULL"

        payload = {
            "binId": "BIN-001",
            "fillLevel": fill,
            "weightKg": weight,
            "gasPpm": gas,
            "maintenance": is_maint,
            "faultReason": "LID_JAMMED / TILT_DETECTED" if is_maint else None,
            "rfidTag": rfid,
            "status": status,
            "event": event
        }

        threading.Thread(target=self._post_data, args=(payload,), daemon=True).start()

    def _post_data(self, payload):
        try:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                API_URL,
                data=data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                self.status_bar.config(text=f"✅ Telemetry Sent: FL={payload['fillLevel']}% | Wt={payload['weightKg']}kg | Status={payload['status']}", fg="#34d399")
        except Exception as e:
            self.status_bar.config(text=f"❌ Backend Disconnected ({e})", fg="#f87171")

    def _start_sync_thread(self):
        def _periodic():
            while True:
                time.sleep(3)
                if self.auto_sync.get():
                    self.send_telemetry()
        t = threading.Thread(target=_periodic, daemon=True)
        t.start()

if __name__ == "__main__":
    root = tk.Tk()
    app = SmartBinHardwareSimulator(root)
    root.mainloop()
