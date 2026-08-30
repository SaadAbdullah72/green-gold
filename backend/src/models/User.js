import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    secondaryPhone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { 
      type: String, 
      enum: ['USER', 'MANAGEMENT', 'TECHNICAL', 'COLLECTOR', 'TRANSPORTER', 'RECYCLING_PLANT', 'DUMP_FACILITY'], 
      default: 'USER',
      required: true 
    },
    employeeId: { type: String, trim: true },
    department: { type: String, trim: true },
    organizationName: { type: String, trim: true },
    address: { type: String, trim: true },
    town: { type: String, trim: true },
    city: { type: String, trim: true, default: 'Islamabad' },
    vehicleNumber: { type: String, trim: true },
    plantType: { type: String, enum: ['Organic/Compost', 'Plastic', 'Metal', 'General Mixed', 'Multi-Stream'], default: 'Organic/Compost' },
    plantCapacityTons: { type: Number, default: 50 },
    workerStatus: { 
      type: String, 
      enum: ['IDLE', 'ASSIGNED', 'WORKING', 'BUSY', 'COMPLETED', 'OFFLINE'], 
      default: 'IDLE' 
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

// Method to match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Pre-save password hashing helper
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const User = mongoose.model('User', userSchema);
