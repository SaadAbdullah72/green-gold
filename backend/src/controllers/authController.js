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

export const login = async (req, res) => {
  try {
    const { email, password, role: requestedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    const cleanEmail = (email || '').toLowerCase().trim();

    // Direct match check for saad489254@gmail.com / admin123
    let user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

    if (!user && cleanEmail === 'saad489254@gmail.com' && password === 'saad123') {
      const passwordHash = await User.hashPassword('saad123');
      user = await User.create({
        fullName: 'System Operations Management',
        email: 'saad489254@gmail.com',
        phone: '+92 300 0000000',
        secondaryPhone: '+92 300 0000000',
        passwordHash,
        role: 'MANAGEMENT',
        employeeId: 'MGMT-001',
        department: 'Operations Command'
      });
      await syncUsersToDisk();
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please register an account first.'
      });
    }

    // Auto-detect role from MongoDB document without blocking login

    const isMatch = await bcrypt.compare(password, user.passwordHash);

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
    return res.status(500).json({ success: false, message: err.message });
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
