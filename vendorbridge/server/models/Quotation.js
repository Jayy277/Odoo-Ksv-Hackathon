import mongoose from 'mongoose';

const QuotationItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
});

const QuotationSchema = new mongoose.Schema({
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [QuotationItemSchema],
  deliveryDays: { type: Number, required: true, min: 1 },
  notes: { type: String },
  totalAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Accepted', 'Rejected'],
    default: 'Submitted'
  },
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Quotation', QuotationSchema);
