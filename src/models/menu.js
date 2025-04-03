import mongoose, { Schema } from "mongoose";

const menuSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Food item name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    category: {
      type: String,
      enum: ["Snacks", "Drinks", "Meals", "Desserts"],
      required: [true, "Category is required"],
    },
    foodImage : {
      type: String,
      requied: [false, "Food item image is required"],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Menu = mongoose.model("Menu", menuSchema);
