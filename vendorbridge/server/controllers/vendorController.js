import Vendor from '../models/Vendor.js';
import RFQ from '../models/RFQ.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { logActivity } from '../utils/logger.js';

// Get all vendors with search & filter
export const getVendors = async (req, res) => {
  const { search, category, status } = req.query;

  try {
    let query = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    const vendors = await Vendor.find(query).sort({ companyName: 1 });
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Error retrieving vendor list' });
  }
};

// Get single vendor details with linked RFQs and POs
export const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Find all RFQs assigned to this vendor
    const rfqs = await RFQ.find({ assignedVendors: vendor._id }).sort({ createdAt: -1 });

    // Find all POs issued to this vendor
    const pos = await PurchaseOrder.find({ vendorId: vendor._id }).sort({ createdAt: -1 });

    res.status(200).json({
      vendor,
      rfqs,
      pos
    });
  } catch (error) {
    console.error('Error fetching vendor details:', error);
    res.status(500).json({ message: 'Error retrieving vendor details' });
  }
};

// Create a new vendor
export const createVendor = async (req, res) => {
  const { companyName, contactPerson, email, phone, gstNumber, category, status, rating } = req.body;

  try {
    if (!companyName || !contactPerson || !email || !phone || !gstNumber || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ message: 'Vendor already exists with this email address' });
    }

    const vendor = await Vendor.create({
      companyName,
      contactPerson,
      email,
      phone,
      gstNumber,
      category,
      status: status || 'Active',
      rating: rating || 4.5
    });

    await logActivity(req.user._id, 'Created Vendor', 'Vendor', `Vendor ${companyName} created successfully.`);

    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ message: 'Error creating vendor record' });
  }
};

// Update an existing vendor
export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await logActivity(
      req.user._id,
      'Updated Vendor',
      'Vendor',
      `Vendor ${updatedVendor.companyName} updated.`
    );

    res.status(200).json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Error updating vendor details' });
  }
};

// Delete a vendor
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await Vendor.findByIdAndDelete(req.params.id);

    await logActivity(
      req.user._id,
      'Deleted Vendor',
      'Vendor',
      `Vendor ${vendor.companyName} removed from database.`
    );

    res.status(200).json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Error deleting vendor record' });
  }
};
