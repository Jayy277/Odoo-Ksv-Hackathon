import express from 'express';
import {
  getQuotations,
  submitQuotation,
  updateQuotation
} from '../controllers/quotationController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getQuotations);

// Restrict submissions and edits to Vendors
router.post('/', restrictTo('Vendor'), submitQuotation);
router.put('/:id', restrictTo('Vendor'), updateQuotation);

export default router;
