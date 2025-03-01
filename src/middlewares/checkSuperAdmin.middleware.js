// middlewares/checkSuperAdmin.js

import Role from "../models/role.model.js";
import { ROLES } from "../utils/enum.js";
import { sendResponse } from "../utils/response-handler/index.js";

const checkSuperAdmin = async (req, res, next) => {
  const role = await Role.findOne({ name: ROLES.SUPER_ADMIN });

  if (!req.user || req.user.role.toString() !== role._id.toString()) {
    return sendResponse(res, 403, "Access denied. Super Admins only.");
  }
  next();
};

export default checkSuperAdmin;
