import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Creates an in-app notification for a single user.
 * @param {string} userId User ID
 * @param {string} message Message body
 * @param {string} type Notification type (e.g. "RFQ_CREATED")
 */
export const createNotification = async (userId, message, type) => {
  try {
    await Notification.create({
      userId,
      message,
      type
    });
  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};

/**
 * Sends a notification to all users belonging to specified roles.
 * @param {Array<string>} roles Target roles (e.g. ['Manager', 'Procurement Officer'])
 * @param {string} message Message body
 * @param {string} type Notification type
 */
export const notifyRoles = async (roles, message, type) => {
  try {
    const users = await User.find({ role: { $in: roles } });
    if (users.length === 0) return;
    
    const notifications = users.map((u) => ({
      userId: u._id,
      message,
      type
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Group notification dispatch failed:', error);
  }
};
