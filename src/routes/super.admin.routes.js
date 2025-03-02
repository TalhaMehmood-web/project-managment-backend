import express from "express";
import {
  assignRole,
  fetchNotIdentifiedUsers,
} from "../controllers/super.admin.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import checkSuperAdmin from "../middlewares/checkSuperAdmin.middleware.js";
const router = express.Router();

router.post(
  "/not_identified_users/all",
  verifyJWT,
  checkSuperAdmin,
  fetchNotIdentifiedUsers
);
router.patch("/assign-role", verifyJWT, checkSuperAdmin, assignRole);
export default router;
