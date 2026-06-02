import { User } from '@/generated';
import { prisma } from '@/common/configs/prisma';
import { BaseRepository } from '@/common/repositories/base.repository';
import { RegisterDTO } from './auth.schema';
import { APP_CONFIG } from '@/constants/app.constant';

export class AuthRepository extends BaseRepository<User> {
  constructor() {
    super('user');
  }

  public async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  public async createPendingUser(data: RegisterDTO, hashedPassword: string) {
    return await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        role: APP_CONFIG.AUTH.DEFAULT_ROLE as any,
        accountStatus: 'PENDING', // Enforcing the manual review flow
      },
    });
  }
}
