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
  deleteActiveSite,
  getDumpRecords,
  createManualDumpRecord,
  separateDumpRecords,
  getTransporters,
  getRecyclingPlants,
  assignTransportJob,
  getAllTransportJobs,
  getAllRecyclingReports,
  getWasteTrackingOverview
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

// Waste Lifecycle & Transport Operations
router.get('/dump-records', getDumpRecords);
router.post('/dump-records', createManualDumpRecord);
router.post('/dump-records/separate', separateDumpRecords);
router.get('/transporters', getTransporters);
router.get('/recycling-plants', getRecyclingPlants);
router.post('/transport-jobs/assign', assignTransportJob);
router.get('/transport-jobs', getAllTransportJobs);
router.get('/recycling-reports', getAllRecyclingReports);
router.get('/waste-tracking', getWasteTrackingOverview);

export default router;

