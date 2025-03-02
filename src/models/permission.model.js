import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Removed unique to handle custom logic
    type: { type: String, enum: ["api", "page"], required: true },
    endpoint: { type: String }, // API route (if type = "api"), e.g., "/users"
    method: { type: String, enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
    controller: { type: String },
    pagePath: { type: String }, // Frontend route (if type = "page"), e.g., "/dashboard"
    assignedToRoles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role", // Reference to Role model
        default: [],
      },
    ],
  },
  { timestamps: true }
);

// ✅ Custom validation to enforce unique name per API and page
permissionSchema.pre("save", async function (next) {
  const Permission = mongoose.model("Permission");

  // 🌟 Check if name already exists with a different endpoint or pagePath
  const existingPermission = await Permission.findOne({
    name: this.name,
    type: this.type,
    _id: { $ne: this._id }, // Ignore current doc during update
  });

  if (this.type === "api") {
    if (existingPermission && existingPermission.endpoint !== this.endpoint) {
      return next(
        new Error(
          `Permission name "${this.name}" is already assigned to a different API endpoint.`
        )
      );
    }
  }

  if (this.type === "page") {
    if (existingPermission && existingPermission.pagePath !== this.pagePath) {
      return next(
        new Error(
          `Permission name "${this.name}" is already assigned to a different page.`
        )
      );
    }
  }

  // 🌐 Check that the name doesn't exceed the limit of one API and one page allocation
  const nameUsageCount = await Permission.countDocuments({
    name: this.name,
    _id: { $ne: this._id }, // Ignore current doc during update
  });

  if (nameUsageCount >= 2) {
    return next(
      new Error(
        `Permission name "${this.name}" has already been allocated to one API and one page.`
      )
    );
  }

  next();
});

const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;
