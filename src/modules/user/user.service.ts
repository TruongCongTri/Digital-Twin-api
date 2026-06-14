import { UserRepository } from './user.repository';
import {
  GetApplicantsQueryDTO,
  GetUsersQueryDTO,
  UpdateProfileDTO,
  UpdateUserRoleDTO,
  UpdateUserStatusDTO,
} from './user.schema';
import { AppError } from '@/common/errors/app.error';
import { MESSAGES } from '@/constants/messages';
import { ERROR_CODES } from '@/constants/error-codes';
import { RESOURCES } from '@/constants/resources';
import { PaginationMetaDto } from '@/data/dtos/pagination.dto';
import { AuthService } from '../auth/auth.service';

export class UserService {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // Remove password utility
  private sanitizeUser(user: any) {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  public async getApplicants(query: GetApplicantsQueryDTO) {
    const { total, data } = await this.userRepository.findApplicants(query);
    const meta = PaginationMetaDto.create(query.page, query.limit, total);
    return { data: data.map(this.sanitizeUser), meta };
  }

  public async getAllUsers(query: GetUsersQueryDTO) {
    const { total, data } = await this.userRepository.findAllUsers(query);
    const meta = PaginationMetaDto.create(query.page, query.limit, total);
    return { data: data.map(this.sanitizeUser), meta };
  }

  public async getProfile(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user)
      throw new AppError(
        404,
        MESSAGES.COMMON.ERROR.NOT_FOUND(RESOURCES.USER),
        ERROR_CODES.COMMON.RECORD_NOT_FOUND
      );
    return this.sanitizeUser(user);
  }

  public async updateStatus(id: string, payload: UpdateUserStatusDTO) {
    const user = await this.getProfile(id); // Fetch current user and verify existence
    const currentStatus = user.accountStatus;
    const newStatus = payload.status;

    // Prevent redundant database updates
    if (currentStatus === newStatus) {
      throw new AppError(
        400,
        `User is already marked as ${newStatus}`,
        ERROR_CODES.COMMON.INVALID_INPUT
      );
    }

    // STATE MACHINE VALIDATOR
    const validTransitions: Record<string, string[]> = {
      // From Pending -> Can only Approve or Reject
      PENDING: ['APPROVED', 'REJECTED'],

      // From Rejected -> Can only Reset back to Pending (or directly Approve if you prefer)
      REJECTED: ['PENDING', 'APPROVED'],

      // From Approved -> Can only Suspend (Cannot reject an active user)
      APPROVED: ['SUSPENDED'],

      // From Suspended -> Can only Unsuspend (Approve)
      SUSPENDED: ['APPROVED'],
    };

    // Check if the requested transition is allowed based on current status
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        400,
        `Invalid status transition. Cannot change status from ${currentStatus} to ${newStatus}.`,
        ERROR_CODES.COMMON.INVALID_INPUT
      );
    }

    // Process the valid update
    const updatedUser = await this.userRepository.updateAccountStatus(id, newStatus);

    // Security Action: If a user is Suspended or Rejected, force logout!
    if (newStatus === 'SUSPENDED' || newStatus === 'REJECTED') {
      const authService = new AuthService();
      await authService.adminRevokeAllUserSessions(id);
    }

    return this.sanitizeUser(updatedUser);
  }

  public async updateRole(id: string, payload: UpdateUserRoleDTO) {
    await this.getProfile(id); // Verify existence
    const updatedUser = await this.userRepository.updateRole(id, payload.role as any);
    return this.sanitizeUser(updatedUser);
  }

  public async updateProfile(id: string, payload: UpdateProfileDTO) {
    await this.getProfile(id); // Verify existence
    const updatedUser = await this.userRepository.updateProfile(id, payload);
    return this.sanitizeUser(updatedUser);
  }

  public async deleteUser(id: string) {
    await this.getProfile(id); // Verify existence
    // Cascade delete in Prisma schema will automatically clean up Assets, Jobs, and Sessions
    await this.userRepository.delete(id);
    return true;
  }
}
