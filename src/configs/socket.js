import { Server } from "socket.io";
import messageHandler from "../socket-handlers/message-handlers.js";
export let io;
let onlineUsers = new Map();
export const getReceiverSocketId = (receiverId) => {
  return onlineUsers.get(receiverId);
};
const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Handle user joining (store userId -> socketId)
    socket.on("join", (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
      }
    });

    // Register socket handlers
    messageHandler(io, socket);

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      // Remove user from online list
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`🚫 User ${userId} went offline`);
          io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
          break;
        }
      }
    });
  });

  return io;
};

export default setupSocket;
