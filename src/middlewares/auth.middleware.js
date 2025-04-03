import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "express-async-handler";
import { User } from "../models/user.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies.refreshToken || req.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Refresh token not found");
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Unauthorized");
        }

        req.user = user;  // ✅ Assign user to `req.user`
        next();           // ✅ `next()` should be inside the `try` block
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized");
    }
});
