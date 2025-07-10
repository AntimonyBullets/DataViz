import {Router} from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import { getDashboardInfo } from "../../controllers/admin/dashboard.controller.js";

const router = Router();
router.use(adminAuth);

router
    .route('/get-dashboard-info')
    .get(getDashboardInfo)

export default router;