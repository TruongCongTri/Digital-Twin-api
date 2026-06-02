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
    await this.getProfile(id); // Verify existence
    const updatedUser = await this.userRepository.updateAccountStatus(id, payload.status);
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
