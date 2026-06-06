import ActivityLog from '../models/ActivityLog.js';

// Fetch all activity logs (restricted to Admin/Manager)
export const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error retrieving activity logs' });
  }
};
