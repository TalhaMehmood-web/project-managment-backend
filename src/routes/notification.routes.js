import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  deleteNotifications,
  getAllNotificationsOfLoggedInUser,
  markAsReadNotification,
} from "../controllers/notification.controller.js";
const router = express.Router();

router.get("/all", verifyJWT, getAllNotificationsOfLoggedInUser);
router.patch("/mark-as-read", verifyJWT, markAsReadNotification);
router.delete("/", verifyJWT, deleteNotifications);
export default router;
