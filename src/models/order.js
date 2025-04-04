import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
        quantity: { type: Number, required: true },
        priceAtPurchase: { type: Number, required: true }, // Price at the time of order
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["processing", "completed", "cancelled"],
      default: "processing",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    estimatedTimeRemaining: {
      type: Number,
      default: 10 * 60 * 1000, // default to 10 minutes
      required: true,
    },    
    transactionId: { type: String }, // Razorpay transaction ID
    razorpayOrderId: { type: String }, // Store Razorpay Order ID
    razorpayPaymentId: { type: String }, // Store Razorpay Payment ID
    razorpaySignature: { type: String }, // Store Razorpay Signature
    notes: { type: String }, // Optional: Order instructions
  },
  { timestamps: true }
);


export const Order = mongoose.model("Order", orderSchema);
