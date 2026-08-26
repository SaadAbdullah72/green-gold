import express from 'express';
import { getMyPickupAssignments, acceptPickupAssignment, markPickupCompleted } from '../controllers/collectorController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.use(requireRole('COLLECTOR'));

router.get('/assignments', getMyPickupAssignments);
router.patch('/assignments/:assignmentId/accept', acceptPickupAssignment);
router.patch('/assignments/:assignmentId/complete', markPickupCompleted);

export default router;
