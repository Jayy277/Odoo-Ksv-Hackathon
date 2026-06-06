import mongoose from 'mongoose';

const POItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true }
});

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [POItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true }, // 18% GST
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Created', 'Sent', 'Acknowledged', 'Completed'],
    default: 'Created'
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PurchaseOrder', PurchaseOrderSchema);
