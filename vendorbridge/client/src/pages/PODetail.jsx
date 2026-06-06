import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { toast } from 'react-toastify';
import { ArrowLeft, Calendar, FileText, CheckCircle2, Send, BookmarkCheck, FilePlus, ChevronRight } from 'lucide-react';

const PODetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPODetails = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/purchase-orders/${id}`);
      setPo(response.data);
    } catch (error) {
      toast.error('Failed to load PO details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPODetails();
    }
  }, [id, user]);

  const handleStatusChange = async (newStatus) => {
    try {
      setIsSubmitting(true);
      await API.put(`/purchase-orders/${po._id}`, { status: newStatus });
      toast.success(`Purchase Order status updated to "${newStatus}"!`);
      fetchPODetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update PO status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setIsSubmitting(true);
      await API.post('/invoices', { poId: po._id });
      toast.success('Invoice generated in Draft state successfully!');
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
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

  if (!po) {
    return <div className="text-center py-20 text-slate-500 text-xs">Purchase Order details not found.</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation */}
      <div>
        <Link
          to="/purchase-orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-350 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to POs</span>
        </Link>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core items and vendor list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  po.status === 'Completed'
                    ? 'bg-green-500/10 text-green-400'
                    : po.status === 'Acknowledged'
                    ? 'bg-blue-500/10 text-blue-400'
                    : po.status === 'Sent'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-slate-850 text-slate-400'
                }`}>
                  {po.status}
                </span>
                <h2 className="text-lg font-bold text-white leading-tight">Purchase Order: {po.poNumber}</h2>
              </div>
            </div>

            {/* Vendor Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-900/40 p-4 border border-slate-850 rounded-lg">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Supplier / Vendor</p>
                <strong className="text-white block text-sm">{po.vendorId?.companyName}</strong>
                <span className="text-slate-400 mt-1 block">{po.vendorId?.contactPerson}</span>
                <span className="text-slate-500 text-[10px] block mt-0.5">{po.vendorId?.email} | {po.vendorId?.phone}</span>
              </div>
              <div className="md:border-l md:border-slate-800 md:pl-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Billing Details</p>
                <strong className="text-slate-200 block">VendorBridge Corp Ltd.</strong>
                <span className="text-slate-400">GSTIN: 29AAAAA0000A1Z5</span>
                <span className="text-slate-400 block mt-1">Vendor GSTIN: <strong className="font-mono text-slate-300">{po.vendorId?.gstNumber}</strong></span>
              </div>
            </div>

            {/* Line items table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items Details</h3>
              <div className="overflow-x-auto border border-slate-850 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 bg-[#0d1321] text-[10px] font-bold uppercase text-slate-400">
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {po.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-900/20">
                        <td className="px-4 py-3 font-semibold text-slate-200">{item.name}</td>
                        <td className="px-4 py-3 text-right text-slate-450">{item.quantity} {item.unit}</td>
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
        </div>

        {/* Financial and Status transitions Column */}
        <div className="space-y-6">
          {/* Financial summary */}
          <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2.5">
              Financial Summary
            </h3>

            <div className="space-y-3.5 text-xs text-slate-350">
              <div className="flex justify-between">
                <span>Subtotal Value:</span>
                <strong className="text-slate-200">INR {po.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (18%):</span>
                <strong className="text-slate-250">INR {po.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              
              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-400 uppercase">PO Grand Total:</span>
                <strong className="text-base font-extrabold text-blue-400">
                  INR {po.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* Workflow transitions block */}
          <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2.5">
              PO Workflow Actions
            </h3>

            <div className="space-y-3">
              {/* Officer: Created -> Sent */}
              {po.status === 'Created' && (user.role === 'Procurement Officer' || user.role === 'Admin') && (
                <button
                  onClick={() => handleStatusChange('Sent')}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 transition-all disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Purchase Order to Vendor</span>
                </button>
              )}

              {/* Vendor: Sent -> Acknowledged */}
              {po.status === 'Sent' && user.role === 'Vendor' && (
                <button
                  onClick={() => handleStatusChange('Acknowledged')}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 transition-all disabled:opacity-50"
                >
                  <BookmarkCheck className="h-4 w-4" />
                  <span>Acknowledge Purchase Order</span>
                </button>
              )}

              {/* Officer/Manager: Acknowledged -> Completed */}
              {po.status === 'Acknowledged' && (user.role === 'Procurement Officer' || user.role === 'Manager' || user.role === 'Admin') && (
                <button
                  onClick={() => handleStatusChange('Completed')}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-xs py-2.5 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark PO as Completed</span>
                </button>
              )}

              {/* Officer: Completed -> Generate Invoice */}
              {po.status === 'Completed' && (user.role === 'Procurement Officer' || user.role === 'Admin') && (
                <button
                  onClick={handleGenerateInvoice}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/15"
                >
                  <FilePlus className="h-4 w-4" />
                  <span>Generate Invoice from PO</span>
                </button>
              )}

              {/* Informational displays if no actions are available */}
              {po.status === 'Created' && user.role === 'Vendor' && (
                <p className="text-xs text-slate-500 italic text-center">Awaiting dispatch by Procurement Officer</p>
              )}
              {po.status === 'Sent' && user.role !== 'Vendor' && (
                <p className="text-xs text-slate-500 italic text-center">Awaiting supplier acknowledgement</p>
              )}
              {po.status === 'Acknowledged' && user.role === 'Vendor' && (
                <p className="text-xs text-slate-500 italic text-center">Awaiting completion by Procurement Team</p>
              )}
              {po.status === 'Completed' && user.role === 'Vendor' && (
                <p className="text-xs text-slate-500 italic text-center">PO Completed. Invoice generated / processed.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PODetail;
