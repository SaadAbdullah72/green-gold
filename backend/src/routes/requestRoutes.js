import express from 'express';
import {
  createRequest,
  createWasteCollectionRequest,
  getMyRequests,
  getMyWasteCollectionRequests,
  getRequestById
} from '../controllers/requestController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/', requireRole('USER'), createRequest);
router.post('/collection', requireRole('USER'), createWasteCollectionRequest);
router.get('/my', requireRole('USER'), getMyRequests);
router.get('/collection/my', requireRole('USER'), getMyWasteCollectionRequests);
router.get('/:id', getRequestById);

export default router;
