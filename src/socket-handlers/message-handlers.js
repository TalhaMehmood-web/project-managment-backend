import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";

const messageHandler = (io, socket) => {
  // **Join chat room**
  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`📩 User joined chat room: ${chatId}`);
  });

  socket.on("sendMessage", async ({ senderId, chatId, content }) => {
    try {
      if (!senderId || !chatId || !content.trim()) return;

      // Save message to DB first
      const newMessage = await Message.create({
        sender: senderId, // Now using senderId
        content,
        chat: chatId,
        seenBy: [senderId],
      });

      // Populate sender details (Optional)
      await newMessage.populate("sender", "fullName email");

      // Update latest message in Chat model
      await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage._id });

      // Emit message after successful DB save
      io.to(chatId).emit("receiveMessage", {
        _id: newMessage._id,
        senderId: newMessage.sender._id, // Ensure frontend gets senderId
        sender: newMessage.sender, // Contains full sender details
        content: newMessage.content,
        chatId: newMessage.chat,
        seenBy: newMessage.seenBy,
        createdAt: newMessage.createdAt,
      });
    } catch (error) {
      console.error("❌ Error sending message:", error);
      socket.emit("messageError", "Message failed to send");
    }
  });

  // **Handle marking messages as seen**
  socket.on("markAsSeen", async ({ chatId, userId }) => {
    try {
      await Message.updateMany(
        { chat: chatId, seenBy: { $ne: userId } }, // Only update unseen messages
        { $addToSet: { seenBy: userId } }
      );
      io.to(chatId).emit("messagesSeen", { chatId, userId });
    } catch (error) {
      console.error("❌ Error marking messages as seen:", error);
    }
  });

  // **Handle disconnect**
  socket.on("disconnect", () => {
    console.log("❌ User Disconnected:", socket.id);
  });
};

export default messageHandler;
