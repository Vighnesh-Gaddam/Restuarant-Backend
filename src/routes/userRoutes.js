import { Router } from "express";
import { getUserProfile, updateUserProfile, deleteUser } from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
userRouter.get("/profile", verifyJWT, getUserProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
userRouter.put("/profile", verifyJWT, updateUserProfile);

/**
 * @route   DELETE /api/user/profile
 * @desc    Delete user account
 * @access  Private
 */
userRouter.delete("/profile", verifyJWT, deleteUser);

export default userRouter;
