import {Router} from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import { uploadMetricDataCsv, getAllMetricDataPaginated, getMetricDataByManualMetric, getAllManualMetrics, deleteMetricDataByMetric, editMetricDataValue } from "../../controllers/admin/mdm.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = Router();
router.use(adminAuth);

router
    .route("/upload-data")
    .post(upload.single("file"), uploadMetricDataCsv);

// Route for paginated metric data fetch
router
    .route("/all-metric-data")
    .get(getAllMetricDataPaginated);

router
    .route("/get-manual-metric-data")
    .get(getMetricDataByManualMetric);

router
    .route("/get-manual-metrics")
    .get(getAllManualMetrics);

router
    .route("/delete-selected-data")
    .delete(deleteMetricDataByMetric);
router
    .route("/edit-metric-data-value")
    .patch(editMetricDataValue);

export default router;