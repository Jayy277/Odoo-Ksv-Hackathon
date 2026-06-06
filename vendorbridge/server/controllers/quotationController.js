import Quotation from '../models/Quotation.js';
import RFQ from '../models/RFQ.js';
import Vendor from '../models/Vendor.js';
import { logActivity } from '../utils/logger.js';
import { notifyRoles } from '../utils/notifier.js';

// Get quotations (filtered by role)
export const getQuotations = async (req, res) => {
  const { rfqId } = req.query;

  try {
    let query = {};

    if (rfqId) {
      query.rfqId = rfqId;
    }

    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        return res.status(200).json([]);
      }
      query.vendorId = vendor._id;
    }

    const quotations = await Quotation.find(query)
      .populate('rfqId', 'title deadline status')
      .populate('vendorId', 'companyName email rating')
      .sort({ submittedAt: -1 });

    res.status(200).json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Error retrieving quotations list' });
  }
};

// Submit a new Quotation (Vendor only)
export const submitQuotation = async (req, res) => {
  const { rfqId, items, deliveryDays, notes } = req.body;

  try {
    if (!rfqId || !items || !items.length || !deliveryDays) {
      return res.status(400).json({ message: 'Missing required quotation details' });
    }

    // 1. Identify the Vendor linked to the User email
    const vendor = await Vendor.findOne({ email: req.user.email });
    if (!vendor) {
      return res.status(400).json({ message: 'No vendor profile associated with your user account.' });
    }

    // 2. Validate RFQ exists and is open
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    if (rfq.status !== 'Open') {
      return res.status(400).json({ message: `Cannot submit quotation. RFQ status is: ${rfq.status}` });
    }

    // 3. Check if deadline has passed
    if (new Date() > new Date(rfq.deadline)) {
      return res.status(400).json({ message: 'Submission failed. The RFQ deadline has passed.' });
    }

    // 4. Verify vendor is assigned to this RFQ
    if (!rfq.assignedVendors.includes(vendor._id)) {
      return res.status(403).json({ message: 'You are not authorized to submit quotations for this RFQ.' });
    }

    // 5. Check if quotation already exists for this vendor and RFQ
    const existingQuote = await Quotation.findOne({ rfqId, vendorId: vendor._id });
    if (existingQuote) {
      return res.status(400).json({ message: 'You have already submitted a quotation. Please update the existing one instead.' });
    }

    // 6. Calculate total amount
    let totalAmount = 0;
    const formattedItems = items.map(item => {
      const unitPrice = Number(item.unitPrice) || 0;
      const quantity = Number(item.quantity) || 0;
      const total = unitPrice * quantity;
      totalAmount += total;
      return {
        name: item.name,
        unitPrice,
        total
      };
    });

    // 7. Create the quotation
    const quotation = await Quotation.create({
      rfqId,
      vendorId: vendor._id,
      items: formattedItems,
      deliveryDays,
      notes,
      totalAmount,
      status: 'Submitted'
    });

    // 8. Log activity
    await logActivity(
      req.user._id,
      'Submitted Quotation',
      'Quotation',
      `Vendor "${vendor.companyName}" submitted quotation for RFQ "${rfq.title}" (Total: INR ${totalAmount}).`
    );

    // 9. Notify Procurement Officers
    await notifyRoles(
      ['Procurement Officer'],
      `New quotation submitted by "${vendor.companyName}" for RFQ "${rfq.title}". Total Bid: INR ${totalAmount.toFixed(2)}`,
      'QUOTATION_SUBMITTED'
    );

    res.status(201).json(quotation);
  } catch (error) {
    console.error('Error submitting quotation:', error);
    res.status(500).json({ message: 'Error saving quotation details' });
  }
};

// Edit a Quotation (Vendor only, before deadline)
export const updateQuotation = async (req, res) => {
  const { items, deliveryDays, notes } = req.body;

  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Identify vendor
    const vendor = await Vendor.findOne({ email: req.user.email });
    if (!vendor || quotation.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit this quotation' });
    }

    // Check RFQ deadline
    const rfq = await RFQ.findById(quotation.rfqId);
    if (!rfq) {
      return res.status(404).json({ message: 'Associated RFQ not found' });
    }

    if (new Date() > new Date(rfq.deadline)) {
      return res.status(400).json({ message: 'Cannot update quotation. The RFQ deadline has passed.' });
    }

    if (rfq.status !== 'Open') {
      return res.status(400).json({ message: `Cannot update quotation. RFQ is no longer Open (Status: ${rfq.status})` });
    }

    // Recompute items totals
    if (items) {
      let totalAmount = 0;
      const formattedItems = items.map(item => {
        const unitPrice = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 0;
        const total = unitPrice * quantity;
        totalAmount += total;
        return {
          name: item.name,
          unitPrice,
          total
        };
      });
      quotation.items = formattedItems;
      quotation.totalAmount = totalAmount;
    }

    if (deliveryDays) quotation.deliveryDays = deliveryDays;
    if (notes !== undefined) quotation.notes = notes;
    quotation.status = 'Submitted'; // Reset to submitted/under review if it was rejected/draft earlier

    await quotation.save();

    await logActivity(
      req.user._id,
      'Updated Quotation',
      'Quotation',
      `Vendor "${vendor.companyName}" updated quotation for RFQ "${rfq.title}" (New Total: INR ${quotation.totalAmount}).`
    );

    res.status(200).json(quotation);
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ message: 'Error updating quotation details' });
  }
};
