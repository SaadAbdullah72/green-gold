import { CollectorAssignment } from '../models/CollectorAssignment.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { User } from '../models/User.js';

export const getMyPickupAssignments = async (req, res) => {
  try {
    const assignments = await CollectorAssignment.find({ 
      collectorId: req.user._id,
      status: { $ne: 'COMPLETED' }
    }).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      count: assignments.length,
      jobs: assignments.map((item) => ({
        _id: item._id,
        id: item._id,
        assignmentId: item._id,
        pickupId: item.pickupId,
        requestId: item.requestId,
        binId: item.binId || item.pickupId,
        locationName: item.locationName || item.siteName || 'Assigned pickup',
        siteName: item.siteName || item.locationName || 'Assigned pickup',
        address: item.address || 'Islamabad',
        town: item.town || 'F-7',
        city: item.city || 'Islamabad',
        lat: item.lat,
        lng: item.lng,
        fillLevel: item.fillLevel || 0,
        timeFullMinutes: item.timeFullMinutes || 0,
        urgency: item.urgency || 'Medium',
        status: item.status,
        notes: item.notes || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptPickupAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await CollectorAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Pickup assignment not found' });
    }

    if (String(assignment.collectorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This pickup is assigned to another collector.' });
    }

    assignment.status = 'IN_PROGRESS';
    assignment.acceptedAt = new Date();
    await assignment.save();

    // Update associated ServiceRequest
    if (assignment.requestId || assignment.pickupId) {
      const sId = assignment.requestId || assignment.pickupId;
      await ServiceRequest.findByIdAndUpdate(sId, { 
        status: 'ROUTED_FOR_COLLECTION',
        assignedCollectorId: req.user._id 
      });
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
    const assignment = await CollectorAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Pickup assignment not found' });
    }

    if (String(assignment.collectorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This pickup is assigned to another collector.' });
    }

    assignment.status = 'COMPLETED';
    assignment.completedAt = new Date();
    await assignment.save();

    // Update associated ServiceRequest
    if (assignment.requestId || assignment.pickupId) {
      const sId = assignment.requestId || assignment.pickupId;
      await ServiceRequest.findByIdAndUpdate(sId, { 
        status: 'COMPLETED',
        collectedDate: new Date()
      });
    }

    // Check if collector has any other active jobs
    const activeRemaining = await CollectorAssignment.countDocuments({
      collectorId: req.user._id,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'ACCEPTED'] }
    });

    await User.findByIdAndUpdate(req.user._id, { 
      workerStatus: activeRemaining > 0 ? 'BUSY' : 'IDLE' 
    });

    return res.json({ success: true, message: 'Pickup completed successfully.', assignment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
