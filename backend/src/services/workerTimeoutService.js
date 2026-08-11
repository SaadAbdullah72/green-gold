import { JobAssignment } from '../models/JobAssignment.js';
import { User } from '../models/User.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Checks for pending job assignments that have exceeded their 5-minute response deadline.
 * Automatically expires the assignment, releases the worker back to IDLE status,
 * and updates the service request assignment state.
 */
export const checkExpiredAssignments = async () => {
  try {
    const now = new Date();
    const expiredJobs = await JobAssignment.find({
      status: 'ASSIGNED',
      responseDeadline: { $lt: now }
    }).populate('workerId').populate('requestId');

    if (expiredJobs.length === 0) return;

    console.log(`⏱️ [Timeout Engine] Found ${expiredJobs.length} expired job assignment(s). Processing...`);

    for (const job of expiredJobs) {
      job.status = 'EXPIRED';
      job.respondedAt = now;
      await job.save();

      // Release worker back to IDLE
      if (job.workerId) {
        await User.findByIdAndUpdate(job.workerId._id, { workerStatus: 'IDLE' });
      }

      // Update Service Request status if needed
      if (job.requestId) {
        const activeAssignments = await JobAssignment.countDocuments({
          requestId: job.requestId._id,
          status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] }
        });

        const reqUpdate = { $inc: { assignedWorkersCount: -1 } };
        if (activeAssignments === 0) {
          reqUpdate.status = 'ASSIGNING';
        }
        await ServiceRequest.findByIdAndUpdate(job.requestId._id, reqUpdate);

        // Notify Management
        const mgmtUsers = await User.find({ role: 'MANAGEMENT' });
        for (const mgmt of mgmtUsers) {
          await Notification.create({
            recipientId: mgmt._id,
            type: 'job_expired',
            title: 'Job Assignment Expired (5-Min Timeout)',
            message: `Assignment for worker ${job.workerId?.fullName || 'Worker'} on request #${job.requestId.requestNumber} expired after 5 minutes without response.`,
            relatedRequestId: job.requestId._id,
            relatedJobId: job._id
          });
        }

        // Notify Worker
        if (job.workerId) {
          await Notification.create({
            recipientId: job.workerId._id,
            type: 'job_expired',
            title: 'Job Assignment Expired',
            message: `Your assigned job for request #${job.requestId.requestNumber} has expired because it was not accepted within 5 minutes.`,
            relatedRequestId: job.requestId._id,
            relatedJobId: job._id
          });
        }
      }

      // Log Audit Entry
      await AuditLog.create({
        actorRole: 'SYSTEM_TIMEOUT_ENGINE',
        action: 'ASSIGNMENT_EXPIRED',
        entityType: 'JobAssignment',
        entityId: job._id,
        metadata: {
          requestId: job.requestId?._id,
          workerId: job.workerId?._id,
          workerName: job.workerId?.fullName,
          expiredAt: now
        }
      });

      console.log(`  [✓] Expired job #${job._id} for worker ${job.workerId?.fullName || 'Worker'}`);
    }
  } catch (error) {
    console.error('❌ Error in workerTimeoutService:', error.message);
  }
};

let timerInterval = null;

export const startWorkerTimeoutEngine = (intervalMs = 15000) => {
  if (timerInterval) clearInterval(timerInterval);
  console.log(`🚀 Server-side 5-Minute Worker Assignment Timeout Engine started (polling every ${intervalMs / 1000}s)...`);
  checkExpiredAssignments();
  timerInterval = setInterval(checkExpiredAssignments, intervalMs);
};
