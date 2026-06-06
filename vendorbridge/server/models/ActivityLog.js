import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. "Created RFQ", "Approved Quotation"
  module: { type: String, required: true }, // e.g. "RFQ", "Vendor", "Approval", "Auth"
  details: { type: String }, // e.g. "RFQ RFQ-2024-001 created"
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ActivityLog', ActivityLogSchema);
