import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileQuestion,
  CheckSquare,
  FileCheck,
  Receipt,
  ClipboardList,
  BarChart3,
  LogOut,
  Building2
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Define navigation items with roles allowed
  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['Admin', 'Procurement Officer', 'Vendor', 'Manager']
    },
    {
      name: 'Vendors',
      path: '/vendors',
      icon: Users,
      roles: ['Admin', 'Procurement Officer']
    },
    {
      name: 'RFQs',
      path: '/rfqs',
      icon: FileQuestion,
      roles: ['Procurement Officer', 'Vendor']
    },
    {
      name: 'Approvals',
      path: '/approvals',
      icon: CheckSquare,
      roles: ['Manager']
    },
    {
      name: 'Purchase Orders',
      path: '/purchase-orders',
      icon: FileCheck,
      roles: ['Procurement Officer', 'Vendor', 'Manager']
    },
    {
      name: 'Invoices',
      path: '/invoices',
      icon: Receipt,
      roles: ['Procurement Officer', 'Vendor']
    },
    {
      name: 'Activity Logs',
      path: '/activity-logs',
      icon: ClipboardList,
      roles: ['Admin', 'Manager']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
      roles: ['Admin', 'Manager']
    }
  ];

  // Filter nav items based on user role
  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-20 flex w-64 flex-col border-r border-slate-800 bg-[#0d1321] text-slate-200">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-6">
        <Building2 className="h-7 w-7 text-blue-500" />
        <span className="text-xl font-bold tracking-tight text-white">
          Vendor<span className="text-blue-500">Bridge</span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border-l-4 border-blue-500 pl-3'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Session profile / actions footer */}
      <div className="border-t border-slate-800 bg-[#080c16] p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10 text-sm font-bold text-blue-400 border border-blue-500/20">
            {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-semibold text-white">{user.name}</span>
            <span className="truncate text-xs text-slate-500">{user.role}</span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/30 hover:text-rose-300 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
