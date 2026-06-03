import { Request, Response } from 'express';
import { WorkspaceService } from './workspace.service';
import { successResponse } from '@/common/utils/responses/api-response';
import { MESSAGES } from '@/constants/messages';
import { RESOURCES } from '@/constants/resources';

/**
 * @class WorkspaceController
 * @description Bridges the Express HTTP layer and the underlying Service logic.
 * Assumes a global async-error handler wrapper is active in the Express app.
 */
export class WorkspaceController {
  private readonly workspaceService: WorkspaceService;

  constructor() {
    this.workspaceService = new WorkspaceService();
  }

  /**
   * @description [POST] Extracts body and initiates event creation.
   */
  public create = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const data = await this.workspaceService.create(userId, req.body);
    successResponse(res, {
      statusCode: 201,
      message: MESSAGES.COMMON.SUCCESS.CREATED(RESOURCES.WORKSPACE),
      data,
    });
  };

  public update = async (req: Request, res: Response) => {
    const workspaceId = req.params.id as string; // <-- FIX: Cast to string
    const userId = (req as any).user.id;

    const data = await this.workspaceService.update(workspaceId, userId, req.body);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.UPDATED(RESOURCES.WORKSPACE),
      data,
    });
  };

  public delete = async (req: Request, res: Response) => {
    const workspaceId = req.params.id as string; // <-- FIX: Cast to string
    const userId = (req as any).user.id;

    await this.workspaceService.delete(workspaceId, userId);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.DELETED(RESOURCES.WORKSPACE),
    });
  };

  public getMyWorkspaces = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const data = await this.workspaceService.getUserWorkspaces(userId);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.WORKSPACE),
      data,
    });
  };

  public inviteMember = async (req: Request, res: Response) => {
    const workspaceId = req.params.id as string; // <-- FIX
    const inviterId = (req as any).user.id;

    const data = await this.workspaceService.inviteMember(workspaceId, inviterId, req.body);
    successResponse(res, { statusCode: 201, message: MESSAGES.WORKSPACE.SUCCESS.INVITED, data });
  };

  public acceptInvitation = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const data = await this.workspaceService.acceptInvitation(user.id, user.email, req.body);
    successResponse(res, { statusCode: 200, message: MESSAGES.WORKSPACE.SUCCESS.jOINED, data });
  };

  public updateMemberRole = async (req: Request, res: Response) => {
    const workspaceId = req.params.id as string; // <-- FIX
    const targetUserId = req.params.userId as string; // <-- FIX
    const requesterId = (req as any).user.id;

    const data = await this.workspaceService.updateMemberRole(
      workspaceId,
      requesterId,
      targetUserId,
      req.body
    );
    successResponse(res, { statusCode: 200, message: 'Role updated', data });
  };

  public removeMember = async (req: Request, res: Response) => {
    const workspaceId = req.params.id as string; // <-- FIX
    const targetUserId = req.params.userId as string; // <-- FIX
    const requesterId = (req as any).user.id;

    await this.workspaceService.removeMember(workspaceId, requesterId, targetUserId);
    successResponse(res, { statusCode: 200, message: MESSAGES.WORKSPACE.SUCCESS.REMOVED });
  };

  public getMembers = async (req: Request, res: Response) => {
    const data = await this.workspaceService.getWorkspaceMembers(
      req.params.id as string,
      (req as any).user.id
    );
    successResponse(res, { statusCode: 200, message: 'Members fetched', data });
  };

  public getInvites = async (req: Request, res: Response) => {
    const data = await this.workspaceService.getPendingInvites(
      req.params.id as string,
      (req as any).user.id
    );
    successResponse(res, { statusCode: 200, message: 'Invites fetched', data });
  };

  public revokeInvite = async (req: Request, res: Response) => {
    await this.workspaceService.revokeInvite(
      req.params.id as string,
      req.params.inviteId as string,
      (req as any).user.id
    );
    successResponse(res, { statusCode: 200, message: 'Invite revoked' });
  };

  public leaveWorkspace = async (req: Request, res: Response) => {
    await this.workspaceService.leaveWorkspace(req.params.id as string, (req as any).user.id);
    successResponse(res, { statusCode: 200, message: 'Successfully left the workspace' });
  };
}
