import crypto from "crypto";
import { Order } from "../models/order.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Cart } from "../models/cart.js";

/**
 * ✅ Manual Payment Verification (Client-side API Call)
//  */
// export const verifyPayment = async (req, res, next) => {
//   try {
//     console.log("🔹 Incoming Payment Verification Request:", req.body);
//     console.log("🔹 User Data from Token:", req.user);

//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       console.error("🚨 Invalid payment data received!", req.body);
//       return next(new ApiError(400, "Invalid payment data"));
//     }

//     console.log("🔹 Searching for Order with ID:", razorpay_order_id);
//     const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

//     if (!order) {
//       console.error("❌ Order not found:", razorpay_order_id);
//       return next(new ApiError(404, "Order not found"));
//     }

//     if (order.paymentStatus === "paid") {
//       console.log("⚠️ Payment already verified for order:", order._id);
//       return res.status(400).json(new ApiResponse(400, null, "Payment already verified"));
//     }

//     // 🔹 Razorpay Signature Verification
//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     console.log("🔹 Expected Signature:", expectedSignature);
//     console.log("🔹 Received Signature:", razorpay_signature);

//     if (expectedSignature !== razorpay_signature) {
//       console.error("❌ Payment verification failed: Signature mismatch");
//       return next(new ApiError(400, "Payment verification failed"));
//     }

//     // ✅ Mark Order as Paid
//     order.paymentStatus = "paid";
//     order.razorpayPaymentId = razorpay_payment_id;
//     order.razorpaySignature = razorpay_signature;
//     await order.save();

//     console.log("✅ Payment verified & order updated!");

//     return res.status(200).json(
//       new ApiResponse(200, { orderId: order._id, status: "paid" }, "Payment verified successfully")
//     );
//   } catch (error) {
//     console.error("❌ Error verifying payment:", error);
//     return next(new ApiError(500, "Error verifying payment"));
//   }
// };

export const verifyPayment = async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
      // Find the order in DB
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  
      if (!order) {
        return res.status(404).json({ message: "Order not found!" });
      }
  
      // Verify the Razorpay signature
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const expectedSignature = hmac.digest("hex");
  
      if (expectedSignature !== razorpay_signature) {
        return res.status(401).json({ message: "Payment verification failed!" });
      }
  
      // Update order status
      order.paymentStatus = "paid";
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      await order.save();
  
      // 🟢 Clear the cart after payment
      await Cart.deleteOne({ userId: order.userId });
  
      return res.status(200).json({ message: "Payment Verified" });
    } catch (error) {
      console.error("❌ Payment Verification Error:", error);
      return res.status(500).json({ message: "Payment verification failed." });
    }
  };  
  
  
/**
 * ✅ Razorpay Webhook Handler (Server-side Auto Payment Capture)
 */
export const handleWebhook = async (req, res) => {
  try {
    const razorpaySignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    console.log("🔹 Received Webhook Event:", req.body);
    console.log("🔹 Razorpay Signature:", razorpaySignature);

    if (!razorpaySignature) {
      console.error("🚨 Missing Razorpay Signature!");
      return res.status(400).json({ success: false, message: "Missing Razorpay signature" });
    }

    // Convert raw buffer to string for verification
    const rawBody = JSON.stringify(req.body);

    // Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      console.error("❌ Webhook verification failed: Signature mismatch");
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    console.log("✅ Webhook verified successfully!");

    // Extract Event Data
    const event = req.body;

    if (event.event === "payment.captured") {
      const { order_id, payment_id } = event.payload.payment.entity;

      console.log("🔹 Captured Payment for Order:", order_id);

      // 🔹 Find Order in Database
      const order = await Order.findOne({ razorpayOrderId: order_id });

      if (!order) {
        console.error("❌ Order not found in database:", order_id);
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      // ✅ Update Order as Paid
      order.paymentStatus = "paid";
      order.razorpayPaymentId = payment_id;
      await order.save();

      console.log("✅ Order updated successfully in database!");
    }

    res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.status(500).json({ success: false, message: "Server error processing webhook" });
  }
};
