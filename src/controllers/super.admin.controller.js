import expressAsyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import { ROLES } from "../utils/enum.js";
import { sendResponse } from "../utils/response-handler/index.js";
import buildQueryFilters from "../utils/build-query-filters/index.js";
import Role from "../models/role.model.js";

export const fetchNotIdentifiedUsers = expressAsyncHandler(async (req, res) => {
  try {
    const { filters, page = 0, pageSize = 10 } = req.body;

    // Fetch the Super Admin role
    const superAdminRole = await Role.findOne({ name: ROLES.SUPER_ADMIN });

    // Build filters to exclude Super Admin users
    const filterQuery = buildQueryFilters(filters, {
      role: { $ne: superAdminRole?._id }, // Exclude Super Admin
    });

    // Fetch paginated users excluding sensitive fields
    const users = await User.find(filterQuery)
      .select("-password -accessToken -refreshToken -permissions")
      .populate("role", "name")
      .skip(page * pageSize)
      .limit(pageSize)
      .lean();

    // Count total users matching the filter
    const totalUsers = await User.countDocuments(filterQuery);

    // Determine if there is a next page
    const hasNextPage = (page + 1) * pageSize < totalUsers;

    return sendResponse(res, 200, "Users fetched successfully", {
      users,
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / pageSize),
      hasNextPage,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});

export const changeUserRole = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { newRole } = req.body;
  const requestingUser = req.user;

  // 1️⃣ Authorization Check
  if (requestingUser.role !== "SUPER_ADMIN") {
    return sendResponse(res, 403, "You are not authorized to change roles");
  }

  // 2️⃣ Validate Input
  if (!newRole) {
    return sendResponse(res, 400, "New role is required");
  }

  try {
    // 3️⃣ Find User
    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    // 4️⃣ Update Role
    user.role = newRole;
    await user.save();

    return sendResponse(res, 200, "User role updated successfully", {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});

export const assignRole = expressAsyncHandler(async (req, res) => {
  try {
    const { userId, selectedRole } = req.body;

    // 🔹 Validate request body
    if (!userId || !selectedRole) {
      return res
        .status(400)
        .json({ success: false, message: "User ID and Role ID are required." });
    }

    // 🔹 Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // 🔹 Find the role
    const role = await Role.findById(selectedRole);
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found." });
    }

    // 🔹 Update user's role
    user.role = role._id;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Error in assignRole API:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error." });
  }
});
