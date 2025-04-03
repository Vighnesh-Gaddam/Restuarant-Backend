
import express from "express";
import { verifyPayment, handleWebhook } from "../controllers/paymentController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/verify",verifyJWT ,verifyPayment);
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;
