import express from 'express';
import {
  getRFQs,
  getRFQById,
  createRFQ,
  updateRFQ
} from '../controllers/rfqController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getRFQs);
router.get('/:id', getRFQById);

router.post('/', restrictTo('Procurement Officer'), createRFQ);
router.put('/:id', restrictTo('Procurement Officer'), updateRFQ);

export default router;
