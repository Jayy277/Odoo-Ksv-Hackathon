import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  gstNumber: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true }, // e.g. IT, Office Supplies, Logistics
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  rating: { type: Number, default: 4.5, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Vendor', VendorSchema);
