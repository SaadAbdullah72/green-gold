import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { connectDB } from '../backend/src/config/db.js';
import { ServiceRequest } from '../backend/src/models/ServiceRequest.js';
import { CollectorAssignment } from '../backend/src/models/CollectorAssignment.js';
import { JobAssignment } from '../backend/src/models/JobAssignment.js';
import { Notification } from '../backend/src/models/Notification.js';
import { User } from '../backend/src/models/User.js';

async function runReset() {
  try {
    await connectDB();
    console.log('🔄 Connected to MongoDB. Deleting all active requests & assignments...');

    const reqResult = await ServiceRequest.deleteMany({});
    console.log(`✅ Deleted ${reqResult.deletedCount} Service Requests (Deployment & Waste Collection)`);

    const colResult = await CollectorAssignment.deleteMany({});
    console.log(`✅ Deleted ${colResult.deletedCount} Collector Assignments`);

    const jobResult = await JobAssignment.deleteMany({});
    console.log(`✅ Deleted ${jobResult.deletedCount} Technical Job Assignments`);

    const notifResult = await Notification.deleteMany({});
    console.log(`✅ Deleted ${notifResult.deletedCount} Notifications`);

    await User.updateMany(
      { role: { $in: ['TECHNICAL', 'COLLECTOR', 'USER', 'MANAGEMENT'] } },
      { workerStatus: 'IDLE' }
    );
    console.log('✅ Reset all worker statuses to IDLE.');

    console.log('\n🎉 ALL REQUESTS AND QUEUES HAVE BEEN COMPLETELY CLEARED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset error:', err);
    process.exit(1);
  }
}

runReset();
