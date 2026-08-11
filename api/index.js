import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

// Ensure DB is connected for serverless invocations
connectDB().catch(err => {
  console.error('MongoDB Initialization Warning:', err.message);
});

export default app;
