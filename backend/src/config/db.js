import mongoose from 'mongoose';

// Cached connection for serverless environments
let cachedConnection = null;

export const connectDB = async () => {
  // If already connected, reuse
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }

  const fallbackUri = 'mongodb+srv://saad489254_db_user:RXYHYFoiS3ePpiOb@cluster0.t2dgddz.mongodb.net/greengold_os?retryWrites=true&w=majority';
  const connStr = process.env.MONGODB_URI || fallbackUri;

  try {
    const conn = await mongoose.connect(connStr, { 
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 20000,
      bufferCommands: false,
      maxPoolSize: 5,
    });
    cachedConnection = conn;
    console.log(`✅ MONGODB CONNECTED: ${conn.connection.host}`);
    
    // Auto-seed management account in background
    autoSeedManagementAccount().catch(() => {});
    
    return conn;
  } catch (err) {
    console.error(`MongoDB Connection Notice: ${err.message}`);
    return null;
  }
};

// Middleware to ensure DB connection is active without hard-blocking
export const ensureDBConnected = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    // Non-blocking
  }
  next();
};

async function autoSeedManagementAccount() {
  const { User } = await import('../models/User.js');
  
  const mgmtEmail = 'saad489254@gmail.com';
  const existingMgmt = await User.findOne({ email: mgmtEmail });
  
  if (existingMgmt) {
    const passwordHash = await User.hashPassword('saad123');
    existingMgmt.passwordHash = passwordHash;
    await existingMgmt.save();
    console.log('✅ Management Account Updated: saad489254@gmail.com / saad123');
  } else {
    const passwordHash = await User.hashPassword('saad123');
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
    console.log('✅ Management Account Created: saad489254@gmail.com / saad123');
  }
}
