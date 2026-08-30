import express from 'express';
import {
  getMyDeliveries,
  submitRecyclingReport,
  getMyReports,
  getPlantStats
} from '../controllers/recyclingController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles('RECYCLING_PLANT', 'MANAGEMENT'));

router.get('/deliveries', getMyDeliveries);
router.post('/report', submitRecyclingReport);
router.get('/reports', getMyReports);
router.get('/stats', getPlantStats);

export default router;
