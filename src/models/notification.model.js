import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "PROJECT_ASSIGNED",
        "TASK_UPDATE",
        "USER_BLOCKED",
        "USER_VERIFIED",
        "NEW_MESSAGE",
        "NEW_COMMENT",
        "ROLE_CHANGED",
        "NEW_CLIENT",
        "NEW_USER_REGISTERED",
        "OTHER",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "entityType",
    },
    entityType: {
      type: String,
      enum: ["Project", "Task", "Chat", "User"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
