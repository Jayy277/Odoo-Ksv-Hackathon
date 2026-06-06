import nodemailer from 'nodemailer';

/**
 * Sends an email with an invoice PDF attachment.
 * @param {string} toEmail Recipient email address
 * @param {string} subject Email subject
 * @param {string} bodyText Text body of the email
 * @param {Buffer} pdfBuffer Buffer of the PDF file
 * @param {string} filename Attachment filename
 * @returns {Promise<Object>} Contains messageId and optional previewUrl
 */
export const sendInvoiceEmail = async (toEmail, subject, bodyText, pdfBuffer, filename) => {
  let transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: port === '465',
      auth: {
        user,
        pass
      }
    });
  } else {
    // Generate temporary Ethereal test account if SMTP configs are missing
    console.log('No custom SMTP details in .env. Initializing a temporary Ethereal Account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || 'VendorBridge <no-reply@vendorbridge.com>',
    to: toEmail,
    subject,
    text: bodyText,
    attachments: [
      {
        filename: filename || 'invoice.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email dispatched successfully! Message ID: ${info.messageId}`);
  
  if (!host || !user) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`Test Mail Preview URL: ${previewUrl}`);
    return {
      messageId: info.messageId,
      previewUrl
    };
  }

  return { messageId: info.messageId };
};
