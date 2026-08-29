import express from 'express';
import { 
  getAllRequests, 
  getCollectionQueue,
  getActiveSites,
  approveRequest, 
  declineRequest, 
  getTechnicalWorkers,
  getCollectors,
  assignCollectorToPickup,
  assignJob,
  deleteActiveSite
} from '../controllers/managementController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.use(requireRole('MANAGEMENT'));

router.get('/requests', getAllRequests);
router.get('/collection-queue', getCollectionQueue);
router.get('/active-sites', getActiveSites);
router.delete('/active-sites/:id', deleteActiveSite);
router.patch('/requests/:id/approve', approveRequest);
router.patch('/requests/:id/decline', declineRequest);

router.get('/workers', getTechnicalWorkers);
router.get('/collectors', getCollectors);
router.post('/collectors/:pickupId/assign', assignCollectorToPickup);
router.post('/jobs/:requestId/assign', assignJob);

export default router;
