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
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check (no DB needed)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    system: 'GreenGold OS Bin Deployment Management System API',
    timestamp: new Date().toISOString()
  });
});

// Ensure DB is connected before hitting any API route
app.use('/api', ensureDBConnected);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/iot', iotRoutes);

// Error Handler
app.use(errorHandler);

export default app;
