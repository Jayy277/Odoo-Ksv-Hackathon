import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import { ArrowLeft, Award, ShieldAlert, AwardIcon, TrendingDown, Star, Calendar } from 'lucide-react';

const QuotationComparison = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price'); // 'price' or 'delivery'

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/rfqs/${id}`);
        setRfq(response.data.rfq);
        setQuotations(response.data.quotations);
      } catch (error) {
        toast.error('Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };
    fetchComparisonData();
  }, [id]);

  const handleSelectVendor = async (quoteId, companyName) => {
    if (!window.confirm(`Request manager approval for selecting vendor "${companyName}"?`)) return;

    try {
      await API.post('/approvals', {
        rfqId: rfq._id,
        quotationId: quoteId
      });
      toast.success('Approval request sent to Managers successfully!');
      navigate('/purchase-orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit selection for approval');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!rfq || quotations.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center text-xs text-slate-500">
        <p>No quotations submitted for comparison.</p>
        <Link to={`/rfqs/${id}`} className="text-blue-400 font-semibold hover:underline">
          Return to RFQ
        </Link>
      </div>
    );
  }

  // Find lowest price per item
  const lowestPricePerItem = {};
  rfq.items.forEach((rfqItem) => {
    let minPrice = Infinity;
    quotations.forEach((quote) => {
      const quoteItem = quote.items.find((qi) => qi.name === rfqItem.name);
      if (quoteItem && quoteItem.unitPrice < minPrice) {
        minPrice = quoteItem.unitPrice;
      }
    });
    lowestPricePerItem[rfqItem.name] = minPrice;
  });

  // Find overall lowest total amount
  const lowestTotalAmount = Math.min(...quotations.map((q) => q.totalAmount));

  // Sort quotations
  const sortedQuotations = [...quotations].sort((a, b) => {
    if (sortBy === 'price') {
      return a.totalAmount - b.totalAmount;
    } else {
      return a.deliveryDays - b.deliveryDays;
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation */}
      <div>
        <Link
          to={`/rfqs/${id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-350 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to RFQ Detail</span>
        </Link>
      </div>

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Quotation Comparison Matrix</h2>
          <p className="text-xs text-slate-500">Compare bidding bids side-by-side. RFQ: <span className="text-slate-300 font-medium">{rfq.title}</span></p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Sort Matrix by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-350 py-1.5 px-3 focus:outline-none"
          >
            <option value="price">Lowest Bid Price</option>
            <option value="delivery">Fastest Delivery Timeline</option>
          </select>
        </div>
      </div>

      {/* Grid Comparison Matrix */}
      <div className="overflow-x-auto border border-slate-800 bg-[#0d1321]/40 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0d1321]">
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider w-64 border-r border-slate-850">
                Evaluation Parameters
              </th>
              {sortedQuotations.map((quote) => (
                <th key={quote._id} className="px-6 py-5 border-r border-slate-850 last:border-0 relative">
                  {quote.totalAmount === lowestTotalAmount && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
                  )}
                  <h3 className="text-sm font-bold text-white leading-none">
                    {quote.vendorId?.companyName || 'Unknown Vendor'}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-[10px] text-amber-400 font-semibold">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {quote.vendorId?.rating?.toFixed(1) || '4.5'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Rating Score</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs text-slate-300 divide-y divide-slate-850">
            {/* Delivery Timeline row */}
            <tr>
              <td className="px-6 py-4 font-semibold text-slate-400 border-r border-slate-850 bg-[#0d1321]/20">
                Delivery Timeline (Days)
              </td>
              {sortedQuotations.map((quote) => (
                <td key={quote._id} className="px-6 py-4 border-r border-slate-850 last:border-0 font-medium">
                  {quote.deliveryDays} Days
                </td>
              ))}
            </tr>

            {/* Remarks / Comments row */}
            <tr>
              <td className="px-6 py-4 font-semibold text-slate-400 border-r border-slate-850 bg-[#0d1321]/20">
                Special Remarks / Warranty
              </td>
              {sortedQuotations.map((quote) => (
                <td key={quote._id} className="px-6 py-4 border-r border-slate-850 last:border-0 text-slate-400 italic">
                  {quote.notes || 'No remarks provided'}
                </td>
              ))}
            </tr>

            {/* Line items details */}
            <tr className="bg-[#0f172a]/45 font-bold uppercase tracking-wider text-[10px] text-slate-500 border-t border-slate-800">
              <td colSpan={sortedQuotations.length + 1} className="px-6 py-3">
                Itemized Unit Pricing Comparison
              </td>
            </tr>

            {rfq.items.map((rfqItem, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 border-r border-slate-850 bg-[#0d1321]/20 font-semibold text-slate-200">
                  {rfqItem.name} <span className="text-[10px] text-slate-500 font-normal">({rfqItem.quantity} {rfqItem.unit})</span>
                </td>
                {sortedQuotations.map((quote) => {
                  const quoteItem = quote.items.find((qi) => qi.name === rfqItem.name);
                  const isLowest = quoteItem && quoteItem.unitPrice === lowestPricePerItem[rfqItem.name];
                  return (
                    <td
                      key={quote._id}
                      className={`px-6 py-4 border-r border-slate-850 last:border-0 ${
                        isLowest ? 'bg-green-500/5' : ''
                      }`}
                    >
                      {quoteItem ? (
                        <div className="space-y-0.5">
                          <p className={`font-semibold ${isLowest ? 'text-green-400' : 'text-slate-200'}`}>
                            INR {quoteItem.unitPrice.toFixed(2)} / unit
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Total: INR {quoteItem.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          {isLowest && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-green-400 font-bold bg-green-500/10 px-1.5 py-0.25 rounded uppercase">
                              Lowest Price
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600">Not quoted</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Bid Summary footer */}
            <tr className="border-t-2 border-slate-800 font-bold bg-[#0d1321]/50 text-sm">
              <td className="px-6 py-5 text-slate-350 border-r border-slate-850">
                Overall Total Value (INR)
              </td>
              {sortedQuotations.map((quote) => {
                const isOverallLowest = quote.totalAmount === lowestTotalAmount;
                return (
                  <td
                    key={quote._id}
                    className={`px-6 py-5 border-r border-slate-850 last:border-0 ${
                      isOverallLowest ? 'bg-green-500/15' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <p className={`font-extrabold ${isOverallLowest ? 'text-green-400' : 'text-white'}`}>
                        INR {quote.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      {isOverallLowest && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-green-400 font-extrabold bg-green-500/15 px-2 py-0.5 rounded border border-green-500/20 uppercase">
                          ★ Best Bid Deal
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Selection row */}
            <tr className="bg-[#0f172a]/20 border-t border-slate-800">
              <td className="px-6 py-4 border-r border-slate-850 bg-[#0d1321]/20"></td>
              {sortedQuotations.map((quote) => (
                <td key={quote._id} className="px-6 py-4 border-r border-slate-850 last:border-0">
                  {rfq.status === 'Open' ? (
                    <button
                      onClick={() => handleSelectVendor(quote._id, quote.vendorId.companyName)}
                      className={`w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        quote.totalAmount === lowestTotalAmount
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/15'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      Select Vendor
                    </button>
                  ) : (
                    <span className="block text-center text-slate-500 font-semibold text-[10px] uppercase tracking-wider py-2">
                      RFQ Awarded
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationComparison;
