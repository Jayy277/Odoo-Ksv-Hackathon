import express from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('Admin', 'Manager')); // Only Admin & Manager can access logs

router.get('/', getActivityLogs);

export default router;
