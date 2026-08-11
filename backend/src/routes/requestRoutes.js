import express from 'express';
import { createRequest, getMyRequests, getRequestById } from '../controllers/requestController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/', requireRole('USER'), createRequest);
router.get('/my', requireRole('USER'), getMyRequests);
router.get('/:id', getRequestById);

export default router;
