import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.use(requireRole('MANAGEMENT'));

router.get('/', getAuditLogs);

export default router;
