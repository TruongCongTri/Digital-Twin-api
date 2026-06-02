import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authLimiter } from '@/middlewares/rate-limit.middleware';
import { registerSchema, loginSchema } from './auth.schema';
import { ENDPOINTS } from '@/constants/endpoints';

export class AuthRoute {
  public router: Router;
  private readonly authController: AuthController;

  constructor(controller?: AuthController) {
    this.router = Router();
    this.authController = controller || new AuthController();

    this.initializeRoutes();
  }

  private initializeRoutes() {
    // [POST] /api/v1/auth/register
    this.router.post(
      ENDPOINTS.AUTH.REGISTER,
      authLimiter, // Apply strict rate limiting for auth routes
      validate(registerSchema),
      this.authController.register
    );

    // [POST] /api/v1/auth/login
    this.router.post(
      ENDPOINTS.AUTH.LOGIN,
      authLimiter,
      validate(loginSchema),
      this.authController.login
    );
  }
}

export default new AuthRoute().router;
