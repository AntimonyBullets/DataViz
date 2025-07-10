import {Router} from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import { getAllPayments } from "../../controllers/admin/pm.controller.js";

const router = Router();
router.use(adminAuth);

router
    .route("/fetch-all-payments")
    .get(getAllPayments);


export default router;