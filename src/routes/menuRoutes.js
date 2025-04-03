import { Router } from "express";
import {
  addMenuItem,
  getAllMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authorizedRole } from "../middlewares/role.middleware.js";
import { refreshAccessToken } from "../controllers/authController.js";

const menuRouter = Router();

menuRouter.post("/", verifyJWT, authorizedRole("admin"), upload.single("image"), addMenuItem);

// menuRouter.post("/",addMenuItem);

menuRouter.get("/", getAllMenuItems);

menuRouter.get("/:id", getMenuItem);

menuRouter.put("/:id", verifyJWT, authorizedRole("admin"), upload.single("image"), updateMenuItem);

// menuRouter.put("/:id",updateMenuItem);

menuRouter.delete("/:id", verifyJWT, authorizedRole("admin"), deleteMenuItem);

export default menuRouter;
