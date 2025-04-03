import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "express-async-handler";
import { User } from "../models/user.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken || req.headers?.authorization?.replace("Bearer ", "");
    console.log("refreshToken from auth",refreshToken)

    if (!refreshToken) {
        throw new ApiError(403, "Refresh token not found");
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        console.log("user refresh token from auth",user.refreshToken);
        if (!user || user.refreshToken !== refreshToken) {
            throw new ApiError(403, "Invalid refresh token");
        }

        req.user = user;  // Attach user to the request
        next();
    } catch (error) {
        console.log("Error verifying JWT:", error);
        throw new ApiError(403, "Invalid or expired refresh token");
    }
});
