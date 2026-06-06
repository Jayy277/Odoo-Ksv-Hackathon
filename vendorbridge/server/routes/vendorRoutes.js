import express from 'express';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
} from '../controllers/vendorController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Ensure all vendor routes require authentication

router.get('/', getVendors);
router.get('/:id', getVendorById);

// Restrict modifications to Admin and Procurement Officer
router.post('/', restrictTo('Admin', 'Procurement Officer'), createVendor);
router.put('/:id', restrictTo('Admin', 'Procurement Officer'), updateVendor);
router.delete('/:id', restrictTo('Admin', 'Procurement Officer'), deleteVendor);

export default router;
