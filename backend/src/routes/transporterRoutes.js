import express from 'express';
import {
  getMyTransportJobs,
  acceptTransportJob,
  startTransitTransportJob,
  markDeliveredTransportJob
} from '../controllers/transporterController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles('TRANSPORTER', 'MANAGEMENT'));

router.get('/jobs', getMyTransportJobs);
router.patch('/jobs/:jobId/accept', acceptTransportJob);
router.patch('/jobs/:jobId/transit', startTransitTransportJob);
router.patch('/jobs/:jobId/delivered', markDeliveredTransportJob);

export default router;
