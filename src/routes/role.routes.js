import express from "express";
import {
  assignPermissionsToRole,
  assignRoleToUser,
  createRole,
  getRoleById,
  getRoles,
} from "../controllers/roles.controller.js";
import checkSuperAdmin from "../middlewares/checkSuperAdmin.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create-role", verifyJWT, checkSuperAdmin, createRole);
router.post("/get-roles", verifyJWT, checkSuperAdmin, getRoles);
router.post(
  "/assign-permission",
  verifyJWT,
  checkSuperAdmin,
  assignPermissionsToRole
);
router.get("/:id", verifyJWT, checkSuperAdmin, getRoleById);
router.patch(
  "/assign-role-to-user",
  verifyJWT,
  checkSuperAdmin,
  assignRoleToUser
);
export default router;
