import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.js"; // Import User model

const authorizedRole = (...roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return next(new ApiError(401, "User not authenticated"));
            }

            // Fetch user details from the database
            const user = await User.findById(req.user.id);
            if (!user) {
                return next(new ApiError(404, "User not found"));
            }

            // Check if the user's role is allowed
            if (!roles.includes(user.role)) {
                return next(new ApiError(403, "You are not authorized to access this route"));
            }

            next(); // Proceed to the next middleware

        } catch (error) {
            next(new ApiError(500, "Error while authorizing user", error?.message || "Unknown error"));
        }
    };
};

export { authorizedRole };
