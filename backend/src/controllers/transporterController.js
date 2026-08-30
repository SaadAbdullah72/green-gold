import { TransportJob } from '../models/TransportJob.js';
import { DumpRecord } from '../models/DumpRecord.js';
import { User } from '../models/User.js';

export const getMyTransportJobs = async (req, res) => {
  try {
    const jobs = await TransportJob.find({
      transporterId: req.user._id
    })
      .populate('recyclingPlantId', 'fullName organizationName address phone plantType')
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
        plantName: j.plantName || j.recyclingPlantId?.organizationName || j.recyclingPlantId?.fullName,
        plantAddress: j.plantAddress || j.recyclingPlantId?.address,
        plantPhone: j.recyclingPlantId?.phone,
        plantType: j.plantType,
        totalWeightKg: j.totalWeightKg,
        wasteType: j.wasteType,
        originSite: j.originSite,
        vehicleNumber: j.vehicleNumber,
        status: j.status,
        dumpRecordCount: j.dumpRecordIds?.length || 0,
        dumpRecords: j.dumpRecordIds || [],
        notes: j.notes,
        assignedAt: j.assignedAt,
        acceptedAt: j.acceptedAt,
        transitStartedAt: j.transitStartedAt,
        deliveredAt: j.deliveredAt,
        createdAt: j.createdAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptTransportJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await TransportJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Transport job assignment not found.' });
    }

    if (String(job.transporterId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This transport job is assigned to another transporter.' });
    }

    job.status = 'ACCEPTED';
    job.acceptedAt = new Date();
    await job.save();

    await User.findByIdAndUpdate(req.user._id, { workerStatus: 'BUSY' });

    return res.json({ success: true, message: 'Transport job accepted! Ready for dispatch.', job });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const startTransitTransportJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await TransportJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Transport job assignment not found.' });
    }

    if (String(job.transporterId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized transport dispatch.' });
    }

    job.status = 'IN_TRANSIT';
    job.transitStartedAt = new Date();
    await job.save();

    // Update dump records status
    if (job.dumpRecordIds && job.dumpRecordIds.length > 0) {
      await DumpRecord.updateMany(
        { _id: { $in: job.dumpRecordIds } },
        { status: 'IN_TRANSIT' }
      );
    }

    await User.findByIdAndUpdate(req.user._id, { workerStatus: 'WORKING' });

    return res.json({ success: true, message: 'Vehicle dispatched! Waste batch is now in transit to recycling plant.', job });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markDeliveredTransportJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await TransportJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Transport job assignment not found.' });
    }

    if (String(job.transporterId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized transport dispatch.' });
    }

    job.status = 'DELIVERED';
    job.deliveredAt = new Date();
    await job.save();

    // Update dump records status
    if (job.dumpRecordIds && job.dumpRecordIds.length > 0) {
      await DumpRecord.updateMany(
        { _id: { $in: job.dumpRecordIds } },
        { status: 'DELIVERED' }
      );
    }

    // Check if transporter has remaining active jobs
    const remaining = await TransportJob.countDocuments({
      transporterId: req.user._id,
      status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_TRANSIT'] }
    });

    await User.findByIdAndUpdate(req.user._id, { workerStatus: remaining > 0 ? 'BUSY' : 'IDLE' });

    return res.json({ success: true, message: 'Delivery confirmed at recycling plant gate.', job });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
