import expressAsyncHandler from "express-async-handler";
import Permission from "../models/permission.model.js";
import { sendResponse } from "../utils/response-handler/index.js";
import fs from "fs";
import path from "path";
import buildQueryFilters from "../utils/build-query-filters/index.js";
import Role from "../models/role.model.js";
import User from "../models/user.model.js";

const formatFileName = (fileName) => {
  return (
    fileName
      .replace(".controller.js", "") // Remove extension
      .split(".") // Split by dot
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize words
      .join(" ") + " Controller" // Add "Controller" at the end
  );
};
const getRoutes = (stack, basePath = "") => {
  const routes = [];

  stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map((method) =>
        method.toUpperCase()
      );

      // ❌ Exclude OPTIONS * and /api/v1/ routes
      if (
        !(
          (methods.includes("OPTIONS") && middleware.route.path === "*") // Exclude OPTIONS *
        ) &&
        middleware.route.path !== "/" // Exclude /api/v1/
      ) {
        routes.push({
          methods,
          path: basePath + middleware.route.path,
        });
      }
    } else if (middleware.name === "router" && middleware.handle.stack) {
      const newBasePath =
        basePath +
        middleware.regexp.source
          .replace("^\\", "")
          .replace("\\/?(?=\\/|$)", "")
          .replace(/\\\//g, "/");
      routes.push(...getRoutes(middleware.handle.stack, newBasePath));
    }
  });

  return routes;
};

export const createPermission = expressAsyncHandler(async (req, res) => {
  try {
    const { name, type, endpoint, method, pagePath, controller } = req.body;

    // ✅ Check if permission with the same name exists
    const existingPermission = await Permission.find({ name });

    if (existingPermission.length > 0) {
      if (type === "api") {
        const apiExists = existingPermission.find(
          (perm) =>
            perm.type === "api" && perm.endpoint === endpoint && prem.controller
        );
        if (apiExists) {
          return sendResponse(
            res,
            400,
            `Permission "${name}" is already assigned to this API endpoint: ${endpoint}`
          );
        }

        if (existingPermission.filter((p) => p.type === "api").length >= 1) {
          return sendResponse(
            res,
            400,
            `Permission "${name}" has already been assigned to another API endpoint.`
          );
        }
      } else if (type === "page") {
        const pageExists = existingPermission.find(
          (perm) => perm.type === "page" && perm.pagePath === pagePath
        );
        if (pageExists) {
          return sendResponse(
            res,
            400,
            `Permission "${name}" is already assigned to this page path: ${pagePath}`
          );
        }

        if (existingPermission.filter((p) => p.type === "page").length >= 1) {
          return sendResponse(
            res,
            400,
            `Permission "${name}" has already been assigned to another page.`
          );
        }
      }
    }

    // 🌟 Conditional Validation for API or Page
    if (type === "api" && (!endpoint || !method || !controller)) {
      return sendResponse(
        res,
        400,
        "Endpoint and method are required for API permissions"
      );
    }

    if (type === "page" && !pagePath) {
      return sendResponse(
        res,
        400,
        "Page path is required for page permissions"
      );
    }

    // 🚀 Create Permission
    const permission = new Permission({
      name,
      type,
      endpoint: type === "api" ? endpoint : undefined,
      method: type === "api" ? method : undefined,
      pagePath: type === "page" ? pagePath : undefined,
      controller,
    });

    await permission.save();
    return sendResponse(
      res,
      201,
      "Permission created successfully",
      permission
    );
  } catch (error) {
    console.error("Error creating permission:", error);
    return sendResponse(res, 500, "Error creating permission");
  }
});

export const getAllAppRoutes = expressAsyncHandler(async (req, res) => {
  try {
    const routes = getRoutes(req.app._router.stack);
    res.json(routes);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});
export const getPermissionNames = expressAsyncHandler(async (req, res) => {
  try {
    const permissions = await Permission.find({}, { _id: 1, name: 1 });

    return sendResponse(
      res,
      200,
      "Permissions fetched successfully",
      permissions
    );
  } catch (error) {
    console.error("Error fetching permission names:", error);
    return sendResponse(res, 500, "Error fetching permission names", error);
  }
});

export const getControllerFileNames = expressAsyncHandler(async (req, res) => {
  try {
    const controllersPath = path.join(process.cwd(), "src", "controllers");

    // Read and format files in the controllers directory
    const files = fs
      .readdirSync(controllersPath)
      .filter((file) => file.endsWith(".js"))
      .map(formatFileName);

    return sendResponse(res, 200, "Controllers fetched successfully", files);
  } catch (error) {
    console.error("Error fetching controller files:", error);
    return sendResponse(res, 500, "Error fetching controller files", error);
  }
});
export const getAllPermissions = expressAsyncHandler(async (req, res) => {
  try {
    const { filters, page = 0, pageSize = 10 } = req.body;

    // ✅ Build filters for permissions
    const filterQuery = buildQueryFilters(filters);

    // 🌟 Fetch paginated permissions
    const permissions = await Permission.find(filterQuery)
      .skip(page * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .lean();

    // 🧮 Count total permissions matching the filter
    const totalPermissions = await Permission.countDocuments(filterQuery);

    // 📈 Determine if there is a next page
    const hasNextPage = (page + 1) * pageSize < totalPermissions;

    return sendResponse(res, 200, "Permissions fetched successfully", {
      permissions,
      totalPermissions,
      currentPage: page,
      totalPages: Math.ceil(totalPermissions / pageSize),
      hasNextPage,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return sendResponse(res, 500, "Error fetching permissions", error);
  }
});

export const getPermissionById = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const permission = await Permission.findById(id);
    if (!permission) return sendResponse(res, 404, "Permission Not found");

    return sendResponse(
      res,
      200,
      "Permission Fetched Successfully",
      permission
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});

export const assignPermissionToRole = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body; // Expecting roles as an array of role IDs

    // ✅ Validation: Check if roles array exists
    if (!roles || !Array.isArray(roles)) {
      return res
        .status(400)
        .json({ message: "Roles must be provided in an array." });
    }

    // ✅ Validate if all provided role IDs exist
    const validRoles = await Role.find({ _id: { $in: roles } });
    if (validRoles.length !== roles.length) {
      return res
        .status(404)
        .json({ message: "Some roles provided do not exist." });
    }

    const updatedPermission = await Permission.findByIdAndUpdate(
      id,
      { assignedToRoles: roles },
      { new: true }
    ).populate("assignedToRoles");

    if (!updatedPermission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    return res.status(200).json({
      message: "Roles assigned to permission successfully.",
      permission: updatedPermission,
    });
  } catch (error) {
    console.error("Error assigning roles to permission:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});
export const assignPermissionToUser = expressAsyncHandler(async (req, res) => {
  const { userId, roleId, permissionIds } = req.body;

  // Find the user and role
  const user = await User.findById(userId);
  if (!user) return sendResponse(res, 404, "User with this Id is not found");

  const role = await Role.findById(roleId);
  if (!role) return sendResponse(res, 404, "Role with this id not found");

  // Normalize permissionIds to an array, in case a single id is passed.
  const permissionsToToggle = Array.isArray(permissionIds)
    ? permissionIds
    : [permissionIds];

  // Loop through each permission id
  permissionsToToggle.forEach((permissionId) => {
    // Only process if the permission is not already provided by the role
    if (!role.permissions.includes(permissionId)) {
      // Check if the user already has this permission
      const hasPermission = user.permissions.some(
        (perm) => perm.toString() === permissionId.toString()
      );
      if (hasPermission) {
        // Remove permission from user.permissions array
        user.permissions = user.permissions.filter(
          (perm) => perm.toString() !== permissionId.toString()
        );
      } else {
        // Add permission to user.permissions array
        user.permissions.push(permissionId);
      }
    }
  });

  await user.save();
  return sendResponse(
    res,
    200,
    "User permissions updated successfully",
    user.permissions
  );
});
