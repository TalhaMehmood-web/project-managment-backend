import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/isAdmin.middleware.js";
import isClient from "../middlewares/isClient.middleware.js";
import {
  getAdmin,
  getAllChatsOfLoggedInUser,
  getChatUsers,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/getAdmin", verifyJWT, isClient, getAdmin);
router.get("/one-on-one-chats", verifyJWT, getAllChatsOfLoggedInUser);
router.get("/get-chat-users", verifyJWT, getChatUsers);
export default router;
