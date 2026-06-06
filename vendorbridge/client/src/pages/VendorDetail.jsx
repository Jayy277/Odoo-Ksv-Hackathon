import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import { ArrowLeft, Building2, Phone, Mail, Award, Landmark, FileQuestion, FileCheck } from 'lucide-react';

const VendorDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/vendors/${id}`);
        setData(response.data);
      } catch (error) {
        toast.error('Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        Vendor not found.
      </div>
    );
  }

  const { vendor, rfqs, pos } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          to="/vendors"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-350 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to directory</span>
        </Link>
      </div>

      {/* Header Profile Header */}
      <div className="glass-card rounded-xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{vendor.companyName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>Category: <strong className="text-slate-300 font-medium">{vendor.category}</strong></span>
              <span className="hidden md:inline">·</span>
              <span>Rating: <strong className="text-amber-400 font-medium">{vendor.rating.toFixed(1)} ★</strong></span>
            </div>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              vendor.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {vendor.status}
          </span>
        </div>
      </div>

      {/* Detailed Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact details */}
        <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5">
            Contact Profile
          </h3>
          
          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-slate-500 text-[10px]">Contact Person</p>
                <p className="font-semibold text-slate-200">{vendor.contactPerson}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-slate-500 text-[10px]">Email Address</p>
                <p className="font-semibold text-slate-250">{vendor.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-slate-500 text-[10px]">Phone Number</p>
                <p className="font-semibold text-slate-200">{vendor.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Landmark className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-slate-500 text-[10px]">GSTIN Number</p>
                <p className="font-mono font-semibold text-slate-200">{vendor.gstNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Linked RFQs Panel */}
        <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-4 md:col-span-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <span>Associated RFQs</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-semibold">{rfqs.length}</span>
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {rfqs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">No RFQs linked to this vendor.</div>
            ) : (
              rfqs.map((rfq) => (
                <div key={rfq._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition-colors">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">{rfq.title}</h4>
                    <span className="text-[10px] text-slate-500">
                      Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      rfq.status === 'Open' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    {rfq.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Linked POs Panel */}
        <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-4 md:col-span-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <span>Associated Purchase Orders</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-semibold">{pos.length}</span>
          </h3>

          <div className="overflow-x-auto">
            {pos.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">No Purchase Orders issued yet.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5">PO Number</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs text-slate-350">
                  {pos.map((po) => (
                    <tr key={po._id} className="hover:bg-slate-900/20">
                      <td className="py-3 font-semibold text-blue-400">
                        <Link to={`/purchase-orders/${po._id}`} className="hover:underline">
                          {po.poNumber}
                        </Link>
                      </td>
                      <td className="py-3 text-[10px]">{new Date(po.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            po.status === 'Completed'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-purple-500/10 text-purple-400'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-white">
                        INR {po.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetail;
