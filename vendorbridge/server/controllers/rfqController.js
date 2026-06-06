import RFQ from '../models/RFQ.js';
import Vendor from '../models/Vendor.js';
import Quotation from '../models/Quotation.js';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';
import { createNotification } from '../utils/notifier.js';

// Get RFQs list (filtered by role)
export const getRFQs = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'Vendor') {
      // Find Vendor record that matches the logged-in user's email
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        return res.status(200).json([]); // No vendor profile associated yet
      }
      // Vendor only sees Open/Closed/Awarded RFQs assigned to them
      query = {
        assignedVendors: vendor._id,
        status: { $ne: 'Draft' }
      };
    }

    const rfqs = await RFQ.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedVendors', 'companyName email')
      .sort({ createdAt: -1 });

    res.status(200).json(rfqs);
  } catch (error) {
    console.error('Error fetching RFQs:', error);
    res.status(500).json({ message: 'Error retrieving RFQ list' });
  }
};

// Get RFQ details (including quotations filtered by permissions)
export const getRFQById = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedVendors', 'companyName contactPerson email phone');

    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    let quotations = [];

    if (req.user.role === 'Vendor') {
      // Vendors only see their own quotation
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (vendor) {
        quotations = await Quotation.find({ rfqId: rfq._id, vendorId: vendor._id })
          .populate('vendorId', 'companyName email');
      }
    } else {
      // Admins, Procurement Officers, and Managers see all quotations
      quotations = await Quotation.find({ rfqId: rfq._id })
        .populate('vendorId', 'companyName contactPerson email phone rating');
    }

    res.status(200).json({
      rfq,
      quotations
    });
  } catch (error) {
    console.error('Error fetching RFQ details:', error);
    res.status(500).json({ message: 'Error retrieving RFQ details' });
  }
};

// Create a new RFQ
export const createRFQ = async (req, res) => {
  const { title, description, items, deadline, assignedVendors } = req.body;

  try {
    if (!title || !description || !items || !items.length || !deadline) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const rfq = await RFQ.create({
      title,
      description,
      items,
      deadline,
      assignedVendors: assignedVendors || [],
      createdBy: req.user._id,
      status: 'Draft'
    });

    await logActivity(req.user._id, 'Created RFQ Draft', 'RFQ', `RFQ "${title}" (ID: ${rfq._id}) created as draft.`);

    res.status(201).json(rfq);
  } catch (error) {
    console.error('Error creating RFQ:', error);
    res.status(500).json({ message: 'Error creating RFQ record' });
  }
};

// Update an RFQ (and trigger notifications if status transitions to Open)
export const updateRFQ = async (req, res) => {
  const { title, description, items, deadline, assignedVendors, status } = req.body;

  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    const oldStatus = rfq.status;

    // Apply updates
    if (title) rfq.title = title;
    if (description) rfq.description = description;
    if (items) rfq.items = items;
    if (deadline) rfq.deadline = deadline;
    if (assignedVendors) rfq.assignedVendors = assignedVendors;
    if (status) rfq.status = status;

    await rfq.save();

    await logActivity(
      req.user._id,
      'Updated RFQ',
      'RFQ',
      `RFQ "${rfq.title}" updated. Status transitioned from ${oldStatus} to ${rfq.status}.`
    );

    // If RFQ is opened, notify the assigned vendors' users
    if (oldStatus === 'Draft' && rfq.status === 'Open' && rfq.assignedVendors.length > 0) {
      // Find vendors
      const vendors = await Vendor.find({ _id: { $in: rfq.assignedVendors } });
      const vendorEmails = vendors.map(v => v.email);
      
      // Find matching user accounts for these vendors
      const vendorUsers = await User.find({ email: { $in: vendorEmails }, role: 'Vendor' });
      
      for (const u of vendorUsers) {
        await createNotification(
          u._id,
          `A new RFQ "${rfq.title}" has been assigned to you. Deadline: ${new Date(rfq.deadline).toLocaleDateString()}`,
          'RFQ_CREATED'
        );
      }
    }

    res.status(200).json(rfq);
  } catch (error) {
    console.error('Error updating RFQ:', error);
    res.status(500).json({ message: 'Error updating RFQ record' });
  }
};
