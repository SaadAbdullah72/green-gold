import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
    relatedJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobAssignment' },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
