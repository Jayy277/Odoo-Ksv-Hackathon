import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { toast } from 'react-toastify';
import { ArrowLeft, Calendar, FileText, CheckCircle2, ChevronRight, Edit3, DollarSign, Clock, HelpCircle } from 'lucide-react';

const RFQDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vendor Bid Form States
  const [isBidding, setIsBidding] = useState(false);
  const [isEditingBid, setIsEditingBid] = useState(false);
  const [bidId, setBidId] = useState(null);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [bidItems, setBidItems] = useState([]); // Array of { name, quantity, unit, unitPrice, total }

  const fetchRFQDetails = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/rfqs/${id}`);
      setRfq(response.data.rfq);
      setQuotations(response.data.quotations);

      // If user is a Vendor, initialize or load existing bid
      if (user.role === 'Vendor') {
        const existingBid = response.data.quotations[0]; // Backend filters so vendors only get their own
        if (existingBid) {
          setBidId(existingBid._id);
          setDeliveryDays(existingBid.deliveryDays);
          setNotes(existingBid.notes || '');
          // Map line items
          const mappedItems = response.data.rfq.items.map(rfqItem => {
            const bidItem = existingBid.items.find(bi => bi.name === rfqItem.name);
            return {
              name: rfqItem.name,
              quantity: rfqItem.quantity,
              unit: rfqItem.unit,
              unitPrice: bidItem ? bidItem.unitPrice : 0,
              total: bidItem ? bidItem.total : 0
            };
          });
          setBidItems(mappedItems);
        } else {
          // Initialize empty prices
          const emptyItems = response.data.rfq.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: 0,
            total: 0
          }));
          setBidItems(emptyItems);
        }
      }
    } catch (error) {
      toast.error('Failed to load RFQ details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRFQDetails();
    }
  }, [id, user]);

  const handleUnitPriceChange = (index, value) => {
    const price = parseFloat(value) || 0;
    const newItems = [...bidItems];
    newItems[index].unitPrice = price;
    newItems[index].total = parseFloat((price * newItems[index].quantity).toFixed(2));
    setBidItems(newItems);
  };

  const calculateBidTotal = () => {
    return bidItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();

    if (deliveryDays <= 0) {
      toast.error('Please specify a valid delivery timeline');
      return;
    }

    const hasZeroPrice = bidItems.some(item => item.unitPrice <= 0);
    if (hasZeroPrice) {
      if (!window.confirm('Some items have a unit price of 0. Do you want to proceed?')) {
        return;
      }
    }

    try {
      const payload = {
        rfqId: rfq._id,
        items: bidItems.map(item => ({
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity
        })),
        deliveryDays,
        notes
      };

      if (isEditingBid && bidId) {
        await API.put(`/quotations/${bidId}`, payload);
        toast.success('Quotation updated successfully!');
      } else {
        await API.post('/quotations', payload);
        toast.success('Quotation submitted successfully!');
      }

      setIsBidding(false);
      setIsEditingBid(false);
      fetchRFQDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit bid');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!rfq) {
    return <div className="text-center py-20 text-slate-500 text-xs">RFQ details not found.</div>;
  }

  const isDeadlinePassed = new Date() > new Date(rfq.deadline);

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation */}
      <div>
        <Link
          to="/rfqs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-350 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to RFQs</span>
        </Link>
      </div>

      {/* Grid: RFQ Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RFQ Specifications card */}
        <div className="lg:col-span-2 glass-card rounded-xl border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                rfq.status === 'Open' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {rfq.status}
              </span>
              <h2 className="text-lg font-bold text-white leading-tight">{rfq.title}</h2>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specifications / Scope</h3>
            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/40 p-4 border border-slate-850 rounded-lg">
              {rfq.description}
            </p>
          </div>

          {/* Line items table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requested Line Items</h3>
            <div className="overflow-x-auto border border-slate-850 rounded-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-850 bg-[#0d1321] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Item Description</th>
                    <th className="px-4 py-3 text-right">Required Quantity</th>
                    <th className="px-4 py-3">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                  {rfq.items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-900/20">
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.name}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Status Box and Actions Column */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2.5">
              Request Info
            </h3>

            <div className="space-y-3 text-xs text-slate-350">
              <div className="flex justify-between">
                <span>Created By:</span>
                <strong className="text-slate-200">{rfq.createdBy?.name || 'Procurement Team'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Deadline Date:</span>
                <strong className="text-rose-400 font-mono">{new Date(rfq.deadline).toLocaleDateString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Bidding State:</span>
                <strong className={isDeadlinePassed ? 'text-rose-400' : 'text-green-400'}>
                  {isDeadlinePassed ? 'Closed (Expired)' : 'Open (Accepting Bids)'}
                </strong>
              </div>
            </div>

            {/* Quick Officer comparison triggers */}
            {user.role === 'Procurement Officer' && rfq.status === 'Open' && quotations.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <Link
                  to={`/rfqs/${rfq._id}/compare`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/10"
                >
                  <span>Compare Bids ({quotations.length})</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Quotation status indicator for Vendors */}
          {user.role === 'Vendor' && !isBidding && (
            <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2.5">
                Your Bidding Profile
              </h3>

              {quotations.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">You have not submitted a bid for this RFQ yet.</p>
                  {!isDeadlinePassed && rfq.status === 'Open' ? (
                    <button
                      onClick={() => setIsBidding(true)}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                    >
                      Submit Bidding Proposal
                    </button>
                  ) : (
                    <span className="block text-center rounded bg-rose-500/10 text-rose-400 px-3 py-2 text-[10px] font-bold uppercase tracking-wider">
                      Submissions Closed
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Proposal Status:</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      quotations[0].status === 'Accepted'
                        ? 'bg-green-500/10 text-green-400'
                        : quotations[0].status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {quotations[0].status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-350">
                    <div className="flex justify-between">
                      <span>Total Bid:</span>
                      <strong className="text-white">INR {quotations[0].totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeline:</span>
                      <strong className="text-white">{quotations[0].deliveryDays} days</strong>
                    </div>
                    {quotations[0].notes && (
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-[10px] text-slate-500 block mb-0.5">Your Remarks:</span>
                        <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2 rounded">{quotations[0].notes}</p>
                      </div>
                    )}
                  </div>

                  {quotations[0].status === 'Submitted' && !isDeadlinePassed && rfq.status === 'Open' && (
                    <button
                      onClick={() => {
                        setIsBidding(true);
                        setIsEditingBid(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-slate-850 hover:text-blue-300 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Bidding Proposal</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vendor Bidding Input form panel */}
      {user.role === 'Vendor' && isBidding && (
        <div className="glass-card rounded-xl border border-slate-800 p-6 mt-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-3 mb-5 flex items-center justify-between">
            <span>{isEditingBid ? 'Edit Bidding Proposal' : 'Configure Bidding Proposal'}</span>
            <button
              onClick={() => {
                setIsBidding(false);
                setIsEditingBid(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-350"
            >
              Cancel
            </button>
          </h3>

          <form onSubmit={handleBidSubmit} className="space-y-6">
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Set Line Item Unit Pricing (INR)</h4>
              
              <div className="overflow-x-auto border border-slate-850 rounded-lg">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-850 bg-[#0d1321] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3">Item Description</th>
                      <th className="px-4 py-3 text-right">Required Qty</th>
                      <th className="px-4 py-3 w-40">Unit Price (INR) *</th>
                      <th className="px-4 py-3 text-right w-40">Total Price (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                    {bidItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 font-semibold text-slate-200">{item.name}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{item.quantity} <span className="text-[10px] text-slate-500 font-mono">{item.unit}</span></td>
                        <td className="px-4 py-2">
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-[10px]">INR</span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.unitPrice || ''}
                              onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                              className="block w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-white">
                          INR {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {/* Financial summary row */}
                    <tr className="bg-[#0d1321]/30 font-bold border-t-2 border-slate-800">
                      <td colSpan={3} className="px-4 py-3 text-right text-slate-400">Total Bidding Value:</td>
                      <td className="px-4 py-3 text-right text-blue-400 text-sm">
                        INR {calculateBidTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>Delivery Timeline (Days) *</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
                  <span>Special Comments / Warranty Scope</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  placeholder="e.g. Warranty covers 3-year replacement, shipping is included."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsBidding(false);
                  setIsEditingBid(false);
                }}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-350 hover:bg-slate-850"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-500/10"
              >
                {isEditingBid ? 'Update Proposal' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Procurement Officer View: List of all received bids */}
      {user.role !== 'Vendor' && (
        <div className="glass-card rounded-xl border border-slate-800 p-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2.5 mb-4 flex items-center justify-between">
            <span>Quotations Submitted ({quotations.length})</span>
            {quotations.length > 1 && (
              <Link
                to={`/rfqs/${rfq._id}/compare`}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                Side-by-Side Comparison Matrix →
              </Link>
            )}
          </h3>

          <div className="space-y-4">
            {quotations.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No quotations submitted by vendors yet.</p>
            ) : (
              quotations.map((quote) => (
                <div key={quote._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition-colors gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">
                      {quote.vendorId?.companyName || 'Unknown Vendor'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-slate-500">
                      <span>Rating: <strong className="text-amber-400 font-semibold">{quote.vendorId?.rating?.toFixed(1)} ★</strong></span>
                      <span>·</span>
                      <span>Delivery: <strong className="text-slate-300">{quote.deliveryDays} days</strong></span>
                      {quote.notes && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-xs italic text-slate-400">"{quote.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-5 justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Total Bid</span>
                      <strong className="text-xs font-bold text-blue-400">
                        INR {quote.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        quote.status === 'Accepted'
                          ? 'bg-green-500/10 text-green-400'
                          : quote.status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {quote.status}
                      </span>
                      {user.role === 'Procurement Officer' && rfq.status === 'Open' && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`Request approval for ${quote.vendorId.companyName}'s quotation?`)) {
                              try {
                                await API.post('/approvals', { rfqId: rfq._id, quotationId: quote._id });
                                toast.success('Sent approval request to Managers!');
                                navigate('/purchase-orders'); // or approvals page
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Failed to submit approval request');
                              }
                            }
                          }}
                          className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] uppercase tracking-wider px-3 py-1.5 transition-all"
                        >
                          Select Bid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQDetail;
