import expressAsyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import { sendResponse } from "../utils/response-handler/index.js";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
export const getAdmin = expressAsyncHandler(async (req, res) => {
  try {
    const admin = await User.find({ isAdmin: true }).select(
      "fullName email username _id isAdmin"
    );
    if (!admin) {
      return sendResponse(res, 404, "Admin not found");
    }

    return sendResponse(res, 200, "Admin found", admin);
  } catch (error) {
    return sendResponse(res, 500, error.message || "Server Error");
  }
});

export const getAllChatsOfLoggedInUser = expressAsyncHandler(
  async (req, res) => {
    try {
      const userId = req.user._id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Fetch one-on-one chats (not group chats) where the user is a participant
      const chats = await Chat.find({
        isGroupChat: false, // Exclude group chats
        users: userId, // Check if the logged-in user is in the users array
      })
        .populate("users", "_id fullName email userName isAdmin") // Populate user details
        .populate("latestMessage") // Populate latest message
        .sort({ updatedAt: -1 }); // Sort by recent activity

      res.status(200).json({
        success: true,
        message: "Chats fetched successfully",
        data: chats,
      });
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

export const getChatUsers = expressAsyncHandler(async (req, res) => {
  try {
    const loggedInUserId = req.user._id; // Get logged-in user's ID
    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let { searchQuery } = req.query; // Single search input

    // Trim and normalize search query
    searchQuery = searchQuery?.trim() || "";

    // Base query to find all one-on-one chats where the user is a participant
    let chatQuery = {
      isGroupChat: false,
      users: loggedInUserId,
    };

    // Fetch chats
    let chats = await Chat.find(chatQuery)
      .populate({
        path: "users",
        select: "_id fullName email userName role",
        match: searchQuery
          ? { fullName: { $regex: `^${searchQuery}`, $options: "i" } } // Case-insensitive & trims before applying regex
          : {},
      })
      .populate("latestMessage", "content") // Populate latest message content
      .select("_id users latestMessage");

    // Remove chats where user filtering removed all participants
    chats = chats.filter((chat) => chat.users.length > 1);

    // Extract unique users with chat details
    const chatUsers = [];
    const userSet = new Set();

    chats.forEach((chat) => {
      chat.users.forEach((user) => {
        if (
          user && // Ensure user exists
          user._id.toString() !== loggedInUserId.toString() &&
          !userSet.has(user._id.toString())
        ) {
          userSet.add(user._id.toString());
          chatUsers.push({
            chatId: chat._id,
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            userName: user.userName,
            isAdmin: user.isAdmin,
            lastMessage: chat.latestMessage?.content || null, // Include latest message content
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      message: "Chat users fetched successfully",
      data: chatUsers,
    });
  } catch (error) {
    console.error("Error fetching chat users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
