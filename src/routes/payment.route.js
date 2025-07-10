import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { checkoutSession, stripeWebhook } from '../controllers/payment.controller.js';


const router = Router();

router
    .route('/create-checkout-session')
    .post(verifyJWT, checkoutSession);


export default router;