import mongoose from 'mongoose';

const dumpRecordSchema = new mongoose.Schema(
  {
    collectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    organizationName: { type: String, required: true },
    clientCode: { type: String },
    binId: { type: String, default: '' },
    address: { type: String, default: '' },
    town: { type: String, default: '' },
    city: { type: String, default: 'Islamabad' },
    weightKg: { type: Number, required: true, min: 0.1 },
    wasteType: { 
      type: String, 
      enum: ['Organic/Compost', 'Plastic', 'Metal', 'General Mixed'], 
      default: 'Organic/Compost' 
    },
    // Waste Separation tracking at Dump Site
    isSeparated: { type: Boolean, default: false },
    separatedAt: { type: Date },
    separatedType: { type: String, default: 'Organic/Compost' },
    
    // Lifecycle status
    status: {
      type: String,
      enum: ['DUMPED', 'SEPARATED', 'ASSIGNED_TRANSPORT', 'IN_TRANSIT', 'DELIVERED', 'PROCESSED'],
      default: 'DUMPED'
    },
    dumpedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const DumpRecord = mongoose.model('DumpRecord', dumpRecordSchema);
