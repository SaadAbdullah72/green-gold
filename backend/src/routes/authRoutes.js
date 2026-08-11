import express from 'express';
import { 
  registerUser, 
  registerManagement, 
  registerTechnical, 
  login, 
  logout, 
  getMe 
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/register/user', registerUser);
router.post('/register/management', registerManagement);
router.post('/register/technical', registerTechnical);

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);

export default router;
