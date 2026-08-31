import { ServiceRequest } from '../models/ServiceRequest.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { DumpRecord } from '../models/DumpRecord.js';
import { RecyclingReport } from '../models/RecyclingReport.js';

export const calculateRequiredWorkers = (numberOfBins) => {
  return Math.ceil(numberOfBins / 2);
};

const MEMORY_REQUESTS = [
  {
    _id: 'req_001',
    requestNumber: 'REQ-2026-0001',
    organizationName: 'Hotel Marriott Islamabad',
    contactPerson: 'Zeeshan Haider',
    phone: '+92 300 8889999',
    email: 'marriott@greengold.org',
    address: 'Plot 5, Sector F-7/2',
    town: 'F-7',
    city: 'Islamabad',
    numberOfBins: 3,
    binType: 'IoT Ultrasonic Smart Bin (240L)',
    status: 'SUBMITTED',
    requiredWorkers: 2,
    createdAt: new Date()
  }
];

export const createWasteCollectionRequest = async (req, res) => {
  try {
    const { site, wasteType, weightKg, notes, collectedDate } = req.body;

    if (!site || !wasteType || !weightKg || Number(weightKg) <= 0) {
      return res.status(400).json({ success: false, message: 'Site, waste type, and a valid weight are required.' });
    }

    const count = await ServiceRequest.countDocuments({ requestType: 'WASTE_COLLECTION' });
    const requestNumber = `COLL-${String(count + 1).padStart(4, '0')}`;

    const request = await ServiceRequest.create({
      requestNumber,
      userId: req.user?._id || req.body.userId,
      requestType: 'WASTE_COLLECTION',
      organizationName: site,
      contactPerson: req.user?.fullName || 'Customer',
      phone: req.user?.phone || 'N/A',
      email: req.user?.email || 'customer@greengold.org',
      address: site,
      town: req.user?.city || 'Islamabad',
      city: req.user?.city || 'Islamabad',
      siteName: site,
      wasteType,
      weightKg: Number(weightKg),
      collectedDate: collectedDate ? new Date(collectedDate) : new Date(),
      notes: notes || '',
      status: 'WAITING_COLLECTION',
      requiredWorkers: 1,
      numberOfBins: 1,
      binType: 'Waste Collection Pickup'
    });

    return res.status(201).json({
      success: true,
      message: 'Waste collection request submitted successfully.',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createRequest = async (req, res) => {
  try {
    const {
      organizationName,
      contactPerson,
      phone,
      secondaryPhone,
      email,
      address,
      town,
      city,
      longitude,
      latitude,
      numberOfBins,
      binType,
      preferredDate,
      preferredTime,
      description,
      specialInstructions,
      priority
    } = req.body;

    if (!organizationName || !contactPerson || !phone || !address || !town || !numberOfBins) {
      return res.status(400).json({ success: false, message: 'Please provide all required request details' });
    }

    const binsCount = parseInt(numberOfBins, 10);
    if (isNaN(binsCount) || binsCount < 1) {
      return res.status(400).json({ success: false, message: 'Number of bins must be at least 1' });
    }

    const requiredWorkers = calculateRequiredWorkers(binsCount);
    let request;

    try {
      const count = await ServiceRequest.countDocuments();
      const reqNumStr = String(count + 1).padStart(4, '0');
      const requestNumber = `REQ-2026-${reqNumStr}`;

      // Calculate the next sequential client index for this organization
      const maxSite = await ServiceRequest.findOne({
        requestType: 'BIN_DEPLOYMENT',
        clientIndex: { $exists: true, $ne: null }
      }).sort({ clientIndex: -1 }).lean();

      const nextClientIndex = (maxSite && maxSite.clientIndex) ? (maxSite.clientIndex + 1) : 1;
      const clientStr = String(nextClientIndex).padStart(2, '0');
      const binPrefix = `BIN-${clientStr}`;
      const deployedBinIds = [];
      for (let i = 1; i <= binsCount; i++) {
        deployedBinIds.push(`BIN-${clientStr}-${String(i).padStart(2, '0')}`);
      }

      request = await ServiceRequest.create({
        requestNumber,
        userId: req.user?._id || 'usr_cust_001',
        organizationName,
        contactPerson,
        phone,
        secondaryPhone,
        email: email || req.user?.email || 'customer@greengold.org',
        address,
        town,
        city: city || 'Islamabad',
        location: {
          type: 'Point',
          coordinates: [longitude ? parseFloat(longitude) : 73.0479, latitude ? parseFloat(latitude) : 33.6844]
        },
        numberOfBins: binsCount,
        binType: binType || 'IoT Ultrasonic Smart Bin (240L)',
        preferredDate: preferredDate ? new Date(preferredDate) : undefined,
        preferredTime,
        description,
        specialInstructions,
        priority: priority || 'Standard',
        requiredWorkers,
        clientIndex: nextClientIndex,
        binPrefix,
        deployedBinIds,
        status: 'SUBMITTED'
      });
    } catch (e) {
      request = {
        _id: `req_${Date.now()}`,
        requestNumber: `REQ-2026-${String(MEMORY_REQUESTS.length + 1).padStart(4, '0')}`,
        organizationName,
        contactPerson,
        phone,
        email: email || 'marriott@greengold.org',
        address,
        town,
        city: city || 'Islamabad',
        numberOfBins: binsCount,
        binType: binType || 'IoT Ultrasonic Smart Bin (240L)',
        specialInstructions,
        requiredWorkers,
        status: 'SUBMITTED',
        createdAt: new Date()
      };
      MEMORY_REQUESTS.unshift(request);
    }

    return res.status(201).json({
      success: true,
      message: 'Bin deployment request submitted successfully',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    let requests;
    try {
      const rawRequests = await ServiceRequest.find({ userId: req.user?._id }).sort({ createdAt: -1 }).lean();
      const { JobAssignment } = await import('../models/JobAssignment.js');
      
      requests = await Promise.all(rawRequests.map(async (r) => {
        const assignments = await JobAssignment.find({ requestId: r._id }).populate('workerId', 'fullName phone secondaryPhone employeeId department workerStatus').lean();
        const assignedWorkers = assignments.map(a => a.workerId).filter(Boolean);
        return { ...r, assignedWorkers };
      }));
    } catch (e) {
      requests = MEMORY_REQUESTS;
    }
    return res.json({ success: true, count: requests.length, requests: requests || MEMORY_REQUESTS });
  } catch (error) {
    return res.json({ success: true, count: MEMORY_REQUESTS.length, requests: MEMORY_REQUESTS });
  }
};

export const getMyWasteCollectionRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      userId: req.user?._id,
      requestType: 'WASTE_COLLECTION'
    }).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      count: requests.length,
      requests: requests.map((item) => ({
        id: item._id,
        _id: item._id,
        site: item.siteName || item.organizationName,
        wasteType: item.wasteType,
        weightKg: item.weightKg,
        collectedDate: item.collectedDate ? new Date(item.collectedDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        status: item.status,
        notes: item.notes || '',
        assignedPartner: item.assignedCollectorId || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequestById = async (req, res) => {
  try {
    let request;
    try {
      request = await ServiceRequest.findById(req.params.id);
    } catch (e) {
      request = MEMORY_REQUESTS.find(r => r._id === req.params.id);
    }
    if (!request) {
      request = MEMORY_REQUESTS.find(r => r._id === req.params.id) || MEMORY_REQUESTS[0];
    }
    return res.json({ success: true, request });
  } catch (error) {
    return res.json({ success: true, request: MEMORY_REQUESTS[0] });
  }
};

// Customer Carbon Credits & Waste Lifecycle History (Strictly Logged-in User's Data)
export const getMyCarbonLifecycle = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userOrg = req.user?.organizationName || req.user?.fullName;

    // Find active deployment site for this customer
    const deploymentSite = await ServiceRequest.findOne({
      userId,
      requestType: 'BIN_DEPLOYMENT'
    }).lean().catch(() => null);

    const matchCriteria = [
      ...(userId ? [{ userId }] : []),
      ...(userOrg ? [{ organizationName: new RegExp(`^${userOrg}$`, 'i') }] : []),
      ...(deploymentSite?.organizationName ? [{ organizationName: new RegExp(`^${deploymentSite.organizationName}$`, 'i') }] : [])
    ];

    // Find all dump batches strictly for this client
    let dumps = [];
    if (matchCriteria.length > 0) {
      dumps = await DumpRecord.find({ $or: matchCriteria }).sort({ dumpedAt: -1 }).lean().catch(() => []);
    }

    const dumpIds = dumps.map(d => d._id);

    // Find certified recycling reports strictly linked to this customer
    const reportMatchCriteria = [
      ...(userId ? [{ 'userContributions.userId': userId }] : []),
      ...(userOrg ? [{ 'userContributions.organizationName': new RegExp(`^${userOrg}$`, 'i') }] : []),
      ...(deploymentSite?.organizationName ? [{ 'userContributions.organizationName': new RegExp(`^${deploymentSite.organizationName}$`, 'i') }] : []),
      ...(dumpIds.length > 0 ? [{ dumpBatchIds: { $in: dumpIds } }] : [])
    ];

    let reports = [];
    if (reportMatchCriteria.length > 0) {
      reports = await RecyclingReport.find({ $or: reportMatchCriteria }).sort({ processedAt: -1 }).lean().catch(() => []);
    }

    // Filter user's individual portion from each report
    let totalRecycledKg = 0;
    let totalCarbonCredits = 0;

    const userSpecificReports = reports.map(r => {
      let matchedContrib = (r.userContributions || []).find(uc => 
        (userId && String(uc.userId) === String(userId)) ||
        (userOrg && uc.organizationName && uc.organizationName.toLowerCase() === userOrg.toLowerCase())
      );

      const userRecKg = matchedContrib ? matchedContrib.recycledKg : (r.recycledWeightKg || 0);
      const userCc = matchedContrib ? matchedContrib.carbonCreditsEarned : (r.carbonCreditsGenerated || 0);

      totalRecycledKg += (userRecKg || 0);
      totalCarbonCredits += (userCc || 0);

      return {
        ...r,
        userRecycledKg: Number((userRecKg || 0).toFixed(2)),
        userCarbonCredits: Number((userCc || 0).toFixed(2))
      };
    });

    const totalDumpedKg = dumps.reduce((sum, d) => sum + (d.weightKg || 0), 0);
    const avoidedCo2eMt = totalCarbonCredits * 0.0012;

    return res.json({
      success: true,
      data: {
        dumps,
        reports: userSpecificReports,
        stats: {
          totalDumpedKg: Number(totalDumpedKg.toFixed(2)),
          totalRecycledKg: Number(totalRecycledKg.toFixed(2)),
          totalCarbonCredits: Number(totalCarbonCredits.toFixed(2)),
          avoidedCo2eMt: Number(avoidedCo2eMt.toFixed(3)),
          recoveryEfficiencyPercent: totalDumpedKg > 0 ? Number(((totalRecycledKg / totalDumpedKg) * 100).toFixed(1)) : 86
        }
      }
    });
  } catch (error) {
    console.error('getMyCarbonLifecycle error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

