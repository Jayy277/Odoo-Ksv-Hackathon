import React, { useState, useEffect } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Check, X, ShieldAlert, Award, FileQuestion, Clock, User, MessageSquare } from 'lucide-react';

const Approvals = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await API.get('/approvals');
      setApprovals(response.data);
      // Automatically select the first pending one if available
      if (response.data.length > 0) {
        setSelectedApproval(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load approval requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleProcess = async (status) => {
    if (!remarks.trim() && status === 'Rejected') {
      toast.error('Remarks are required for rejecting a procurement request');
      return;
    }

    try {
      setIsSubmitting(true);
      await API.put(`/approvals/${selectedApproval._id}`, {
        status,
        remarks
      });

      toast.success(`Request ${status === 'Approved' ? 'Approved & PO generated!' : 'Rejected'}`);
      setRemarks('');
      loadApprovals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing request');
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

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white">Procurement Approval Board</h2>
        <p className="text-xs text-slate-500">Review, approve, or reject selected vendor bids and trigger auto-POs</p>
      </div>

      {approvals.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-500 bg-[#0d1321]/30 border border-slate-800 rounded-xl">
          No approval requests logged in the system.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: List of approvals */}
          <div className="glass-card rounded-xl border border-slate-800 divide-y divide-slate-850 overflow-hidden h-[600px] overflow-y-auto">
            <div className="px-5 py-4 bg-[#0d1321] text-xs font-bold text-white uppercase tracking-wider">
              Procurement Requests ({approvals.length})
            </div>
            {approvals.map((app) => (
              <button
                key={app._id}
                onClick={() => {
                  setSelectedApproval(app);
                  setRemarks('');
                }}
                className={`w-full text-left p-4 hover:bg-slate-900/35 transition-all flex flex-col gap-2 ${
                  selectedApproval?._id === app._id ? 'bg-blue-600/5 border-l-4 border-blue-500 pl-3' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      app.status === 'Approved'
                        ? 'bg-green-500/10 text-green-400'
                        : app.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {app.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate w-full">
                  {app.rfqId?.title || 'RFQ Title Missing'}
                </h4>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Vendor: <strong className="text-slate-350">{app.quotationId?.vendorId?.companyName || 'Apex'}</strong></span>
                  <span className="font-semibold text-blue-400">INR {app.quotationId?.totalAmount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right panel: Details & actions */}
          {selectedApproval && (
            <div className="lg:col-span-2 glass-card rounded-xl border border-slate-800 p-6 space-y-6">
              {/* Header Details */}
              <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Request Details</h3>
                  <p className="text-xs text-slate-400">RFQ: <strong className="text-slate-200">{selectedApproval.rfqId?.title}</strong></p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block text-left md:text-right">Requested By</span>
                  <strong className="text-xs text-slate-200">{selectedApproval.requestedBy?.name}</strong>
                </div>
              </div>

              {/* Selected quotation details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quotation metrics */}
                <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Bid Summary</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Company Name:</span>
                      <strong className="text-slate-250">{selectedApproval.quotationId?.vendorId?.companyName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GSTIN Number:</span>
                      <strong className="font-mono text-slate-200">{selectedApproval.quotationId?.vendorId?.gstNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vendor Rating:</span>
                      <strong className="text-amber-400 font-semibold">{selectedApproval.quotationId?.vendorId?.rating?.toFixed(1)} ★</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery Days:</span>
                      <strong className="text-slate-200">{selectedApproval.quotationId?.deliveryDays} Days</strong>
                    </div>
                    {selectedApproval.quotationId?.notes && (
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-[9px] text-slate-500 block mb-0.5">Vendor Remarks:</span>
                        <p className="text-[11px] text-slate-400 italic bg-[#0f172a]/30 p-2 rounded">"{selectedApproval.quotationId?.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-lg space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pricing (INR)</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="text-slate-200">INR {selectedApproval.quotationId?.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">GST (18%):</span>
                        <span className="text-slate-200">INR {(selectedApproval.quotationId?.totalAmount * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated PO Total:</span>
                    <strong className="text-base font-extrabold text-blue-400">
                      INR {(selectedApproval.quotationId?.totalAmount * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Items listing */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bid Line Items</h4>
                <div className="overflow-x-auto border border-slate-850 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 bg-[#0d1321] text-[10px] font-bold uppercase text-slate-400">
                        <th className="px-4 py-2.5">Item</th>
                        <th className="px-4 py-2.5 text-right w-24">Unit Price</th>
                        <th className="px-4 py-2.5 text-right w-24">Quantity</th>
                        <th className="px-4 py-2.5 text-right w-32">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-350">
                      {selectedApproval.quotationId?.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-semibold text-slate-250">{item.name}</td>
                          <td className="px-4 py-2.5 text-right">INR {item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400">
                            {selectedApproval.rfqId?.items.find(ri => ri.name === item.name)?.quantity || 1}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-white">INR {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Approval Action timeline history */}
              <div className="space-y-3.5 pt-4 border-t border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span>Workflow Progress Timeline</span>
                </h4>

                <div className="space-y-3 relative border-l border-slate-850 pl-4 ml-2.5">
                  {selectedApproval.timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21.5px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500 ring-4 ring-[#0f172a]"></span>
                      <div className="text-xs">
                        <span className="font-semibold text-slate-200">{item.action}</span>
                        <span className="text-slate-500 text-[10px] ml-2">
                          by {item.by} · {new Date(item.at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Controls: Approve / Reject panel */}
              {selectedApproval.status === 'Pending' && (
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  {user.role === 'Manager' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-blue-400" />
                          <span>Manager Decision Remarks *</span>
                        </label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2.5}
                          className="mt-1 block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          placeholder="Provide approval comments or reasons for rejection..."
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleProcess('Rejected')}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-900/30 bg-rose-950/15 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 active:bg-rose-900/30 transition-all disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          <span>Reject Proposal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProcess('Approved')}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-green-500 active:bg-green-700 transition-all disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          <span>Approve & Generate PO</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-lg border border-amber-900/30 bg-amber-950/15 p-4 text-xs text-amber-400">
                      <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
                      <span>This request is currently pending Manager approval. You can view progress, but you lack sign-off permissions.</span>
                    </div>
                  )}
                </div>
              )}

              {selectedApproval.status !== 'Pending' && selectedApproval.remarks && (
                <div className="pt-4 border-t border-slate-800 text-xs bg-slate-900/40 p-4 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Decision Remarks:</span>
                  <p className="text-slate-300 italic">"{selectedApproval.remarks}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Approvals;
