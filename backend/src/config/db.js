import mongoose from 'mongoose';
import { loadUsersFromDisk } from './persistence.js';

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return mongoose.connection;

  const fallbackUri = 'mongodb+srv://saad489254_db_user:RXYHYFoiS3ePpiOb@cluster0.t2dgddz.mongodb.net/greengold_os?retryWrites=true&w=majority';
  const connStr = process.env.MONGODB_URI || fallbackUri;
  
  if (!connStr || connStr.includes('127.0.0.1')) {
    console.log(`⚠️ WARNING: You are currently using a Local MongoDB URI.`);
  }

  try {
    const conn = await mongoose.connect(connStr, { 
      serverSelectionTimeoutMS: 5000, // Shorter timeout for serverless
      connectTimeoutMS: 5000
    });
    console.log(`✅ REAL MONGODB CONNECTED: ${conn.connection.host}:${conn.connection.port}`);
    await autoSeedManagementAccount();
    return conn;
  } catch (err) {
    console.error(`❌ CRITICAL ERROR: Could not connect to MongoDB Database`);
    console.error(`❌ Reason: ${err.message}`);
    // Do NOT process.exit(1) in serverless environments, it will crash the function entirely
    throw err;
  }
};

async function autoSeedManagementAccount() {
  try {
    const { User } = await import('../models/User.js');
    
    // Purge old dummy accounts from local MongoDB
    await User.deleteMany({ 
      email: { $in: ['admin@greengold.com.pk', 'generator@marriott.com.pk', 'tech1@greengold.com.pk'] } 
    });

    // Restore saved users from disk storage so accounts survive restarts
    const savedUsers = loadUsersFromDisk();
    for (const saved of savedUsers) {
      if (saved.email) {
        const cleanEmail = saved.email.toLowerCase().trim();
        const exists = await User.findOne({ email: cleanEmail });
        if (!exists) {
          await User.create(saved);
          console.log(`💾 Permanently Restored User from Disk: ${saved.email} (${saved.role})`);
        }
      }
    }

    const mgmtEmail = 'saad489254@gmail.com';
    const passwordHash = await User.hashPassword('saad123');
    const existingMgmt = await User.findOne({ email: mgmtEmail });
    
    if (existingMgmt) {
      existingMgmt.passwordHash = passwordHash;
      await existingMgmt.save();
      console.log('✅ Management Account Password Hash Updated in MongoDB to: saad123');
    } else {
      console.log('🌱 Provisioning System Management Account (saad489254@gmail.com)...');
      await User.create({
        fullName: 'System Operations Management',
        email: mgmtEmail,
        phone: '+92 300 0000000',
        secondaryPhone: '+92 300 0000000',
        passwordHash,
        role: 'MANAGEMENT',
        employeeId: 'MGMT-001',
        department: 'Operations Command'
      });
      console.log('✅ Management Account Provisioned: saad489254@gmail.com / saad123');
    }
  } catch (e) {
    console.error('Management auto-seed notice:', e.message);
  }
}
