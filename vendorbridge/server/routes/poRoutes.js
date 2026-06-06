import express from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus
} from '../controllers/poController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.put('/:id', updatePurchaseOrderStatus);

export default router;
