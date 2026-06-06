import Invoice from '../models/Invoice.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { sendInvoiceEmail } from '../utils/emailSender.js';
import { logActivity } from '../utils/logger.js';
import { createNotification, notifyRoles } from '../utils/notifier.js';

// Get invoices (filtered by role)
export const getInvoices = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        return res.status(200).json([]);
      }
      query.vendorId = vendor._id;
    }

    const invoices = await Invoice.find(query)
      .populate('poId', 'poNumber')
      .populate('vendorId', 'companyName email')
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error retrieving Invoices' });
  }
};

// Get single Invoice details
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({
        path: 'poId',
        select: 'poNumber rfqId subtotal tax totalAmount status'
      })
      .populate('vendorId', 'companyName contactPerson email phone gstNumber category');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Role check: Vendor can only see their own invoices
    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor || invoice.vendorId._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this invoice' });
      }
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ message: 'Error retrieving invoice details' });
  }
};

// Create Invoice from PO (Procurement Officer)
export const createInvoice = async (req, res) => {
  const { poId } = req.body;

  try {
    if (!poId) {
      return res.status(400).json({ message: 'Purchase Order ID is required' });
    }

    const po = await PurchaseOrder.findById(poId).populate('vendorId');
    if (!po) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    // Check if an invoice already exists for this PO
    const existingInvoice = await Invoice.findOne({ poId });
    if (existingInvoice) {
      return res.status(400).json({
        message: `An invoice (${existingInvoice.invoiceNumber}) has already been generated for this PO`
      });
    }

    // Generate Invoice Number
    const invoiceCount = await Invoice.countDocuments();
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      poId: po._id,
      vendorId: po.vendorId._id,
      items: po.items,
      subtotal: po.subtotal,
      tax: po.tax,
      totalAmount: po.totalAmount,
      status: 'Draft'
    });

    await logActivity(
      req.user._id,
      'Created Invoice Draft',
      'Invoice',
      `Invoice ${invoiceNumber} created in Draft state from PO ${po.poNumber}.`
    );

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: 'Error generating invoice record' });
  }
};

// Update Invoice status (Draft, Sent, Paid)
export const updateInvoice = async (req, res) => {
  const { status } = req.body;

  try {
    const invoice = await Invoice.findById(req.params.id).populate('vendorId');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!status || !['Draft', 'Sent', 'Paid'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const oldStatus = invoice.status;
    invoice.status = status;
    
    if (status === 'Sent' && !invoice.sentAt) {
      invoice.sentAt = new Date();
    }
    
    await invoice.save();

    await logActivity(
      req.user._id,
      'Updated Invoice Status',
      'Invoice',
      `Invoice ${invoice.invoiceNumber} status updated from "${oldStatus}" to "${status}".`
    );

    // Notify Vendor user if invoice status changed to Sent or Paid
    const vendorUser = await User.findOne({ email: invoice.vendorId.email, role: 'Vendor' });
    if (vendorUser) {
      if (status === 'Sent') {
        await createNotification(
          vendorUser._id,
          `Invoice ${invoice.invoiceNumber} has been sent to you.`,
          'INVOICE_SENT'
        );
      } else if (status === 'Paid') {
        await createNotification(
          vendorUser._id,
          `Invoice ${invoice.invoiceNumber} has been marked as Paid. Thank you!`,
          'INVOICE_SENT'
        );
      }
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ message: 'Error updating invoice details' });
  }
};

// Send Invoice PDF via Email using Nodemailer
export const sendInvoiceByEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('vendorId').populate('poId');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const vendor = invoice.vendorId;
    const po = invoice.poId;

    // 1. Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, vendor, po);

    // 2. Dispatch Email
    const subject = `Invoice ${invoice.invoiceNumber} from VendorBridge ERP`;
    const bodyText = `Dear ${vendor.contactPerson},\n\nPlease find attached the tax invoice ${invoice.invoiceNumber} for the purchase order ${po.poNumber}.\n\nTotal Amount: INR ${invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nBest regards,\nVendorBridge Procurement Team`;
    
    const filename = `Invoice_${invoice.invoiceNumber}.pdf`;
    const emailResult = await sendInvoiceEmail(vendor.email, subject, bodyText, pdfBuffer, filename);

    // 3. Update Status
    invoice.status = 'Sent';
    if (!invoice.sentAt) {
      invoice.sentAt = new Date();
    }
    await invoice.save();

    await logActivity(
      req.user._id,
      'Sent Invoice Email',
      'Invoice',
      `Invoice ${invoice.invoiceNumber} sent to vendor email ${vendor.email}.`
    );

    // Notify vendor account
    const vendorUser = await User.findOne({ email: vendor.email, role: 'Vendor' });
    if (vendorUser) {
      await createNotification(
        vendorUser._id,
        `Tax Invoice "${invoice.invoiceNumber}" was sent to your email.`,
        'INVOICE_SENT'
      );
    }

    res.status(200).json({
      message: 'Invoice email sent successfully',
      previewUrl: emailResult.previewUrl || null
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Error mailing invoice file' });
  }
};

// Get Invoice PDF file stream
export const getInvoicePDFFile = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('vendorId').populate('poId');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Role check: Vendor can only see their own invoice PDFs
    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor || invoice.vendorId._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to download this PDF' });
      }
    }

    const vendor = invoice.vendorId;
    const po = invoice.poId;

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, vendor, po);

    // Serve PDF Buffer
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error rendering PDF:', error);
    res.status(500).json({ message: 'Error rendering PDF invoice file' });
  }
};
