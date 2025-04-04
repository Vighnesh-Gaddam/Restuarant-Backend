import { User } from "../models/user.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "express-async-handler";
import { sendEmail } from "../utils/email.js";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating tokens");
    }
};

// ✅ Register User
const registerUser = asyncHandler(async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) throw new ApiError(409, "User with this email already exists");

        const newUser = await User.create({ name, email, password, phone });

        return res.status(201).json(new ApiResponse(201, { user: newUser }, "User registered successfully"));
    } catch (error) {
        next(error);
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json(new ApiResponse(400, null, "Email and password are required."));
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.isPasswordCorrect(password))) {
        return res.status(401).json(new ApiResponse(401, null, "Invalid email or password."));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    // ✅ Save refreshToken in DB
    user.refreshToken = refreshToken;
    console.log("user.refreshToken",user.refreshToken);
    await user.save();

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        sameSite: "Strict"
    };

    console.log("refreshToken",refreshToken);
    // ✅ Set cookies before sending response
    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);

    return res.status(200).json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully."));
});

const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json(new ApiResponse(400, null, "Email and password are required."));
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.isPasswordCorrect(password))) {
        return res.status(401).json(new ApiResponse(401, null, "Invalid email or password."));
    }
    
    // Check if the user is an admin
    if (user.role !== "admin") {
        return res.status(403).json(new ApiResponse(403, null, "Access denied. Admins only."));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    // ✅ Save refreshToken in DB
    user.refreshToken = refreshToken;
    await user.save();

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        sameSite: "Strict"
    };

    // ✅ Set cookies before sending response
    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);

    return res.status(200).json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Admin logged in successfully."));
});


// ✅ Logout User
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: null } }, { new: true });

    const options = { httpOnly: true, secure: true };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"));
});

// ✅ Forgot Password
const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    // Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 mins

    await user.save({ validateBeforeSave: false });

    // Create Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send Email
    const message = `Click the link to reset your password: ${resetUrl}`;
    await sendEmail(user.email, "Password Reset Request", message);

    res.status(200).json(new ApiResponse(200, null, "Password reset link sent to email"));
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    console.log("🔵 Incoming Refresh Token:", incomingRefreshToken);

    if (!incomingRefreshToken) {
        return next(new ApiError(401, "Refresh token is required"));
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?.id);

        console.log("🟢 User Found:", user ? user.email : "No user found");
        console.log("🟠 Stored Refresh Token:", user?.refreshToken);

        if (!user || incomingRefreshToken !== user.refreshToken) {
            console.log("❌ Mismatch Detected");
            return next(new ApiError(401, "Invalid refresh token"));
        }

        // ✅ Generate new tokens
        const { accessToken } = await generateAccessAndRefereshTokens(user._id);

        // ✅ Update refresh token in DB
        // user.refreshToken = refreshToken;

        // await user.save();
        // console.log("🟢 New Refresh Token Stored:", refreshToken);

        // ✅ Set cookies
        const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Strict" };
        res.cookie("accessToken", accessToken, options);

        req.headers.authorization = `Bearer ${accessToken}`;

        next();
    } catch (error) {
        console.log("🔴 Error:", error.message);
        if (error.name === "TokenExpiredError") {
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            return next(new ApiError(401, "Refresh token expired"));
        }
        return next(new ApiError(500, "Error refreshing access token"));
    }
});




export { registerUser, loginUser, logoutUser, refreshAccessToken, forgotPassword, adminLogin };
