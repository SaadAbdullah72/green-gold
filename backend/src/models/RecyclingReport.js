import mongoose from 'mongoose';

const recyclingReportSchema = new mongoose.Schema(
  {
    reportCode: { type: String, required: true, unique: true },
    plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plantName: { type: String, required: true },
    transportJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportJob', required: true },
    dumpRecordIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DumpRecord' }],
    wasteType: { 
      type: String, 
      enum: ['Organic/Compost', 'Plastic', 'Metal', 'General Mixed'], 
      required: true 
    },
    receivedWeightKg: { type: Number, required: true, min: 0 },
    recycledWeightKg: { type: Number, required: true, min: 0 },
    rejectedWeightKg: { type: Number, default: 0 },
    recoveryEfficiencyPercent: { type: Number, default: 0 },
    // Carbon credits generated formula: recycledWeightKg * factor
    carbonCreditsGenerated: { type: Number, required: true, default: 0 },
    ccFactorUsed: { type: Number, default: 0.5 },
    
    // Breakdown per original user/generator for distributed reporting
    userContributions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organizationName: { type: String },
        clientCode: { type: String },
        rawKg: { type: Number },
        recycledKg: { type: Number },
        carbonCreditsEarned: { type: Number }
      }
    ],

    notes: { type: String, default: '' },
    operatorName: { type: String, default: 'Plant Chief Inspector' },
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED', 'VERIFIED'],
      default: 'COMPLETED'
    },
    processedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const RecyclingReport = mongoose.model('RecyclingReport', recyclingReportSchema);
