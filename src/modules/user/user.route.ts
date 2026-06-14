import { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '@/middlewares/validate.middleware';
import {
  getApplicantsQuerySchema,
  getUsersQuerySchema,
  updateProfileSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from './user.schema';
import { getIDSchema } from '@/common/schemas/reusable.schema';
import { ENDPOINTS } from '@/constants/endpoints';
import { requireRole, verifyToken } from '@/middlewares/auth.middleware';
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
    // ==========================================
    // USER ROUTES (Self-Service)
    // ==========================================

    // Get own profile /users/me
    this.router.get(ENDPOINTS.USER.PROFILE, verifyToken, this.userController.getMyProfile);

    // Update own profile /users/me
    this.router.patch(
      ENDPOINTS.USER.PROFILE,
      verifyToken,
      validate(updateProfileSchema),
      this.userController.updateMyProfile
    );

    // ==========================================
    // ADMIN ROUTES (Management & QA/QC)
    // ==========================================

    // QA/QC: List applicants /applicants?status=APPROVED|REJECTED|PENDING&page=1&limit=10
    this.router.get(
      ENDPOINTS.USER.APPLICANTS,
      verifyToken,
      requireRole(['ADMIN']),
      validate(getApplicantsQuerySchema),
      this.userController.getApplicants
    );

    // QA/QC: Approve/Reject applicant /applicants/:id/status
    this.router.patch(
      ENDPOINTS.USER.UPDATE_STATUS,
      verifyToken,
      requireRole(['ADMIN']),
      validate(getIDSchema),
      validate(updateUserStatusSchema),
      this.userController.updateStatus
    );

    // Management: List all users /users
    this.router.get(
      ENDPOINTS.USER.LIST,
      verifyToken,
      requireRole(['ADMIN']),
      validate(getUsersQuerySchema),
      this.userController.getAllUsers
    );

    // Management: Get specific user details /:id
    this.router.get(
      ENDPOINTS.USER.GET_BY_ID,
      verifyToken,
      requireRole(['ADMIN']),
      validate(getIDSchema),
      this.userController.getUserById
    );

    // Management: Promote/Demote user /:id/role
    this.router.patch(
      ENDPOINTS.USER.GET_ROLE_OF_USER,
      verifyToken,
      requireRole(['ADMIN']),
      validate(getIDSchema),
      validate(updateUserRoleSchema),
      this.userController.updateRole
    );

    // Management: Delete user (Cascade will delete their Assets/Jobs)
    this.router.delete(
      ENDPOINTS.USER.GET_BY_ID,
      verifyToken,
      requireRole(['ADMIN']),
      validate(getIDSchema),
      this.userController.deleteUser
    );

    // ==========================================
    // ADMIN OVERRIDE METHODS
    // ==========================================
    // 1. Trigger Password Reset Email
    this.router.post(
      '/:id/reset-password',
      verifyToken,
      requireRole(['ADMIN']), // ONLY ADMINS
      validate(getIDSchema),
      this.userController.triggerPasswordReset
    );

    // 2. Force Logout (Kill all sessions)
    this.router.post(
      '/:id/force-logout',
      verifyToken,
      requireRole(['ADMIN']), // ONLY ADMINS
      validate(getIDSchema),
      this.userController.forceLogout
    );

    // 3. Manually Verify Email
    this.router.post(
      '/:id/verify-email',
      verifyToken,
      requireRole(['ADMIN']), // ONLY ADMINS
      validate(getIDSchema),
      this.userController.verifyEmailManually
    );
  }
}

export default new UserRoute().router;
