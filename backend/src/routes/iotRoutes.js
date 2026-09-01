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

// 0. GET Active / Deployed Smart Bins Endpoint for Proteus Bridge & External Systems
// GET /api/iot/active-bins
router.get('/active-bins', async (req, res) => {
  try {
    const sites = await ServiceRequest.find({
      requestType: 'BIN_DEPLOYMENT',
      status: { $nin: ['DECLINED', 'CANCELLED'] }
    }).sort({ createdAt: 1 }).lean();

    const binList = [];
    sites.forEach((site, sIdx) => {
      const clientIdx = site.clientIndex || (sIdx + 1);
      const clientStr = String(clientIdx).padStart(2, '0');
      const binIds = (site.deployedBinIds && site.deployedBinIds.length > 0)
        ? site.deployedBinIds
        : [`BIN-${clientStr}-01`];
      
      const coords = site.location?.coordinates || [73.0479, 33.6844];

      binIds.forEach(bId => {
        binList.push({
          binId: bId,
          clientIndex: clientIdx,
          organizationName: site.organizationName,
          contactPerson: site.contactPerson,
          phone: site.phone,
          address: site.address,
          town: site.town,
          city: site.city || 'Islamabad',
          lat: coords[1],
          lng: coords[0],
          status: site.status === 'Completed' ? 'ACTIVE' : site.status
        });
      });
    });

    return res.json({
      success: true,
      count: binList.length,
      bins: binList
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

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
      event,
      wasteType: incomingWasteType,
      serviceArea,
      facilityName
    } = req.body;

    // Resolve waste type: from Proteus payload, or infer from BIN-{code} pattern
    let resolvedWasteType = incomingWasteType || 'Municipal Solid Waste / Recyclables';
    if (!incomingWasteType && binId) {
      const typeMatch = binId.match(/BIN-(\d+)/i);
      if (typeMatch) {
        const tc = typeMatch[1];
        if (tc === '01') resolvedWasteType = 'Metal';
        else if (tc === '02') resolvedWasteType = 'Plastic';
        else if (tc === '03') resolvedWasteType = 'Organic/Compost';
      }
    }

    const targetBinId = binId || 'BIN-01-01';
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

    // 100% Dynamic Database Lookup for Real Active Client Site Allotment
    const activeSitesList = await ServiceRequest.find({
      requestType: 'BIN_DEPLOYMENT',
      status: { $in: ['COMPLETED', 'Completed'] }
    }).sort({ createdAt: 1 }).lean().catch(() => []);

    const binFormatMatch = targetBinId.match(/BIN-(\d+)-(\d+)/i);
    let matchedSite = null;

    if (binFormatMatch) {
      const streamCode = binFormatMatch[1];
      const siteIndex = parseInt(binFormatMatch[2], 10);
      if (streamCode === '01') resolvedWasteType = 'Metal';
      else if (streamCode === '02') resolvedWasteType = 'Plastic';
      else if (streamCode === '03') resolvedWasteType = 'Organic/Compost';

      if (activeSitesList && siteIndex > 0 && siteIndex <= activeSitesList.length) {
        matchedSite = activeSitesList[siteIndex - 1];
      }
    }

    if (!matchedSite && activeSitesList.length > 0) {
      matchedSite = activeSitesList.find(s => 
        (s.deployedBinIds && s.deployedBinIds.includes(targetBinId)) ||
        (s.binPrefix && targetBinId.startsWith(s.binPrefix))
      ) || activeSitesList[0];
    }

    let siteName = `Smart Bin ${targetBinId}`;
    let orgName = `Smart Bin Facility (${targetBinId})`;
    let siteAddress = 'Saddar, Rawalpindi';
    let siteTown = 'Saddar';
    let siteCity = 'Islamabad';
    let siteContactPerson = 'Site Operations Incharge';
    let sitePhone = '+92 300 1234567';
    let siteEmail = 'iot-logistics@greengold.org';
    let siteLat = lat || 33.5954;
    let siteLng = lng || 73.0512;

    if (matchedSite) {
      orgName = matchedSite.organizationName || orgName;
      siteName = `${matchedSite.organizationName} (${targetBinId})`;
      siteAddress = matchedSite.address || siteAddress;
      siteTown = matchedSite.town || siteTown;
      siteCity = matchedSite.city || siteCity;
      siteContactPerson = matchedSite.contactPerson || siteContactPerson;
      sitePhone = matchedSite.phone || sitePhone;
      siteEmail = matchedSite.email || siteEmail;
      if (matchedSite.location?.coordinates && matchedSite.location.coordinates.length === 2) {
        siteLng = matchedSite.location.coordinates[0];
        siteLat = matchedSite.location.coordinates[1];
      }
    }

    const telemetryData = {
      binId: targetBinId,
      weightKg: numWeight,
      fillLevel: numFill,
      maintenance: isMaintenance,
      faultReason: isMaintenance ? (faultReason || 'Sensor/Lid Malfunction') : null,
      gasPpm: numGas,
      status: status || computedStatus,
      locationName: siteName,
      organizationName: orgName,
      address: siteAddress,
      town: siteTown,
      city: siteCity,
      lat: siteLat,
      lng: siteLng,
      rfidLastScanned: rfidTag || null,
      lastUpdated: new Date().toISOString(),
      event: event || defaultEvent,
      wasteType: resolvedWasteType,
      serviceArea: serviceArea || null
    };

    liveBinTelemetry[targetBinId] = telemetryData;
    console.log(`[IoT Telemetry Ingest] ${targetBinId} (${orgName}) -> Fill: ${numFill}%, Weight: ${numWeight}kg, Status: ${telemetryData.status}`);

    let generatedRequestId = null;
    let generatedRequestType = null;

    // =========================================================================
    // 1. AUTOMATED MAINTENANCE CALL -> MANAGEMENT SERVICE REQUEST (TECHNICAL)
    // =========================================================================
    if (isMaintenance) {
      try {
        const existingMaintenanceReq = await ServiceRequest.findOne({
          $or: [
            { organizationName: { $regex: new RegExp(targetBinId, 'i') } },
            { description: { $regex: new RegExp(targetBinId, 'i') } }
          ],
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
            organizationName: `${orgName} (Maintenance Fault - ${targetBinId})`,
            contactPerson: 'IoT Autonomous Diagnostic System',
            phone: '+92 300 0000000',
            email: 'iot-alerts@greengold.org',
            address: siteAddress,
            town: siteTown,
            city: siteCity,
            location: {
              type: 'Point',
              coordinates: [siteLng, siteLat]
            },
            numberOfBins: 1,
            binType: 'IoT Ultrasonic Smart Bin (240L)',
            description: `[CRITICAL IOT ALERT] Smart Bin ${targetBinId} at ${orgName} requires urgent maintenance: ${faultReason || 'Lid Jammed / Tilt Sensor Triggered'}. Please assign a Technical Team member to inspect and resolve.`,
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
              message: `Proteus Smart Bin ${targetBinId} at ${orgName} reported a fault (${faultReason || 'Lid Jammed'}). Assigned to Technical Queue.`,
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
            { notes: { $regex: new RegExp(targetBinId, 'i') } }
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
            organizationName: orgName,
            siteName: siteName,
            contactPerson: 'IoT Fill-Level Telemetry Monitor',
            phone: '+92 300 0000000',
            email: 'iot-logistics@greengold.org',
            address: siteAddress,
            town: siteTown,
            city: siteCity,
            location: {
              type: 'Point',
              coordinates: [siteLng, siteLat]
            },
            wasteType: resolvedWasteType,
            weightKg: numWeight > 0 ? numWeight : 7.5,
            numberOfBins: 1,
            binType: `${resolvedWasteType} Waste Collection Pickup`,
            notes: `[AUTO-DISPATCH] Smart Bin ${targetBinId} (${resolvedWasteType} Bin) reached ${numFill}% fill level (${numWeight} kg). Immediate ${resolvedWasteType} waste pickup needed by Waste Collector at ${siteAddress}, ${siteTown}.`,
            priority: 'Urgent',
            status: 'WAITING_COLLECTION',
            requiredWorkers: 1
          });

          generatedRequestId = newCollReq._id;
          generatedRequestType = 'WASTE_COLLECTION_REQUEST';

          console.log(`♻️ [IoT -> Management Auto-Call] Waste Collection Request Created: ${requestNumber} for ${orgName}`);

          // Send notification to Management
          const mgmtUsers = await User.find({ role: 'MANAGEMENT' }).select('_id');
          for (const mgmt of mgmtUsers) {
            await Notification.create({
              recipientId: mgmt._id,
              type: 'BIN_FULL_ALERT',
              title: `♻️ ${resolvedWasteType} Bin Full Alert: ${targetBinId} (${orgName})`,
              message: `${resolvedWasteType} Smart Bin ${targetBinId} at ${orgName} is FULL at ${numFill}% capacity (${numWeight} kg of ${resolvedWasteType} waste). Please assign a Waste Collector from the Logistics Queue.`,
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

// 5. GET /api/iot/public-stats - Public landing page stats (no auth required)
router.get('/public-stats', async (req, res) => {
  try {
    const { RecyclingReport } = await import('../models/RecyclingReport.js');
    const { DumpRecord } = await import('../models/DumpRecord.js');

    const [activeSites, recyclingReports, dumpRecords, wasteCollectionReqs] = await Promise.all([
      ServiceRequest.find({
        requestType: 'BIN_DEPLOYMENT',
        status: { $in: ['COMPLETED', 'Completed'] }
      }).lean().catch(() => []),
      RecyclingReport.find({}).lean().catch(() => []),
      DumpRecord.find({}).lean().catch(() => []),
      ServiceRequest.find({ requestType: 'WASTE_COLLECTION' }).lean().catch(() => [])
    ]);

    // Active bins count
    const activeBins = activeSites.reduce((sum, s) => sum + (s.numberOfBins || 1), 0);

    // Carbon credits from recycling reports
    const totalCarbonCredits = recyclingReports.reduce((sum, r) =>
      sum + Number(r.carbonCreditsGenerated || r.carbonCreditsMinted || 0), 0);

    // Total waste diverted from recycling reports
    const totalWasteKg = recyclingReports.reduce((sum, r) =>
      sum + Number(r.recycledWeightKg || r.inputWeightKg || 0), 0);

    // CO2 avoided
    const co2AvoidedMt = Number(((totalWasteKg * 0.001)).toFixed(3));

    // Pickup requests completed
    const completedPickups = wasteCollectionReqs.filter(r =>
      r.status === 'COMPLETED').length;

    // Active client sites
    const activeClients = activeSites.length;

    return res.json({
      success: true,
      stats: {
        activeBins,
        activeClients,
        totalCarbonCredits: Number(totalCarbonCredits.toFixed(2)),
        totalWasteKg: Math.round(totalWasteKg),
        co2AvoidedMt,
        completedPickups,
        recyclingBatches: recyclingReports.length
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
