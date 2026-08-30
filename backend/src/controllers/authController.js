import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { saveUsersToDisk } from '../config/persistence.js';

const JWT_SECRET = process.env.JWT_SECRET || 'greengold_os_super_secret_jwt_key_2026_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const sanitizeUser = (user) => {
  return {
    id: user._id || user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    secondaryPhone: user.secondaryPhone || user.phone,
    organizationName: user.organizationName,
    address: user.address,
    town: user.town,
    city: user.city || 'Islamabad',
    employeeId: user.employeeId,
    department: user.department,
    vehicleNumber: user.vehicleNumber,
    plantType: user.plantType,
    plantCapacityTons: user.plantCapacityTons,
    lat: user.lat,
    lng: user.lng,
    workerStatus: user.workerStatus
  };
};

const syncUsersToDisk = async () => {
  try {
    const allUsers = await User.find({}).select('+passwordHash').lean();
    saveUsersToDisk(allUsers);
  } catch (e) {
    console.error('Disk sync error:', e.message);
  }
};

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, organizationName, address, town, city } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, phone and password.' });
    }
    
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered. Please sign in.' });
    }

    const passwordHash = await User.hashPassword(password);
    const newUser = await User.create({
      fullName,
      email: cleanEmail,
      phone,
      secondaryPhone: phone,
      passwordHash,
      role: 'USER',
      organizationName: organizationName || fullName,
      address: address || 'Islamabad',
      town: town || 'F-7',
      city: city || 'Islamabad'
    });

    await syncUsersToDisk();

    const token = generateToken(newUser._id, newUser.role);
    return res.status(201).json({
      success: true,
      message: 'Customer account registered successfully in MongoDB and saved to disk',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('registerUser Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const registerManagement = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Management accounts are pre-provisioned. Please sign in directly with management credentials.'
  });
};

export const registerTechnical = async (req, res) => {
  try {
    const { fullName, email, phone, secondaryPhone, password } = req.body;

    if (!fullName || !email || !password || !phone || !secondaryPhone) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, password, primary phone AND secondary emergency phone number.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered. Please sign in.' });
    }

    // Auto-calculate sequential Employee ID (T-101, T-102, T-103...)
    const techCount = await User.countDocuments({ role: 'TECHNICAL' });
    const autoEmployeeId = `T-${101 + techCount}`;

    const passwordHash = await User.hashPassword(password);
    const newUser = await User.create({
      fullName,
      email: cleanEmail,
      phone,
      secondaryPhone,
      passwordHash,
      role: 'TECHNICAL',
      employeeId: autoEmployeeId,
      workerStatus: 'IDLE'
    });

    await syncUsersToDisk();

    const token = generateToken(newUser._id, newUser.role);
    return res.status(201).json({
      success: true,
      message: `Technical staff account registered successfully in MongoDB with ID ${autoEmployeeId}`,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('registerTechnical Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const registerCollector = async (req, res) => {
  try {
    const { fullName, email, phone, secondaryPhone, password, vehicleNumber, zone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, password and phone number.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered. Please sign in.' });
    }

    const collectorCount = await User.countDocuments({ role: 'COLLECTOR' });
    const autoEmployeeId = `C-${101 + collectorCount}`;
    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      fullName,
      email: cleanEmail,
      phone,
      secondaryPhone: secondaryPhone || phone,
      passwordHash,
      role: 'COLLECTOR',
      employeeId: autoEmployeeId,
      department: 'Waste Collection',
      town: zone || 'F-7',
      vehicleNumber: vehicleNumber || 'ICT-GRN-9912',
      workerStatus: 'IDLE'
    });

    await syncUsersToDisk();

    const token = generateToken(newUser._id, newUser.role);
    return res.status(201).json({
      success: true,
      message: `Collector account registered successfully with ID ${autoEmployeeId}`,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('registerCollector Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const registerTransporter = async (req, res) => {
  try {
    const { fullName, email, phone, secondaryPhone, password, vehicleNumber } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, password and phone number.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered. Please sign in.' });
    }

    const trnCount = await User.countDocuments({ role: 'TRANSPORTER' });
    const autoEmployeeId = `TRN-${101 + trnCount}`;
    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      fullName,
      email: cleanEmail,
      phone,
      secondaryPhone: secondaryPhone || phone,
      passwordHash,
      role: 'TRANSPORTER',
      employeeId: autoEmployeeId,
      department: 'Logistics & Inter-Facility Transport',
      vehicleNumber: vehicleNumber || `ICT-TRN-${1001 + trnCount}`,
      workerStatus: 'IDLE'
    });

    await syncUsersToDisk();

    const token = generateToken(newUser._id, newUser.role);
    return res.status(201).json({
      success: true,
      message: `Transporter account registered with ID ${autoEmployeeId}`,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('registerTransporter Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const registerRecyclingPlant = async (req, res) => {
  try {
    const { organizationName, fullName, email, phone, password, address, plantType, plantCapacityTons } = req.body;

    if (!organizationName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide plant organization name, email, password and phone.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered. Please sign in.' });
    }

    const plantCount = await User.countDocuments({ role: 'RECYCLING_PLANT' });
    const autoEmployeeId = `PLANT-${101 + plantCount}`;
    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      fullName: fullName || organizationName,
      organizationName,
      email: cleanEmail,
      phone,
      secondaryPhone: phone,
      passwordHash,
      role: 'RECYCLING_PLANT',
      employeeId: autoEmployeeId,
      department: 'Industrial Resource Recovery',
      address: address || 'Industrial Area, Sector I-9, Islamabad',
      plantType: plantType || 'Organic/Compost',
      plantCapacityTons: plantCapacityTons || 50,
      workerStatus: 'IDLE'
    });

    await syncUsersToDisk();

    const token = generateToken(newUser._id, newUser.role);
    return res.status(201).json({
      success: true,
      message: `Recycling Plant account registered with ID ${autoEmployeeId}`,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('registerRecyclingPlant Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const registerDumpFacility = async (req, res) => {
  try {
    const { organizationName, fullName, email, phone, password, address, town, city } = req.body;

    if (!organizationName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide facility organization name, email, password and phone.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered. Please sign in.' });
    }

    const dumpCount = await User.countDocuments({ role: 'DUMP_FACILITY' });
    const autoEmployeeId = `DUMP-${101 + dumpCount}`;
    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      fullName: fullName || organizationName,
      organizationName,
      email: cleanEmail,
      phone,
      secondaryPhone: phone,
      passwordHash,
      role: 'DUMP_FACILITY',
      employeeId: autoEmployeeId,
      department: 'Central Processing & Yard Logistics',
      address: address || 'Sector I-9/1 Industrial Hub, Islamabad',
      town: town || 'I-9',
      city: city || 'Islamabad',
      workerStatus: 'IDLE'
    });

    await syncUsersToDisk();

    const token = generateToken(newUser._id, newUser.role);
    return res.status(201).json({
      success: true,
      message: `Dumping Facility account registered with ID ${autoEmployeeId}`,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('registerDumpFacility Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Seed helper for instant demo accounts
const SEEDED_ACCOUNTS = [
  {
    email: 'saad489254@gmail.com',
    passwords: ['saad123', 'admin123'],
    data: {
      fullName: 'System Operations Management',
      phone: '+92 300 0000000',
      secondaryPhone: '+92 300 0000000',
      role: 'MANAGEMENT',
      employeeId: 'MGMT-001',
      department: 'Operations Command'
    }
  },
  // 4 Waste Collectors (Smart Bins -> Dump Yard)
  {
    email: 'collector1@greengold.com',
    passwords: ['collector123'],
    data: {
      fullName: 'Collector Driver Tariq Jamil',
      phone: '+92 321 5550101',
      secondaryPhone: '+92 321 5550199',
      role: 'COLLECTOR',
      employeeId: 'C-101',
      department: 'Waste Collection Fleet',
      town: 'F-7',
      vehicleNumber: 'ICT-GRN-9901',
      workerStatus: 'IDLE'
    }
  },
  {
    email: 'collector@greengold.com',
    passwords: ['collector123'],
    data: {
      fullName: 'Collector Driver Tariq Jamil',
      phone: '+92 321 5550101',
      secondaryPhone: '+92 321 5550199',
      role: 'COLLECTOR',
      employeeId: 'C-101',
      department: 'Waste Collection Fleet',
      town: 'F-7',
      vehicleNumber: 'ICT-GRN-9901',
      workerStatus: 'IDLE'
    }
  },
  {
    email: 'collector2@greengold.com',
    passwords: ['collector123'],
    data: {
      fullName: 'Collector Driver Zubair Ali',
      phone: '+92 321 5550102',
      secondaryPhone: '+92 321 5550199',
      role: 'COLLECTOR',
      employeeId: 'C-102',
      department: 'Waste Collection Fleet',
      town: 'G-5',
      vehicleNumber: 'ICT-GRN-9902',
      workerStatus: 'IDLE'
    }
  },
  {
    email: 'collector3@greengold.com',
    passwords: ['collector123'],
    data: {
      fullName: 'Collector Driver Usman Ghani',
      phone: '+92 321 5550103',
      secondaryPhone: '+92 321 5550199',
      role: 'COLLECTOR',
      employeeId: 'C-103',
      department: 'Waste Collection Fleet',
      town: 'E-9',
      vehicleNumber: 'ICT-GRN-9903',
      workerStatus: 'IDLE'
    }
  },
  {
    email: 'collector4@greengold.com',
    passwords: ['collector123'],
    data: {
      fullName: 'Collector Driver Farhan Malik',
      phone: '+92 321 5550104',
      secondaryPhone: '+92 321 5550199',
      role: 'COLLECTOR',
      employeeId: 'C-104',
      department: 'Waste Collection Fleet',
      town: 'F-6',
      vehicleNumber: 'ICT-GRN-9904',
      workerStatus: 'IDLE'
    }
  },
  // 4 Transporters (Dump Yard -> Recycling Plant)
  {
    email: 'transporter1@greengold.com',
    passwords: ['transport123'],
    data: {
      fullName: 'Transporter Aslam Khan',
      phone: '+92 312 9001001',
      secondaryPhone: '+92 312 9001099',
      role: 'TRANSPORTER',
      employeeId: 'TRN-101',
      department: 'Logistics Transport',
      vehicleNumber: 'ICT-TRN-1001',
      workerStatus: 'IDLE'
    }
  },
  {
    email: 'transporter2@greengold.com',
    passwords: ['transport123'],
    data: {
      fullName: 'Transporter Bilal Ahmed',
      phone: '+92 312 9001002',
      secondaryPhone: '+92 312 9001099',
      role: 'TRANSPORTER',
      employeeId: 'TRN-102',
      department: 'Logistics Transport',
      vehicleNumber: 'ICT-TRN-1002',
      workerStatus: 'IDLE'
    }
  },
  {
    email: 'transporter3@greengold.com',
    passwords: ['transport123'],
    data: {
      fullName: 'Transporter Kamran Shah',
      phone: '+92 312 9001003',
      secondaryPhone: '+92 312 9001099',
      role: 'TRANSPORTER',
      employeeId: 'TRN-103',
      department: 'Logistics Transport',
      vehicleNumber: 'ICT-TRN-1003',
      workerStatus: 'IDLE'
    }
  },
  {
    email: 'transporter4@greengold.com',
    passwords: ['transport123'],
    data: {
      fullName: 'Transporter Danish Raza',
      phone: '+92 312 9001004',
      secondaryPhone: '+92 312 9001099',
      role: 'TRANSPORTER',
      employeeId: 'TRN-104',
      department: 'Logistics Transport',
      vehicleNumber: 'ICT-TRN-1004',
      workerStatus: 'IDLE'
    }
  },
  // 3 Recycling Plants (Pakistan-based)
  {
    email: 'pakrecycling@greengold.com',
    passwords: ['plant123'],
    data: {
      fullName: 'Engr. Tariq Mahmood (Pak Recycling)',
      organizationName: 'Pak Recycling Ltd (Organic & Compost)',
      phone: '+92 51 4430111',
      secondaryPhone: '+92 300 5550222',
      role: 'RECYCLING_PLANT',
      employeeId: 'PLANT-101',
      department: 'Organic Waste Processing',
      address: 'Plot 42, Sector I-9/2 Industrial Area, Islamabad',
      plantType: 'Organic/Compost',
      plantCapacityTons: 80,
      lat: 33.6628,
      lng: 73.0489,
      workerStatus: 'IDLE'
    }
  },
  {
    email: 'ecopak@greengold.com',
    passwords: ['plant123'],
    data: {
      fullName: 'Haji Rafiq (EcoPak Plastics)',
      organizationName: 'EcoPak Plastics Recycling Facility',
      phone: '+92 51 4430222',
      secondaryPhone: '+92 300 5550333',
      role: 'RECYCLING_PLANT',
      employeeId: 'PLANT-102',
      department: 'Polymer Reprocessing Unit',
      address: 'Industrial Triangle, Kahuta Road, Islamabad',
      plantType: 'Plastic',
      plantCapacityTons: 60,
      lat: 33.5684,
      lng: 73.1610,
      workerStatus: 'IDLE'
    }
  },
  {
    email: 'greentech@greengold.com',
    passwords: ['plant123'],
    data: {
      fullName: 'Zubair Qureshi (GreenTech Metal)',
      organizationName: 'GreenTech Metal & Materials Recovery',
      phone: '+92 51 4430333',
      secondaryPhone: '+92 300 5550444',
      role: 'RECYCLING_PLANT',
      employeeId: 'PLANT-103',
      department: 'Heavy Scrap Smelting',
      address: 'Plot 18, Sector I-10/3 Industrial Area, Islamabad',
      plantType: 'Metal',
      plantCapacityTons: 100,
      lat: 33.6512,
      lng: 73.0321,
      workerStatus: 'IDLE'
    }
  },
  // Dumping Facility / Central Waste Separation Yard
  {
    email: 'dumpyard@greengold.com',
    passwords: ['dump123'],
    data: {
      fullName: 'Supervisor Rashid Mahmood (Central Dump Yard)',
      organizationName: 'Capital Green Central Waste & Dumping Facility',
      phone: '+92 51 4430999',
      secondaryPhone: '+92 300 5550999',
      role: 'DUMP_FACILITY',
      employeeId: 'DUMP-101',
      department: 'Central Processing & Yard Logistics',
      address: 'Sector I-9/1 Industrial Hub, Islamabad',
      town: 'I-9',
      city: 'Islamabad',
      lat: 33.6660,
      lng: 73.0410,
      workerStatus: 'IDLE'
    }
  }
];

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    const matchSeed = SEEDED_ACCOUNTS.find(s => s.email === cleanEmail);

    let user = null;
    try {
      user = await User.findOne({ email: cleanEmail }).select('+passwordHash');
    } catch (dbErr) {
      console.error('DB query fallback:', dbErr.message);
    }

    // Direct Instant Seed Fallback (guarantees login works even if DB connection is cold)
    if (matchSeed && matchSeed.passwords.includes(password)) {
      const demoUser = user || {
        _id: 'seed_' + (matchSeed.data.employeeId || '001'),
        ...matchSeed.data,
        email: cleanEmail
      };

      // Try async seed creation if not already created
      if (!user) {
        User.hashPassword(password)
          .then(hash => User.create({ ...matchSeed.data, email: cleanEmail, passwordHash: hash }))
          .catch(() => {});
      }

      const token = generateToken(demoUser._id || demoUser.id, demoUser.role);
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${demoUser.fullName}!`,
        token,
        user: sanitizeUser(demoUser)
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please check your credentials or register.'
      });
    }

    let isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your password.' });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('login Error:', err.message);
    return res.status(500).json({ success: false, message: 'Login error: ' + err.message });
  }
};

export const logout = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
