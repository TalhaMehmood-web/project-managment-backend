import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import checkSuperAdmin from "../middlewares/checkSuperAdmin.middleware.js";
import {
  assignPermissionToRole,
  createPermission,
  getAllAppRoutes,
  getAllPermissions,
  getControllerFileNames,
  getPermissionById,
  getPermissionNames,
} from "../controllers/permission.controller.js";
import { getUserPermission } from "../controllers/user.permissions.controller.js";

const router = express.Router();

router.post("/", verifyJWT, checkSuperAdmin, createPermission);
router.get("/routes", verifyJWT, checkSuperAdmin, getAllAppRoutes);
router.get(
  "/get-permission-names",
  verifyJWT,
  checkSuperAdmin,
  getPermissionNames
);
router.post(
  "/get-all-permissions",
  verifyJWT,
  checkSuperAdmin,
  getAllPermissions
);
router.get("/get-by-id/:id", verifyJWT, checkSuperAdmin, getPermissionById);
router.get(
  "/get-controller-file-names",
  verifyJWT,
  checkSuperAdmin,
  getControllerFileNames
);
router.put(
  "/assign-permission-to-role/:id",
  verifyJWT,
  checkSuperAdmin,
  assignPermissionToRole
);
router.get("/get", verifyJWT, getUserPermission);
export default router;
