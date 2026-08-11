import mongoose from 'mongoose';
import { loadUsersFromDisk } from './persistence.js';

export const connectDB = async () => {
  const connStr = process.env.MONGODB_URI;
  
  if (!connStr || connStr.includes('127.0.0.1')) {
    console.log(`⚠️ WARNING: You are currently using a Local MongoDB URI. For Live Cloud Database, please update MONGODB_URI in backend/.env with your MongoDB Atlas connection string!`);
  }

  try {
    const conn = await mongoose.connect(connStr, { 
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log(`✅ REAL MONGODB CONNECTED: ${conn.connection.host}:${conn.connection.port} / ${conn.connection.name}`);
    await autoSeedManagementAccount();
    return conn;
  } catch (err) {
    console.error(`❌ CRITICAL ERROR: Could not connect to MongoDB Database at ${connStr}`);
    console.error(`❌ Reason: ${err.message}`);
    console.error(`❌ Please ensure your MongoDB Atlas (Live Cloud) is running and the URI is correct in backend/.env`);
    process.exit(1); // Force exit if database connection fails
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
