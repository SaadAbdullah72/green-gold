# 🌿 GreenGold OS — Proteus Smart Bin Hardware Simulation & Web App Integration Guide

Yeh complete step-by-step guide hai jo aapko **Proteus 8/9** mein Arduino Smart Bin circuit banane, code load karne, aur **GreenGold OS Web Application** ke sath real-time live calls / alerts connect karne ka poora tareeqa sikhayegi.

---

## 📑 Index
1. [Proteus Components Required](#1-proteus-components-required)
2. [Pin Connections & Wiring Table](#2-pin-connections--wiring-table)
3. [Arduino Code (.hex file generate karna)](#3-arduino-code-hex-file-generate-karna)
4. [Virtual COM Port Setup (com0com)](#4-virtual-com-port-setup-com0com)
5. [Connecting Proteus COMPIM](#5-connecting-proteus-compim)
6. [Running the Full System (Live Testing)](#6-running-the-full-system-live-testing)
7. [Hardware Events & App Alerts Matrix](#7-hardware-events--app-alerts-matrix)

---

## 1. Proteus Components Required

Proteus mein **Pick Devices (P key)** se yeh components select karein:

| # | Proteus Device Name | Circuit Label | Simulates |
|---|---------------------|---------------|-----------|
| 1 | `ARDUINO UNO R3`    | `U1`          | Central Microcontroller |
| 2 | `POT-HG` (Potentiometer) | `RV1`    | Ultrasonic Sensor (HC-SR04 Fill Level: 0–100%) |
| 3 | `POT-HG` (Potentiometer) | `RV2`    | Weight Load Cell (HX711: 0–15 kg) |
| 4 | `POT-HG` (Potentiometer) | `RV3`    | MQ-135 Gas / Smoke Sensor (50–1000 ppm) |
| 5 | `LM016L`            | `LCD1`        | 16x2 LCD Display Screen |
| 6 | `COMPIM`            | `U2`          | Serial Physical Model (Virtual COM Port Link) |
| 7 | `SWITCH` or `LOGICSTATE` | `SW1`    | Maintenance / Lid Fault Trigger |
| 8 | `BUTTON`            | `SW2`         | RFID Card Scan Trigger (Empty Bin) |
| 9 | `LED-GREEN`         | `D1`          | Normal Status Indicator |
| 10 | `LED-RED`          | `D2`          | Bin Full Alert Indicator |
| 11 | `LED-YELLOW`       | `D3`          | Maintenance Required Indicator |
| 12 | `BUZZER`           | `BZ1`         | Audible Sound Alarm |

---

## 2. Pin Connections & Wiring Table

### A. Arduino to Analog Sensors (Potentiometers)
* **RV1 (Fill Level)**:
  * Top Pin $\rightarrow$ `+5V` (POWER)
  * Bottom Pin $\rightarrow$ `GND`
  * Middle Wiper Pin $\rightarrow$ Arduino **`A0`**
* **RV2 (Weight Sensor)**:
  * Top Pin $\rightarrow$ `+5V`
  * Bottom Pin $\rightarrow$ `GND`
  * Middle Wiper Pin $\rightarrow$ Arduino **`A1`**
* **RV3 (Gas / Air Quality)**:
  * Top Pin $\rightarrow$ `+5V`
  * Bottom Pin $\rightarrow$ `GND`
  * Middle Wiper Pin $\rightarrow$ Arduino **`A2`**

### B. Arduino to LCD 16x2 (LM016L)
* LCD Pin 1 (`VSS`) $\rightarrow$ `GND`
* LCD Pin 2 (`VDD`) $\rightarrow$ `+5V`
* LCD Pin 3 (`VEE`) $\rightarrow$ `GND`
* LCD Pin 4 (`RS`)  $\rightarrow$ Arduino **`Pin 12`**
* LCD Pin 5 (`RW`)  $\rightarrow$ `GND`
* LCD Pin 6 (`E`)   $\rightarrow$ Arduino **`Pin 11`**
* LCD Pin 11 (`D4`) $\rightarrow$ Arduino **`Pin 4`**
* LCD Pin 12 (`D5`) $\rightarrow$ Arduino **`Pin 5`**
* LCD Pin 13 (`D6`) $\rightarrow$ Arduino **`Pin 6`**
* LCD Pin 14 (`D7`) $\rightarrow$ Arduino **`Pin 7`**

### C. Arduino to Switches (Triggers)
* **SW1 (Maintenance Fault Switch)**:
  * One Pin $\rightarrow$ Arduino **`Pin 8`**
  * Other Pin $\rightarrow$ `GND`
  *(Internal pull-up enabled in code)*
* **SW2 (RFID Tap Button)**:
  * One Pin $\rightarrow$ Arduino **`Pin 9`**
  * Other Pin $\rightarrow$ `GND`

### D. Arduino to LEDs & Buzzer
* Arduino **`Pin 2`** $\rightarrow$ `D1 (Green LED)` (Cathode to `GND`)
* Arduino **`Pin 3`** $\rightarrow$ `D2 (Red LED)` (Cathode to `GND`)
* Arduino **`Pin 10`** $\rightarrow$ `D3 (Yellow LED)` (Cathode to `GND`)
* Arduino **`Pin 13`** $\rightarrow$ `BZ1 (Buzzer)` (Other pin to `GND`)

### E. Arduino to COMPIM (Serial Port)
* Arduino **`TXD (Pin 1)`** $\rightarrow$ COMPIM **`RXD (Pin 2)`**
* Arduino **`RXD (Pin 0)`** $\rightarrow$ COMPIM **`TXD (Pin 3)`**

---

## 3. Arduino Code (.hex File Generate Karna)

Source file location:
`firmware/smart_bin_proteus/smart_bin_proteus.ino`

### Hex file nikaalne ka tareeqa:
1. Arduino IDE mein `smart_bin_proteus.ino` open karein.
2. Menu bar mein jayein: **Sketch $\rightarrow$ Export Compiled Binary** (`Ctrl + Alt + S`).
3. Sketch ke folder mein `.hex` file generate ho jayegi (e.g. `smart_bin_proteus.ino.hex`).
4. **Proteus mein**:
   * Arduino UNO component par Double Click karein.
   * **Program File** field mein `smart_bin_proteus.ino.hex` select karein.
   * **OK** press karein.

---

## 4. Virtual COM Port Setup (com0com)

Proteus aur Python bridge ko connect karne ke liye do Virtual COM ports chahiye:

1. Free tool **com0com** (ya **Virtual Serial Port Driver - VSPD**) download karein.
2. Pair create karein: **`COM1`** aur **`COM2`**.
   * `COM1` $\rightarrow$ Proteus COMPIM ke liye
   * `COM2` $\rightarrow$ Python Bridge script ke liye

---

## 5. Connecting Proteus COMPIM

Proteus mein **COMPIM** component par Double Click karein:
* **Port**: `COM1`
* **Physical Baud Rate**: `9600`
* **Virtual Baud Rate**: `9600`
* **Data Bits**: `8`
* **Parity**: `None`
* **Stop Bits**: `1`
* Click **OK**.

---

## 6. Running the Full System (Live Testing)

Sab cheezein aik sath run karne ke 3 asaan steps:

### Step 1: GreenGold OS Backend Run Karein
Terminal 1 mein:
```bash
cd backend
npm run dev
```
*(Backend `http://localhost:5000` par start ho jayega)*

### Step 2: Python Serial Bridge Run Karein
Terminal 2 mein:
```bash
python scripts/proteus_bridge.py --port COM2 --baud 9600
```
*(Yeh script Proteus ke packets receive kar ke seedha backend ko calls bhejti hai)*

> 💡 **Bonus (Bina Proteus ke direct test karne ke liye):**
> Aap hamara GUI emulator bhi chala sakte hain:
> ```bash
> python scripts/hardware_simulator.py
> ```

### Step 3: Proteus Simulation Start Karein
* Proteus mein bottom-left par **Play Button (▶)** dabayein.
* LCD par **"GreenGold OS Smart Bin"** display hoga.
* Potentiometers ko ghumayein ya switches press karein.

---

## 7. Hardware Events & App Alerts Matrix

| Hardware Action (Proteus) | Hardware Response (LED/LCD) | GreenGold OS Web App par Asar |
|---|---|---|
| **Fill Level Pot > 85%** | Red LED ON, LCD shows "FULL", Buzzer beeps | **Waste Collector Alert**: Map par bin Red ho jayegi aur Collector ke route list mein priority pickup ban jayega. |
| **Fault Switch (SW1) ON** | Yellow LED ON, LCD shows "!MAINTENANCE REQ!" | **Technician Alert**: Backend foran **Maintenance Service Ticket** raise karega aur Technician Dashboard par dispatch call aayegi. |
| **Gas Pot > 400 ppm** | Buzzer sound, Telemetry warning | **Hazard Alert**: Management dashboard par Fire / Bad Odor safety warning aayegi. |
| **RFID Button (SW2) Press** | LCD shows "CARD: CLEAR BIN", Level 0% | **Clearance Event**: Collector ne bin khali kar di, bin reset ho kar Normal ho jayegi aur clearance log record hoga. |
