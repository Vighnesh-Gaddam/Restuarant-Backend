import Razorpay from "razorpay";
import { Order } from "../models/order.js";
import { Cart } from "../models/cart.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    console.log("User ID:", userId);
    console.log("process.env.RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
    console.log("process.env.RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);

    // Fetch user's cart
    const cart = await Cart.findOne({ userId }).populate("items.menuItemId");
    if (!cart || cart.items.length === 0) {
      return next(new ApiError(400, "Cart is empty, cannot create order"));
    }

    // Calculate total price dynamically
    const totalPrice = cart.items.reduce((sum, item) => sum + item.menuItemId.price * item.quantity, 0);

    // Prepare order items
    const orderItems = cart.items.map((item) => ({
      menuItemId: item.menuItemId._id,
      quantity: item.quantity,
      priceAtPurchase: item.menuItemId.price,
    }));

    // Create Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalPrice * 100, // Convert ₹ to paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    // If Razorpay order creation fails, return an error
    if (!razorpayOrder || !razorpayOrder.id) {
      return next(new ApiError(500, "Failed to create Razorpay order"));
    }

    // Create order in DB
    const order = await Order.create({
      userId,
      items: orderItems,
      totalPrice,
      status: "processing",
      paymentStatus: "pending",
      transactionId: "",
      razorpayOrderId: razorpayOrder.id, // Save Razorpay Order ID
    });

    // Clear user's cart after order creation
    await Cart.findOneAndUpdate({ userId }, { items: [] });

    res.status(201).json(
      new ApiResponse(201, {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
      }, "Order created, proceed to payment")
    );
  } catch (error) {
    console.log("Error creating order:", error);
    next(new ApiError(500, "Error creating order"));
  }
};


export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user orders with only necessary fields
    const orders = await Order.find({ userId })
      .populate("items.menuItemId", "name price foodImage") // Populate only necessary fields
      .select("_id items totalPrice status paymentStatus createdAt");

    if (!orders || orders.length === 0) {
      return next(new ApiError(404, "No orders found for this user"));
    }

    res.json(new ApiResponse(200, orders, "User orders fetched successfully"));
  } catch (error) {
    console.error("Error fetching user orders:", error);
    next(new ApiError(500, "Error fetching user orders"));
  }
};


// 📌 Get All Orders (Admin Only)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email") // ✅ Correct populate field
      .populate("items.menuItemId", "name foodImage");

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};


// 📌 Update Order Status
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["processing", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ success: true, message: "Order status updated successfully", data: order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
};