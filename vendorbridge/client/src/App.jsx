import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import RFQs from './pages/RFQs';
import RFQDetail from './pages/RFQDetail';
import QuotationComparison from './pages/QuotationComparison';
import Approvals from './pages/Approvals';
import PurchaseOrders from './pages/PurchaseOrders';
import PODetail from './pages/PODetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';

// Master Dashboard Layout
const Layout = () => {
  return (
    <div className="min-h-screen bg-[#0b0f19]">
      <Sidebar />
      <Navbar />
      {/* Content wrapper. Offset by sidebar width (ml-64) and navbar height (pt-20) */}
      <main className="ml-64 pt-20 px-8 min-h-screen text-slate-100 bg-[#0b0f19]">
        <Outlet />
      </main>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Workspace Dashboard Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Home Dashboard (Any Role) */}
              <Route path="/" element={<Dashboard />} />

              {/* Vendor Management (Admin / Procurement Officer) */}
              <Route
                path="/vendors"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer']}>
                    <Vendors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendors/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer']}>
                    <VendorDetail />
                  </ProtectedRoute>
                }
              />

              {/* RFQ Management */}
              <Route
                path="/rfqs"
                element={
                  <ProtectedRoute allowedRoles={['Procurement Officer', 'Vendor']}>
                    <RFQs />
                  </ProtectedRoute>
                }
              />
              <Route path="/rfqs/:id" element={<RFQDetail />} />
              <Route
                path="/rfqs/:id/compare"
                element={
                  <ProtectedRoute allowedRoles={['Procurement Officer', 'Admin', 'Manager']}>
                    <QuotationComparison />
                  </ProtectedRoute>
                }
              />

              {/* Approval Workflow (Manager / Approver) */}
              <Route
                path="/approvals"
                element={
                  <ProtectedRoute allowedRoles={['Manager', 'Procurement Officer', 'Admin']}>
                    <Approvals />
                  </ProtectedRoute>
                }
              />

              {/* Purchase Orders */}
              <Route
                path="/purchase-orders"
                element={
                  <ProtectedRoute allowedRoles={['Procurement Officer', 'Vendor', 'Manager', 'Admin']}>
                    <PurchaseOrders />
                  </ProtectedRoute>
                }
              />
              <Route path="/purchase-orders/:id" element={<PODetail />} />

              {/* Invoices */}
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute allowedRoles={['Procurement Officer', 'Vendor', 'Admin']}>
                    <Invoices />
                  </ProtectedRoute>
                }
              />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />

              {/* Activity Logs (Admin / Manager) */}
              <Route
                path="/activity-logs"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                    <ActivityLogs />
                  </ProtectedRoute>
                }
              />

              {/* Reports (Admin / Manager) */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast notifications container */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
