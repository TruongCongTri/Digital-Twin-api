import { User, Prisma, Role } from '@/generated/client';
import { prisma } from '@/common/configs/prisma';
import { BaseRepository } from '@/common/repositories/base.repository';
import {
  GetApplicantsQueryDTO,
  GetUsersQueryDTO,
  UpdateProfileDTO,
} from '@/modules/user/user.schema';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('user');
  }

  /**
   * @method findApplicants
   * @description Admin ONLY - Fetches users with pagination and optional status filtering.
   */
  public async findApplicants(query: GetApplicantsQueryDTO) {
    const where: Prisma.UserWhereInput = {};

    if (query.status) where.accountStatus = query.status;

    return await this.executePagination<User>({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
  }

  // Admin: All users with search
  public async findAllUsers(query: GetUsersQueryDTO) {
    const where: Prisma.UserWhereInput = {};

    if (query.role) where.role = query.role;
    if (query.status) where.accountStatus = query.status;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return await this.executePagination<User>({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
  }

  public async updateAccountStatus(
    id: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  ) {
    return await prisma.user.update({
      where: { id },
      data: { accountStatus: status },
    });
  }

  public async updateRole(id: string, role: Role) {
    return await prisma.user.update({ where: { id }, data: { role } });
  }

  public async updateProfile(id: string, data: UpdateProfileDTO) {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.fullName !== undefined) {
      updateData.fullName = data.fullName;
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
}
