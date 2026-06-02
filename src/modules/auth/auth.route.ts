import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authLimiter } from '@/middlewares/rate-limit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendVerifyEmailSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  revokeSessionSchema,
} from '@/modules/auth/auth.schema';
import { ENDPOINTS } from '@/constants/endpoints';
import { verifyToken } from '@/middlewares/auth.middleware';

export class AuthRoute {
  public router: Router;
  private readonly authController: AuthController;

  constructor(controller?: AuthController) {
    this.router = Router();
    this.authController = controller || new AuthController();

    this.initializeRoutes();
  }

  private initializeRoutes() {
    // === PUBLIC ROUTES ===

    // 1. REGISTER
    this.router.post(
      ENDPOINTS.AUTH.REGISTER,
      authLimiter,
      validate(registerSchema),
      this.authController.register
    );

    // 2. LOGIN
    this.router.post(
      ENDPOINTS.AUTH.LOGIN,
      authLimiter,
      validate(loginSchema),
      this.authController.login
    );

    // 3. REFRESH TOKEN
    this.router.post(
      ENDPOINTS.AUTH.REFRESH_TOKEN,
      validate(refreshTokenSchema), // Checks cookies directly via Schema
      this.authController.refreshToken
    );

    // 4. VERIFICATION OTP
    this.router.post(
      ENDPOINTS.AUTH.SEND_VERIFY_EMAIL,
      authLimiter,
      validate(sendVerifyEmailSchema),
      this.authController.sendVerifyOTP
    );
    this.router.post(
      ENDPOINTS.AUTH.VERIFY_EMAIL,
      authLimiter,
      validate(verifyEmailSchema),
      this.authController.verifyOTP
    );

    // 5. PASSWORD RECOVERY
    this.router.post(
      ENDPOINTS.AUTH.FORGOT_PASSWORD,
      authLimiter,
      validate(forgotPasswordSchema),
      this.authController.forgotPassword
    );
    this.router.post(
      ENDPOINTS.AUTH.RESET_PASSWORD,
      authLimiter,
      validate(resetPasswordSchema),
      this.authController.resetPassword
    );

    // === PROTECTED ROUTES (Requires valid Access Token) ===

    // 6. PASSWORD MANAGEMENT
    this.router.patch(
      ENDPOINTS.AUTH.CHANGE_PASSWORD,
      verifyToken,
      validate(changePasswordSchema),
      this.authController.changePassword
    );

    // 7. DEVICE / SESSION MANAGEMENT
    this.router.get(ENDPOINTS.AUTH.SESSIONS, verifyToken, this.authController.getSessions);
    this.router.delete(
      ENDPOINTS.AUTH.REVOKE_SESSION,
      verifyToken,
      validate(revokeSessionSchema),
      this.authController.revokeSession
    );
    this.router.delete(
      ENDPOINTS.AUTH.REVOKE_OTHER_SESSIONS,
      verifyToken,
      this.authController.revokeOtherSessions
    );

    // 8. LOGOUT
    this.router.post(ENDPOINTS.AUTH.LOGOUT, verifyToken, this.authController.logout);
  }
}

export default new AuthRoute().router;
