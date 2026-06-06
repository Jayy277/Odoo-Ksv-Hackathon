import Approval from '../models/Approval.js';
import RFQ from '../models/RFQ.js';
import Quotation from '../models/Quotation.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';
import { createNotification, notifyRoles } from '../utils/notifier.js';

// Get all approvals (filtered by role)
export const getApprovals = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Manager') {
      // Managers typically focus on pending approvals, but let them fetch all
      const { status } = req.query;
      if (status) query.status = status;
    }

    const approvals = await Approval.find(query)
      .populate({
        path: 'rfqId',
        select: 'title deadline status items'
      })
      .populate({
        path: 'quotationId',
        populate: { path: 'vendorId', select: 'companyName contactPerson email phone rating' }
      })
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(approvals);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ message: 'Error retrieving approvals' });
  }
};

// Create a new Approval Request (Procurement Officer)
export const createApprovalRequest = async (req, res) => {
  const { rfqId, quotationId, remarks } = req.body;

  try {
    if (!rfqId || !quotationId) {
      return res.status(400).json({ message: 'RFQ and Quotation IDs are required' });
    }

    // Check if there is already a pending approval for this RFQ
    const existingPending = await Approval.findOne({ rfqId, status: 'Pending' });
    if (existingPending) {
      return res.status(400).json({ message: 'An approval request is already pending for this RFQ' });
    }

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    const quotation = await Quotation.findById(quotationId).populate('vendorId', 'companyName');
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Update quotation status to show it is under review
    quotation.status = 'Under Review';
    await quotation.save();

    // Create Approval
    const approval = await Approval.create({
      rfqId,
      quotationId,
      requestedBy: req.user._id,
      status: 'Pending',
      remarks: remarks || '',
      timeline: [
        {
          action: 'Submission for Approval',
          by: `${req.user.name} (${req.user.role})`,
          at: new Date()
        }
      ]
    });

    await logActivity(
      req.user._id,
      'Requested Approval',
      'Approval',
      `Approval request submitted for RFQ "${rfq.title}" selecting Vendor "${quotation.vendorId.companyName}".`
    );

    // Notify Managers
    await notifyRoles(
      ['Manager'],
      `New approval pending for RFQ "${rfq.title}" (Vendor: ${quotation.vendorId.companyName}, Amount: INR ${quotation.totalAmount.toFixed(2)})`,
      'APPROVAL_ACTION'
    );

    res.status(201).json(approval);
  } catch (error) {
    console.error('Error creating approval request:', error);
    res.status(500).json({ message: 'Error creating approval request' });
  }
};

// Process Approval - Approve or Reject (Manager)
export const processApproval = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body; // status must be 'Approved' or 'Rejected'

  try {
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    const approval = await Approval.findById(id)
      .populate('rfqId')
      .populate('quotationId')
      .populate('requestedBy');

    if (!approval) {
      return res.status(404).json({ message: 'Approval record not found' });
    }

    if (approval.status !== 'Pending') {
      return res.status(400).json({ message: `This request was already processed (Current Status: ${approval.status})` });
    }

    const rfq = approval.rfqId;
    const quotation = approval.quotationId;

    // Update approval details
    approval.status = status;
    approval.approvedBy = req.user._id;
    approval.remarks = remarks || approval.remarks;
    approval.timeline.push({
      action: status === 'Approved' ? 'Manager Approval' : 'Manager Rejection',
      by: `${req.user.name} (${req.user.role})`,
      at: new Date()
    });
    await approval.save();

    if (status === 'Approved') {
      // 1. Award RFQ
      rfq.status = 'Awarded';
      await rfq.save();

      // 2. Accept Selected Quotation
      quotation.status = 'Accepted';
      await quotation.save();

      // 3. Reject all other quotations for this RFQ
      await Quotation.updateMany(
        { rfqId: rfq._id, _id: { $ne: quotation._id } },
        { $set: { status: 'Rejected' } }
      );

      // 4. Generate sequential Purchase Order number
      const poCount = await PurchaseOrder.countDocuments();
      const currentYear = new Date().getFullYear();
      const poNumber = `PO-${currentYear}-${String(poCount + 1).padStart(4, '0')}`;

      // Calculate financial values
      const subtotal = quotation.totalAmount;
      const tax = parseFloat((subtotal * 0.18).toFixed(2)); // 18% GST
      const totalAmount = parseFloat((subtotal + tax).toFixed(2));

      // Build PO items with prices from quotation
      const poItems = rfq.items.map(rfqItem => {
        const quoteItem = quotation.items.find(qi => qi.name === rfqItem.name);
        const unitPrice = quoteItem ? quoteItem.unitPrice : 0;
        const total = unitPrice * rfqItem.quantity;
        return {
          name: rfqItem.name,
          quantity: rfqItem.quantity,
          unit: rfqItem.unit,
          unitPrice,
          total
        };
      });

      const po = await PurchaseOrder.create({
        poNumber,
        rfqId: rfq._id,
        quotationId: quotation._id,
        vendorId: quotation.vendorId,
        items: poItems,
        subtotal,
        tax,
        totalAmount,
        status: 'Created'
      });

      await logActivity(
        req.user._id,
        'Approved Request & Created PO',
        'Approval',
        `Approval request approved by ${req.user.name}. Auto-generated Purchase Order: ${poNumber}.`
      );

      // Notify Procurement Officer
      await createNotification(
        approval.requestedBy._id,
        `Your approval request for RFQ "${rfq.title}" has been approved! PO "${poNumber}" is generated.`,
        'PO_GENERATED'
      );

      // Notify Vendor (look up user account by vendor email)
      const vendor = await Vendor.findById(quotation.vendorId);
      if (vendor) {
        const vendorUser = await User.findOne({ email: vendor.email, role: 'Vendor' });
        if (vendorUser) {
          await createNotification(
            vendorUser._id,
            `Congratulations! Your quotation for RFQ "${rfq.title}" has been accepted. PO "${poNumber}" has been created.`,
            'APPROVAL_ACTION'
          );
        }
      }

    } else {
      // Rejection logic
      quotation.status = 'Rejected';
      await quotation.save();

      // Re-open RFQ so that the Procurement Officer can request selection again
      rfq.status = 'Open';
      await rfq.save();

      await logActivity(
        req.user._id,
        'Rejected Request',
        'Approval',
        `Approval request for RFQ "${rfq.title}" rejected by ${req.user.name}. Remarks: ${remarks}`
      );

      // Notify Procurement Officer
      await createNotification(
        approval.requestedBy._id,
        `Your approval request for RFQ "${rfq.title}" was rejected. Remarks: ${remarks}`,
        'APPROVAL_ACTION'
      );
    }

    res.status(200).json(approval);
  } catch (error) {
    console.error('Error processing approval:', error);
    res.status(500).json({ message: 'Error processing approval request' });
  }
};
