import { Router } from "express";
import { createOrder, getUserOrders, updateOrderStatus, getAllOrders } from "../controllers/orderController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizedRole } from "../middlewares/role.middleware.js";

const orderRouter = Router();

orderRouter.post("/", verifyJWT, createOrder);
orderRouter.get("/myOrders", verifyJWT, getUserOrders);
orderRouter.get("/", verifyJWT,authorizedRole("admin") , getAllOrders);
orderRouter.put("/:id/status",verifyJWT,authorizedRole("admin"), updateOrderStatus);
// orderRouter.put("/:id/status", verifyJWT, updateOrderStatus);

export default orderRouter;
