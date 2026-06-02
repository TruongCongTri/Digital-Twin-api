import { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '@/middlewares/validate.middleware';
import { getApplicantsQuerySchema, updateUserStatusSchema } from './user.schema';
import { getIDSchema } from '@/common/schemas/reusable.schema';
import { ENDPOINTS } from '@/constants/endpoints';
// import { requireAuth, requireRole } from '@/middlewares/auth.middleware';

export class UserRoute {
  public router: Router;
  private readonly userController: UserController;

  constructor(controller?: UserController) {
    this.router = Router();
    this.userController = controller || new UserController();

    this.initializeRoutes();
  }

  private initializeRoutes() {
    // --- ADMIN ROUTES ---

    // [GET] /api/v1/users/applicants?status=PENDING
    this.router.get(
      ENDPOINTS.USER.APPLICANTS,
      // requireAuth,
      // requireRole('ADMIN'),
      validate(getApplicantsQuerySchema),
      this.userController.getApplicants
    );

    // [PATCH] /api/v1/users/applicants/:id/status
    this.router.patch(
      ENDPOINTS.USER.UPDATE_STATUS,
      // requireAuth,
      // requireRole('ADMIN'),
      validate(getIDSchema),
      validate(updateUserStatusSchema),
      this.userController.updateStatus
    );

    // --- PROTECTED USER ROUTES ---

    // [GET] /api/v1/users/me (Get own profile)
    this.router.get(
      ENDPOINTS.USER.PROFILE,
      // requireAuth,
      this.userController.getProfile
    );
  }
}

export default new UserRoute().router;
