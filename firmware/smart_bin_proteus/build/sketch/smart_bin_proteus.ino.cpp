#include <Arduino.h>
#line 1 "c:\\Users\\Hp\\Desktop\\GreenGold Os\\firmware\\smart_bin_proteus\\smart_bin_proteus.ino"
#line 1 "c:\\Users\\Hp\\Desktop\\GreenGold Os\\firmware\\smart_bin_proteus\\smart_bin_proteus.ino"
/*
 * ============================================================================
 * GreenGold OS - Smart IoT Bin Simulation Firmware (Arduino UNO / Proteus)
 * ============================================================================
 * Hardware & Simulation Description:
 *  - U1: Arduino UNO (ATmega328P)
 *  - RV1 (A0): Fill Level Sensor (Ultrasonic HC-SR04 simulation via Potentiometer 0-100%)
 *  - RV2 (A1): Weight Sensor (Load Cell / HX711 simulation via Potentiometer 0-10kg)
 *  - RV3 (A2): Gas / Smoke Sensor (MQ-135 simulation via Potentiometer 0-1000ppm)
 *  - SW1 (Pin 8): Maintenance / Fault Simulation Switch (LOW = Fault / Lid Jammed)
 *  - SW2 (Pin 9): RFID Staff Card Scan Emulation (LOW = Card Scanned to Empty Bin)
 *  - LCD1 (LM016L): 16x2 LCD Display (Pins: RS=12, EN=11, D4=4, D5=5, D6=6, D7=7)
 *  - D1 (Pin 2): Green LED (Normal Status)
 *  - D2 (Pin 3): Red LED (Bin Full Alert)
 *  - D3 (Pin 10): Yellow LED (Maintenance / Fault Alert)
 *  - BUZZER (Pin 13): Audible alarm when Full or Fault
 *  - UART (Pins 0/1): Transmits JSON Telemetry to GreenGold OS Cloud API Bridge
 * ============================================================================
 */

#include <LiquidCrystal.h>

// Initialize 16x2 LCD (RS, E, D4, D5, D6, D7)
LiquidCrystal lcd(12, 11, 4, 5, 6, 7);

// Pin Assignments
const int PIN_FILL_POT     = A0;  // RV1: Fill Level Potentiometer
const int PIN_WEIGHT_POT   = A1;  // RV2: Weight Potentiometer
const int PIN_GAS_POT      = A2;  // RV3: Gas / Smoke Potentiometer
const int PIN_FAULT_SW     = 8;   // SW1: Maintenance Trigger Switch (Active LOW)
const int PIN_RFID_SW      = 9;   // SW2: RFID Emulation Trigger (Active LOW)

const int PIN_LED_GREEN    = 2;   // Normal Status LED
const int PIN_LED_RED      = 3;   // Bin Full Alert LED
const int PIN_LED_YELLOW   = 10;  // Maintenance Alert LED
const int PIN_BUZZER       = 13;  // Alarm Buzzer

const char* BIN_ID = "BIN-001";
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 3000; // Send telemetry every 3 seconds

#line 42 "c:\\Users\\Hp\\Desktop\\GreenGold Os\\firmware\\smart_bin_proteus\\smart_bin_proteus.ino"
void setup();
#line 75 "c:\\Users\\Hp\\Desktop\\GreenGold Os\\firmware\\smart_bin_proteus\\smart_bin_proteus.ino"
void loop();
#line 42 "c:\\Users\\Hp\\Desktop\\GreenGold Os\\firmware\\smart_bin_proteus\\smart_bin_proteus.ino"
void setup() {
  // Initialize Serial Communication for Telemetry
  Serial.begin(9600);

  // Initialize LCD
  lcd.begin(16, 2);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("  GreenGold OS  ");
  lcd.setCursor(0, 1);
  lcd.print("Smart Bin Boot..");
  
  // Configure GPIO Pins
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  pinMode(PIN_FAULT_SW, INPUT_PULLUP);
  pinMode(PIN_RFID_SW, INPUT_PULLUP);

  // Initial LED Test
  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_LED_RED, HIGH);
  digitalWrite(PIN_LED_YELLOW, HIGH);
  delay(1000);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_YELLOW, LOW);

  lcd.clear();
}

void loop() {
  // 1. Read Analog Sensors
  int rawFill   = analogRead(PIN_FILL_POT);   // 0 to 1023
  int rawWeight = analogRead(PIN_WEIGHT_POT); // 0 to 1023
  int rawGas    = analogRead(PIN_GAS_POT);    // 0 to 1023

  // Map values to engineering units
  int fillPercent = map(rawFill, 0, 1023, 0, 100);
  fillPercent = constrain(fillPercent, 0, 100);

  float weightKg = (float)map(rawWeight, 0, 1023, 0, 1000) / 100.0; // 0.00 to 10.00 kg
  weightKg = constrain(weightKg, 0.0, 15.0);

  int gasPpm = map(rawGas, 0, 1023, 50, 1000); // 50 to 1000 ppm

  // 2. Read Digital Triggers
  bool isMaintenanceFault = (digitalRead(PIN_FAULT_SW) == LOW);
  bool isRfidScanned      = (digitalRead(PIN_RFID_SW) == LOW);

  // 3. Determine Bin Status & Control Actuators
  String binStatus = "NORMAL";
  String faultReason = "None";

  if (isMaintenanceFault) {
    binStatus = "MAINTENANCE_REQUIRED";
    faultReason = "LID_JAMMED / SENSOR_FAULT";
    
    // Actuators
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
  } 
  else if (fillPercent >= 86) {
    binStatus = "FULL";
    
    // Actuators
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_BUZZER, HIGH);
  } 
  else if (fillPercent >= 61) {
    binStatus = "ALMOST FULL";
    
    // Actuators
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_BUZZER, LOW);
  } 
  else {
    binStatus = "NORMAL";
    
    // Actuators
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  }

  // 4. Update LCD Screen
  lcd.setCursor(0, 0);
  lcd.print("ID:");
  lcd.print(BIN_ID);
  lcd.print(" FL:");
  if (fillPercent < 10) lcd.print(" ");
  lcd.print(fillPercent);
  lcd.print("% ");

  lcd.setCursor(0, 1);
  if (isMaintenanceFault) {
    lcd.print("!MAINTENANCE REQ!");
  } else if (isRfidScanned) {
    lcd.print("CARD: CLEAR BIN ");
  } else {
    lcd.print("W:");
    lcd.print(weightKg, 1);
    lcd.print("kg St:");
    if (binStatus == "FULL") lcd.print("FULL ");
    else if (binStatus == "ALMOST FULL") lcd.print("NEAR ");
    else lcd.print("OK   ");
  }

  // 5. Transmit JSON Telemetry periodically or immediately on state trigger
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL || isRfidScanned || isMaintenanceFault) {
    lastTelemetryTime = millis();

    Serial.print("{\"binId\":\"");
    Serial.print(BIN_ID);
    Serial.print("\",\"fillLevel\":");
    Serial.print(isRfidScanned ? 0 : fillPercent);
    Serial.print(",\"weightKg\":");
    Serial.print(isRfidScanned ? 0.0 : weightKg, 2);
    Serial.print(",\"gasPpm\":");
    Serial.print(gasPpm);
    Serial.print(",\"maintenance\":");
    Serial.print(isMaintenanceFault ? "true" : "false");
    Serial.print(",\"faultReason\":\"");
    Serial.print(isMaintenanceFault ? faultReason : "NONE");
    Serial.print("\",\"rfidTag\":");
    if (isRfidScanned) Serial.print("\"COLLECTOR-CARD-77\"");
    else Serial.print("null");
    Serial.print(",\"status\":\"");
    if (isMaintenanceFault) Serial.print("MAINTENANCE_REQUIRED");
    else if (isRfidScanned) Serial.print("NORMAL");
    else Serial.print(binStatus);
    Serial.println("\"}");
  }

  delay(200); // Small loop delay
}

