import express from 'express';
import {
  getDumpFacilityRecords,
  getDumpFacilityAnalytics,
  separateDumpFacilityRecords,
  getDumpFacilityTransporters,
  getDumpFacilityRecyclingPlants,
  dispatchTransporterFromYard,
  getDumpFacilityTransportJobs
} from '../controllers/dumpFacilityController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Allow DUMP_FACILITY and MANAGEMENT
router.use(authenticateUser);
router.use(requireRole('DUMP_FACILITY', 'MANAGEMENT'));

router.get('/records', getDumpFacilityRecords);
router.get('/analytics', getDumpFacilityAnalytics);
router.post('/separate', separateDumpFacilityRecords);
router.get('/transporters', getDumpFacilityTransporters);
router.get('/recycling-plants', getDumpFacilityRecyclingPlants);
router.post('/dispatch', dispatchTransporterFromYard);
router.get('/jobs', getDumpFacilityTransportJobs);

export default router;
