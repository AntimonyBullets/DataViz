import {Router} from "express";
import { loginAdmin, logoutAdmin, registerAdmin, updatePassword } from "../../controllers/admin/admin.controller.js";
import { adminToken } from "../../middlewares/adminToken.middleware.js";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";

const router = Router();

router
    .route("/register")
    .post(adminToken,registerAdmin);

router
    .route("/login")
    .post(loginAdmin);

router
    .route("/update-password")
    .post(adminAuth, updatePassword);

router
    .route("/logout")
    .post(adminAuth, logoutAdmin)

export default router;