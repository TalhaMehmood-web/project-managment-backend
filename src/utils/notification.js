// src/utils/notificationUtils.js

import Notification from "../models/notification.model.js";
import { getReceiverSocketId, io } from "../configs/socket.js";
/**
 * Create and send a real-time notification
 *
 * @param {Object} options - Notification options
 * @param {Object} options.recipient - Recipient user object
 * @param {Object} options.sender - Sender user object
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.userId - Recipient user ID for socket
 */
export const createAndSendNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  userId,
}) => {
  try {
    // Create and save the notification
    const notification = new Notification({
      recipient: recipient._id,
      sender: sender._id,
      type,
      title,
      message,
    });
    await notification.save();

    // Get recipient socket ID
    const userSocketId = getReceiverSocketId(userId);

    // Send real-time notification via socket
    if (userSocketId) {
      io.to(userSocketId).emit("notification", {
        _id: notification._id,
        title: notification.title,
        recipient: {
          _id: recipient._id,
          email: recipient.email,
          fullName: recipient.fullName,
          role: recipient.role,
        },
        sender: {
          _id: sender._id,
          email: sender.email,
          fullName: sender.fullName,
          role: sender.role,
        },
        isRead: notification.isRead,
        message: notification.message,
        createdAt: notification.createdAt,
        type: notification.type,
      });
    }
  } catch (error) {
    console.error("Error creating or sending notification:", error);
  }
};
