import { WorkspaceRepository } from './workspace.repository';
import {
  CreateWorkspaceDTO,
  InviteMemberDTO,
  AcceptInviteDTO,
  UpdateWorkspaceDTO,
  UpdateMemberRoleDTO,
} from './workspace.schema';
import { AppError } from '@/common/errors/app.error';
import crypto from 'crypto';
import { NotificationService } from '../notification/notification.service';

/**
 * @class WorkspaceService
 * @description Orchestrates business logic, verifies entity existence before mutations,
 * and constructs standardized pagination metadata for the client layer.
 */
export class WorkspaceService {
  private readonly workspaceRepository: WorkspaceRepository;
  private readonly notificationService: NotificationService;

  constructor() {
    this.workspaceRepository = new WorkspaceRepository();
    this.notificationService = new NotificationService();
  }

  public async create(userId: string, data: CreateWorkspaceDTO) {
    return await this.workspaceRepository.create(userId, {
      name: data.name,
      description: data.description ?? null,
    });
  }

  public async update(workspaceId: string, userId: string, data: UpdateWorkspaceDTO) {
    const member = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!member || !['OWNER', 'EDITOR'].includes(member.role)) {
      throw new AppError(403, 'Only Owners or Editors can update the workspace.');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    return await this.workspaceRepository.updateWorkspace(workspaceId, updateData);
  }

  public async delete(workspaceId: string, userId: string) {
    const member = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!member || member.role !== 'OWNER') {
      throw new AppError(403, 'Only the Workspace Owner can delete the workspace.');
    }
    return await this.workspaceRepository.deleteWorkspace(workspaceId);
  }

  public async getUserWorkspaces(userId: string) {
    return await this.workspaceRepository.findUserWorkspaces(userId);
  }

  // --- Invitations ---
  public async inviteMember(workspaceId: string, inviterId: string, data: InviteMemberDTO) {
    const inviter = await this.workspaceRepository.findMember(workspaceId, inviterId);
    if (!inviter || !['OWNER', 'EDITOR'].includes(inviter.role)) {
      throw new AppError(403, 'You do not have permission to invite members.');
    }

    const existingUser = await this.workspaceRepository.findUserByEmail(data.email);
    if (existingUser) {
      const isAlreadyMember = await this.workspaceRepository.findMember(
        workspaceId,
        existingUser.id
      );
      if (isAlreadyMember) throw new AppError(409, 'User is already a member.');
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await this.workspaceRepository.createInvitation({
      workspaceId,
      inviterId,
      email: data.email,
      role: data.role as any,
      token: inviteToken,
      expiresAt,
    });

    console.log(
      `📧 Send Email to ${data.email}. Link: http://localhost:3000/invites/accept?token=${inviteToken}`
    );
    return invite;
  }

  public async acceptInvitation(userId: string, email: string, data: AcceptInviteDTO) {
    const invite = await this.workspaceRepository.findInvitationByToken(data.token);
    if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new AppError(400, 'Invalid or expired invitation.');
    }
    if (invite.email !== email) {
      throw new AppError(403, 'This invitation was sent to a different email address.');
    }

    const existingMember = await this.workspaceRepository.findMember(invite.workspaceId, userId);
    if (existingMember) throw new AppError(409, 'You are already a member.');

    await this.workspaceRepository.processInvitationAcceptance(
      invite.id,
      invite.workspaceId,
      userId,
      invite.role
    );

    await this.notificationService.sendDirectNotification({
      userId: invite.inviterId,
      title: 'New Team Member!',
      message: `${email} has accepted your invitation to ${invite.workspace.name}.`,
      type: 'SUCCESS',
      relatedEntityId: invite.workspaceId,
    });
    return { workspaceId: invite.workspaceId, name: invite.workspace.name };
  }

  // --- Member Management ---
  public async updateMemberRole(
    workspaceId: string,
    requesterId: string,
    targetUserId: string,
    data: UpdateMemberRoleDTO
  ) {
    const requester = await this.workspaceRepository.findMember(workspaceId, requesterId);
    if (!requester || requester.role !== 'OWNER')
      throw new AppError(403, 'Only Owners can change roles.');
    if (requesterId === targetUserId) throw new AppError(400, 'You cannot change your own role.');

    const targetMember = await this.workspaceRepository.findMember(workspaceId, targetUserId);
    if (!targetMember) throw new AppError(404, 'Member not found in this workspace.');

    return await this.workspaceRepository.updateMemberRole(
      workspaceId,
      targetUserId,
      data.role as any
    );
  }

  public async removeMember(workspaceId: string, requesterId: string, targetUserId: string) {
    const requester = await this.workspaceRepository.findMember(workspaceId, requesterId);
    if (!requester || requester.role !== 'OWNER')
      throw new AppError(403, 'Only Owners can remove members.');
    if (requesterId === targetUserId)
      throw new AppError(400, 'You cannot remove yourself. Delete the workspace instead.');

    const targetMember = await this.workspaceRepository.findMember(workspaceId, targetUserId);
    if (!targetMember) throw new AppError(404, 'Member not found.');

    return await this.workspaceRepository.removeMember(workspaceId, targetUserId);
  }

  // --- New Read Methods ---
  public async getWorkspaceMembers(workspaceId: string, userId: string) {
    const isMember = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!isMember) throw new AppError(403, 'You are not a member of this workspace.');
    return await this.workspaceRepository.getWorkspaceMembers(workspaceId);
  }

  public async getPendingInvites(workspaceId: string, userId: string) {
    const member = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!member || !['OWNER', 'EDITOR'].includes(member.role)) {
      throw new AppError(403, 'Only Owners or Editors can view invites.');
    }
    return await this.workspaceRepository.getPendingInvites(workspaceId);
  }

  // --- New Action Methods ---
  public async revokeInvite(workspaceId: string, inviteId: string, userId: string) {
    const member = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!member || !['OWNER', 'EDITOR'].includes(member.role)) {
      throw new AppError(403, 'Only Owners or Editors can revoke invites.');
    }
    return await this.workspaceRepository.deleteInvite(inviteId);
  }

  public async leaveWorkspace(workspaceId: string, userId: string) {
    const member = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!member) throw new AppError(404, 'You are not a member of this workspace.');

    // CRITICAL: The "Last Owner" Check
    if (member.role === 'OWNER') {
      const ownerCount = await this.workspaceRepository.countOwners(workspaceId);
      if (ownerCount <= 1) {
        throw new AppError(
          400,
          'You are the last owner. You must transfer ownership or delete the workspace entirely before leaving.'
        );
      }
    }

    return await this.workspaceRepository.removeMember(workspaceId, userId);
  }
}
