import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Connected to MongoDB for provisioning...');

    const mgmtEmail = 'saad489254@gmail.com';
    const passwordHash = await User.hashPassword('admin123');

    // Create or Update Management Account
    await User.findOneAndUpdate(
      { email: mgmtEmail },
      {
        fullName: 'System Operations Management',
        email: mgmtEmail,
        phone: '+92 300 0000000',
        passwordHash,
        role: 'MANAGEMENT',
        employeeId: 'MGMT-001',
        department: 'Operations Command'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Management Account Ready!');
    console.log('----------------------------------------------------');
    console.log('🔑 MANAGEMENT Login:  saad489254@gmail.com / admin123');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Provisioning Error:', error);
    process.exit(1);
  }
};

seedDatabase();
