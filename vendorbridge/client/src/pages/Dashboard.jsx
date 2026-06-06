import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import API from '../api';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  FileSpreadsheet,
  CheckCircle,
  PlusCircle,
  FileQuestion,
  FileCheck,
  Receipt,
  UserPlus,
  AlertCircle
} from 'lucide-react';

const COLORS = ['#1b6ff7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const Dashboard = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pendingApprovals: 0,
    activeRfqs: 0,
    totalPos: 0,
    totalInvoices: 0,
    totalSpend: 0,
    vendorCount: 0
  });
  const [spendingData, setSpendingData] = useState([]);
  const [vendorData, setVendorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch core data arrays to compile dashboard metrics
        const rfqRes = await API.get('/rfqs');
        const poRes = await API.get('/purchase-orders');
        
        let activeRfqs = 0;
        let totalSpend = 0;
        let totalPos = poRes.data.length;
        let pendingApprovals = 0;
        let vendorCount = 0;
        let totalInvoices = 0;

        activeRfqs = rfqRes.data.filter(r => r.status === 'Open').length;
        poRes.data.forEach(po => {
          totalSpend += po.totalAmount;
        });

        // Fetches that depend on roles
        if (user.role === 'Admin' || user.role === 'Procurement Officer') {
          const vendorRes = await API.get('/vendors');
          vendorCount = vendorRes.data.length;
        }

        if (user.role === 'Procurement Officer' || user.role === 'Vendor') {
          const invRes = await API.get('/invoices');
          totalInvoices = invRes.data.length;
        }

        if (user.role === 'Manager') {
          const appRes = await API.get('/approvals');
          pendingApprovals = appRes.data.filter(a => a.status === 'Pending').length;
        } else if (user.role === 'Procurement Officer') {
          const appRes = await API.get('/approvals');
          pendingApprovals = appRes.data.filter(a => a.status === 'Pending').length;
        }

        setStats({
          pendingApprovals,
          activeRfqs,
          totalPos,
          totalInvoices,
          totalSpend,
          vendorCount
        });

        // Fetch reports if Admin/Manager
        if (user.role === 'Admin' || user.role === 'Manager') {
          const spendRep = await API.get('/reports/spending');
          const vendorRep = await API.get('/reports/vendors');
          setSpendingData(spendRep.data);
          setVendorData(vendorRep.data);
        }

      } catch (error) {
        console.error('Error fetching dashboard summary stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-950/20 to-slate-900/40 p-8 border border-slate-800">
        <h2 className="text-2xl font-extrabold text-white">Welcome back, {user?.name}!</h2>
        <p className="mt-1 text-slate-400 max-w-xl text-sm">
          Here is an overview of the procurement pipeline, active requests, quotations, and recent operational workflows.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Spend / Invoices Card */}
        {user.role !== 'Vendor' ? (
          <div className="glass-card rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spend (PO)</span>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  INR {stats.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">Accumulated from approved orders</div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoices Sent</span>
                <h3 className="mt-2 text-2xl font-bold text-white">{stats.totalInvoices}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">Total invoice drafts & sent</div>
          </div>
        )}

        {/* Active RFQs Card */}
        <div className="glass-card rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active RFQs</span>
              <h3 className="mt-2 text-2xl font-bold text-white">{stats.activeRfqs}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <FileQuestion className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">Currently open for quotation inputs</div>
        </div>

        {/* Purchase Orders Issued */}
        <div className="glass-card rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Orders</span>
              <h3 className="mt-2 text-2xl font-bold text-white">{stats.totalPos}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <FileCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">Total POs created & completed</div>
        </div>

        {/* Dynamic Fourth Card (Pending approvals or Vendor count) */}
        {user.role === 'Manager' || user.role === 'Procurement Officer' ? (
          <div className="glass-card rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                <h3 className="mt-2 text-2xl font-bold text-white">{stats.pendingApprovals}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">Awaiting Manager clearance</div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Vendors</span>
                <h3 className="mt-2 text-2xl font-bold text-white">{stats.vendorCount}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">Total registered vendors</div>
          </div>
        )}
      </div>

      {/* Quick Action Dashboard Block */}
      <div className="glass-card rounded-xl p-6 border border-slate-800">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Operations</h3>
        <div className="flex flex-wrap gap-4">
          {user.role === 'Procurement Officer' && (
            <>
              <Link
                to="/rfqs"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/15"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create New RFQ</span>
              </Link>
              <Link
                to="/vendors"
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add New Vendor</span>
              </Link>
            </>
          )}
          {user.role === 'Admin' && (
            <>
              <Link
                to="/vendors"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Manage Vendors</span>
              </Link>
              <Link
                to="/reports"
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>View Reports</span>
              </Link>
            </>
          )}
          {user.role === 'Manager' && (
            <>
              <Link
                to="/approvals"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Process Approvals</span>
              </Link>
              <Link
                to="/reports"
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Spend Analysis</span>
              </Link>
            </>
          )}
          {user.role === 'Vendor' && (
            <>
              <Link
                to="/rfqs"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <FileQuestion className="h-4 w-4" />
                <span>View Assigned RFQs</span>
              </Link>
              <Link
                to="/purchase-orders"
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <FileCheck className="h-4 w-4" />
                <span>View Purchase Orders</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Analytics and Activity Split Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Charts block (Manager / Admin only) */}
        {(user.role === 'Admin' || user.role === 'Manager') && (
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Trend */}
            <div className="glass-card rounded-xl p-6 border border-slate-800">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Monthly Spend Trend (INR)</h4>
              <div className="h-80 w-full">
                {spendingData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-500 text-xs">
                    No PO data available to plot chart.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="amount" stroke="#1b6ff7" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Vendor Breakdowns */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="glass-card rounded-xl p-6 border border-slate-800">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Vendor-wise Share</h4>
                <div className="h-60 w-full flex items-center justify-center">
                  {vendorData.length === 0 ? (
                    <span className="text-xs text-slate-500">No vendor spend data</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vendorData}
                          dataKey="amount"
                          nameKey="vendorName"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          fill="#8884d8"
                          label={({ name }) => name.substring(0, 10) + '...'}
                        >
                          {vendorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 border border-slate-800">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Orders per Vendor</h4>
                <div className="h-60 w-full">
                  {vendorData.length === 0 ? (
                    <span className="text-xs text-slate-500">No order volume data</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendorData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="vendorName" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Alerts / Activity Feed */}
        <div className={`glass-card rounded-xl p-6 border border-slate-800 ${user.role !== 'Admin' && user.role !== 'Manager' ? 'lg:col-span-3' : ''}`}>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Recent Alerts Feed</h4>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center">
                <AlertCircle className="h-7 w-7 mb-2 text-slate-600" />
                <p className="text-xs">No recent activity alerts</p>
              </div>
            ) : (
              notifications.slice(0, 8).map(notif => (
                <div key={notif._id} className="flex gap-3 rounded-lg bg-slate-900/50 p-3.5 border border-slate-850 hover:border-slate-800 transition-all">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-200 leading-normal">{notif.message}</p>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      {new Date(notif.createdAt).toLocaleDateString()} · {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
