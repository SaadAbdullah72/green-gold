import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/greengold_os';

async function fixSiteRecords() {
  await mongoose.connect(MONGO_URI);
  
  const activeSite = await mongoose.connection.collection('servicerequests').findOne({
    requestType: 'BIN_DEPLOYMENT',
    status: { $in: ['COMPLETED', 'Completed'] }
  });

  console.log('Active Site Found:', activeSite ? { org: activeSite.organizationName, address: activeSite.address, town: activeSite.town } : 'None');

  const realOrg = (activeSite && activeSite.organizationName !== 'Customer Portal') ? activeSite.organizationName : 'Saad Abdullah';
  const realAddress = activeSite?.address || 'Saddar, Rawalpindi';
  const realTown = activeSite?.town || 'Saddar';
  const realCity = activeSite?.city || 'Islamabad';

  // Fix Dump Records
  const dumpFix = await mongoose.connection.collection('dumprecords').updateMany(
    {},
    {
      $set: {
        organizationName: realOrg,
        address: realAddress,
        town: realTown,
        city: realCity,
        binId: 'BIN-02-01'
      }
    }
  );
  console.log('Fixed Dump Records:', dumpFix.modifiedCount);

  // Fix Service Requests
  const reqFix = await mongoose.connection.collection('servicerequests').updateMany(
    { requestType: 'WASTE_COLLECTION' },
    {
      $set: {
        organizationName: realOrg,
        address: realAddress,
        town: realTown,
        city: realCity,
        siteName: `${realOrg} (BIN-02-01)`
      }
    }
  );
  console.log('Fixed Collection Requests:', reqFix.modifiedCount);

  // Fix Recycling Reports user contributions
  const recFix = await mongoose.connection.collection('recyclingreports').updateMany(
    {},
    {
      $set: {
        'userContributions.0.organizationName': realOrg,
        'userContributions.0.clientCode': 'CLIENT-01'
      }
    }
  );
  console.log('Fixed Recycling Reports:', recFix.modifiedCount);

  process.exit(0);
}
fixSiteRecords();
