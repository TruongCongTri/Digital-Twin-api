import { User, Prisma } from '@/generated/client';
import { prisma } from '@/common/configs/prisma';
import { BaseRepository } from '@/common/repositories/base.repository';
import { GetApplicantsQueryDTO } from '@/modules/user/user.schema';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('user');
  }

  /**
   * @method findApplicants
   * @description Fetches users with pagination and optional status filtering.
   */
  public async findApplicants(query: GetApplicantsQueryDTO) {
    const where: Prisma.UserWhereInput = {};

    if (query.status) {
      where.accountStatus = query.status;
    }

    return await this.executePagination<User>({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
  }

  public async updateAccountStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    return await prisma.user.update({
      where: { id },
      data: { accountStatus: status },
    });
  }
}
