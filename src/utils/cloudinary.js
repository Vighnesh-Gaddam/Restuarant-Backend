import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

/**
 * Configures Cloudinary credentials
 */
const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};

/**
 * Uploads an image to Cloudinary
 * @param {string} localFilePath - Path to the local image file
 * @returns {object|null} - Cloudinary response or null
 */
const uploadImageToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        configureCloudinary();

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image",
            folder: "uploads", // Change folder name as needed
            format: "jpg", // Ensure JPG format
        });

        // Delete local file after successful upload
        try {
            fs.unlinkSync(localFilePath);
        } catch (err) {
            console.error("Error deleting local file:", err.message);
        }

        return response;
    } catch (error) {
        // Cleanup local file if upload fails
        try {
            if (localFilePath) fs.unlinkSync(localFilePath);
        } catch {}

        throw new ApiError(500, "Cloudinary image upload failed", error.message);
    }
};

/**
 * Deletes an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {object} - Cloudinary response
 */
const deleteImageFromCloudinary = async (publicId) => {
    try {
        configureCloudinary();
        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        throw new ApiError(500, "Cloudinary image deletion failed", error.message);
    }
};

export { uploadImageToCloudinary, deleteImageFromCloudinary };
