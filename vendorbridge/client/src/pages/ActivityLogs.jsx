import React, { useState, useEffect } from 'react';
import API from '../api';
import { toast } from 'react-toastify';
import { ClipboardList, Shield, Filter } from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await API.get('/activity-logs');
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to load system activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = moduleFilter
    ? logs.filter((log) => log.module === moduleFilter)
    : logs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-5.5 w-5.5 text-blue-500" />
            <span>Audit Activity Logs</span>
          </h2>
          <p className="text-xs text-slate-500">System-wide audit trail of operational events and status updates</p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-350 py-1.5 px-3 focus:outline-none"
          >
            <option value="">All Modules</option>
            <option value="Auth">Auth / Session</option>
            <option value="Vendor">Vendor Profile</option>
            <option value="RFQ">RFQ Management</option>
            <option value="Quotation">Quotation / Bid</option>
            <option value="Approval">Manager Approval</option>
            <option value="PO">Purchase Order</option>
            <option value="Invoice">Invoice</option>
          </select>
        </div>
      </div>

      {/* Audit table */}
      <div className="overflow-hidden border border-slate-800 bg-[#0d1321]/50 rounded-xl">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">No activity logs recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-[#0d1321] text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-350">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500 text-[10px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {log.userId?.name || 'System / Unknown'}
                      <span className="block text-[9px] font-normal text-slate-500 font-mono mt-0.5">{log.userId?.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        {log.userId?.role || 'Guest'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{log.action}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-[10px] text-blue-400 font-semibold border border-blue-500/10">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={log.details}>
                      {log.details || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
