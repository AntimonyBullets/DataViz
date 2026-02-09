import { Router } from 'express';
import { registerUser, resendVerificationEmail, verifyEmail, loginUser, guestLogin, sendResetPasswordLink, resetPassword, logoutUser, getCurrentUser } from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();

router
    .route('/register')
    .post(registerUser);

router
    .route("/verify/:token")
    .get(verifyEmail);

router
    .route("/resend-verification-email")
    .post(resendVerificationEmail);
    
router
    .route("/login")
    .post(loginUser);

router
    .route("/guest-login")
    .post(guestLogin);

router
    .route("/send-reset-password-link")
    .post(sendResetPasswordLink);

router
    .route("/reset-password")
    .post(resetPassword);

router
    .route("/logout")
    .post(verifyJWT, logoutUser);

router
    .route("/me")
    .get(verifyJWT, getCurrentUser);

export default router;