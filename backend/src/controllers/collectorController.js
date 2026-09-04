import { CollectorAssignment } from '../models/CollectorAssignment.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { DumpRecord } from '../models/DumpRecord.js';
import { User } from '../models/User.js';

const TOWN_COORDINATES = {
  'saddar': { lat: 33.5954, lng: 73.0512 },
  'gharibabad': { lat: 33.6069, lng: 73.1003 },
  'lahore': { lat: 31.4800, lng: 74.3938 },
  'f-7': { lat: 33.7215, lng: 73.0558 },
  'f-6': { lat: 33.7297, lng: 73.0746 },
  'g-5': { lat: 33.7200, lng: 73.1000 },
  'e-9': { lat: 33.7150, lng: 73.0250 },
  'i-9': { lat: 33.6620, lng: 73.0600 },
  'i-10': { lat: 33.6450, lng: 73.0380 },
  'blue area': { lat: 33.7100, lng: 73.0600 },
  'bahria': { lat: 33.5250, lng: 73.1050 },
  'dha': { lat: 33.5350, lng: 73.1550 },
  'islamabad': { lat: 33.6844, lng: 73.0479 }
};

function resolveCoordinates(item, activeSites = []) {
  // 1. If explicit non-default coordinates are given on the item
  if (item.lat && item.lng && (item.lat !== 33.6844 || item.lng !== 73.0479)) {
    return { lat: Number(item.lat), lng: Number(item.lng) };
  }

  // 2. Try matching with active sites in DB
  const binId = item.binId || item.pickupId;
  const matchedSite = activeSites.find(s => 
    (s._id && item.requestId && String(s._id) === String(item.requestId)) ||
    (s.deployedBinIds && s.deployedBinIds.includes(binId)) ||
    (s.binPrefix && binId && binId.startsWith(s.binPrefix)) ||
    (s.organizationName && item.siteName && item.siteName.toLowerCase().includes(s.organizationName.toLowerCase())) ||
    (s.town && item.town && s.town.toLowerCase() === item.town.toLowerCase())
  );

  if (matchedSite?.location?.coordinates && matchedSite.location.coordinates.length === 2) {
    return {
      lat: matchedSite.location.coordinates[1],
      lng: matchedSite.location.coordinates[0],
      siteName: matchedSite.organizationName ? `${matchedSite.organizationName} (${binId || 'Site'})` : item.siteName,
      address: matchedSite.address || item.address,
      town: matchedSite.town || item.town,
      city: matchedSite.city || item.city
    };
  }

  // 3. Fallback to town / address coordinate dictionary
  const searchStr = `${item.town || ''} ${item.address || ''} ${item.siteName || ''} ${item.locationName || ''}`.toLowerCase();
  for (const [key, coords] of Object.entries(TOWN_COORDINATES)) {
    if (searchStr.includes(key)) {
      return coords;
    }
  }

  return { lat: Number(item.lat) || 33.6844, lng: Number(item.lng) || 73.0479 };
}

export const getMyPickupAssignments = async (req, res) => {
  try {
    const collectorId = req.user._id;

    // Fetch active sites for accurate GPS & metadata enrichment
    const activeSites = await ServiceRequest.find({
      requestType: 'BIN_DEPLOYMENT',
      status: { $nin: ['DECLINED', 'CANCELLED'] }
    }).lean().catch(() => []);

    // 1. Fetch explicitly assigned CollectorAssignments
    const assignments = await CollectorAssignment.find({ 
      collectorId,
      status: { $ne: 'COMPLETED' }
    }).sort({ createdAt: -1 }).lean().catch(() => []);

    // 2. Fetch direct WASTE_COLLECTION ServiceRequests assigned to this collector or waiting for collection
    const directRequests = await ServiceRequest.find({
      requestType: 'WASTE_COLLECTION',
      $or: [
        { assignedCollectorId: collectorId },
        { status: { $in: ['WAITING_COLLECTION', 'ROUTED_FOR_COLLECTION', 'ASSIGNED_TO_COLLECTOR'] } }
      ],
      status: { $ne: 'COMPLETED' }
    }).sort({ createdAt: -1 }).lean().catch(() => []);

    const jobsMap = new Map();

    // Add CollectorAssignments
    assignments.forEach(item => {
      const resolved = resolveCoordinates(item, activeSites);
      const key = String(item._id);
      jobsMap.set(key, {
        _id: item._id,
        id: item._id,
        assignmentId: item._id,
        pickupId: item.pickupId,
        requestId: item.requestId,
        binId: item.binId || item.pickupId || 'BIN-01-01',
        locationName: resolved.siteName || item.locationName || item.siteName || 'Assigned Pickup Site',
        siteName: resolved.siteName || item.siteName || item.locationName || 'Assigned Pickup Site',
        address: resolved.address || item.address || 'Islamabad',
        town: resolved.town || item.town || 'Islamabad',
        city: resolved.city || item.city || 'Islamabad',
        lat: resolved.lat,
        lng: resolved.lng,
        fillLevel: item.fillLevel || 95,
        timeFullMinutes: item.timeFullMinutes || 15,
        urgency: item.urgency || (item.fillLevel >= 85 ? 'High' : 'Medium'),
        status: item.status || 'ASSIGNED',
        wasteType: item.wasteType || 'Organic/Compost',
        notes: item.notes || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    });

    // Add Direct / IoT ServiceRequests (if not already in map)
    directRequests.forEach(reqItem => {
      const alreadyAssigned = assignments.some(a => 
        (a.requestId && String(a.requestId) === String(reqItem._id)) ||
        (a.pickupId && String(a.pickupId) === String(reqItem._id))
      );

      if (!alreadyAssigned) {
        const binMatch = (reqItem.notes || reqItem.description || '').match(/BIN-\d+(-\d+)?/i);
        const inferredBinId = binMatch ? binMatch[0] : (reqItem.deployedBinIds?.[0] || 'BIN-01-01');
        
        let coords = { lat: 33.6844, lng: 73.0479 };
        if (reqItem.location?.coordinates && reqItem.location.coordinates.length === 2) {
          coords = { lat: reqItem.location.coordinates[1], lng: reqItem.location.coordinates[0] };
        } else {
          coords = resolveCoordinates({ ...reqItem, binId: inferredBinId }, activeSites);
        }

        const key = String(reqItem._id);
        jobsMap.set(key, {
          _id: reqItem._id,
          id: reqItem._id,
          assignmentId: reqItem._id,
          pickupId: reqItem._id,
          requestId: reqItem._id,
          binId: inferredBinId,
          locationName: `${reqItem.organizationName || reqItem.siteName || 'Client Site'} (${inferredBinId})`,
          siteName: reqItem.siteName || reqItem.organizationName || 'Client Site',
          address: reqItem.address || 'Islamabad',
          town: reqItem.town || 'Islamabad',
          city: reqItem.city || 'Islamabad',
          lat: coords.lat,
          lng: coords.lng,
          fillLevel: reqItem.notes?.includes('%') ? parseInt(reqItem.notes.match(/(\d+)%/)?.[1] || '95', 10) : 95,
          timeFullMinutes: 20,
          urgency: 'High',
          status: reqItem.status === 'WAITING_COLLECTION' ? 'ASSIGNED' : reqItem.status,
          wasteType: reqItem.wasteType || 'Organic/Compost',
          notes: reqItem.notes || reqItem.description || '',
          createdAt: reqItem.createdAt,
          updatedAt: reqItem.updatedAt,
        });
      }
    });

    const jobs = Array.from(jobsMap.values());

    return res.json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptPickupAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    let assignment = await CollectorAssignment.findById(assignmentId);

    if (assignment) {
      if (String(assignment.collectorId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'This pickup is assigned to another collector.' });
      }
      assignment.status = 'IN_PROGRESS';
      assignment.acceptedAt = new Date();
      await assignment.save();

      if (assignment.requestId || assignment.pickupId) {
        const sId = assignment.requestId || assignment.pickupId;
        await ServiceRequest.findByIdAndUpdate(sId, { 
          status: 'ROUTED_FOR_COLLECTION',
          assignedCollectorId: req.user._id 
        });
      }
    } else {
      // Might be a direct ServiceRequest ID
      const sReq = await ServiceRequest.findById(assignmentId);
      if (sReq) {
        sReq.status = 'ROUTED_FOR_COLLECTION';
        sReq.assignedCollectorId = req.user._id;
        await sReq.save();

        assignment = await CollectorAssignment.create({
          collectorId: req.user._id,
          pickupId: sReq._id,
          requestId: sReq._id,
          siteName: sReq.siteName || sReq.organizationName,
          locationName: `${sReq.organizationName} Pickup`,
          address: sReq.address,
          town: sReq.town,
          city: sReq.city,
          lat: sReq.location?.coordinates?.[1] || 33.6844,
          lng: sReq.location?.coordinates?.[0] || 73.0479,
          fillLevel: 95,
          urgency: 'High',
          status: 'IN_PROGRESS',
          acceptedAt: new Date()
        });
      } else {
        return res.status(404).json({ success: false, message: 'Pickup assignment not found' });
      }
    }

    await User.findByIdAndUpdate(req.user._id, { workerStatus: 'BUSY' });

    return res.json({ success: true, message: 'Duty accepted! Moving to pickup site.', assignment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markPickupCompleted = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    let assignment = await CollectorAssignment.findById(assignmentId);
    let linkedRequest = null;

    if (assignment) {
      if (String(assignment.collectorId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'This pickup is assigned to another collector.' });
      }
      assignment.status = 'COMPLETED';
      assignment.completedAt = new Date();
      await assignment.save();

      if (assignment.requestId || assignment.pickupId) {
        const sId = assignment.requestId || assignment.pickupId;
        linkedRequest = await ServiceRequest.findByIdAndUpdate(sId, { 
          status: 'COMPLETED',
          collectedDate: new Date()
        }, { new: true });
      }
    } else {
      linkedRequest = await ServiceRequest.findByIdAndUpdate(assignmentId, {
        status: 'COMPLETED',
        collectedDate: new Date(),
        assignedCollectorId: req.user._id
      }, { new: true });
    }

    // Resolve actual site details
    let realOrgName = linkedRequest?.organizationName || assignment?.siteName || assignment?.locationName || 'Customer Portal';
    let realAddress = linkedRequest?.address || assignment?.address || 'Islamabad';
    let realTown = linkedRequest?.town || assignment?.town || 'Islamabad';
    let realCity = linkedRequest?.city || assignment?.city || 'Islamabad';
    const targetBinId = assignment?.binId || linkedRequest?.deployedBinIds?.[0] || 'BIN-01-01';

    const matchedSite = await ServiceRequest.findOne({
      requestType: 'BIN_DEPLOYMENT',
      $or: [
        { deployedBinIds: targetBinId },
        { binPrefix: targetBinId.slice(0, 6) },
        { organizationName: realOrgName }
      ]
    }).lean().catch(() => null);

    if (matchedSite) {
      realOrgName = matchedSite.organizationName || realOrgName;
      realAddress = matchedSite.address || realAddress;
      realTown = matchedSite.town || realTown;
      realCity = matchedSite.city || realCity;
    }

    const weightKg = Number(linkedRequest?.weightKg || (assignment?.fillLevel ? (assignment.fillLevel * 0.15).toFixed(1) : 5.0));
    const wasteType = linkedRequest?.wasteType || assignment?.wasteType || 'Organic/Compost';
    const clientCode = linkedRequest?.clientIndex ? `CLIENT-${String(linkedRequest.clientIndex).padStart(2, '0')}` : 'CLIENT-01';

    await DumpRecord.create({
      collectorId: req.user._id,
      requestId: linkedRequest?._id || null,
      userId: linkedRequest?.userId || null,
      organizationName: realOrgName,
      clientCode,
      binId: targetBinId,
      address: realAddress,
      town: realTown,
      city: realCity,
      weightKg: weightKg > 0 ? weightKg : 5.0,
      wasteType,
      status: 'DUMPED',
      dumpedAt: new Date(),
      notes: `Collected & dumped by ${req.user.fullName || 'Collector'}`
    });

    const activeRemaining = await CollectorAssignment.countDocuments({
      collectorId: req.user._id,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'ACCEPTED'] }
    });

    await User.findByIdAndUpdate(req.user._id, { 
      workerStatus: activeRemaining > 0 ? 'BUSY' : 'IDLE' 
    });

    return res.json({ 
      success: true, 
      message: 'Pickup completed & waste payload dumped at Central Separation Yard.', 
      assignment 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
