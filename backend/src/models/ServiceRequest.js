import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestType: {
      type: String,
      enum: ['BIN_DEPLOYMENT', 'WASTE_COLLECTION'],
      default: 'BIN_DEPLOYMENT'
    },

    organizationName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    secondaryPhone: { type: String },
    email: { type: String, required: true },

    address: { type: String, required: true },
    town: { type: String, required: true },
    city: { type: String, default: 'Islamabad' },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [73.0479, 33.6844]
      }
    },

    numberOfBins: { type: Number, min: 1 },
    binType: { type: String, default: 'IoT Ultrasonic Smart Bin (240L)' },

    siteName: { type: String },
    wasteType: { type: String },
    weightKg: { type: Number },
    collectedDate: { type: Date },
    notes: { type: String },
    assignedCollectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    preferredDate: { type: Date },
    preferredTime: { type: String },

    description: { type: String },
    specialInstructions: { type: String },
    attachments: [{ type: String }],

    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'PENDING_REVIEW',
        'APPROVED',
        'ASSIGNING',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETED',
        'DECLINED',
        'CANCELLED',
        'WAITING_COLLECTION',
        'ROUTED_FOR_COLLECTION',
        'ASSIGNED_TO_COLLECTOR'
      ],
      default: 'SUBMITTED'
    },
    priority: { type: String, enum: ['Standard', 'High', 'Urgent'], default: 'Standard' },

    requiredWorkers: { type: Number, required: true, default: 1 },
    assignedWorkersCount: { type: Number, default: 0 },
    completedBins: { type: Number, default: 0 },

    clientIndex: { type: Number },
    binPrefix: { type: String },
    deployedBinIds: [{ type: String }],
    installedAt: { type: Date },

    declineReason: { type: String },
    declinedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    declinedAt: { type: Date }
  },
  { timestamps: true }
);

serviceRequestSchema.index({ location: '2dsphere' });
serviceRequestSchema.index({ deployedBinIds: 1 });

export const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
