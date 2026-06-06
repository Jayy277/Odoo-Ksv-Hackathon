import ActivityLog from '../models/ActivityLog.js';

/**
 * Creates an activity log entry.
 * @param {string} userId User ID performing the action
 * @param {string} action Description of action (e.g., "Created RFQ")
 * @param {string} module Target Module (e.g., "RFQ", "PO")
 * @param {string} details Contextual info (e.g., "RFQ title: Laptop Order")
 */
export const logActivity = async (userId, action, module, details) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      module,
      details
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
};
