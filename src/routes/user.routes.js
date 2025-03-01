import express from "express";
import {
  getAllUsers,
  login,
  register,
  logout,
  getUserById,
} from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/logout", verifyJWT, logout);
router.post("/all", verifyJWT, getAllUsers);
router.get("/:id", verifyJWT, getUserById);
export default router;
