import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // 🔹 Handle Mongoose CastError (Invalid ID)
    if (error?.name === "CastError") {
        error = new ApiError(400, "Invalid ID format");
    }

    // 🔹 Handle Mongoose ValidationError (Schema Validation)
    if (error instanceof mongoose.Error.ValidationError) {
        // Extract field-specific error messages
        const validationErrors = Object.values(error.errors).map((e) => e.message);
        error = new ApiError(400, validationErrors.join(", ")); // Join messages for better readability
    }

    // 🔹 If not an ApiError, wrap it properly
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || (error instanceof mongoose.Error ? 500 : 400);
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message);
    }

    // 🔹 Response Object
    const response = {
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }) // Show stack trace only in dev mode
    };

    return res.status(error.statusCode || 500).json(response);
};

// 🚀 Process-Level Error Handling (Prevents Crashes)
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

export { errorHandler };
