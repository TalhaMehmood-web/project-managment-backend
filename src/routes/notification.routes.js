import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  deleteNotifications,
  getAllNotificationsOfLoggedInUser,
  markAsReadNotification,
} from "../controllers/notification.controller.js";
import { authorizePermission } from "../middlewares/authorizePermission.middleware.js";
const router = express.Router();

router.get(
  "/all",
  verifyJWT,
  authorizePermission(),
  getAllNotificationsOfLoggedInUser
);
router.patch("/mark-as-read", verifyJWT, markAsReadNotification);
router.delete("/", verifyJWT, deleteNotifications);
export default router;
