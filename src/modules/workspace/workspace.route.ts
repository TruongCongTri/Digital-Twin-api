import { Router } from 'express';
import { WorkspaceController } from './workspace.controller';
import { validate } from '@/middlewares/validate.middleware';
import {
  acceptInviteSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
} from './workspace.schema';
import { ENDPOINTS } from '@/constants/endpoints';
import { getIDSchema } from '@/common/schemas/reusable.schema';
import { verifyToken } from '@/middlewares/auth.middleware';

/**
 * @class WorkspaceRoute
 * @description Registers all RESTful endpoints, injects Zod validation middlewares,
 * and maintains strict path precedence to prevent routing conflicts.
 */
export class WorkspaceRoute {
  public router: Router;
  private readonly workspaceController: WorkspaceController;

  /**
   * Init Route with Dependency Injection (DI)
   */
  constructor(controller?: WorkspaceController) {
    this.router = Router();
    this.workspaceController = controller || new WorkspaceController();

    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Note: The order matters. Put static paths before dynamic /:id paths.

    // 1. Accept Email Invite (Static path)
    this.router.post(
      '/invites/accept',
      verifyToken,
      validate(acceptInviteSchema),
      this.workspaceController.acceptInvitation
    );

    // 2. Fetch User's Workspaces
    this.router.get(ENDPOINTS.BASE.BASE, verifyToken, this.workspaceController.getMyWorkspaces);

    // 3. Create Workspace
    this.router.post(
      ENDPOINTS.BASE.BASE,
      verifyToken,
      validate(createWorkspaceSchema),
      this.workspaceController.create
    );

    // 4. Update Workspace
    this.router.patch(
      ENDPOINTS.BASE.GET_BY_ID,
      verifyToken,
      validate(getIDSchema),
      validate(updateWorkspaceSchema),
      this.workspaceController.update
    );

    // 5. Delete Workspace
    this.router.delete(
      ENDPOINTS.BASE.GET_BY_ID,
      verifyToken,
      validate(getIDSchema),
      this.workspaceController.delete
    );

    // 6. Send Email Invite
    this.router.post(
      ENDPOINTS.WORKSPACE.SEND_INVITE,
      verifyToken,
      validate(getIDSchema),
      validate(inviteMemberSchema),
      this.workspaceController.inviteMember
    );

    // 7. Update Member Role
    this.router.patch(
      ENDPOINTS.WORKSPACE.UPDATE_MEMBER_ROLE,
      verifyToken,
      validate(updateMemberRoleSchema),
      this.workspaceController.updateMemberRole
    );

    // 8. Remove Member from Workspace
    this.router.delete(
      ENDPOINTS.WORKSPACE.REMOVE_MEMBER,
      verifyToken,
      this.workspaceController.removeMember
    );

    // List Members
    this.router.get(
      ENDPOINTS.WORKSPACE.LIST_MEMBERS,
      verifyToken,
      validate(getIDSchema),
      this.workspaceController.getMembers
    );

    // List Pending Invites
    this.router.get(
      ENDPOINTS.WORKSPACE.LIST_INVITES,
      verifyToken,
      validate(getIDSchema),
      this.workspaceController.getInvites
    );

    // Revoke Invite
    this.router.delete(
      ENDPOINTS.WORKSPACE.REVOKE_INVITE,
      verifyToken,
      this.workspaceController.revokeInvite
    );

    // Leave Workspace voluntarily
    this.router.delete(
      ENDPOINTS.WORKSPACE.LEAVE_WORKSPACE,
      verifyToken,
      validate(getIDSchema),
      this.workspaceController.leaveWorkspace
    );
  }
}

// Export default instance of Route to be used in main route configuration
export default new WorkspaceRoute().router;
