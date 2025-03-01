import expressAsyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import { ROLES } from "../utils/enum.js";
import { sendResponse } from "../utils/response-handler/index.js";
import buildQueryFilters from "../utils/build-query-filters/index.js";
import Role from "../models/role.model.js";

export const fetchNotIdentifiedUsers = expressAsyncHandler(async (req, res) => {
  try {
    const { filters, page = 0, pageSize = 10 } = req.body;
    const guestRoles = await Role.findOne({ name: ROLES.GUEST });
    // Build filters for users with role NOT_IDENTIFIED
    const filterQuery = buildQueryFilters(filters, {
      role: guestRoles?._id,
    });

    // Fetch paginated users excluding sensitive fields
    const users = await User.find(filterQuery)
      .select("-password -accessToken -refreshToken -permissions")
      .populate("role", "name")
      .skip(page * pageSize)
      .limit(pageSize)
      .lean();
    console.log("users", users);
    // Count total users matching the filter
    const totalUsers = await User.countDocuments(filterQuery);

    // Determine if there is a next page
    const hasNextPage = (page + 1) * pageSize < totalUsers;

    return sendResponse(res, 200, "Not Identified Users fetched successfully", {
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
