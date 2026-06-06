import PurchaseOrder from '../models/PurchaseOrder.js';
import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';
import { createNotification, notifyRoles } from '../utils/notifier.js';

// Get purchase orders (filtered by role)
export const getPurchaseOrders = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        return res.status(200).json([]);
      }
      query.vendorId = vendor._id;
    }

    const pos = await PurchaseOrder.find(query)
      .populate('rfqId', 'title')
      .populate('vendorId', 'companyName email contactPerson phone')
      .sort({ createdAt: -1 });

    res.status(200).json(pos);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: 'Error retrieving Purchase Orders' });
  }
};

// Get single Purchase Order details
export const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('rfqId', 'title description items deadline')
      .populate('quotationId', 'deliveryDays notes')
      .populate('vendorId', 'companyName contactPerson email phone gstNumber category');

    if (!po) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    // Role check: Vendor can only see their own POs
    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor || po.vendorId._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this purchase order' });
      }
    }

    res.status(200).json(po);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ message: 'Error retrieving purchase order details' });
  }
};

// Update Purchase Order status (sent, acknowledged, completed)
export const updatePurchaseOrderStatus = async (req, res) => {
  const { status } = req.body;

  try {
    if (!status || !['Created', 'Sent', 'Acknowledged', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid PO status' });
    }

    const po = await PurchaseOrder.findById(req.params.id).populate('vendorId');
    if (!po) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    const oldStatus = po.status;

    // Enforce role-based state transitions
    if (status === 'Sent' && req.user.role !== 'Procurement Officer' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Procurement Officers can mark PO as Sent' });
    }

    if (status === 'Acknowledged') {
      if (req.user.role !== 'Vendor') {
        return res.status(403).json({ message: 'Only the assigned Vendor can acknowledge the PO' });
      }
      if (po.vendorId.email !== req.user.email) {
        return res.status(403).json({ message: 'You are not the vendor assigned to this Purchase Order' });
      }
    }

    if (status === 'Completed' && req.user.role !== 'Procurement Officer' && req.user.role !== 'Manager' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Procurement Officers or Managers can mark PO as Completed' });
    }

    po.status = status;
    await po.save();

    await logActivity(
      req.user._id,
      'Updated PO Status',
      'PO',
      `Purchase Order "${po.poNumber}" status updated from "${oldStatus}" to "${status}".`
    );

    // Send notifications based on transitions
    if (status === 'Sent') {
      // Notify Vendor User
      const vendorUser = await User.findOne({ email: po.vendorId.email, role: 'Vendor' });
      if (vendorUser) {
        await createNotification(
          vendorUser._id,
          `Purchase Order "${po.poNumber}" has been sent to you. Please review and Acknowledge it.`,
          'PO_GENERATED'
        );
      }
    } else if (status === 'Acknowledged') {
      // Notify Procurement Officers
      await notifyRoles(
        ['Procurement Officer'],
        `Vendor "${po.vendorId.companyName}" acknowledged Purchase Order "${po.poNumber}".`,
        'PO_GENERATED'
      );
    } else if (status === 'Completed') {
      // Notify Vendor User
      const vendorUser = await User.findOne({ email: po.vendorId.email, role: 'Vendor' });
      if (vendorUser) {
        await createNotification(
          vendorUser._id,
          `Purchase Order "${po.poNumber}" is completed.`,
          'PO_GENERATED'
        );
      }
    }

    res.status(200).json(po);
  } catch (error) {
    console.error('Error updating PO status:', error);
    res.status(500).json({ message: 'Error updating Purchase Order status' });
  }
};
