import {Router} from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import { addMetric, deleteMetric, getAllMetrics, editMetric, changeMetricStatus } from "../../controllers/admin/mm.controller.js";

const router = Router();
router.use(adminAuth); 

router
    .route("/add")
    .post(addMetric);

router
    .route("/fetch-all-metrics")
    .get(getAllMetrics);

router
    .route("/delete/:id")
    .delete(deleteMetric);

router
    .route("/edit/:id")
    .patch(editMetric);

router
    .route("/update-status/:id")
    .patch(changeMetricStatus);

export default router;