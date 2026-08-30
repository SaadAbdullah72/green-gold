import mongoose from 'mongoose';

const transportJobSchema = new mongoose.Schema(
  {
    jobCode: { type: String, required: true, unique: true },
    transporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dumpRecordIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DumpRecord' }],
    recyclingPlantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plantName: { type: String, required: true },
    plantAddress: { type: String, default: 'Industrial Area, Sector I-9, Islamabad' },
    plantType: { type: String, enum: ['Organic/Compost', 'Plastic', 'Metal', 'General Mixed'], default: 'Organic/Compost' },
    totalWeightKg: { type: Number, required: true, min: 0.1 },
    wasteType: { type: String, required: true },
    originSite: { type: String, default: 'Islamabad Central Dump & Separation Yard' },
    vehicleNumber: { type: String, default: 'ICT-TRN-1001' },
    status: {
      type: String,
      enum: ['ASSIGNED', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'DECLINED'],
      default: 'ASSIGNED'
    },
    notes: { type: String, default: '' },
    assignedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    transitStartedAt: { type: Date },
    deliveredAt: { type: Date }
  },
  { timestamps: true }
);

export const TransportJob = mongoose.model('TransportJob', transportJobSchema);
