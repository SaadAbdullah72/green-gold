import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app.js';
import { connectDB } from './config/db.js';
import { startWorkerTimeoutEngine } from './services/workerTimeoutService.js';

const PORT = process.env.PORT || 5000;

// 1. Start HTTP Express Server IMMEDIATELY on port 5000
const server = app.listen(PORT, () => {
  console.log(`🚀 GreenGold OS Backend API Server running on http://localhost:${PORT}`);
  console.log(`📡 Accepting client requests from: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

// 2. Connect to MongoDB asynchronously without blocking HTTP server
connectDB().then(() => {
  // 3. Start 5-Minute Worker Assignment Timeout Engine once DB is connected
  startWorkerTimeoutEngine(10000);
}).catch(err => {
  console.error('MongoDB Initialization Warning:', err.message);
});
