import expressAsyncHandler from "express-async-handler";
import Role from "../models/role.model.js";
import Permission from "../models/permission.model.js";
import { sendResponse } from "../utils/response-handler/index.js";
import buildQueryFilters from "../utils/build-query-filters/index.js";
import User from "../models/user.model.js";

// ✅ Controller to create a new role with default empty permissions
export const createRole = expressAsyncHandler(async (req, res) => {
  try {
    const { name } = req.body;

    // ✅ Check if role name already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole)
      return sendResponse(res, 400, "Role with this name already exists");

    // ✅ Create new role with empty permissions
    const newRole = new Role({ name, permissions: [] });
    await newRole.save();

    return sendResponse(res, 201, "Role created successfully", newRole);
  } catch (error) {
    console.error("Error creating role:", error);
    return sendResponse(res, 500, "Error creating role", error);
  }
});
export const getRoles = expressAsyncHandler(async (req, res) => {
  try {
    const { filters, page = 0, pageSize = 10 } = req.body;

    // Build dynamic query based on filters
    const filterQuery = buildQueryFilters(filters);

    // Fetch paginated roles with filtering
    const roles = await Role.find(filterQuery)
      .select("name") // Fetch only role names
      .skip(page * pageSize) // Pagination offset
      .limit(pageSize) // Limit per page
      .lean(); // Convert Mongoose docs to plain JS objects

    // Count total roles matching the filter
    const totalRoles = await Role.countDocuments(filterQuery);

    // Determine if there is a next page
    const hasNextPage = (page + 1) * pageSize < totalRoles;

    return sendResponse(res, 200, "Role names fetched successfully", {
      roles,
      totalRoles,
      currentPage: page,
      totalPages: Math.ceil(totalRoles / pageSize),
      hasNextPage,
    });
  } catch (error) {
    console.error("Error fetching role names:", error);
    return sendResponse(res, 500, "Error fetching role names", error);
  }
});

// ✅ Controller to assign permissions to an existing role
export const assignPermissionsToRole = expressAsyncHandler(async (req, res) => {
  try {
    const { roleId, permissions } = req.body;

    // ✅ Check if role exists
    const role = await Role.findById(roleId);
    if (!role) return sendResponse(res, 404, "Role not found");

    // ✅ Validate permission IDs
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({
        _id: { $in: permissions },
      });
      if (validPermissions.length !== permissions.length) {
        return sendResponse(res, 400, "Some provided permissions are invalid");
      }
    }

    // ✅ Toggle permissions
    permissions.forEach((permId) => {
      const index = role.permissions.indexOf(permId);
      if (index === -1) {
        // 🔄 Permission not found, add it
        role.permissions.push(permId);
      } else {
        // ❌ Permission exists, remove it
        role.permissions.splice(index, 1);
      }
    });

    await role.save();

    return sendResponse(res, 200, "Permissions updated successfully", role);
  } catch (error) {
    console.error("Error assigning permissions:", error);
    return sendResponse(res, 500, "Error assigning permissions", error);
  }
});

export const getRoleById = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // 🔍 Find role by ID
    const role = await Role.findById(id);

    // ❌ If role not found
    if (!role) return sendResponse(res, 404, "Role not found");

    // ✅ Return role details
    return sendResponse(res, 200, "Role fetched successfully", role);
  } catch (error) {
    console.error("Error fetching role by ID:", error);
    return sendResponse(res, 500, "Error fetching role by ID", error);
  }
});
export const assignRoleToUser = expressAsyncHandler(async (req, res) => {
  const { userId, roleId } = req.body;

  // ⚡ Validate required fields
  if (!userId || !roleId) {
    return res
      .status(400)
      .json({ message: "User ID and Role ID are required." });
  }

  try {
    // 🔍 Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    // 🔄 Assign role to user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: roleId },
      { new: true }
    ).populate("role"); // Optional: populate role details

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Role assigned to user successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error assigning role:", error);
    res.status(500).json({
      message: "Failed to assign role to user.",
      error: error.message,
    });
  }
});
