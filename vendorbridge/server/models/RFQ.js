import mongoose from 'mongoose';

const RFQItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true } // e.g. Pcs, Box, Kg, Hours
});

const RFQSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  items: [RFQItemSchema],
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Open', 'Closed', 'Awarded'],
    default: 'Draft'
  },
  assignedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('RFQ', RFQSchema);
