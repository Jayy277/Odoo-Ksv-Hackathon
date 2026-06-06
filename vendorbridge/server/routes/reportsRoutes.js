import express from 'express';
import { getSpendingReport, getVendorReport } from '../controllers/reportsController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('Admin', 'Manager'));

router.get('/spending', getSpendingReport);
router.get('/vendors', getVendorReport);

export default router;
