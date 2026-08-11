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
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
      maxPoolSize: 10,
    });
    cachedConnection = conn;
    console.log(`✅ MONGODB CONNECTED: ${conn.connection.host}`);
    
    // Auto-seed management account (safe, won't crash if it fails)
    try {
      await autoSeedManagementAccount();
    } catch (seedErr) {
      console.error('Seed notice:', seedErr.message);
    }
    
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    throw err;
  }
};

// Middleware to ensure DB is connected before handling requests
export const ensureDBConnected = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database temporarily unavailable. Please try again.' });
  }
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
