import express from 'express';
import { 
  getMyJobs, 
  acceptJob, 
  declineJob, 
  startWork, 
  delayJob,
  completeWork 
} from '../controllers/technicalController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.use(requireRole('TECHNICAL'));

router.get('/jobs', getMyJobs);
router.patch('/jobs/:jobId/accept', acceptJob);
router.patch('/jobs/:jobId/decline', declineJob);
router.patch('/jobs/:jobId/start', startWork);
router.patch('/jobs/:jobId/delay', delayJob);
router.patch('/jobs/:jobId/complete', completeWork);

export default router;
