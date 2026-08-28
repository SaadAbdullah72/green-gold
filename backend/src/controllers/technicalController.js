import { JobAssignment } from '../models/JobAssignment.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { User } from '../models/User.js';

export const getMyJobs = async (req, res) => {
  try {
    const jobs = await JobAssignment.find({ workerId: req.user._id })
      .populate({
        path: 'requestId',
        select: 'requestNumber organizationName address town city contactPerson phone binsNeeded status declineReason'
      })
      .populate('workerId', 'fullName phone secondaryPhone employeeId workerStatus')
      .sort({ createdAt: -1 });

    const formattedJobs = jobs.map(j => ({
      _id: j._id,
      request: j.requestId,
      worker: j.workerId,
      binsAssigned: j.binsAssigned,
      status: j.status,
      responseDeadline: j.responseDeadline,
      declineReason: j.declineReason,
      delayReason: j.delayReason,
      completionNotes: j.completionNotes,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt
    }));

    return res.json({ success: true, count: formattedJobs.length, jobs: formattedJobs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobAssignment.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job assignment not found' });
    }

    job.status = 'ACCEPTED';
    job.acceptedAt = new Date();
    job.respondedAt = new Date();
    await job.save();

    return res.json({ success: true, message: 'Job assignment accepted and confirmed!', job });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const declineJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { declineReason } = req.body;

    const job = await JobAssignment.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job assignment not found' });
    }

    job.status = 'DECLINED';
    job.declineReason = declineReason || 'Worker unavailable';
    job.declinedAt = new Date();
    job.respondedAt = new Date();
    await job.save();

    // Mark worker back as IDLE
    await User.findByIdAndUpdate(job.workerId, { workerStatus: 'IDLE' });

    return res.json({ success: true, message: 'Job declined', job });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const startWork = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobAssignment.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job assignment not found' });
    }

    job.status = 'IN_PROGRESS';
    job.startedAt = new Date();
    await job.save();

    return res.json({ success: true, message: 'On-site installation started', job });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const delayJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { delayReason } = req.body;

    const job = await JobAssignment.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job assignment not found' });
    }

    job.status = 'PARTIALLY_DELAYED';
    job.delayReason = delayReason || 'Site access or hardware issue encountered';
    await job.save();

    return res.json({ success: true, message: 'Task marked as Partially Delayed', job });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const completeWork = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { binsInstalled, serialNumbers, notes } = req.body;

    const job = await JobAssignment.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job assignment not found' });
    }

    job.status = 'COMPLETED';
    job.completedAt = new Date();
    if (binsInstalled) job.binsCompleted = parseInt(binsInstalled, 10);
    if (notes) job.completionNotes = notes;
    await job.save();

    // Mark worker IDLE
    await User.findByIdAndUpdate(job.workerId, { workerStatus: 'IDLE' });

    // Check if ALL assigned jobs for this request are completed
    const uncompletedJobs = await JobAssignment.countDocuments({
      requestId: job.requestId,
      status: { $ne: 'COMPLETED' }
    });
    const allCompleted = uncompletedJobs === 0;

    if (allCompleted) {
      const targetReq = await ServiceRequest.findById(job.requestId);
      if (targetReq) {
        // Calculate client index if not already assigned
        let clientIdx = targetReq.clientIndex;
        if (!clientIdx) {
          const completedCount = await ServiceRequest.countDocuments({
            requestType: 'BIN_DEPLOYMENT',
            status: 'Completed',
            _id: { $ne: targetReq._id }
          });
          clientIdx = completedCount + 1;
        }

        const clientStr = String(clientIdx).padStart(2, '0');
        const binPrefix = `BIN-${clientStr}`;
        const totalBins = targetReq.numberOfBins || 1;
        const deployedBinIds = [];
        for (let i = 1; i <= totalBins; i++) {
          deployedBinIds.push(`BIN-${clientStr}-${String(i).padStart(2, '0')}`);
        }

        targetReq.status = 'COMPLETED';
        targetReq.clientIndex = clientIdx;
        targetReq.binPrefix = binPrefix;
        targetReq.deployedBinIds = deployedBinIds;
        targetReq.installedAt = new Date();
        await targetReq.save();
      }
    }

    return res.json({
      success: true,
      message: 'Installation task completed successfully',
      isRequestCompleted: allCompleted,
      job
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
