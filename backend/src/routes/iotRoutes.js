import express from 'express';
const router = express.Router();

// Memory store for live IoT bin telemetry (for real-time dashboard updates)
let liveBinTelemetry = {
  'BIN-001': {
    binId: 'BIN-001',
    weightKg: 2.85,
    fillLevel: 65,
    status: 'NORMAL', // NORMAL (0-60%), ALMOST FULL (61-85%), FULL (86-100%)
    locationName: 'Riphah Campus, Islamabad',
    lat: 33.6844,
    lng: 73.0479,
    rfidLastScanned: 'STAFF-001',
    lastUpdated: new Date().toISOString(),
    event: 'Telemetry Sync'
  }
};

// 1. ESP32 / Proteus Telemetry Ingestion Endpoint
// POST /api/iot/telemetry
router.post('/telemetry', (req, res) => {
  try {
    const { binId, weightKg, fillLevel, rfidTag, status, lat, lng, event } = req.body;

    const targetBinId = binId || 'BIN-001';
    const numWeight = parseFloat(weightKg) || 0;
    const numFill = parseInt(fillLevel) || 0;

    let computedStatus = 'NORMAL';
    if (numFill >= 86) {
      computedStatus = 'FULL';
    } else if (numFill >= 61) {
      computedStatus = 'ALMOST FULL';
    }

    const telemetryData = {
      binId: targetBinId,
      weightKg: numWeight,
      fillLevel: numFill,
      status: status || computedStatus,
      locationName: 'Riphah Campus, Islamabad',
      lat: lat || 33.6844,
      lng: lng || 73.0479,
      rfidLastScanned: rfidTag || null,
      lastUpdated: new Date().toISOString(),
      event: event || (numFill >= 86 ? 'ALERT: BIN FILLED' : 'Routine Sensor Reading')
    };

    liveBinTelemetry[targetBinId] = telemetryData;

    console.log(`[IoT Telemetry] Received from ${targetBinId}:`, telemetryData);

    return res.json({
      success: true,
      message: 'Telemetry received successfully',
      telemetry: telemetryData,
      alertTriggered: numFill >= 86
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
