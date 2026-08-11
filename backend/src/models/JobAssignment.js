import mongoose from 'mongoose';

const jobAssignmentSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    assignedAt: { type: Date, default: Date.now },
    responseDeadline: { type: Date, required: true },

    status: {
      type: String,
      enum: ['ASSIGNED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'IN_PROGRESS', 'PARTIALLY_DELAYED', 'COMPLETED'],
      default: 'ASSIGNED'
    },

    respondedAt: { type: Date },
    acceptedAt: { type: Date },
    declinedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },

    declineReason: { type: String },
    delayReason: { type: String },
    completionNotes: { type: String },

    binsAssigned: { type: Number, default: 2 },
    binsCompleted: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const JobAssignment = mongoose.model('JobAssignment', jobAssignmentSchema);
