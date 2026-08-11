import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

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

    numberOfBins: { type: Number, required: true, min: 1 },
    binType: { type: String, default: 'IoT Ultrasonic Smart Bin (240L)' },

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
        'CANCELLED'
      ],
      default: 'SUBMITTED'
    },
    priority: { type: String, enum: ['Standard', 'High', 'Urgent'], default: 'Standard' },

    requiredWorkers: { type: Number, required: true, default: 1 },
    assignedWorkersCount: { type: Number, default: 0 },
    completedBins: { type: Number, default: 0 },

    declineReason: { type: String },
    declinedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    declinedAt: { type: Date }
  },
  { timestamps: true }
);

serviceRequestSchema.index({ location: '2dsphere' });

export const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
