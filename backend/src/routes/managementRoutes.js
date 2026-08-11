import express from 'express';
import { 
  getAllRequests, 
  approveRequest, 
  declineRequest, 
  getTechnicalWorkers, 
  assignJob 
} from '../controllers/managementController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.use(requireRole('MANAGEMENT'));

router.get('/requests', getAllRequests);
router.patch('/requests/:id/approve', approveRequest);
router.patch('/requests/:id/decline', declineRequest);

router.get('/workers', getTechnicalWorkers);
router.post('/jobs/:requestId/assign', assignJob);

export default router;
