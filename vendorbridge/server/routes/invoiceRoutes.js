import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  sendInvoiceByEmail,
  getInvoicePDFFile
} from '../controllers/invoiceController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', getInvoicePDFFile);

router.post('/', restrictTo('Procurement Officer'), createInvoice);
router.put('/:id', restrictTo('Procurement Officer'), updateInvoice);
router.post('/:id/send-email', restrictTo('Procurement Officer'), sendInvoiceByEmail);

export default router;
