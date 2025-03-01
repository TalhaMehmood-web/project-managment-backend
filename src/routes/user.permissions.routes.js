import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  blockUser,
  verifyUser,
} from "../controllers/user.permissions.controller.js";

const router = express.Router();

router.put("/verify/:userId", verifyJWT, verifyUser);
router.put("/block/:userId", verifyJWT, blockUser);

export default router;
