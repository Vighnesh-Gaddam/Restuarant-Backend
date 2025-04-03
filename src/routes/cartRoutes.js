import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    addToCart, 
    getCartItems, 
    updateCartItem, 
    removeCartItem, 
    clearCart 
} from "../controllers/cartController.js";
import { refreshAccessToken } from "../controllers/authController.js";

const cartRouter = Router();

// Routes for managing cart items
cartRouter.post("/",verifyJWT, addToCart);
cartRouter.get("/", verifyJWT, getCartItems);
cartRouter.put("/:cartItemId",verifyJWT, updateCartItem);
cartRouter.delete("/:cartItemId", verifyJWT, removeCartItem);
cartRouter.delete("/clear",verifyJWT, clearCart);

export default cartRouter;

