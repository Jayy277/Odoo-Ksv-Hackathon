import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import Routers
import authRoutes from './routes/authRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import rfqRoutes from './routes/rfqRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import poRoutes from './routes/poRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware (simple)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportsRoutes);

// Base Check Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'VendorBridge ERP API Server is running smoothly!' });
});

// Database Connection and Server Boot
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vendorbridge';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Express Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed! Server aborted.', err);
    process.exit(1);
  });
