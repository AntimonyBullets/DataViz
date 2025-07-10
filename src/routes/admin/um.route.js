import {Router} from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import { changeUserStatus, getAllUsers, deleteUser } from "../../controllers/admin/um.controller.js";

const router = Router();
router.use(adminAuth);

router
    .route("/fetch-users")
    .get(getAllUsers);

router
    .route("/update-status/:id")
    .patch(changeUserStatus);

router
    .route("/delete/:id")
    .delete(deleteUser);

export default router;