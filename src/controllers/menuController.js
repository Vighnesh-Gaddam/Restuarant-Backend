import { Menu } from "../models/menu.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import fs from 'fs/promises';
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";


const deleteLocalFiles = async (filePaths) => {
  // console.log("filePaths (before check):", filePaths);

  // Ensure filePaths is an array or convert it if needed
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];

  for (const path of paths) {
    if (path) {
      try {
        await fs.unlink(path);
        // console.log(`Deleted file: ${path}`);
      } catch (err) {
        // console.error(`Failed to delete file: ${path}`, err);
      }
    }
  }
};

const addMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, category, inStock } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return next(new ApiError(400, "All fields are required"));
    }

    let foodImage = "";
    if (req.file) {
      try {
        // Upload image to Cloudinary
        const uploadResult = await uploadImageToCloudinary(req.file.path);
        if (!uploadResult || !uploadResult.secure_url) {
          return next(new ApiError(500, "Failed to upload image", [{ message: "Image upload failed" }]));
        }
        foodImage = uploadResult.secure_url;
      } catch (uploadError) {
        return next(new ApiError(500, "Image upload error", [{ message: uploadError.message }]));
      }
    }

    // Create the new menu item
    const newItem = await Menu.create({
      name,
      description,
      price,
      category,
      foodImage,
      inStock,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newItem, "Menu item added successfully"));

  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return next(new ApiError(400, "Validation failed", validationErrors));
    }
    next(new ApiError(500, "Internal server error", [{ message: error.message }]));
  }
};







const getAllMenuItems = async (req, res) => {
  try {
    const items = await Menu.find().select("-__v -createdAt -updatedAt");
    return res
      .status(200)
      .json(new ApiResponse(200, items, "Menu items fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
};



const getMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, "Invalid Menu ID format"));
    }

    let item = await Menu.findById(id).select("-__v -createdAt -updatedAt");
    if (!item) {
      return next(new ApiError(404, "Menu item not found"));
    }

    return res.status(200).json(new ApiResponse(200, item, "Item found"));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Internal server error"));
  }
};


// const updateMenuItem = async (req, res, next) => {
//   try {
//     const { name, description, price, category, inStock } = req.body;

//     // Find the existing menu item
//     const existingItem = await Menu.findById(req.params.id);
//     if (!existingItem) return next(new ApiError(404, "Menu item not found"));

//     let foodImage = existingItem.foodImage;

//     if (req.file) {
//       try {
//         // Upload new image to Cloudinary
//         const uploadResult = await uploadImageToCloudinary(req.file.path);
//         if (!uploadResult || !uploadResult.secure_url) {
//           return next(new ApiError(500, "Failed to upload image", [{ message: "Image upload failed" }]));
//         }

//       } catch (uploadError) {
//         console.log("Error uploading image:", uploadError);
//         return next(new ApiError(500, "Image upload error", [{ message: uploadError.message }]));
//       }
//     }

//     // Update menu item
//     const updatedItem = await Menu.findByIdAndUpdate(
//       req.params.id,
//       { name, description, price, category, foodImage, inStock },
//       { new: true, runValidators: true }
//     );

//     return res
//       .status(200)
//       .json(new ApiResponse(200, updatedItem, "Menu item updated successfully"));

//   } catch (error) {
//     if (error.name === "ValidationError") {
//       const validationErrors = Object.values(error.errors).map((err) => ({
//         field: err.path,
//         message: err.message,
//       }));
//       return next(new ApiError(400, "Validation failed", validationErrors));
//     }
//     next(new ApiError(500, "Internal server error", [{ message: error.message }]));
//   }
// };

const updateMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, category, inStock } = req.body;

    // Find the existing menu item
    const existingItem = await Menu.findById(req.params.id);
    if (!existingItem) return next(new ApiError(404, "Menu item not found"));

    let foodImage = existingItem.foodImage; // Retain the old image URL

    if (req.file) {
      try {
        // Upload new image to Cloudinary
        const uploadResult = await uploadImageToCloudinary(req.file.path);
        if (!uploadResult || !uploadResult.secure_url) {
          return next(new ApiError(500, "Failed to upload image", [{ message: "Image upload failed" }]));
        }

        foodImage = uploadResult.secure_url; // ✅ Update foodImage with new URL

      } catch (uploadError) {
        console.log("Error uploading image:", uploadError);
        return next(new ApiError(500, "Image upload error", [{ message: uploadError.message }]));
      }
    }

    // Update menu item in the database
    const updatedItem = await Menu.findByIdAndUpdate(
      req.params.id,
      { name, description, price, category, foodImage, inStock }, // ✅ Now foodImage gets updated
      { new: true, runValidators: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedItem, "Menu item updated successfully"));

  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return next(new ApiError(400, "Validation failed", validationErrors));
    }
    next(new ApiError(500, "Internal server error", [{ message: error.message }]));
  }
};



const deleteMenuItem = async (req, res) => {
  try {
    const deletedItem = await Menu.findByIdAndDelete(req.params.id);
    if (!deletedItem) throw new ApiError(404, "Menu item not found");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Menu item deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
};



export {
  addMenuItem,
  getAllMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
};