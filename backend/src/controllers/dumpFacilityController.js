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

    // Dynamically discover all active sites from ServiceRequests and DumpRecords
    const activeRequests = await ServiceRequest.find({
      requestType: 'BIN_DEPLOYMENT',
      status: { $nin: ['DECLINED', 'CANCELLED'] }
    }).lean();

    // Map areas
    const areaMap = {};

    // Seed areas from active requests
    activeRequests.forEach(ar => {
      const areaKey = ar.town || ar.organizationName || 'Main Campus';
      if (!areaMap[areaKey]) {
        areaMap[areaKey] = {
          areaName: areaKey,
          organizationName: ar.organizationName,
          address: ar.address || '',
          town: ar.town || '',
          city: ar.city || 'Islamabad',
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

    // Populate with actual dump records
    records.forEach(r => {
      const areaKey = r.town || r.organizationName || 'Central Hub';
      if (!areaMap[areaKey]) {
        areaMap[areaKey] = {
          areaName: areaKey,
          organizationName: r.organizationName,
          address: r.address || '',
          town: r.town || '',
          city: r.city || 'Islamabad',
          totalKg: 0,
          plasticKg: 0,
          metalKg: 0,
          organicKg: 0,
          mixedKg: 0,
          recordsCount: 0,
          inflowHistory: []
        };
      }

      const w = Number(r.weightKg || 0);
      const wt = (r.wasteType || r.separatedType || '').toLowerCase();

      areaMap[areaKey].totalKg = Number((areaMap[areaKey].totalKg + w).toFixed(2));
      areaMap[areaKey].recordsCount += 1;

      if (wt.includes('plastic')) {
        areaMap[areaKey].plasticKg = Number((areaMap[areaKey].plasticKg + w).toFixed(2));
      } else if (wt.includes('metal')) {
        areaMap[areaKey].metalKg = Number((areaMap[areaKey].metalKg + w).toFixed(2));
      } else if (wt.includes('organic') || wt.includes('compost')) {
        areaMap[areaKey].organicKg = Number((areaMap[areaKey].organicKg + w).toFixed(2));
      } else {
        areaMap[areaKey].mixedKg = Number((areaMap[areaKey].mixedKg + w).toFixed(2));
      }

      areaMap[areaKey].inflowHistory.push({
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
        collectorVehicle: r.collectorId?.vehicleNumber || 'ICT-GRN'
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
        readyForTransportKg: records.filter(r => r.status === 'DUMPED' || r.status === 'SEPARATED').reduce((s, r) => s + (r.weightKg || 0), 0),
        inTransitKg: records.filter(r => r.status === 'ASSIGNED_TRANSPORT' || r.status === 'IN_TRANSIT').reduce((s, r) => s + (r.weightKg || 0), 0),
        deliveredToPlantsKg: records.filter(r => r.status === 'DELIVERED' || r.status === 'PROCESSED').reduce((s, r) => s + (r.weightKg || 0), 0)
      },
      areas: Object.values(areaMap),
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

// 5. GET RECYCLING PLANTS FOR YARD DISPATCH
export const getDumpFacilityRecyclingPlants = async (req, res) => {
  try {
    const plants = await User.find({ role: 'RECYCLING_PLANT', isActive: true })
      .select('fullName email phone organizationName address plantType plantCapacityTons employeeId')
      .lean();

    return res.json({ success: true, count: plants.length, plants });
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
      .populate('recyclingPlantId', 'fullName organizationName address plantType')
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
