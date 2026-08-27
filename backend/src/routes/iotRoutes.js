import express from 'express';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { CollectorAssignment } from '../models/CollectorAssignment.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';

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

// Helper: Get or fallback a default user ID for IoT-generated tickets
async function getSystemUserId() {
  try {
    const user = await User.findOne({ role: { $in: ['MANAGEMENT', 'USER'] } }).sort({ createdAt: 1 });
    return user ? user._id : '6a7b4e919b49ecf5489e17dc';
  } catch {
    return '6a7b4e919b49ecf5489e17dc';
  }
}

// 1. ESP32 / Arduino Proteus Telemetry Ingestion Endpoint
// POST /api/iot/telemetry
router.post('/telemetry', async (req, res) => {
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

    let generatedRequestId = null;
    let generatedRequestType = null;

    // =========================================================================
    // 1. AUTOMATED MAINTENANCE CALL -> MANAGEMENT SERVICE REQUEST (TECHNICAL)
    // =========================================================================
    if (isMaintenance) {
      try {
        const existingMaintenanceReq = await ServiceRequest.findOne({
          organizationName: { $regex: new RegExp(targetBinId, 'i') },
          description: { $regex: /MAINTENANCE/i },
          status: { $nin: ['COMPLETED', 'DECLINED', 'CANCELLED'] }
        });

        if (!existingMaintenanceReq) {
          const sysUserId = await getSystemUserId();
          const count = await ServiceRequest.countDocuments();
          const requestNumber = `MAINT-${targetBinId}-${String(count + 1).padStart(3, '0')}`;

          const newReq = await ServiceRequest.create({
            requestNumber,
            userId: sysUserId,
            requestType: 'BIN_DEPLOYMENT',
            organizationName: `Smart Bin ${targetBinId} (Maintenance Fault)`,
            contactPerson: 'IoT Autonomous Diagnostic System',
            phone: '+92 300 0000000',
            email: 'iot-alerts@greengold.org',
            address: 'Riphah International University, Sector I-14',
            town: 'I-14',
            city: 'Islamabad',
            numberOfBins: 1,
            binType: 'IoT Ultrasonic Smart Bin (240L)',
            description: `[CRITICAL IOT ALERT] Smart Bin ${targetBinId} requires urgent maintenance: ${faultReason || 'Lid Jammed / Tilt Sensor Triggered'}. Please assign a Technical Team member to inspect and resolve.`,
            priority: 'Urgent',
            status: 'SUBMITTED',
            requiredWorkers: 1
          });

          generatedRequestId = newReq._id;
          generatedRequestType = 'MAINTENANCE_SERVICE_REQUEST';

          console.log(`🔔 [IoT -> Management Auto-Call] Maintenance Service Request Created: ${requestNumber}`);

          // Send notification to Management
          const mgmtUsers = await User.find({ role: 'MANAGEMENT' }).select('_id');
          for (const mgmt of mgmtUsers) {
            await Notification.create({
              recipientId: mgmt._id,
              type: 'MAINTENANCE_ALERT',
              title: `🚨 Maintenance Alert: ${targetBinId}`,
              message: `Proteus Smart Bin ${targetBinId} reported a fault (${faultReason || 'Lid Jammed'}). Assigned to Technical Queue.`,
              relatedRequestId: newReq._id
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[IoT Maintenance Request Error]:', err.message);
      }
    }

    // =========================================================================
    // 2. AUTOMATED BIN FULL CALL -> MANAGEMENT WASTE COLLECTION QUEUE (COLLECTOR)
    // =========================================================================
    if (numFill >= 86) {
      try {
        const existingCollectionReq = await ServiceRequest.findOne({
          requestType: 'WASTE_COLLECTION',
          $or: [
            { siteName: { $regex: new RegExp(targetBinId, 'i') } },
            { organizationName: { $regex: new RegExp(targetBinId, 'i') } }
          ],
          status: { $in: ['WAITING_COLLECTION', 'ROUTED_FOR_COLLECTION', 'ASSIGNED_TO_COLLECTOR'] }
        });

        if (!existingCollectionReq) {
          const sysUserId = await getSystemUserId();
          const count = await ServiceRequest.countDocuments({ requestType: 'WASTE_COLLECTION' });
          const requestNumber = `COLL-${targetBinId}-${String(count + 1).padStart(3, '0')}`;

          const newCollReq = await ServiceRequest.create({
            requestNumber,
            userId: sysUserId,
            requestType: 'WASTE_COLLECTION',
            organizationName: `Smart Bin ${targetBinId}`,
            siteName: `Smart Bin ${targetBinId} (Main Campus)`,
            contactPerson: 'IoT Fill-Level Telemetry Monitor',
            phone: '+92 300 0000000',
            email: 'iot-logistics@greengold.org',
            address: 'Riphah International University, Sector I-14',
            town: 'I-14',
            city: 'Islamabad',
            wasteType: 'Municipal Solid Waste / Recyclables',
            weightKg: numWeight > 0 ? numWeight : 7.5,
            numberOfBins: 1,
            binType: 'Waste Collection Pickup',
            notes: `[AUTO-DISPATCH] Bin reached ${numFill}% fill level (${numWeight} kg). Immediate pickup needed by Waste Collector.`,
            priority: 'Urgent',
            status: 'WAITING_COLLECTION',
            requiredWorkers: 1
          });

          generatedRequestId = newCollReq._id;
          generatedRequestType = 'WASTE_COLLECTION_REQUEST';

          console.log(`♻️ [IoT -> Management Auto-Call] Waste Collection Request Created: ${requestNumber}`);

          // Send notification to Management
          const mgmtUsers = await User.find({ role: 'MANAGEMENT' }).select('_id');
          for (const mgmt of mgmtUsers) {
            await Notification.create({
              recipientId: mgmt._id,
              type: 'BIN_FULL_ALERT',
              title: `♻️ Bin Full Alert: ${targetBinId}`,
              message: `Smart Bin ${targetBinId} is FULL at ${numFill}% capacity. Please assign a Waste Collector from the Logistics Queue.`,
              relatedRequestId: newCollReq._id
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[IoT Waste Collection Request Error]:', err.message);
      }
    }

    return res.json({
      success: true,
      message: 'Telemetry received and processed successfully',
      telemetry: telemetryData,
      generatedRequestId,
      generatedRequestType,
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

// 4. POST /api/iot/reset-requests - Clear stale requests for a fresh clean test
router.post('/reset-requests', async (req, res) => {
  try {
    await ServiceRequest.deleteMany({
      $or: [
        { requestType: 'WASTE_COLLECTION' },
        { organizationName: { $regex: /BIN-|Smart Bin|Maintenance Fault/i } },
        { siteName: { $regex: /BIN-|Smart Bin/i } },
        { description: { $regex: /IOT ALERT/i } },
        { notes: { $regex: /AUTO-DISPATCH/i } }
      ]
    });
    await CollectorAssignment.deleteMany({});
    await Notification.deleteMany({
      $or: [
        { type: 'BIN_FULL_ALERT' },
        { type: 'MAINTENANCE_ALERT' }
      ]
    });
    await User.updateMany({ role: 'COLLECTOR' }, { workerStatus: 'IDLE' });

    return res.json({ success: true, message: 'All previous IoT test requests and assignments cleared successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
