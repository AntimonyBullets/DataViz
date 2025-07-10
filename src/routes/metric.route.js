import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getMetricById, getMetrics } from '../controllers/metric.controller.js';

const router = Router();

router
    .route("/fetch-metrics")
    .get(verifyJWT, getMetrics);

router
    .route("/get-metric/:id")
    .get(verifyJWT, getMetricById);

export default router;