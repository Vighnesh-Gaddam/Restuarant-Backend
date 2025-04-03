import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    paymentMethod: { type: String, enum: ["UPI", "Card", "Cash"], required: true },
    status: { type: String, enum: ["success", "failed", "pending"], default: "pending" },
    transactionId: { type: String, unique: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
