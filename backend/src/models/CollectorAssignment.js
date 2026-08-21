import mongoose from 'mongoose';

const collectorAssignmentSchema = new mongoose.Schema(
  {
    collectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pickupId: { type: String, required: true, index: true },
    binId: { type: String, default: '' },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', default: null },
    siteName: { type: String, default: '' },
    locationName: { type: String, default: '' },
    address: { type: String, default: '' },
    town: { type: String, default: 'F-7' },
    city: { type: String, default: 'Islamabad' },
    lat: { type: Number, default: 33.6844 },
    lng: { type: Number, default: 73.0479 },
    fillLevel: { type: Number, default: 0 },
    timeFullMinutes: { type: Number, default: 0 },
    urgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: {
      type: String,
      enum: ['ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'FLAGGED', 'DECLINED'],
      default: 'ASSIGNED'
    },
    notes: { type: String, default: '' },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const CollectorAssignment = mongoose.model('CollectorAssignment', collectorAssignmentSchema);
