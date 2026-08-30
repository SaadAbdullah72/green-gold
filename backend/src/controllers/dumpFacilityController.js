import { DumpRecord } from '../models/DumpRecord.js';
import { TransportJob } from '../models/TransportJob.js';
import { User } from '../models/User.js';
import { ServiceRequest } from '../models/ServiceRequest.js';

// 1. GET ALL DUMP RECORDS AT CENTRAL YARD
export const getDumpFacilityRecords = async (req, res) => {
  try {
    const { status, wasteType, area } = req.query;
    const query = {};
    if (status) query.status = status;
    if (wasteType) query.wasteType = wasteType;
    if (area) {
      query.$or = [
        { town: { $regex: new RegExp(area, 'i') } },
        { address: { $regex: new RegExp(area, 'i') } },
        { organizationName: { $regex: new RegExp(area, 'i') } }
      ];
    }

    const records = await DumpRecord.find(query)
      .populate('collectorId', 'fullName phone employeeId vehicleNumber')
      .populate('userId', 'fullName email organizationName')
      .sort({ dumpedAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: records.length,
      records: records.map(r => ({
        id: r._id,
        _id: r._id,
        organizationName: r.organizationName,
        clientCode: r.clientCode || 'CLIENT-01',
        binId: r.binId,
        address: r.address,
        town: r.town,
        city: r.city,
        weightKg: r.weightKg,
        wasteType: r.wasteType,
        isSeparated: r.isSeparated,
        separatedType: r.separatedType,
        separatedAt: r.separatedAt,
        status: r.status,
        dumpedAt: r.dumpedAt,
        collectorName: r.collectorId?.fullName || 'Waste Collector',
        collectorPhone: r.collectorId?.phone || '',
        collectorVehicle: r.collectorId?.vehicleNumber || '',
        notes: r.notes
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET AREA-WISE SEPARATED ANALYTICS & LOGS
export const getDumpFacilityAnalytics = async (req, res) => {
  try {
    const records = await DumpRecord.find({})
      .populate('collectorId', 'fullName phone employeeId vehicleNumber')
      .sort({ dumpedAt: -1 })
      .lean();

    // Dynamically discover all active sites from ServiceRequests and enrolled Users
    const activeRequests = await ServiceRequest.find({
      requestType: 'BIN_DEPLOYMENT',
      status: { $nin: ['DECLINED', 'CANCELLED'] }
    }).lean();

    const enrolledUsers = await User.find({ role: 'USER', isActive: true })
      .select('fullName organizationName address town city phone email')
      .lean();

    // Map sites / areas
    const siteMap = {};

    // 1. Seed from active service requests
    activeRequests.forEach((ar, idx) => {
      let displayName = ar.organizationName;
      if (!displayName || displayName === 'Customer Portal' || displayName === 'Client Site') {
        displayName = ar.contactPerson ? `${ar.contactPerson}'s Facility` : (ar.town ? `Site ${ar.town}` : `Client Site #${idx + 1}`);
      }
      const siteKey = String(ar._id);

      siteMap[siteKey] = {
        siteId: siteKey,
        siteName: displayName,
        organizationName: displayName,
        contactPerson: ar.contactPerson || '',
        phone: ar.phone || '',
        address: ar.address || 'Main Placement Location',
        town: ar.town || 'Islamabad',
        city: ar.city || 'Islamabad',
        binIds: ar.deployedBinIds || [`BIN-0${idx + 1}-01`],
        totalKg: 0,
        plasticKg: 0,
        metalKg: 0,
        organicKg: 0,
        mixedKg: 0,
        recordsCount: 0,
        inflowHistory: []
      };
    });

    // 2. Seed from enrolled users if not already present
    enrolledUsers.forEach((u, uIdx) => {
      const uName = u.organizationName || u.fullName || `Customer Facility #${uIdx + 1}`;
      const exists = Object.values(siteMap).some(s => s.organizationName.toLowerCase() === uName.toLowerCase() || s.contactPerson.toLowerCase() === u.fullName.toLowerCase());
      if (!exists) {
        const uKey = String(u._id);
        siteMap[uKey] = {
          siteId: uKey,
          siteName: uName,
          organizationName: uName,
          contactPerson: u.fullName,
          phone: u.phone,
          address: u.address || 'Islamabad',
          town: u.town || 'Islamabad',
          city: u.city || 'Islamabad',
          binIds: [`BIN-0${uIdx + 1}-01`],
          totalKg: 0,
          plasticKg: 0,
          metalKg: 0,
          organicKg: 0,
          mixedKg: 0,
          recordsCount: 0,
          inflowHistory: []
        };
      }
    });

    // 3. Fallback default well-known sites if database is fresh
    if (Object.keys(siteMap).length === 0) {
      siteMap['site_g5'] = {
        siteId: 'site_g5',
        siteName: 'Serena Hotel Islamabad',
        organizationName: 'Serena Hotel Islamabad',
        contactPerson: 'Operations Directorate',
        phone: '+92 51 111133133',
        address: 'Club Road, Sector G-5',
        town: 'Sector G-5',
        city: 'Islamabad',
        binIds: ['BIN-01-01', 'BIN-02-01', 'BIN-03-01'],
        totalKg: 0,
        plasticKg: 0,
        metalKg: 0,
        organicKg: 0,
        mixedKg: 0,
        recordsCount: 0,
        inflowHistory: []
      };
      siteMap['site_e9'] = {
        siteId: 'site_e9',
        siteName: 'PAF Complex Sector E-9',
        organizationName: 'PAF Complex Sector E-9',
        contactPerson: 'Estate Officer',
        phone: '+92 51 9260000',
        address: 'Sector E-9 Campus',
        town: 'Sector E-9',
        city: 'Islamabad',
        binIds: ['BIN-01-02', 'BIN-02-02', 'BIN-03-02'],
        totalKg: 0,
        plasticKg: 0,
        metalKg: 0,
        organicKg: 0,
        mixedKg: 0,
        recordsCount: 0,
        inflowHistory: []
      };
      siteMap['site_bt7'] = {
        siteId: 'site_bt7',
        siteName: 'Bahria Town Phase 7 Commercial Hub',
        organizationName: 'Bahria Town Phase 7',
        contactPerson: 'Facility Supervisor',
        phone: '+92 51 5730100',
        address: 'Wilayat Complex, Phase 7',
        town: 'Bahria Town',
        city: 'Rawalpindi',
        binIds: ['BIN-01-03', 'BIN-02-03', 'BIN-03-03'],
        totalKg: 0,
        plasticKg: 0,
        metalKg: 0,
        organicKg: 0,
        mixedKg: 0,
        recordsCount: 0,
        inflowHistory: []
      };
    }

    // 4. Map dump records to their respective sites
    records.forEach(r => {
      const rOrg = (r.organizationName || '').toLowerCase();
      const rTown = (r.town || '').toLowerCase();
      const rAddr = (r.address || '').toLowerCase();

      // Find best matching site
      let matchedSite = Object.values(siteMap).find(s => 
        (rOrg && s.organizationName.toLowerCase().includes(rOrg)) ||
        (rTown && s.town.toLowerCase().includes(rTown)) ||
        (rAddr && s.address.toLowerCase().includes(rAddr))
      );

      // If no match, create a site entry for this record's origin
      if (!matchedSite) {
        const genKey = `site_${r.organizationName || r.town || 'hub'}`;
        siteMap[genKey] = {
          siteId: genKey,
          siteName: r.organizationName || (r.town ? `Site ${r.town}` : 'Client Site'),
          organizationName: r.organizationName || 'Client Site',
          contactPerson: 'Site Manager',
          phone: '',
          address: r.address || '',
          town: r.town || '',
          city: r.city || 'Islamabad',
          binIds: [r.binId || 'BIN-01-01'],
          totalKg: 0,
          plasticKg: 0,
          metalKg: 0,
          organicKg: 0,
          mixedKg: 0,
          recordsCount: 0,
          inflowHistory: []
        };
        matchedSite = siteMap[genKey];
      }

      const w = Number(r.weightKg || 0);
      const wt = (r.wasteType || r.separatedType || '').toLowerCase();

      matchedSite.totalKg = Number((matchedSite.totalKg + w).toFixed(2));
      matchedSite.recordsCount += 1;

      if (wt.includes('plastic')) {
        matchedSite.plasticKg = Number((matchedSite.plasticKg + w).toFixed(2));
      } else if (wt.includes('metal')) {
        matchedSite.metalKg = Number((matchedSite.metalKg + w).toFixed(2));
      } else if (wt.includes('organic') || wt.includes('compost')) {
        matchedSite.organicKg = Number((matchedSite.organicKg + w).toFixed(2));
      } else {
        matchedSite.mixedKg = Number((matchedSite.mixedKg + w).toFixed(2));
      }

      matchedSite.inflowHistory.push({
        id: r._id,
        _id: r._id,
        date: r.dumpedAt,
        organizationName: r.organizationName,
        binId: r.binId,
        address: r.address,
        town: r.town,
        weightKg: r.weightKg,
        wasteType: r.wasteType,
        status: r.status,
        collectorName: r.collectorId?.fullName || 'Waste Collector Driver',
        collectorVehicle: r.collectorId?.vehicleNumber || 'ICT-GRN-9901'
      });
    });

    // Compute Global Totals
    let globalTotalKg = 0;
    let globalPlasticKg = 0;
    let globalMetalKg = 0;
    let globalOrganicKg = 0;
    let globalMixedKg = 0;

    records.forEach(r => {
      const w = Number(r.weightKg || 0);
      const wt = (r.wasteType || r.separatedType || '').toLowerCase();
      globalTotalKg = Number((globalTotalKg + w).toFixed(2));

      if (wt.includes('plastic')) {
        globalPlasticKg = Number((globalPlasticKg + w).toFixed(2));
      } else if (wt.includes('metal')) {
        globalMetalKg = Number((globalMetalKg + w).toFixed(2));
      } else if (wt.includes('organic') || wt.includes('compost')) {
        globalOrganicKg = Number((globalOrganicKg + w).toFixed(2));
      } else {
        globalMixedKg = Number((globalMixedKg + w).toFixed(2));
      }
    });

    return res.json({
      success: true,
      totals: {
        totalDumpedKg: globalTotalKg,
        totalPlasticKg: globalPlasticKg,
        totalMetalKg: globalMetalKg,
        totalOrganicKg: globalOrganicKg,
        totalMixedKg: globalMixedKg,
        totalBatches: records.length,
        readyForTransportKg: Number(records.filter(r => r.status === 'DUMPED' || r.status === 'SEPARATED').reduce((s, r) => s + (r.weightKg || 0), 0).toFixed(2)),
        inTransitKg: Number(records.filter(r => r.status === 'ASSIGNED_TRANSPORT' || r.status === 'IN_TRANSIT').reduce((s, r) => s + (r.weightKg || 0), 0).toFixed(2)),
        deliveredToPlantsKg: Number(records.filter(r => r.status === 'DELIVERED' || r.status === 'PROCESSED').reduce((s, r) => s + (r.weightKg || 0), 0).toFixed(2))
      },
      sites: Object.values(siteMap),
      areas: Object.values(siteMap),
      records
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. SEPARATE WASTE AT DUMP YARD
export const separateDumpFacilityRecords = async (req, res) => {
  try {
    const { dumpRecordIds, separatedType, notes } = req.body;
    if (!dumpRecordIds || !Array.isArray(dumpRecordIds) || dumpRecordIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one dump batch to separate.' });
    }

    await DumpRecord.updateMany(
      { _id: { $in: dumpRecordIds } },
      {
        isSeparated: true,
        separatedAt: new Date(),
        separatedType: separatedType || 'Organic/Compost',
        wasteType: separatedType || 'Organic/Compost',
        status: 'SEPARATED',
        notes: notes ? `Separated at Yard into ${separatedType}: ${notes}` : `Separated at Yard into ${separatedType}`
      }
    );

    return res.json({
      success: true,
      message: `Successfully separated ${dumpRecordIds.length} batch(es) into ${separatedType} waste stream.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. GET AVAILABLE TRANSPORTERS FOR YARD DISPATCH
export const getDumpFacilityTransporters = async (req, res) => {
  try {
    const transporters = await User.find({ role: 'TRANSPORTER', isActive: true })
      .select('fullName email phone vehicleNumber workerStatus employeeId department')
      .lean();

    return res.json({ success: true, count: transporters.length, transporters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET RECYCLING PLANTS FOR YARD DISPATCH (WITH EXACT GPS COORDINATES)
export const getDumpFacilityRecyclingPlants = async (req, res) => {
  try {
    const plants = await User.find({ role: 'RECYCLING_PLANT', isActive: true })
      .select('fullName email phone organizationName address plantType plantCapacityTons employeeId lat lng')
      .lean();

    // Ensure GPS coordinates are populated
    const plantsWithCoords = plants.map(p => {
      let lat = p.lat;
      let lng = p.lng;
      const pt = (p.plantType || '').toLowerCase();
      if (!lat || !lng) {
        if (pt.includes('plastic')) {
          lat = 33.5684;
          lng = 73.1610;
        } else if (pt.includes('metal')) {
          lat = 33.6512;
          lng = 73.0321;
        } else {
          lat = 33.6628;
          lng = 73.0489;
        }
      }
      return {
        ...p,
        lat,
        lng,
        coords: [lat, lng]
      };
    });

    return res.json({ success: true, count: plantsWithCoords.length, plants: plantsWithCoords });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. DISPATCH TRANSPORTER WITH SEPARATED WASTE TO SPECIFIC RECYCLING PLANT
export const dispatchTransporterFromYard = async (req, res) => {
  try {
    const { dumpRecordIds, transporterId, recyclingPlantId, notes } = req.body;

    if (!dumpRecordIds || !Array.isArray(dumpRecordIds) || dumpRecordIds.length === 0 || !transporterId || !recyclingPlantId) {
      return res.status(400).json({
        success: false,
        message: 'Please select dump records, an assigned transporter, and a destination recycling plant.'
      });
    }

    const transporter = await User.findById(transporterId);
    const plant = await User.findById(recyclingPlantId);
    const dumps = await DumpRecord.find({ _id: { $in: dumpRecordIds } });

    if (!transporter || !plant) {
      return res.status(404).json({ success: false, message: 'Transporter or Recycling Plant not found.' });
    }

    const totalWeightKg = Number(dumps.reduce((sum, d) => sum + (d.weightKg || 0), 0).toFixed(2));
    const wasteType = dumps[0]?.wasteType || dumps[0]?.separatedType || plant.plantType || 'Organic/Compost';

    const pt = (plant.plantType || wasteType).toLowerCase();
    const destLat = plant.lat || (pt.includes('plastic') ? 33.5684 : pt.includes('metal') ? 33.6512 : 33.6628);
    const destLng = plant.lng || (pt.includes('plastic') ? 73.1610 : pt.includes('metal') ? 73.0321 : 73.0489);

    const jobCount = await TransportJob.countDocuments();
    const jobCode = `DUMP-LOG-${String(jobCount + 101).padStart(4, '0')}`;

    const job = await TransportJob.create({
      jobCode,
      transporterId: transporter._id,
      assignedBy: req.user._id,
      dumpRecordIds: dumps.map(d => d._id),
      recyclingPlantId: plant._id,
      plantName: plant.organizationName || plant.fullName,
      plantAddress: plant.address || 'Industrial Area, Sector I-9, Islamabad',
      plantType: plant.plantType || wasteType,
      totalWeightKg: totalWeightKg > 0 ? totalWeightKg : 10.0,
      wasteType,
      originSite: 'Capital Green Central Dump Facility (Sector I-9/1)',
      originCoords: [33.6660, 73.0410],
      destinationCoords: [destLat, destLng],
      vehicleNumber: transporter.vehicleNumber || 'ICT-TRN-1001',
      status: 'ASSIGNED',
      notes: notes ? `[Dispatched from Central Yard] ${notes}` : `Dispatched from Central Yard to ${plant.organizationName}`,
      assignedAt: new Date()
    });

    // Update Dump records to ASSIGNED_TRANSPORT
    await DumpRecord.updateMany(
      { _id: { $in: dumpRecordIds } },
      { status: 'ASSIGNED_TRANSPORT' }
    );

    // Update Transporter status
    await User.findByIdAndUpdate(transporter._id, { workerStatus: 'ASSIGNED' });

    return res.status(201).json({
      success: true,
      message: `Transport Job ${jobCode} (${totalWeightKg} kg of ${wasteType}) assigned to ${transporter.fullName} destined for ${plant.organizationName || plant.fullName}.`,
      job
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. GET ALL DISPATCHED TRANSPORT JOBS FROM YARD
export const getDumpFacilityTransportJobs = async (req, res) => {
  try {
    const jobs = await TransportJob.find({})
      .populate('transporterId', 'fullName phone vehicleNumber')
      .populate('recyclingPlantId', 'fullName organizationName address plantType lat lng')
      .populate('dumpRecordIds')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: jobs.length,
      jobs: jobs.map(j => ({
        id: j._id,
        _id: j._id,
        jobCode: j.jobCode,
        transporterName: j.transporterId?.fullName || 'Transporter',
        transporterPhone: j.transporterId?.phone || '',
        vehicleNumber: j.transporterId?.vehicleNumber || j.vehicleNumber,
        plantName: j.plantName || j.recyclingPlantId?.organizationName || j.recyclingPlantId?.fullName,
        plantAddress: j.plantAddress || j.recyclingPlantId?.address,
        plantType: j.plantType,
        totalWeightKg: j.totalWeightKg,
        wasteType: j.wasteType,
        originSite: j.originSite || 'Capital Green Central Dump Facility (Sector I-9/1)',
        originCoords: j.originCoords && j.originCoords.length === 2 ? j.originCoords : [33.6660, 73.0410],
        destinationCoords: j.destinationCoords && j.destinationCoords.length === 2 ? j.destinationCoords : [33.6628, 73.0489],
        status: j.status,
        dumpRecordCount: j.dumpRecordIds?.length || 0,
        notes: j.notes,
        assignedAt: j.assignedAt,
        deliveredAt: j.deliveredAt,
        createdAt: j.createdAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
