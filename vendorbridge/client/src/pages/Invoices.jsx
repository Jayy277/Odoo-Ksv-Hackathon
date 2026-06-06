import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import { FileText, Calendar, Receipt, ChevronRight } from 'lucide-react';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await API.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Tax Invoices</h2>
        <p className="text-xs text-slate-500">Review, print, download, and dispatch invoices linked to purchase orders</p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-20 text-center text-slate-500 text-xs bg-[#0d1321]/30 border border-slate-800 rounded-xl">
          No Invoices found in the system.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {invoices.map((inv) => (
            <div
              key={inv._id}
              className="glass-card rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      inv.status === 'Paid'
                        ? 'bg-green-500/10 text-green-400'
                        : inv.status === 'Sent'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {inv.status}
                  </span>
                  <h3 className="text-sm font-bold text-white leading-none">
                    <Link to={`/invoices/${inv._id}`} className="hover:underline hover:text-blue-400">
                      {inv.invoiceNumber}
                    </Link>
                  </h3>
                </div>

                <div className="text-xs text-slate-400">
                  Vendor: <strong className="text-slate-350">{inv.vendorId?.companyName || 'Apex'}</strong> · PO: <span className="font-semibold text-slate-400">{inv.poId?.poNumber}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                  {inv.sentAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Dispatched: {new Date(inv.sentAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between md:justify-end">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Total Value (incl. GST)</span>
                  <strong className="text-xs font-bold text-blue-400">
                    INR {inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>

                <Link
                  to={`/invoices/${inv._id}`}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-850 transition-all"
                >
                  <span>View Details</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Invoices;
