import mongoose from "mongoose";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import Permission from "../models/permission.model.js";
import Role from "../models/role.model.js";

const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers?.Authorization?.split(" ")[1] ||
      req.headers?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json("Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // ✅ Ensure `_id` is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(decodedToken?._id)) {
      return res.status(400).json({ message: "Invalid User ID in token" });
    }

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -accessToken"
    );

    if (!user) {
      return res.status(401).json("Invalid Access Token");
    }

    const role = await Role.findById(user.role);
    if (!role) {
      return res.status(404).json("Role not found");
    }

    // ✅ Ensure role.permissions are valid ObjectIds
    const validPermissionIds = role.permissions.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const permissions = await Permission.find({
      _id: { $in: validPermissionIds },
    });
    console.log("permissions", permissions);
    req.user = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      isVerified: user.isVerified,
      phone: user.phone,
      termsAccepted: user.termsAccepted,
      userName: user?.userName,
      role: role._id,
      permissions:
        permissions.map((perm) => ({
          _id: perm._id,
          name: perm.name,
          endpoint: perm.endpoint || null,
          method: perm.method,
          type: perm.type,
          pagePath: perm.pagePath || null,
        })) || [],
    };

    next();
  } catch (error) {
    console.log("Error in verifyJWT:", error.message);
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export default verifyJWT;
