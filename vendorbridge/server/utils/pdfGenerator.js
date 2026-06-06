import PDFDocument from 'pdfkit';

/**
 * Generates a PDF buffer for an Invoice.
 * @param {Object} invoice Invoice database record
 * @param {Object} vendor Vendor database record
 * @param {Object} po Purchase Order database record
 * @returns {Promise<Buffer>}
 */
export const generateInvoicePDF = (invoice, vendor, po) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(buffers);
        resolve(result);
      });
      doc.on('error', (err) => reject(err));

      // Header branding
      doc.fontSize(22).fillColor('#1e3a8a').font('Helvetica-Bold').text('VendorBridge ERP', 50, 50);
      doc.fontSize(10).fillColor('#4b5563').font('Helvetica').text('Complete Procurement & Supply Chain Solutions', 50, 75);
      
      // Invoice metadata
      doc.fontSize(20).fillColor('#111827').font('Helvetica-Bold').text('TAX INVOICE', 350, 50, { align: 'right' });
      doc.fontSize(10).fillColor('#374151').font('Helvetica');
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 350, 75, { align: 'right' });
      doc.text(`Invoice Date: ${new Date(invoice.sentAt || invoice.createdAt).toLocaleDateString()}`, 350, 90, { align: 'right' });
      doc.text(`Purchase Order Ref: ${po ? po.poNumber : 'N/A'}`, 350, 105, { align: 'right' });
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 350, 120, { align: 'right' });

      // Horizontal separator line
      doc.moveTo(50, 145).lineTo(545, 145).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // Vendor and Client grid
      doc.fontSize(11).fillColor('#1e3a8a').font('Helvetica-Bold').text('FROM (SUPPLIER):', 50, 160);
      doc.fontSize(10).fillColor('#1f2937').font('Helvetica');
      doc.text(vendor.companyName, 50, 175);
      doc.text(`Contact: ${vendor.contactPerson}`, 50, 190);
      doc.text(`Email: ${vendor.email}`, 50, 205);
      doc.text(`Phone: ${vendor.phone}`, 50, 220);
      doc.text(`GSTIN: ${vendor.gstNumber}`, 50, 235);

      doc.fontSize(11).fillColor('#1e3a8a').font('Helvetica-Bold').text('TO (BUYER):', 300, 160);
      doc.fontSize(10).fillColor('#1f2937').font('Helvetica');
      doc.text('VendorBridge Corp Ltd.', 300, 175);
      doc.text('Procurement Operations Dept.', 300, 190);
      doc.text('finance@vendorbridge.com', 300, 205);
      doc.text('+91 80 555 0199', 300, 220);
      doc.text('GSTIN: 29AAAAA0000A1Z5', 300, 235);

      // Horizontal separator line
      doc.moveTo(50, 260).lineTo(545, 260).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // Table Header
      const tableTop = 280;
      doc.fontSize(10).fillColor('#374151').font('Helvetica-Bold');
      doc.text('Item Description', 50, tableTop, { width: 200 });
      doc.text('Qty', 260, tableTop, { width: 50, align: 'right' });
      doc.text('Unit', 320, tableTop, { width: 50, align: 'right' });
      doc.text('Unit Price (INR)', 380, tableTop, { width: 80, align: 'right' });
      doc.text('Total (INR)', 470, tableTop, { width: 75, align: 'right' });

      // Table line
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#9ca3af').lineWidth(1.5).stroke();

      // Items loop
      let currentY = tableTop + 25;
      doc.font('Helvetica').fillColor('#4b5563');
      
      invoice.items.forEach((item) => {
        // Page break if items exceed page size
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        doc.text(item.name, 50, currentY, { width: 200 });
        doc.text(item.quantity.toString(), 260, currentY, { width: 50, align: 'right' });
        doc.text(item.unit, 320, currentY, { width: 50, align: 'right' });
        doc.text(item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 380, currentY, { width: 80, align: 'right' });
        doc.text(item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 470, currentY, { width: 75, align: 'right' });
        
        currentY += 22;
      });

      // Total details separator
      doc.moveTo(50, currentY + 5).lineTo(545, currentY + 5).strokeColor('#e5e7eb').lineWidth(1).stroke();
      currentY += 15;

      // Pricing blocks
      doc.fontSize(10).fillColor('#374151').font('Helvetica-Bold');
      doc.text('Subtotal:', 320, currentY, { width: 140, align: 'right' });
      doc.font('Helvetica').fillColor('#4b5563');
      doc.text(invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 470, currentY, { width: 75, align: 'right' });
      
      currentY += 18;
      doc.font('Helvetica-Bold').fillColor('#374151');
      doc.text('GST (18%):', 320, currentY, { width: 140, align: 'right' });
      doc.font('Helvetica').fillColor('#4b5563');
      doc.text(invoice.tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 470, currentY, { width: 75, align: 'right' });

      currentY += 18;
      doc.font('Helvetica-Bold').fillColor('#111827').fontSize(11);
      doc.text('Grand Total:', 320, currentY, { width: 140, align: 'right' });
      doc.text(invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 470, currentY, { width: 75, align: 'right' });

      // Footer
      doc.fontSize(9).fillColor('#9ca3af').font('Helvetica-Oblique').text('This is a computer-generated tax invoice and requires no physical signature.', 50, 750, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
