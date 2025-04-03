import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiResponse } from "./utils/ApiResponse.js";

const app = express();

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allow these methods
    credentials: true, // Allow cookies
    allowedHeaders: ["Content-Type", "Authorization", "withCredentials"] // Include "withCredentials"
}));



// Logging
app.use(morgan("common"));

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Common Middleware
app.use(express.json({ limit: "10mb" }));  // Increased limit for larger payloads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRoutes from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import menuRouter from "./routes/menuRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import Razorpay from "razorpay";
import paymentRoutes from "./routes/paymentRoutes.js";

// import adminRoute from "./routes/admin.routes.js";
// import { verifyJWT } from "./middlewares/auth.middleware.js";
// import { refreshAccessToken } from "./controllers/user.controller.js";
// import { authorizedRole } from "./middlewares/role.middleware.js";

// Routes
app.get("/", (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Welcome to the API"
        )
    );
});

app.use("/api/auth/", authRouter );
app.use("/api/user/", userRoutes);
app.use("/api/menu/", menuRouter);
app.use("/api/cart/", cartRouter);
app.use("/api/order/", orderRouter);
app.use("/api/payments", paymentRoutes);

// Error Handling Middleware (ALWAYS LAST)
app.use(errorHandler);

export { app };