import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { toast } from 'react-toastify';
import { ArrowLeft, Download, Printer, Mail, DollarSign, ExternalLink, Calendar, Receipt } from 'lucide-react';

const InvoiceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState(null);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/invoices/${id}`);
      setInvoice(response.data);
    } catch (error) {
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvoiceDetails();
    }
  }, [id, user]);

  const downloadPDF = async () => {
    try {
      toast.info('Generating PDF for download...');
      const response = await API.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Invoice PDF downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to download PDF invoice');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    try {
      setIsSubmitting(true);
      toast.info('Sending invoice email...');
      const response = await API.post(`/invoices/${id}/send-email`);
      toast.success('Invoice email sent successfully!');
      
      if (response.data.previewUrl) {
        setEmailPreviewUrl(response.data.previewUrl);
      }
      fetchInvoiceDetails();
    } catch (error) {
      toast.error('Failed to send invoice email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setIsSubmitting(true);
      await API.put(`/invoices/${id}`, { status: 'Paid' });
      toast.success('Invoice marked as Paid!');
      fetchInvoiceDetails();
    } catch (error) {
      toast.error('Failed to update invoice status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center py-20 text-slate-500 text-xs">Invoice not found.</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation */}
      <div className="no-print">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-350 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>

      {/* Email preview alert banner */}
      {emailPreviewUrl && (
        <div className="no-print p-4 rounded-xl border border-blue-900/30 bg-blue-950/25 flex items-center justify-between text-xs text-blue-400">
          <span>
            <strong>Testing SMTP Active:</strong> Ethereal Email test preview link is generated!
          </span>
          <a
            href={emailPreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-bold hover:underline"
          >
            <span>Preview Email Inbox</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Split Details Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Invoice Sheet */}
        <div className="lg:col-span-2 glass-card rounded-xl border border-slate-800 p-8 space-y-6 bg-slate-950/20" id="invoice-sheet">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-5">
            <div>
              <h1 className="text-xl font-black text-white">TAX INVOICE</h1>
              <p className="text-slate-400 text-xs mt-1">Invoice Ref: <span className="font-semibold text-white">{invoice.invoiceNumber}</span></p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                invoice.status === 'Paid'
                  ? 'bg-green-500/10 text-green-400'
                  : invoice.status === 'Sent'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {invoice.status}
              </span>
              {invoice.sentAt && (
                <span className="block text-[9px] text-slate-500 mt-1">
                  Sent: {new Date(invoice.sentAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-slate-800 pb-5">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">From (Supplier)</p>
              <strong className="text-white text-sm">{invoice.vendorId?.companyName}</strong>
              <p className="text-slate-400 mt-1">{invoice.vendorId?.contactPerson}</p>
              <p className="text-slate-550 text-[10px] mt-0.5">{invoice.vendorId?.email} | {invoice.vendorId?.phone}</p>
              <p className="text-slate-500 font-mono text-[10px] mt-1">GSTIN: {invoice.vendorId?.gstNumber}</p>
            </div>
            <div className="md:border-l md:border-slate-800 md:pl-6">
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">To (Buyer)</p>
              <strong className="text-slate-200">VendorBridge Corp Ltd.</strong>
              <p className="text-slate-400">Procurement Department</p>
              <p className="text-slate-500 text-[10px] mt-0.5">finance@vendorbridge.com</p>
              <p className="text-slate-400 mt-1">GSTIN: 29AAAAA0000A1Z5</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Lines</h3>
            <div className="overflow-x-auto border border-slate-850 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-850 bg-[#0d1321] text-[10px] font-bold uppercase text-slate-400">
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-350">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.name}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-right">INR {item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        INR {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Panel Column */}
        <div className="space-y-6 no-print">
          {/* Totals Summary */}
          <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2.5">
              Financial Summary
            </h3>

            <div className="space-y-3 text-xs text-slate-350">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <strong className="text-slate-200">INR {invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <strong className="text-slate-250">INR {invoice.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              
              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-400 uppercase">Grand Total (incl. GST):</span>
                <strong className="text-base font-extrabold text-blue-400">
                  INR {invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* Print/Download and Email dispatch Controls */}
          <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2.5">
              Invoice Operations
            </h3>

            <button
              onClick={downloadPDF}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-850 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download Official PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-850 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice Document</span>
            </button>

            {/* Email send button (Officer only) */}
            {user.role === 'Procurement Officer' && (
              <button
                onClick={handleSendEmail}
                disabled={isSubmitting || invoice.status === 'Paid'}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 transition-all disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                <span>Send PDF via Email</span>
              </button>
            )}

            {/* Paid Trigger (Officer/Admin only) */}
            {(user.role === 'Procurement Officer' || user.role === 'Admin') && invoice.status !== 'Paid' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-xs py-2.5 transition-all disabled:opacity-50"
              >
                <DollarSign className="h-4 w-4" />
                <span>Mark Invoice as Paid</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
