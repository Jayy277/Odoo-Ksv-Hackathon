import React, { useState, useEffect } from 'react';
import API from '../api';
import { toast } from 'react-toastify';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FileDown, Calendar, BarChart3, TrendingUp, PieChart as PieIcon, Award } from 'lucide-react';

const COLORS = ['#1b6ff7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const Reports = () => {
  const [spendingData, setSpendingData] = useState([]);
  const [vendorData, setVendorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const spendRes = await API.get('/reports/spending');
        const vendorRes = await API.get('/reports/vendors');
        setSpendingData(spendRes.data);
        setVendorData(vendorRes.data);
      } catch (error) {
        toast.error('Failed to load analytical reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Export vendor analytics as CSV
  const handleExportCSV = () => {
    if (vendorData.length === 0) {
      toast.error('No report data available to export');
      return;
    }

    try {
      const headers = ['Vendor Name', 'Category', 'Purchase Orders Count', 'Total Spent (INR)'];
      const rows = vendorData.map((v) => [
        `"${v.vendorName}"`,
        `"${v.category}"`,
        v.count,
        v.amount
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `procurement_vendor_analysis_${new Date().getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('CSV report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export CSV file');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5.5 w-5.5 text-blue-500" />
            <span>Reports & Analytics Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500">Corporate spending pipelines and vendor volume distributions</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/10 self-start sm:self-center"
        >
          <FileDown className="h-4 w-4" />
          <span>Export Analytics (CSV)</span>
        </button>
      </div>

      {spendingData.length === 0 && vendorData.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-500 bg-[#0d1321]/30 border border-slate-800 rounded-xl">
          No transactions registered in system database.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Spend Trends Graph */}
          <div className="glass-card rounded-xl border border-slate-800 p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span>Procurement Spend Timeline (INR)</span>
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="amount" name="Spend Value (INR)" stroke="#1b6ff7" strokeWidth={3.5} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Splitted vendor volume distribution charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl border border-slate-800 p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <PieIcon className="h-4 w-4 text-blue-400" />
                <span>Supplier Spend Breakdown</span>
              </h3>
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorData}
                      dataKey="amount"
                      nameKey="vendorName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name }) => name.substring(0, 12) + '...'}
                    >
                      {vendorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-xl border border-slate-800 p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span>Order Volume per Supplier</span>
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendorData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="vendorName" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="count" name="Order count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Supplier matrix table */}
          <div className="glass-card rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4 text-blue-400" />
              <span>Top Vendor Volume Metrics</span>
            </h3>

            <div className="overflow-x-auto border border-slate-850 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-850 bg-[#0d1321] text-[10px] font-bold uppercase text-slate-400">
                    <th className="px-5 py-3">Vendor Supplier</th>
                    <th className="px-5 py-3">Industry Category</th>
                    <th className="px-5 py-3 text-right">Orders Handled</th>
                    <th className="px-5 py-3 text-right">Total Transacted Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-350">
                  {vendorData.map((vendor, index) => (
                    <tr key={index} className="hover:bg-slate-900/10">
                      <td className="px-5 py-3 font-semibold text-slate-200">{vendor.vendorName}</td>
                      <td className="px-5 py-3 text-slate-400">{vendor.category}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-200">{vendor.count}</td>
                      <td className="px-5 py-3 text-right font-bold text-white">
                        INR {vendor.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
