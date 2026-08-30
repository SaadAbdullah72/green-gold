import express from 'express';
import { 
  registerUser, 
  registerManagement, 
  registerTechnical, 
  registerCollector,
  registerTransporter,
  registerRecyclingPlant,
  registerDumpFacility,
  login, 
  logout, 
  getMe 
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/register/user', registerUser);
router.post('/register/management', registerManagement);
router.post('/register/technical', registerTechnical);
router.post('/register/collector', registerCollector);
router.post('/register/transporter', registerTransporter);
router.post('/register/recycling-plant', registerRecyclingPlant);
router.post('/register/dump-facility', registerDumpFacility);

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);

export default router;

