import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true }
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  poId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true }, // 18% GST
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid'],
    default: 'Draft'
  },
  sentAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Invoice', InvoiceSchema);
