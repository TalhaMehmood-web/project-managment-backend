import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
// configs import
import connectDB from "./src/configs/db.js";
import setupSocket from "./src/configs/socket.js";

// routes import
import userRoutes from "./src/routes/user.routes.js";
import userPermissionsRoutes from "./src/routes/user.permissions.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import messageRoutes from "./src/routes/message.routes.js";
import superAdminRoutes from "./src/routes/super.admin.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import rolesRoutes from "./src/routes/role.routes.js";
import permissionRoutes from "./src/routes/permission.routes.js";

dotenv.config();
const app = express();
const server = http.createServer(app); // Create HTTP server

// Middlewares
app.use(express.json());
app.use(cookieParser());

// CORS setup
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_ORIGIN_PROD]
    : [process.env.FRONTEND_ORIGIN_DEV, process.env.FRONTEND_ORIGIN_DEV_CLIENT];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

// Routes
app.get("/api/v1/", (_, res) => {
  console.log("hello");
  res.send(
    `<h2>${
      process.env.NODE_ENV === "production"
        ? "Production Deployed"
        : "Development"
    }</h2>`
  );
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/user/permissions", userPermissionsRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/super_admin", superAdminRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/roles", rolesRoutes);
app.use("/api/v1/permissions", permissionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// Database connection and server startup
connectDB()
  .then(() => {
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server is running at port: ${PORT} !!`);
    });

    // Initialize Socket.IO with event handlers
    setupSocket(server);

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received: closing HTTP server");
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error(err);
  });
