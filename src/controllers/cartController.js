import { Cart } from "../models/cart.js";
import { Menu } from "../models/menu.js";  // ✅ Correct import
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import expressAsyncHandler from "express-async-handler";
/**
 * @route   POST /api/cart
 * @desc    Add item(s) to cart
 * @access  Private
 */
// const addToCart = async (req, res, next) => {
//     try {
//         // const { userId, items } = req.body;

//         const userId = req.user._id; 
//         let { items } = req.body;

//         if (!Array.isArray(items)) {
//             items = [items]; // Convert single object to array
//         }

//         console.log("Items:", items);

//         // Validate menu items
//         const menuItems = await Promise.all(items.map(item => Menu.findById(item.menuItemId)));
//         menuItems.forEach((menuItem, index) => {
//             if (!menuItem) throw new ApiError(404, `Menu item with ID ${items[index].menuItemId} not found`);
//         });

//         // Find user cart
//         let cart = await Cart.findOne({ userId });

//         if (!cart) {
//             cart = new Cart({ userId, items });
//         } else {
//             items.forEach(({ menuItemId, quantity }) => {
//                 const existingItem = cart.items.find(item => item.menuItemId.toString() === menuItemId);
//                 existingItem ? (existingItem.quantity += quantity) : cart.items.push({ menuItemId, quantity });
//             });
//         }

//         await cart.save();
//         res.status(201).json(new ApiResponse(201, cart, "Item(s) added to cart successfully"));
//     } catch (error) {
//         next(error);
//     }
// };


const addToCart = async (req, res, next) => {
    try {
        const userId = req.user._id;
        let { items } = req.body;

        // ✅ Fix: Extract items correctly if nested inside another object
        if (items && Array.isArray(items.items)) {
            items = items.items;
        }

        if (!Array.isArray(items)) {
            throw new ApiError(400, "Invalid items format");
        }


        // Validate menu items
        const menuItems = await Promise.all(
            items.map(item => Menu.findById(item.menuItemId))
        );

        menuItems.forEach((menuItem, index) => {
            if (!menuItem) throw new ApiError(404, `Menu item with ID ${items[index].menuItemId} not found`);
        });

        // Find user cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items });
        } else {
            items.forEach(({ menuItemId, quantity }) => {
                const existingItem = cart.items.find(item => item.menuItemId.toString() === menuItemId);
                existingItem ? (existingItem.quantity += quantity) : cart.items.push({ menuItemId, quantity });
            });
        }

        await cart.save();
        res.status(201).json(new ApiResponse(201, cart, "Item(s) added to cart successfully"));
    } catch (error) {
        next(error);
    }
};


/**
 * @route   GET /api/cart
 * @desc    Get all items in cart
 * @access  Private
 */
const getCartItems = expressAsyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id; 

        const cart = await Cart.findOne({ userId }).populate(
            "items.menuItemId",
            "name description price category foodImage inStock" // Exclude unwanted fields
        );
        

        if (!cart) return res.status(200).json(new ApiResponse(200, [], "Cart is empty"));

        res.status(200).json(new ApiResponse(200, cart, "Cart items fetched successfully"));
    } catch (error) {
        next(error);
    }
});


/**
 * @route   PUT /api/cart/:cartItemId
 * @desc    Update quantity of an item in cart
 * @access  Private
 */
const updateCartItem = async (req, res, next) => {
    try {
        const userId = req.user._id; 
        console.log("User ID:", userId);
        
        const { cartItemId } = req.params; // ✅ Fix: Extract cartItemId properly
        console.log("Cart Item ID:", cartItemId);
        
        const { quantity } = req.body;

        if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than zero");

        let cart = await Cart.findOne({ userId });

        if (!cart) throw new ApiError(404, "Cart not found");

        const cartItem = cart.items.find(item => item._id.toString() === cartItemId);
        if (!cartItem) throw new ApiError(404, "Cart item not found");

        cartItem.quantity = quantity;
        await cart.save();

        res.status(200).json(new ApiResponse(200, cart, "Cart item updated successfully"));
    } catch (error) {
        console.error("Update Cart Item Error:", error); // Debugging log
        next(error);
    }
};


/**
 * @route   DELETE /api/cart/:cartItemId
 * @desc    Remove an item from cart
 * @access  Private
 */
const removeCartItem = async (req, res, next) => {
    try {
        const userId = req.user?._id || req.query.userId || req.params.userId;
        const { cartItemId } = req.params;

        console.log("➡️ User ID:", userId);
        console.log("➡️ Cart Item ID:", cartItemId);

        if (!userId) throw new ApiError(400, "User ID is required");
        if (!cartItemId) throw new ApiError(400, "Cart Item ID is required");

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            console.log("❌ Cart not found for user:", userId);
            throw new ApiError(404, "Cart not found");
        }

        if (!cart.items || cart.items.length === 0) {
            console.log("❌ Cart is empty for user:", userId);
            throw new ApiError(404, "Cart is empty");
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId.toString());

        if (itemIndex === -1) {
            console.log("❌ Item not found in cart");
            throw new ApiError(404, "Item not found in cart");
        }

        // ✅ Remove item from array using MongoDB's built-in method
        cart.items.splice(itemIndex, 1);

        await cart.save();

        console.log("✅ Updated cart after removal:", cart);

        res.status(200).json(new ApiResponse(200, cart, "Cart item removed successfully"));
    } catch (error) {
        console.error("🚨 Error removing cart item:", error);
        next(error);
    }
};



/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart
 * @access  Private
 */
import mongoose from "mongoose";

const clearCart = async (req, res) => {
    try {
      const userId = req.user.id;
      const cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        return res.status(404).json({ success: false, message: "Cart not found" });
      }
  
      if (cart.items.length === 0) {
        return res.status(200).json({ success: false, message: "Cart is already empty" });
      }
  
      cart.items = []; // ✅ Clear items
      await cart.save(); // ✅ Save empty cart
  
      return res.status(200).json({ success: true, message: "Cart cleared successfully" });
    } catch (error) {
      console.error("🚨 Error clearing cart:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
    




export { addToCart, getCartItems, updateCartItem, removeCartItem, clearCart };
