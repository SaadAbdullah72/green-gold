import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { connectDB } from '../backend/src/config/db.js';
import { ServiceRequest } from '../backend/src/models/ServiceRequest.js';
import { CollectorAssignment } from '../backend/src/models/CollectorAssignment.js';
import { Notification } from '../backend/src/models/Notification.js';
import { User } from '../backend/src/models/User.js';

async function runReset() {
  await connectDB();
  await ServiceRequest.deleteMany({
    $or: [
      { requestType: 'WASTE_COLLECTION' },
      { organizationName: { $regex: /BIN-|Smart Bin|Maintenance Fault/i } },
      { siteName: { $regex: /BIN-|Smart Bin/i } },
      { description: { $regex: /IOT ALERT/i } },
      { notes: { $regex: /AUTO-DISPATCH/i } }
    ]
  });
  await CollectorAssignment.deleteMany({});
  await Notification.deleteMany({
    $or: [
      { type: 'BIN_FULL_ALERT' },
      { type: 'MAINTENANCE_ALERT' }
    ]
  });
  await User.updateMany({ role: 'COLLECTOR' }, { workerStatus: 'IDLE' });
  console.log('✅ DATABASE FULLY RESET & READY FOR FRESH PROTEUS TELEMETRY!');
  process.exit(0);
}

runReset();
