import { User } from "../models/user.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// ✅ Get User Profile
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("-password -refreshToken");
        if (!user) throw new ApiError(404, "User not found");

        return res.status(200).json(new ApiResponse(200, user, "User profile fetched successfully"));
    } catch (error) {
        next(error);
    }
};

// ✅ Update User Profile
const updateUserProfile = async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        if (!name || !phone) throw new ApiError(400, "Name and phone are required");

        const trimmedName = String(name).trim();
        const trimmedPhone = String(phone).trim();

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { name: trimmedName, phone: trimmedPhone },
            { new: true, runValidators: true }
        ).select("-password -refreshToken");

        if (!updatedUser) throw new ApiError(404, "User not found");

        return res.status(200).json(new ApiResponse(200, { updatedUser }, "Profile updated successfully"));
    } catch (error) {
        next(error);
    }
};

// ✅ Delete User
const deleteUser = async (req, res, next) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        return res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
    } catch (error) {
        next(error);
    }
};

export { getUserProfile, updateUserProfile, deleteUser };
