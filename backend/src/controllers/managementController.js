import { ServiceRequest } from '../models/ServiceRequest.js';
import { User } from '../models/User.js';
import { JobAssignment } from '../models/JobAssignment.js';
import { CollectorAssignment } from '../models/CollectorAssignment.js';
import { DumpRecord } from '../models/DumpRecord.js';
import { TransportJob } from '../models/TransportJob.js';
import { RecyclingReport } from '../models/RecyclingReport.js';
import { AuditLog } from '../models/AuditLog.js';
import { calculateRequiredWorkers } from './requestController.js';
import { saveUsersToDisk } from '../config/persistence.js';

export const getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const rawRequests = await ServiceRequest.find(query).sort({ createdAt: -1 }).lean();

    const requests = await Promise.all(rawRequests.map(async (r) => {
      const assignments = await JobAssignment.find({ 
        requestId: r._id,
        status: { $nin: ['EXPIRED', 'DECLINED'] } 
      })
        .populate('workerId', 'fullName phone secondaryPhone employeeId workerStatus')
        .sort({ createdAt: -1 })
        .lean();
      
      const assignedWorkers = assignments.map(a => ({
        assignmentId: a._id,
        worker: a.workerId,
        status: a.status,
        responseDeadline: a.responseDeadline,
        declineReason: a.declineReason,
        delayReason: a.delayReason,
        acceptedAt: a.acceptedAt,
        completedAt: a.completedAt,
        binsAssigned: a.binsAssigned,
        binsCompleted: a.binsCompleted
      }));

      const completedCount = assignedWorkers.filter(w => w.status === 'COMPLETED').length;

      return {
        ...r,
        assignedWorkers,
        assignedWorkersCount: assignedWorkers.length,
        completedWorkersCount: completedCount
      };
    }));

    return res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCollectionQueue = async (req, res) => {
  try {
    const rawRequests = await ServiceRequest.find({ requestType: 'WASTE_COLLECTION' })
      .populate('assignedCollectorId', 'fullName email phone workerStatus')
      .sort({ createdAt: -1 })
      .lean();

    const requests = await Promise.all(rawRequests.map(async (item) => {
      let assignment = null;
      if (item.assignedCollectorId) {
        assignment = await CollectorAssignment.findOne({
          $or: [{ requestId: item._id }, { pickupId: item._id }]
        }).sort({ createdAt: -1 }).lean();
      }

      let dynamicStatus = 'Awaiting Partner';
      if (item.status === 'COMPLETED' || (assignment && assignment.status === 'COMPLETED')) {
        dynamicStatus = 'Completed';
      } else if (assignment && (assignment.status === 'IN_PROGRESS' || assignment.status === 'ACCEPTED')) {
        dynamicStatus = 'In Progress (On Route)';
      } else if (item.assignedCollectorId || (assignment && assignment.status === 'ASSIGNED')) {
        dynamicStatus = 'Assigned to Collector (Waiting for Response)';
      } else if (item.status === 'WAITING_COLLECTION') {
        dynamicStatus = 'Awaiting Partner';
      }

      return {
        id: item._id,
        _id: item._id,
        site: item.siteName || item.organizationName,
        wasteType: item.wasteType,
        weightKg: item.weightKg,
        collectedDate: item.collectedDate ? new Date(item.collectedDate).toISOString().slice(0, 10) : new Date(item.createdAt).toISOString().slice(0, 10),
        status: dynamicStatus,
        assignedCollectorName: item.assignedCollectorId ? item.assignedCollectorId.fullName : null,
        assignedPartner: item.assignedCollectorId || null,
        assignedCollector: item.assignedCollectorId || null,
        requestId: item._id,
        notes: item.notes || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    }));

    return res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const approveRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    request.status = 'ASSIGNING';
    request.requiredWorkers = calculateRequiredWorkers(request.numberOfBins);
    await request.save();

    return res.json({
      success: true,
      message: 'Request approved successfully',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const declineRequest = async (req, res) => {
  try {
    const { declineReason } = req.body;

    if (!declineReason || typeof declineReason !== 'string' || declineReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Decline reason is mandatory when declining a request'
      });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    request.status = 'DECLINED';
    request.declineReason = declineReason.trim();
    request.declinedAt = new Date();
    await request.save();

    return res.json({
      success: true,
      message: 'Request declined successfully',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTechnicalWorkers = async (req, res) => {
  try {
    const workers = await User.find({ role: 'TECHNICAL' }).select('-passwordHash');
    return res.json({ success: true, count: workers.length, workers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCollectors = async (req, res) => {
  try {
    const rawCollectors = await User.find({ role: 'COLLECTOR' }).select('-passwordHash').lean();
    
    const collectors = await Promise.all(rawCollectors.map(async (col) => {
      const activeCount = await CollectorAssignment.countDocuments({
        collectorId: col._id,
        status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'ACCEPTED'] }
      });

      return {
        ...col,
        activeTasksCount: activeCount,
        workerStatus: activeCount > 0 ? 'BUSY' : 'IDLE',
        status: activeCount > 0 ? 'BUSY' : 'IDLE'
      };
    }));

    return res.json({ success: true, count: collectors.length, collectors });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignCollectorToPickup = async (req, res) => {
  try {
    const { collectorId, pickupId, siteName, locationName, address, town, city, lat, lng, fillLevel, timeFullMinutes, urgency, binId, requestId } = req.body;

    if (!collectorId) {
      return res.status(400).json({ success: false, message: 'Please select a collector to assign.' });
    }

    const collector = await User.findById(collectorId);
    if (!collector || collector.role !== 'COLLECTOR') {
      return res.status(404).json({ success: false, message: 'Collector account not found.' });
    }

    const targetRequestId = requestId || pickupId;

    if (targetRequestId) {
      const targetRequest = await ServiceRequest.findById(targetRequestId).catch(() => null);
      if (targetRequest) {
        targetRequest.assignedCollectorId = collectorId;
        targetRequest.status = 'ROUTED_FOR_COLLECTION';
        await targetRequest.save();
      }
    }

    const assignment = await CollectorAssignment.findOneAndUpdate(
      { pickupId, collectorId },
      {
        collectorId,
        assignedBy: req.user?._id || null,
        pickupId,
        requestId: requestId || targetRequestId || null,
        siteName: siteName || 'Assigned Pickup',
        locationName: locationName || siteName || 'Management Assigned Route',
        address: address || 'Islamabad',
        town: town || 'F-7',
        city: city || 'Islamabad',
        lat: Number(lat) || 33.6844,
        lng: Number(lng) || 73.0479,
        fillLevel: Number(fillLevel) || 0,
        timeFullMinutes: Number(timeFullMinutes) || 0,
        urgency: urgency || 'Medium',
        binId: binId || pickupId,
        status: 'ASSIGNED'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(collectorId, { workerStatus: 'ASSIGNED' });

    return res.status(201).json({
      success: true,
      message: `${collector.fullName} assigned to pickup ${pickupId}.`,
      assignment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignJob = async (req, res) => {
  try {
    const { workerId, binsAssigned } = req.body;
    const { requestId } = req.params;

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Please specify a worker ID to assign' });
    }

    const assignedAt = new Date();
    const responseDeadline = new Date(assignedAt.getTime() + 5 * 60 * 1000);
    const binsQuota = binsAssigned ? parseInt(binsAssigned, 10) : 2;

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    const existingAssignment = await JobAssignment.findOne({ requestId, workerId });
    if (existingAssignment && existingAssignment.status !== 'DECLINED' && existingAssignment.status !== 'EXPIRED') {
      return res.status(400).json({ success: false, message: 'Worker is already assigned to this request.' });
    }

    const activeAssignmentsCount = await JobAssignment.countDocuments({
      requestId,
      status: { $nin: ['DECLINED', 'EXPIRED'] }
    });

    if (activeAssignmentsCount >= request.requiredWorkers) {
      return res.status(400).json({ success: false, message: `Cannot assign more workers. Maximum required workers (${request.requiredWorkers}) are already assigned or working.` });
    }

    request.status = 'ASSIGNED';
    request.assignedWorkersCount = activeAssignmentsCount + 1;
    await request.save();

    const job = await JobAssignment.create({
      requestId,
      workerId,
      assignedBy: req.user?._id || workerId,
      assignedAt,
      responseDeadline,
      status: 'ASSIGNED',
      binsAssigned: binsQuota
    });

    await User.findByIdAndUpdate(workerId, { workerStatus: 'ASSIGNED' });

    return res.status(201).json({
      success: true,
      message: `Job assigned to worker. Waiting for technical member confirmation (5-minute timer).`,
      responseDeadline,
      job
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveSites = async (req, res) => {
  try {
    const rawSites = await ServiceRequest.find({
      requestType: 'BIN_DEPLOYMENT',
      status: { $in: ['COMPLETED', 'Completed'] }
    }).sort({ createdAt: 1 }).lean();

    const sites = rawSites.map((site, idx) => {
      const clientIdx = site.clientIndex || (idx + 1);
      const clientStr = String(clientIdx).padStart(2, '0');
      const binPrefix = site.binPrefix || `BIN-${clientStr}`;
      const totalBins = site.numberOfBins || 1;
      
      let deployedBinIds = site.deployedBinIds;
      if (!deployedBinIds || deployedBinIds.length === 0) {
        deployedBinIds = [];
        for (let i = 1; i <= totalBins; i++) {
          deployedBinIds.push(`BIN-${clientStr}-${String(i).padStart(2, '0')}`);
        }
      }

      const coords = site.location?.coordinates || [73.0479, 33.6844];
      const lng = coords[0];
      const lat = coords[1];

      return {
        id: site._id,
        _id: site._id,
        requestNumber: site.requestNumber,
        clientIndex: clientIdx,
        clientCode: `CLIENT-${clientStr}`,
        binPrefix,
        deployedBinIds,
        organizationName: site.organizationName,
        contactPerson: site.contactPerson,
        phone: site.phone,
        email: site.email,
        address: site.address,
        town: site.town,
        city: site.city || 'Islamabad',
        lat,
        lng,
        numberOfBins: totalBins,
        binType: site.binType || 'IoT Ultrasonic Smart Bin (240L)',
        status: site.status === 'Completed' ? 'ACTIVE' : 'DEPLOYING',
        requestStatus: site.status,
        installedAt: site.installedAt || site.updatedAt || site.createdAt,
        createdAt: site.createdAt
      };
    });

    return res.json({
      success: true,
      count: sites.length,
      sites
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteActiveSite = async (req, res) => {
  try {
    const { id } = req.params;
    await ServiceRequest.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Active site removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// WASTE LIFECYCLE, SEPARATION & TRANSPORT
// ==========================================

export const getDumpRecords = async (req, res) => {
  try {
    const { status, wasteType } = req.query;
    const query = {};
    if (status) query.status = status;
    if (wasteType) query.wasteType = wasteType;

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
        notes: r.notes
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createManualDumpRecord = async (req, res) => {
  try {
    const { organizationName, clientCode, binId, weightKg, wasteType, address, town, city, notes } = req.body;
    if (!organizationName || !weightKg) {
      return res.status(400).json({ success: false, message: 'Organization name and weight (kg) are required.' });
    }

    const newRecord = await DumpRecord.create({
      collectorId: req.user._id,
      organizationName,
      clientCode: clientCode || 'CLIENT-01',
      binId: binId || 'BIN-01-01',
      weightKg: Number(weightKg),
      wasteType: wasteType || 'Organic/Compost',
      address: address || 'Islamabad',
      town: town || 'F-7',
      city: city || 'Islamabad',
      status: 'DUMPED',
      dumpedAt: new Date(),
      notes: notes || 'Direct yard weigh-in'
    });

    return res.status(201).json({ success: true, message: 'Dump record logged in Central Yard.', record: newRecord });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const separateDumpRecords = async (req, res) => {
  try {
    const { dumpRecordIds, separatedType, notes } = req.body;
    if (!dumpRecordIds || !Array.isArray(dumpRecordIds) || dumpRecordIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one dump record to separate.' });
    }

    await DumpRecord.updateMany(
      { _id: { $in: dumpRecordIds } },
      {
        isSeparated: true,
        separatedAt: new Date(),
        separatedType: separatedType || 'Organic/Compost',
        wasteType: separatedType || 'Organic/Compost',
        status: 'SEPARATED',
        notes: notes ? `Separated into ${separatedType}: ${notes}` : `Separated into ${separatedType}`
      }
    );

    return res.json({
      success: true,
      message: `Successfully classified ${dumpRecordIds.length} batches as ${separatedType || 'Organic/Compost'}. Ready for transporter dispatch.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransporters = async (req, res) => {
  try {
    const transporters = await User.find({ role: 'TRANSPORTER', isActive: true })
      .select('fullName email phone vehicleNumber workerStatus employeeId')
      .lean();

    return res.json({
      success: true,
      count: transporters.length,
      transporters: transporters.map(t => ({
        id: t._id,
        _id: t._id,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone,
        vehicleNumber: t.vehicleNumber || 'ICT-TRN-1001',
        workerStatus: t.workerStatus || 'IDLE',
        employeeId: t.employeeId || 'TRN-101'
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecyclingPlants = async (req, res) => {
  try {
    const plants = await User.find({ role: 'RECYCLING_PLANT', isActive: true })
      .select('fullName organizationName email phone address plantType plantCapacityTons')
      .lean();

    return res.json({
      success: true,
      count: plants.length,
      plants: plants.map(p => ({
        id: p._id,
        _id: p._id,
        name: p.organizationName || p.fullName,
        plantName: p.organizationName || p.fullName,
        email: p.email,
        phone: p.phone,
        address: p.address || 'Industrial Area I-9, Islamabad',
        plantType: p.plantType || 'Organic/Compost',
        capacityTons: p.plantCapacityTons || 50
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignTransportJob = async (req, res) => {
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
    const wasteType = dumps[0]?.wasteType || dumps[0]?.separatedType || 'Organic/Compost';

    const jobCount = await TransportJob.countDocuments();
    const jobCode = `LOG-JOB-${String(jobCount + 101).padStart(4, '0')}`;

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
      notes: notes || '',
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
      message: `Transport Job ${jobCode} assigned to ${transporter.fullName} destined for ${plant.organizationName || plant.fullName}.`,
      job
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTransportJobs = async (req, res) => {
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
        dumpRecords: j.dumpRecordIds || [],
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

export const getAllRecyclingReports = async (req, res) => {
  try {
    const reports = await RecyclingReport.find({})
      .populate('plantId', 'fullName organizationName address')
      .populate('transportJobId')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWasteTrackingOverview = async (req, res) => {
  try {
    const dumps = await DumpRecord.find({}).lean();
    const reports = await RecyclingReport.find({}).lean();

    // Aggregations per User / Organization
    const userMap = {};

    dumps.forEach(d => {
      const key = d.organizationName || 'General Client';
      if (!userMap[key]) {
        userMap[key] = {
          organizationName: key,
          clientCode: d.clientCode || 'CLIENT-01',
          totalDumpedKg: 0,
          totalRecycledKg: 0,
          totalCarbonCredits: 0,
          dumpBatchesCount: 0,
          types: {},
          lastDumpedAt: d.dumpedAt
        };
      }
      userMap[key].totalDumpedKg += (d.weightKg || 0);
      userMap[key].dumpBatchesCount += 1;
      const t = d.wasteType || 'Organic/Compost';
      userMap[key].types[t] = (userMap[key].types[t] || 0) + (d.weightKg || 0);
      if (new Date(d.dumpedAt) > new Date(userMap[key].lastDumpedAt)) {
        userMap[key].lastDumpedAt = d.dumpedAt;
      }
    });

    // Merge in recycling report contributions
    reports.forEach(r => {
      if (r.userContributions && Array.isArray(r.userContributions)) {
        r.userContributions.forEach(uc => {
          const key = uc.organizationName || 'General Client';
          if (userMap[key]) {
            userMap[key].totalRecycledKg += (uc.recycledKg || 0);
            userMap[key].totalCarbonCredits += (uc.carbonCreditsEarned || 0);
          }
        });
      }
    });

    const userSummaries = Object.values(userMap).map(u => ({
      ...u,
      totalDumpedKg: Number(u.totalDumpedKg.toFixed(2)),
      totalRecycledKg: Number(u.totalRecycledKg.toFixed(2)),
      totalCarbonCredits: Number(u.totalCarbonCredits.toFixed(2)),
      recyclingRatePercent: u.totalDumpedKg > 0 ? Number(((u.totalRecycledKg / u.totalDumpedKg) * 100).toFixed(1)) : 0
    }));

    const totalDumpsKg = dumps.reduce((sum, d) => sum + (d.weightKg || 0), 0);
    const totalRecycledKg = reports.reduce((sum, r) => sum + (r.recycledWeightKg || 0), 0);
    const totalCarbonCredits = reports.reduce((sum, r) => sum + (r.carbonCreditsGenerated || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalDumpsKg: Number(totalDumpsKg.toFixed(2)),
        totalRecycledKg: Number(totalRecycledKg.toFixed(2)),
        totalCarbonCredits: Number(totalCarbonCredits.toFixed(2)),
        activeDumpBatches: dumps.filter(d => d.status === 'DUMPED' || d.status === 'SEPARATED').length,
        inTransitBatches: dumps.filter(d => d.status === 'IN_TRANSIT').length,
        processedBatches: dumps.filter(d => d.status === 'PROCESSED').length
      },
      userSummaries
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// COMPLETE CASCADE USER PURGE & GRANULAR DELETION
// ==========================================

// Complete System-Wide User & Record Purge
export const purgeUserAndData = async (req, res) => {
  try {
    const { id } = req.params; // Can be user _id, site _id, or request _id

    let targetUserId = null;
    let targetOrgName = null;
    let targetBinIds = [];

    // 1. Check if ID is a User
    const user = await User.findById(id).catch(() => null);
    if (user) {
      targetUserId = user._id;
      targetOrgName = user.organizationName || user.fullName;
    }

    // 2. Check if ID is a ServiceRequest
    const sReq = await ServiceRequest.findById(id).catch(() => null);
    if (sReq) {
      targetUserId = targetUserId || sReq.userId;
      targetOrgName = targetOrgName || sReq.organizationName;
      targetBinIds = sReq.deployedBinIds || [];
    }

    const queryFilters = [];
    if (targetUserId) queryFilters.push({ userId: targetUserId });
    if (targetOrgName) queryFilters.push({ organizationName: new RegExp(`^${targetOrgName}$`, 'i') });
    if (targetBinIds.length > 0) queryFilters.push({ binId: { $in: targetBinIds } });

    // Cascade 1: Delete Service Requests
    await ServiceRequest.deleteMany({
      $or: [
        { _id: id },
        ...(targetUserId ? [{ userId: targetUserId }] : []),
        ...(targetOrgName ? [{ organizationName: new RegExp(`^${targetOrgName}$`, 'i') }] : [])
      ]
    });

    // Cascade 2: Delete Collector Assignments
    await CollectorAssignment.deleteMany({
      $or: [
        { requestId: id },
        ...(targetOrgName ? [{ siteName: new RegExp(`^${targetOrgName}$`, 'i') }] : []),
        ...(targetBinIds.length > 0 ? [{ binId: { $in: targetBinIds } }] : [])
      ]
    });

    // Cascade 3: Delete Dump Records
    await DumpRecord.deleteMany({
      $or: [
        ...(targetUserId ? [{ userId: targetUserId }] : []),
        ...(targetOrgName ? [{ organizationName: new RegExp(`^${targetOrgName}$`, 'i') }] : []),
        ...(targetBinIds.length > 0 ? [{ binId: { $in: targetBinIds } }] : [])
      ]
    });

    // Cascade 4: Remove/Clean Transport Jobs
    if (targetOrgName) {
      await TransportJob.deleteMany({
        $or: [
          { originSite: new RegExp(`^${targetOrgName}$`, 'i') },
          { 'dumpRecords.organizationName': new RegExp(`^${targetOrgName}$`, 'i') }
        ]
      });
    }

    // Cascade 5: Remove User Contributions & Carbon Credits from Recycling Reports
    if (targetUserId || targetOrgName) {
      await RecyclingReport.updateMany(
        {},
        {
          $pull: {
            userContributions: {
              $or: [
                ...(targetUserId ? [{ userId: targetUserId }] : []),
                ...(targetOrgName ? [{ organizationName: new RegExp(`^${targetOrgName}$`, 'i') }] : [])
              ]
            }
          }
        }
      );
    }

    // Cascade 6: Delete User Account if exists
    if (targetUserId) {
      await User.findByIdAndDelete(targetUserId);
      const allUsers = await User.find({}).select('+passwordHash').lean();
      saveUsersToDisk(allUsers);
    }

    return res.json({
      success: true,
      message: `User ${targetOrgName || id} and all associated records, bins, dump logs, and carbon credits successfully purged across entire system.`
    });
  } catch (error) {
    console.error('[Purge User Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Granular: Delete Single Dump Record
export const deleteDumpRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await DumpRecord.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Dump record deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk: Clear All Dump Records
export const clearAllDumpRecords = async (req, res) => {
  try {
    await DumpRecord.deleteMany({});
    return res.json({ success: true, message: 'All dump records cleared successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Granular: Delete Single Transport Job
export const deleteTransportJob = async (req, res) => {
  try {
    const { id } = req.params;
    await TransportJob.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Transport job deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk: Clear All Transport Jobs
export const clearAllTransportJobs = async (req, res) => {
  try {
    await TransportJob.deleteMany({});
    return res.json({ success: true, message: 'All transport jobs cleared successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Granular: Delete Single Recycling Report
export const deleteRecyclingReport = async (req, res) => {
  try {
    const { id } = req.params;
    await RecyclingReport.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Recycling report deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk: Clear All Recycling Reports
export const clearAllRecyclingReports = async (req, res) => {
  try {
    await RecyclingReport.deleteMany({});
    return res.json({ success: true, message: 'All recycling reports cleared successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Granular: Delete Single Collector Assignment
export const deleteCollectorAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await CollectorAssignment.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Collector assignment deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk: Clear All Collector Assignments
export const clearAllCollectorAssignments = async (req, res) => {
  try {
    await CollectorAssignment.deleteMany({});
    return res.json({ success: true, message: 'All collector assignments cleared successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Ultra High-Speed Aggregated Bootstrap: Loads all Management Hub data in ONE single DB round-trip
export const getManagementBootstrap = async (req, res) => {
  try {
    const [
      rawRequests,
      assignments,
      rawSites,
      workers,
      collectors,
      dumpRecords,
      transporters,
      plants,
      transportJobs,
      recyclingReports,
      auditLogs,
      iotCollectionRequests
    ] = await Promise.all([
      ServiceRequest.find({ requestType: 'BIN_DEPLOYMENT' }).sort({ createdAt: -1 }).lean(),
      CollectorAssignment.find({}).populate('requestId').populate('collectorId', 'fullName phone employeeId vehicleNumber').sort({ assignedAt: -1 }).lean().catch(() => []),
      ServiceRequest.find({ requestType: 'BIN_DEPLOYMENT', status: { $in: ['COMPLETED', 'Completed'] } }).sort({ createdAt: 1 }).lean().catch(() => []),
      User.find({ role: 'TECHNICAL' }).select('-passwordHash').lean().catch(() => []),
      User.find({ role: 'COLLECTOR' }).select('-passwordHash').lean().catch(() => []),
      DumpRecord.find({}).populate('collectorId', 'fullName phone vehicleNumber').sort({ dumpedAt: -1 }).lean().catch(() => []),
      User.find({ role: 'TRANSPORTER' }).select('-passwordHash').lean().catch(() => []),
      User.find({ role: 'RECYCLING_PLANT' }).select('-passwordHash').lean().catch(() => []),
      TransportJob.find({}).populate('transporterId', 'fullName phone vehicleNumber').sort({ assignedAt: -1 }).lean().catch(() => []),
      RecyclingReport.find({}).sort({ processedAt: -1 }).lean().catch(() => []),
      AuditLog.find({}).sort({ timestamp: -1 }).limit(20).lean().catch(() => []),
      ServiceRequest.find({ requestType: 'WASTE_COLLECTION' }).populate('assignedCollectorId', 'fullName phone vehicleNumber').sort({ createdAt: -1 }).lean().catch(() => [])
    ]);

    // Format requests with active worker assignments
    const requests = rawRequests.map(r => {
      const neededWorkers = calculateRequiredWorkers(r.numberOfBins || 1);
      return {
        ...r,
        id: r._id,
        requiredWorkers: neededWorkers,
        assignedWorkersCount: 0,
        activeAssignments: [],
        assignedWorkerNames: []
      };
    });

    // Format active sites with dynamic client indices
    const sites = (rawSites || []).map((site, idx) => {
      const clientIdx = site.clientIndex || (idx + 1);
      const clientStr = String(clientIdx).padStart(2, '0');
      const binPrefix = site.binPrefix || `BIN-${clientStr}`;
      const totalBins = site.numberOfBins || 1;
      let deployedBinIds = site.deployedBinIds;
      if (!deployedBinIds || deployedBinIds.length === 0) {
        deployedBinIds = [];
        for (let i = 1; i <= totalBins; i++) {
          deployedBinIds.push(`BIN-${clientStr}-${String(i).padStart(2, '0')}`);
        }
      }
      const coords = site.location?.coordinates || [73.0479, 33.6844];
      return {
        id: site._id,
        _id: site._id,
        requestNumber: site.requestNumber,
        clientIndex: clientIdx,
        clientCode: `CLIENT-${clientStr}`,
        binPrefix,
        deployedBinIds,
        organizationName: site.organizationName,
        contactPerson: site.contactPerson,
        phone: site.phone,
        email: site.email,
        address: site.address,
        town: site.town,
        city: site.city || 'Islamabad',
        lat: coords[1],
        lng: coords[0],
        numberOfBins: totalBins,
        binType: site.binType || 'IoT Ultrasonic Smart Bin (240L)',
        status: site.status === 'Completed' ? 'ACTIVE' : 'DEPLOYING',
        requestStatus: site.status,
        installedAt: site.installedAt || site.updatedAt || site.createdAt,
        createdAt: site.createdAt
      };
    });

    // Format collection queue from CollectorAssignments (manually assigned)
    const assignmentQueue = assignments.map(a => ({
      id: a._id,
      _id: a._id,
      requestId: a.requestId?._id || a.requestId,
      requestNumber: a.requestId?.requestNumber || 'REQ-COLL',
      site: a.siteName,
      locationName: a.siteName,
      town: a.town,
      address: a.address,
      wasteType: a.wasteType,
      weightKg: a.estimatedWeightKg,
      notes: a.notes,
      assignedCollectorId: a.collectorId?._id || a.collectorId,
      assignedCollectorName: a.collectorId?.fullName || 'Collector',
      collectorPhone: a.collectorId?.phone,
      vehicleNumber: a.collectorId?.vehicleNumber,
      status: a.status,
      assignedAt: a.assignedAt,
      collectedDate: a.collectedDate,
      source: 'manual'
    }));

    // Also include IoT-generated WASTE_COLLECTION ServiceRequests (from Proteus telemetry)
    const iotQueue = (iotCollectionRequests || []).map(r => {
      let dynamicStatus = 'Awaiting Partner';
      if (r.status === 'COMPLETED') dynamicStatus = 'Completed';
      else if (r.status === 'ASSIGNED_TO_COLLECTOR') dynamicStatus = 'Assigned to Collector (Waiting for Response)';
      else if (r.status === 'ROUTED_FOR_COLLECTION') dynamicStatus = 'Assigned to Collector (Waiting for Response)';
      else if (r.status === 'WAITING_COLLECTION') dynamicStatus = 'Awaiting Partner';

      return {
        id: r._id,
        _id: r._id,
        requestId: r._id,
        requestNumber: r.requestNumber || 'IOT-COLL',
        site: r.siteName || r.organizationName,
        locationName: r.siteName || r.organizationName,
        town: r.town,
        address: r.address,
        wasteType: r.wasteType,
        weightKg: r.weightKg || 0,
        notes: r.notes || r.description || '',
        assignedCollectorId: r.assignedCollectorId?._id || r.assignedCollectorId || null,
        assignedCollectorName: r.assignedCollectorId?.fullName || null,
        collectorPhone: r.assignedCollectorId?.phone || null,
        vehicleNumber: r.assignedCollectorId?.vehicleNumber || null,
        status: dynamicStatus,
        collectedDate: new Date(r.createdAt).toISOString().slice(0, 10),
        createdAt: r.createdAt,
        source: 'iot'
      };
    });

    // Merge: IoT queue entries first (most urgent), then manual assignments
    // Deduplicate by requestId to avoid double-entries
    const seenIds = new Set();
    const collectionQueue = [];
    for (const item of [...iotQueue, ...assignmentQueue]) {
      const key = String(item.requestId || item.id || item._id);
      if (!seenIds.has(key)) {
        seenIds.add(key);
        collectionQueue.push(item);
      }
    }

    // User waste tracking calculations
    const userMap = {};
    (dumpRecords || []).forEach(d => {
      const key = d.organizationName || 'General Client';
      if (!userMap[key]) {
        userMap[key] = {
          organizationName: key,
          clientCode: d.clientCode || 'CLIENT-01',
          totalDumpedKg: 0,
          totalRecycledKg: 0,
          totalCarbonCredits: 0,
          dumpBatchesCount: 0
        };
      }
      userMap[key].totalDumpedKg += (d.weightKg || 0);
      userMap[key].dumpBatchesCount += 1;
    });

    (recyclingReports || []).forEach(r => {
      if (r.userContributions && Array.isArray(r.userContributions)) {
        r.userContributions.forEach(uc => {
          const key = uc.organizationName || 'General Client';
          if (userMap[key]) {
            userMap[key].totalRecycledKg += (uc.recycledKg || 0);
            userMap[key].totalCarbonCredits += (uc.carbonCreditsEarned || 0);
          }
        });
      }
    });

    const userSummaries = Object.values(userMap).map(u => ({
      ...u,
      totalDumpedKg: Number(u.totalDumpedKg.toFixed(2)),
      totalRecycledKg: Number(u.totalRecycledKg.toFixed(2)),
      totalCarbonCredits: Number(u.totalCarbonCredits.toFixed(2)),
      recyclingRatePercent: u.totalDumpedKg > 0 ? Number(((u.totalRecycledKg / u.totalDumpedKg) * 100).toFixed(1)) : 0
    }));

    return res.json({
      success: true,
      data: {
        requests,
        collectionQueue,
        sites,
        workers,
        collectors,
        dumpRecords,
        transporters,
        recyclingPlants: plants,
        transportJobs,
        recyclingReports,
        wasteTracking: { userSummaries },
        auditLogs
      }
    });
  } catch (error) {
    console.error('getManagementBootstrap error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


