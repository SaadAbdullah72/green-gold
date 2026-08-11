import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app.js';
import { connectDB } from './config/db.js';

// Vercel Serverless Functions should not use app.listen or long-running setIntervals
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 GreenGold OS Backend API Server running on http://localhost:${PORT}`);
  });
}

// Ensure DB is connected for serverless invocations
connectDB().catch(err => {
  console.error('MongoDB Initialization Warning:', err.message);
});

export default app;
