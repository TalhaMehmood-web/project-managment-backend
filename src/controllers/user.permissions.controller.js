import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import { sendResponse } from "../utils/response-handler/index.js";
import Notification from "../models/notification.model.js";
import { io } from "../configs/socket.js";
import { getReceiverSocketId } from "../configs/socket.js";
import { createAndSendNotification } from "../utils/notification.js";
export const verifyUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUser = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }
    user.isVerified = true;
    await user.save();
    // Send real-time notification via socket
    await createAndSendNotification({
      userId: userId,
      recipient: user,
      sender: loggedInUser,
      type: "USER_VERIFIED",
      title: "Account Verified",
      message: "Congratulations! Your account has been successfully verified.",
    });

    return sendResponse(res, 200, "User verified successfully");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});
export const blockUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    const loggedInUser = req.user;
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }
    user.isVerified = false;
    await user.save();
    await createAndSendNotification({
      userId,
      recipient: user,
      sender: loggedInUser,
      type: "USER_BLOCKED",
      title: "Account Blocked",
      message:
        "Your account has been blocked. Please contact support for assistance.",
    });
    // const notification = new Notification({
    //   recipient: user._id,
    //   sender: loggedInUser._id,
    //   type: "USER_BLOCKED",
    //   title: "Account Blocked",
    //   message:
    //     "Your account has been blocked. Please contact support for assistance.",
    // });
    // await notification.save();

    // // Send real-time notification via socket
    // const userSocketId = getReceiverSocketId(userId);

    // if (userSocketId) {
    //   io.to(userSocketId).emit("notification", {
    //     _id: notification?._id,
    //     title: notification.title,
    //     recipient: {
    //       _id: user?._id,
    //       email: user?.email,
    //       fullName: user?.fullName,
    //       role: user?.role,
    //     },
    //     sender: {
    //       _id: loggedInUser?._id,
    //       email: loggedInUser?.email,
    //       fullName: loggedInUser?.fullName,
    //       role: loggedInUser?.role,
    //     },
    //     isRead: notification?.isRead,
    //     message: notification.message,
    //     createdAt: notification.createdAt,
    //     type: notification.type,
    //   });
    // }
    return sendResponse(res, 200, "User blocked successfully");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});
