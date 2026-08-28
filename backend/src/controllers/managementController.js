import { ServiceRequest } from '../models/ServiceRequest.js';
import { User } from '../models/User.js';
import { JobAssignment } from '../models/JobAssignment.js';
import { CollectorAssignment } from '../models/CollectorAssignment.js';
import { calculateRequiredWorkers } from './requestController.js';

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
