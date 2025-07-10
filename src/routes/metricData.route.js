import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getManualMetricData, getWorldBankIndicator } from '../controllers/metricData.controller.js';


const router = Router();
router.use(verifyJWT);

router
    .route("/fetch-live-metric-data")
    .get(getWorldBankIndicator);

router
    .route("/fetch-manual-metric-data")
    .get(getManualMetricData);



export default router;