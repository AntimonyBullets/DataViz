import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getAllIndustries } from '../controllers/industry.controller.js';

const router = Router();

router
    .route("/fetch-industries")
    .get(verifyJWT, getAllIndustries);

export default router;