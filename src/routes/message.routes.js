import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getMessagesOfChat } from "../controllers/message.controller.js";
const router = express.Router();

router.get("/:chatId", verifyJWT, getMessagesOfChat);

export default router;
