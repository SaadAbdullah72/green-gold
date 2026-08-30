import { RecyclingReport } from '../models/RecyclingReport.js';
import { TransportJob } from '../models/TransportJob.js';
import { DumpRecord } from '../models/DumpRecord.js';
import { User } from '../models/User.js';

const CC_FACTORS = {
  'Organic/Compost': 0.5,
  'Plastic': 1.2,
  'Metal': 2.0,
  'General Mixed': 0.3
};

export const getMyDeliveries = async (req, res) => {
  try {
    const jobs = await TransportJob.find({
      recyclingPlantId: req.user._id
    })
      .populate('transporterId', 'fullName phone vehicleNumber')
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
        transporterName: j.transporterId?.fullName || 'Logistics Carrier',
        transporterPhone: j.transporterId?.phone || '',
        vehicleNumber: j.transporterId?.vehicleNumber || j.vehicleNumber,
        totalWeightKg: j.totalWeightKg,
        wasteType: j.wasteType,
        originSite: j.originSite,
        status: j.status,
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

export const submitRecyclingReport = async (req, res) => {
  try {
    const {
      transportJobId,
      receivedWeightKg,
      recycledWeightKg,
      rejectedWeightKg,
      notes,
      operatorName
    } = req.body;

    if (!transportJobId || receivedWeightKg === undefined || recycledWeightKg === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Transport Job ID, received weight (kg), and recycled weight (kg) are required.'
      });
    }

    const job = await TransportJob.findById(transportJobId).populate('dumpRecordIds');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Transport Job not found.' });
    }

    const wasteType = job.wasteType || 'Organic/Compost';
    const factor = CC_FACTORS[wasteType] || 0.5;

    const numRecycled = Number(recycledWeightKg) || 0;
    const numReceived = Number(receivedWeightKg) || Number(job.totalWeightKg) || 0;
    const numRejected = rejectedWeightKg !== undefined ? Number(rejectedWeightKg) : Math.max(0, numReceived - numRecycled);

    const carbonCredits = Number((numRecycled * factor).toFixed(2));
    const efficiency = numReceived > 0 ? Number(((numRecycled / numReceived) * 100).toFixed(1)) : 0;

    // Calculate user contributions breakdown
    const dumpRecords = job.dumpRecordIds || [];
    const totalDumpRawKg = dumpRecords.reduce((sum, d) => sum + (d.weightKg || 0), 0) || 1;

    const userContributions = dumpRecords.map(d => {
      const userShareRatio = (d.weightKg || 0) / totalDumpRawKg;
      const userRecycledKg = Number((userShareRatio * numRecycled).toFixed(2));
      const userCC = Number((userRecycledKg * factor).toFixed(2));

      return {
        userId: d.userId,
        organizationName: d.organizationName || 'Client Site',
        clientCode: d.clientCode || 'CLIENT-01',
        rawKg: d.weightKg || 0,
        recycledKg: userRecycledKg,
        carbonCreditsEarned: userCC
      };
    });

    const reportCount = await RecyclingReport.countDocuments();
    const reportCode = `REC-RPT-${String(reportCount + 101).padStart(4, '0')}`;

    const report = await RecyclingReport.create({
      reportCode,
      plantId: req.user._id,
      plantName: req.user.organizationName || req.user.fullName || 'Recycling Plant Facility',
      transportJobId: job._id,
      dumpRecordIds: job.dumpRecordIds.map(d => d._id),
      wasteType,
      receivedWeightKg: numReceived,
      recycledWeightKg: numRecycled,
      rejectedWeightKg: numRejected,
      recoveryEfficiencyPercent: efficiency,
      carbonCreditsGenerated: carbonCredits,
      ccFactorUsed: factor,
      userContributions,
      notes: notes || '',
      operatorName: operatorName || req.user.fullName || 'Plant Chief Inspector',
      status: 'COMPLETED',
      processedAt: new Date()
    });

    // Update job status to COMPLETED
    job.status = 'COMPLETED';
    await job.save();

    // Update Dump Records to PROCESSED
    if (job.dumpRecordIds && job.dumpRecordIds.length > 0) {
      await DumpRecord.updateMany(
        { _id: { $in: job.dumpRecordIds.map(d => d._id) } },
        { status: 'PROCESSED' }
      );
    }

    return res.status(201).json({
      success: true,
      message: `Recycling audit verified! ${carbonCredits} Carbon Credits successfully minted.`,
      report
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const reports = await RecyclingReport.find({
      plantId: req.user._id
    })
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

export const getPlantStats = async (req, res) => {
  try {
    const reports = await RecyclingReport.find({ plantId: req.user._id }).lean();
    
    const totalReceivedKg = reports.reduce((acc, r) => acc + (r.receivedWeightKg || 0), 0);
    const totalRecycledKg = reports.reduce((acc, r) => acc + (r.recycledWeightKg || 0), 0);
    const totalCarbonCredits = reports.reduce((acc, r) => acc + (r.carbonCreditsGenerated || 0), 0);
    const avgEfficiency = reports.length > 0
      ? Number((reports.reduce((acc, r) => acc + (r.recoveryEfficiencyPercent || 0), 0) / reports.length).toFixed(1))
      : 0;

    return res.json({
      success: true,
      stats: {
        totalReports: reports.length,
        totalReceivedKg: Number(totalReceivedKg.toFixed(2)),
        totalRecycledKg: Number(totalRecycledKg.toFixed(2)),
        totalCarbonCredits: Number(totalCarbonCredits.toFixed(2)),
        avgEfficiency
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
