import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, MailOpen } from 'lucide-react';

const Navbar = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-64 right-0 z-10 flex h-16 items-center justify-between border-b border-slate-800 bg-[#0d1321]/80 px-8 backdrop-blur-md">
      {/* Title / Module Name */}
      <div>
        <h1 className="text-lg font-semibold text-white">
          Portal Control Centre
        </h1>
        <p className="text-xs text-slate-500">
          Logged in as <span className="text-slate-400 font-medium">{user?.role}</span>
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-850 bg-[#0f172a] shadow-xl ring-1 ring-black/50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-850 px-4 py-3 bg-[#0d1321]">
                <span className="text-sm font-semibold text-white">Workflow Alerts</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-xs text-blue-400">
                    {unreadCount} pending
                  </span>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                    <MailOpen className="h-8 w-8 text-slate-600 mb-2" />
                    <span className="text-xs">All caught up! No alerts.</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`flex flex-col p-4 transition-all hover:bg-slate-850/35 ${
                        !notif.isRead ? 'bg-blue-600/5 border-l-2 border-blue-500' : 'bg-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-slate-300 leading-relaxed break-words">
                          {notif.message}
                        </p>
                        {!notif.isRead && (
                          <button
                            onClick={() => markAsRead(notif._id)}
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-blue-600/15 text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <span className="mt-2 text-[10px] text-slate-500">
                        {new Date(notif.createdAt).toLocaleTimeString()} · {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-slate-200">{user?.name}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
