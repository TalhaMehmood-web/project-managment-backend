import expressAsyncHandler from "express-async-handler";
import Notification from "../models/notification.model.js";
import { sendResponse } from "../utils/response-handler/index.js";

export const getAllNotificationsOfLoggedInUser = expressAsyncHandler(
  async (req, res) => {
    try {
      const userId = req.user._id;

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.pageSize) || 10;
      const skip = (page - 1) * limit;

      const totalNotifications = await Notification.countDocuments({
        recipient: userId,
      });

      const notifications = await Notification.find({ recipient: userId })
        .populate({
          path: "recipient",
          select: "_id fullName email role",
        })
        .populate({
          path: "sender",
          select: "_id fullName email role",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      if (!notifications.length) {
        return sendResponse(res, 200, "No notifications found");
      }

      const totalPages = Math.ceil(totalNotifications / limit);
      const startItem = skip + 1;
      const endItem = Math.min(skip + limit, totalNotifications);
      return sendResponse(res, 200, "Notifications retrieved successfully", {
        notifications,
        pagination: {
          totalItems: totalNotifications,
          currentPage: page,
          totalPages,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          displayedRange: `${startItem}-${endItem}`,
        },
      });
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }
);

export const markAsReadNotification = expressAsyncHandler(async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: "Invalid notification IDs" });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: req.user._id,
      },
      [
        {
          $set: {
            isRead: { $not: "$isRead" },
          },
        },
      ]
    );
    return sendResponse(res, 200, "Notifications updated successfully", {
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});
export const deleteNotifications = expressAsyncHandler(async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: "Invalid notification IDs" });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: req.user._id,
    });
    return sendResponse(res, 200, "Notifications deleted successfully", {
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {}
});
