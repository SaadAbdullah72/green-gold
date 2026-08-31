import { connectDB } from '../backend/src/config/db.js';
import { User } from '../backend/src/models/User.js';
import { DumpRecord } from '../backend/src/models/DumpRecord.js';
import { RecyclingReport } from '../backend/src/models/RecyclingReport.js';
import { ServiceRequest } from '../backend/src/models/ServiceRequest.js';

async function run() {
  await connectDB();

  const users = await User.find({ role: 'USER' });
  console.log('Found users:', users.map(u => ({ id: u._id, email: u.email, name: u.fullName })));

  const saadUser = users.find(u => u.email === 'saddar@gmail.com') || users[0];
  const nastpUser = users.find(u => u.email === 'nastp@gmail.com') || users[1] || saadUser;

  // Link dump records so both accounts have active dump records & carbon credits
  const dumps = await DumpRecord.find({});
  if (dumps.length >= 2) {
    dumps[0].userId = saadUser._id;
    dumps[0].organizationName = saadUser.organizationName || saadUser.fullName || 'Saad Abdullah';
    dumps[0].address = 'Saddar, Rawalpindi';
    await dumps[0].save();

    dumps[1].userId = nastpUser._id;
    dumps[1].organizationName = nastpUser.organizationName || nastpUser.fullName || 'nastp old airport';
    dumps[1].address = 'NASTP Rd, Chaklala, Rawalpindi';
    await dumps[1].save();
  }

  // Update reports user contributions
  const reports = await RecyclingReport.find({});
  if (reports.length >= 2) {
    reports[0].userContributions = [{
      userId: saadUser._id,
      organizationName: saadUser.organizationName || saadUser.fullName,
      recycledKg: reports[0].recycledWeightKg,
      carbonCreditsEarned: reports[0].carbonCreditsGenerated
    }];
    await reports[0].save();

    reports[1].userContributions = [{
      userId: nastpUser._id,
      organizationName: nastpUser.organizationName || nastpUser.fullName,
      recycledKg: reports[1].recycledWeightKg,
      carbonCreditsEarned: reports[1].carbonCreditsGenerated
    }];
    await reports[1].save();
  }

  console.log('✅ Successfully linked dump records and recycling reports to all active customer users!');
  process.exit(0);
}

run().catch(console.error);
