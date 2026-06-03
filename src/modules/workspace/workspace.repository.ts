import { Prisma, Workspace, WorkspaceRole } from '@/generated';
import { prisma } from '@/common/configs/prisma';
import { BaseRepository } from '@/common/repositories/base.repository';

/**
 * @class WorkspaceRepository
 * @description Handles all raw database interactions, atomic transactions, and CQRS routing
 * for the ScoreEvent and PlayerScore domains.
 */
export class WorkspaceRepository extends BaseRepository<Workspace> {
  constructor() {
    // inject Prisma client delegate for Workspace model
    super('workspace');
  }

  /**
   * @method create
   * @description Create a new Workspace record
   *
   * @param data - The validated Workspace payload
   * @returns The created Workspace record
   */
  public async create(userId: string, data: { name: string; description?: string | null }) {
    return await prisma.workspace.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: { members: true },
    });
  }

  public async findById(workspaceId: string) {
    return await prisma.workspace.findUnique({ where: { id: workspaceId } });
  }

  public async updateWorkspace(workspaceId: string, data: Prisma.WorkspaceUpdateInput) {
    return await prisma.workspace.update({ where: { id: workspaceId }, data });
  }

  public async deleteWorkspace(workspaceId: string) {
    return await prisma.workspace.delete({ where: { id: workspaceId } });
  }

  // --- Member Management ---
  public async findUserWorkspaces(userId: string) {
    return await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });
  }

  public async findMember(workspaceId: string, userId: string) {
    return await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  public async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    return await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
  }

  public async removeMember(workspaceId: string, userId: string) {
    return await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  // --- Invites ---
  public async createInvitation(data: Prisma.WorkspaceInvitationUncheckedCreateInput) {
    return await prisma.workspaceInvitation.create({ data });
  }

  public async findInvitationByToken(token: string) {
    return await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true },
    });
  }

  public async processInvitationAcceptance(
    invitationId: string,
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ) {
    return await prisma.$transaction(async (tx) => {
      await tx.workspaceInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
      });
      await tx.workspaceMember.create({
        data: { workspaceId, userId, role },
      });
    });
  }

  public async findUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  // Add these helper methods to your repository
  public async getWorkspaceMembers(workspaceId: string) {
    return await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
  }

  public async getPendingInvites(workspaceId: string) {
    return await prisma.workspaceInvitation.findMany({
      where: { workspaceId, status: 'PENDING' },
    });
  }

  public async deleteInvite(inviteId: string) {
    return await prisma.workspaceInvitation.delete({ where: { id: inviteId } });
  }

  public async countOwners(workspaceId: string) {
    return await prisma.workspaceMember.count({
      where: { workspaceId, role: 'OWNER' },
    });
  }
}
