import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Notification target
  message: { type: String, required: true },
  type: { type: String, required: true }, // e.g. "RFQ_CREATED", "QUOTATION_SUBMITTED", "APPROVAL_ACTION", "PO_GENERATED", "INVOICE_SENT"
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', NotificationSchema);
