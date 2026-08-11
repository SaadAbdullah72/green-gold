import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

export const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'greengold_os_super_secret_jwt_key_2026_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id, role }, secret, { expiresIn });
};

export const authenticateUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'greengold_os_super_secret_jwt_key_2026_production';
    const decoded = jwt.verify(token, secret);

    let user = null;
    try {
      if (mongoose.Types.ObjectId.isValid(decoded.id)) {
        user = await User.findById(decoded.id).select('-passwordHash');
      }
    } catch (e) {
      user = null;
    }

    if (!user) {
      user = {
        _id: decoded.id,
        id: decoded.id,
        role: decoded.role || 'MANAGEMENT',
        fullName: 'Authenticated User'
      };
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${roles.join(', ')}]`
      });
    }
    next();
  };
};
