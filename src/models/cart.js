import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
        {
            menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true }, // ✅ Should match "Menu"
            quantity: { type: Number, required: true }
        }
    ]
});

const Cart = mongoose.model("Cart", cartSchema);
export { Cart };
