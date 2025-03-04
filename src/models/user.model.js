import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    userName: { type: String, unique: true, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },
    password: { type: String, required: true, minlength: 8 },
    phone: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    accessToken: String,
    refreshToken: String,
    termsAccepted: { type: Boolean, required: true },

    // 🔗 Added role field referencing the Role model
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
