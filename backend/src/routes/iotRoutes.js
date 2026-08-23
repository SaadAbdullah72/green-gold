import express from 'express';
const router = express.Router();

// Memory store for live IoT bin telemetry (for real-time dashboard updates)
let liveBinTelemetry = {
  'BIN-001': {
    binId: 'BIN-001',
    weightKg: 2.85,
    fillLevel: 65,
    maintenance: false,
    faultReason: null,
    gasPpm: 120,
    status: 'NORMAL', // NORMAL (0-60%), ALMOST FULL (61-85%), FULL (86-100%), MAINTENANCE_REQUIRED
    locationName: 'Riphah Campus, Islamabad',
    lat: 33.6844,
    lng: 73.0479,
    rfidLastScanned: 'STAFF-001',
    lastUpdated: new Date().toISOString(),
    event: 'Telemetry Sync'
  }
};

// 1. ESP32 / Arduino Proteus Telemetry Ingestion Endpoint
// POST /api/iot/telemetry
router.post('/telemetry', (req, res) => {
  try {
    const { 
      binId, 
      weightKg, 
      fillLevel, 
      rfidTag, 
      status, 
      maintenance, 
      faultReason, 
      gasPpm,
      lat, 
      lng, 
      event 
    } = req.body;

    const targetBinId = binId || 'BIN-001';
    const numWeight = parseFloat(weightKg) || 0;
    const numFill = parseInt(fillLevel) || 0;
    const isMaintenance = maintenance === true || maintenance === 'true' || status === 'MAINTENANCE_REQUIRED';
    const numGas = parseInt(gasPpm) || 120;

    let computedStatus = 'NORMAL';
    if (isMaintenance) {
      computedStatus = 'MAINTENANCE_REQUIRED';
    } else if (numFill >= 86) {
      computedStatus = 'FULL';
    } else if (numFill >= 61) {
      computedStatus = 'ALMOST FULL';
    }

    let defaultEvent = 'Routine Sensor Reading';
    if (isMaintenance) {
      defaultEvent = `MAINTENANCE ALERT: ${faultReason || 'Hardware Malfunction / Tamper Detected'}`;
    } else if (numFill >= 86) {
      defaultEvent = 'ALERT: BIN FULL - COLLECTOR DISPATCH REQUIRED';
    } else if (numGas > 400) {
      defaultEvent = 'HAZARD ALERT: HIGH GAS/SMOKE DETECTED';
    }

    const telemetryData = {
      binId: targetBinId,
      weightKg: numWeight,
      fillLevel: numFill,
      maintenance: isMaintenance,
      faultReason: isMaintenance ? (faultReason || 'Sensor/Lid Malfunction') : null,
      gasPpm: numGas,
      status: status || computedStatus,
      locationName: 'Riphah Campus, Islamabad',
      lat: lat || 33.6844,
      lng: lng || 73.0479,
      rfidLastScanned: rfidTag || null,
      lastUpdated: new Date().toISOString(),
      event: event || defaultEvent
    };

    liveBinTelemetry[targetBinId] = telemetryData;

    console.log(`[IoT Telemetry Ingest] ${targetBinId} -> Fill: ${numFill}%, Weight: ${numWeight}kg, Status: ${telemetryData.status}`);

    return res.json({
      success: true,
      message: 'Telemetry received successfully',
      telemetry: telemetryData,
      alertTriggered: numFill >= 86 || isMaintenance || numGas > 400
    });
  } catch (error) {
    console.error('[IoT Telemetry Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET /api/iot/bins - Retrieve Live Telemetry for GreenGold OS Dashboards
router.get('/bins', (req, res) => {
  res.json({
    success: true,
    bins: Object.values(liveBinTelemetry)
  });
});

// 3. GET /api/iot/bins/:binId - Specific bin live data
router.get('/bins/:binId', (req, res) => {
  const bin = liveBinTelemetry[req.params.binId] || null;
  res.json({
    success: true,
    bin
  });
});

export default router;
