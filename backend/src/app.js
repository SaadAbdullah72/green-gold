import express from 'express';
import cors from 'cors';
import { ensureDBConnected } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import managementRoutes from './routes/managementRoutes.js';
import technicalRoutes from './routes/technicalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import iotRoutes from './routes/iotRoutes.js';
import collectorRoutes from './routes/collectorRoutes.js';
import transporterRoutes from './routes/transporterRoutes.js';
import recyclingRoutes from './routes/recyclingRoutes.js';
import dumpFacilityRoutes from './routes/dumpFacilityRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check (no DB needed)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'OK',
    system: 'GreenGold OS Bin Deployment Management System API',
    timestamp: new Date().toISOString()
  });
});

// Ensure DB connection is initiated
app.use(ensureDBConnected);

// Mount API Routes under both /api and root prefixes for seamless serverless routing
const mountRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/requests`, requestRoutes);
  app.use(`${prefix}/management`, managementRoutes);
  app.use(`${prefix}/technical`, technicalRoutes);
  app.use(`${prefix}/collector`, collectorRoutes);
  app.use(`${prefix}/transporter`, transporterRoutes);
  app.use(`${prefix}/recycling`, recyclingRoutes);
  app.use(`${prefix}/dump-facility`, dumpFacilityRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/audit`, auditRoutes);
  app.use(`${prefix}/iot`, iotRoutes);
};

mountRoutes('/api');
mountRoutes('');

// Error Handler
app.use(errorHandler);

export default app;
