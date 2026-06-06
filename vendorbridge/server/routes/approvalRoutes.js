import express from 'express';
import {
  getApprovals,
  createApprovalRequest,
  processApproval
} from '../controllers/approvalController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getApprovals);

// Procurement Officer requests approval
router.post('/', restrictTo('Procurement Officer'), createApprovalRequest);

// Manager reviews and signs off (Approve/Reject)
router.put('/:id', restrictTo('Manager'), processApproval);

export default router;
