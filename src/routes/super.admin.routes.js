import express from "express";
import { fetchNotIdentifiedUsers } from "../controllers/super.admin.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import checkSuperAdmin from "../middlewares/checkSuperAdmin.middleware.js";
const router = express.Router();

router.post(
  "/not_identified_users/all",
  verifyJWT,
  checkSuperAdmin,
  fetchNotIdentifiedUsers
);

export default router;
