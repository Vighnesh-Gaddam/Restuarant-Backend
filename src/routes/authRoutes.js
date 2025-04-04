import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, adminLogin } from "../controllers/authController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const authRouter = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
authRouter.post("/register", upload.fields([{ name: "profilePic", maxCount: 1 }]), registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
authRouter.post("/login", loginUser);
authRouter.post("/admin-login", adminLogin);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear token)
 * @access  Private
 */
authRouter.post("/logout", verifyJWT, logoutUser);

/**
 * @route   GET /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
authRouter.get("/refresh-token", refreshAccessToken);

export default authRouter;
