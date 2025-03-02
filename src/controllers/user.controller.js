import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import generateAccessAndRefreshTokens from "../utils/generate-token/index.js";
import validator from "validator";
import { sendResponse } from "../utils/response-handler/index.js";
import bcrypt from "bcryptjs";
import cookieOptions from "../utils/cookies-options/index.js";
import buildQueryFilters from "../utils/build-query-filters/index.js";
import Chat from "../models/chat.model.js";
import { createAndSendNotification } from "../utils/notification.js";
import { ROLES } from "../utils/enum.js";

export const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    phone,
    termsAccepted,
    confirmPassword,
    userName,
  } = req.body;

  try {
    // 🛡️ Validation checks
    if (!fullName || !email || !password || !userName) {
      return sendResponse(res, 400, "Please fill all the fields");
    }
    if (password !== confirmPassword) {
      return sendResponse(res, 400, "Password not matched");
    }
    if (!termsAccepted) {
      return sendResponse(
        res,
        400,
        "You have not accepted our terms and policy"
      );
    }
    if (!validator.isEmail(email)) {
      return sendResponse(res, 400, "Email is not a valid email");
    }

    // 🔍 Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingUser) {
      return sendResponse(res, 400, "Email or phone already exists");
    }

    const findByUserName = await User.findOne({ userName });
    if (findByUserName) {
      return sendResponse(res, 400, "User Name already exists");
    }

    // 🔒 Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const guestRole = await Role.findOne({ name: ROLES.GUEST });
    // ⚡ Find super_admin role
    let userRole;
    if (email.toString().trim() === process.env.SUPER_ADMIN_EMAIL) {
      const superAdminRole = await Role.findOne({ name: "super_admin" });
      if (!superAdminRole) {
        userRole = await Role.create({
          name: ROLES.SUPER_ADMIN,
        });
      }
      userRole = superAdminRole._id;
    }

    // 👤 Create user with role if matched
    const user = await User.create({
      fullName,
      email,
      userName,
      phone,
      role: userRole || guestRole._id,
      password: hashedPassword,
      isVerified: email === process.env.SUPER_ADMIN_EMAIL,
      termsAccepted,
    });

    // 💬 Create chat with Super Admin if user has NOT_IDENTIFIED role
    if (!userRole) {
      const superAdmin = await User.findOne().populate("role");
      if (superAdmin?.role?.name === "super_admin") {
        await Chat.create({
          users: [user._id, superAdmin._id],
          isGroupChat: false,
          chatName: `Chat with Super Admin`,
          createdBy: superAdmin._id,
        });
        await createAndSendNotification({
          userId: superAdmin._id,
          recipient: superAdmin,
          sender: user,
          type: "NEW_USER_REGISTERED",
          title: "New User Registered",
          message: "A new user has been registered to Manage.io",
        });
      }
    }

    // 🍪 Generate tokens and send response
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendResponse(res, 200, "User Registered Successfully", {
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      phone: user.phone,
      email: user.email,
      isVerified: user.isVerified,
      termsAccepted: user.termsAccepted,
      role: userRole ? "super_admin" : "not_identified",
    });
  } catch (error) {
    console.log("err", error);
    return sendResponse(res, 500, error.message);
  }
});

export const login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return sendResponse(res, 400, "Email is required");
    }
    if (!password) {
      return sendResponse(res, 400, "Password is required");
    }

    const user = await User.findOne({ email }).populate("role", "name");

    if (!user) {
      return sendResponse(res, 404, "User with this email is not found!");
    }

    const matchedPassword = await bcrypt.compare(password, user.password);
    if (!matchedPassword) {
      return sendResponse(res, 400, "Incorrect Password");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const {
      password: _,
      accessToken: __,
      refreshToken: ___,
      role,
      ...userData
    } = user.toObject();

    return sendResponse(res, 200, "User Logged in Successfully", {
      ...userData,
      role: role?.name || null,
    });
  } catch (error) {
    return sendResponse(res, 505, error.message);
  }
});

export const logout = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error?.message });
  }
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user.isAdmin) {
    return sendResponse(
      res,
      401,
      "You are not authorized to perform this action"
    );
  }
  try {
    const { filters, page = 0, pageSize = 10 } = req.body;

    const filterQuery = buildQueryFilters(filters, { isAdmin: false });

    // Fetch paginated users
    const users = await User.find(filterQuery)
      .select("fullName userName email phone isVerified") // Exclude password for security
      .skip(page * pageSize) // Pagination offset
      .limit(pageSize) // Limit per page
      .lean(); // Convert Mongoose docs to plain JS objects for better performance

    // Count total users matching the filter
    const totalUsers = await User.countDocuments(filterQuery);

    // Determine if there is a next page
    const hasNextPage = (page + 1) * pageSize < totalUsers;

    return sendResponse(res, 200, "Users fetched successfully", {
      users,
      totalUsers, // Send total count for frontend pagination
      currentPage: page,
      totalPages: Math.ceil(totalUsers / pageSize),
      hasNextPage, // Include hasNextPage in response
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});
export const getUserById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id", id);
    const user = await User.findById(id).select("-password  -__v");

    if (!user) {
      return sendResponse(res, 404, "User not found");
    }
    return sendResponse(res, 200, "User fetched successfully", user);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});
