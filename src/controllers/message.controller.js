import expressAsyncHandler from "express-async-handler";
import Message from "../models/message.model.js";
import { sendResponse } from "../utils/response-handler/index.js";

export const getMessagesOfChat = expressAsyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required" });
    }

    // Fetch messages, populating sender details
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "fullName email userName isAdmin") // Populate sender info
      .sort({ createdAt: 1 }); // Sort oldest to newest

    // Add `senderId` field explicitly
    const messagesWithSenderId = messages.map((msg) => ({
      ...msg.toObject(),
      senderId: msg.sender._id, // Extract sender's ObjectId
    }));

    return sendResponse(
      res,
      200,
      "Messages fetched successfully",
      messagesWithSenderId
    );
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
