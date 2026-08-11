import { ServiceRequest } from '../models/ServiceRequest.js';
import { User } from '../models/User.js';
import { JobAssignment } from '../models/JobAssignment.js';
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
