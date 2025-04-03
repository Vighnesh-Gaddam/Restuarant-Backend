import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "express-async-handler";
import { User } from "../models/user.js";

export const verifyRefreshToken = asyncHandler(async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken || req.headers?.authorization?.replace("Bearer ", "");

    if (!refreshToken) {
        throw new ApiError(403, "Refresh token not found");
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user || user.refreshToken !== refreshToken) {
            throw new ApiError(403, "Invalid refresh token");
        }

        req.user = user;  // Attach user to the request
        next();
    } catch (error) {
        throw new ApiError(403, "Invalid or expired refresh token");
    }
});
