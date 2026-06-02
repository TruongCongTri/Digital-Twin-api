import { OtpType, Prisma, User } from '@/generated';
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

  public async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        fullName: true,
      },
    });
  }

  public async updateUserLoginAttempts(userId: string, attempts: number, lockedUntil: Date | null) {
    return prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: attempts, lockedUntil },
    });
  }

  public async updatePassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // [SESSION / THIẾT BỊ]
  public async findActiveSessionsForLogin(userId: string) {
    return prisma.session.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      select: { id: true },
      orderBy: { lastActive: 'asc' },
    });
  }

  public async findDeviceSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceId: true,
        createdAt: true,
        lastActive: true,
      },
      orderBy: { lastActive: 'desc' },
    });
  }

  public async createSession(data: Prisma.SessionUncheckedCreateInput) {
    return prisma.session.create({ data });
  }

  public async findSessionById(sessionId: string) {
    return prisma.session.findUnique({ where: { id: sessionId } });
  }

  public async findSessionByRefreshToken(refreshToken: string) {
    return prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
  }

  public async updateSession(sessionId: string, data: Prisma.SessionUpdateInput) {
    return prisma.session.update({ where: { id: sessionId }, data });
  }

  public async revokeSessions(sessionIds: string[]) {
    return prisma.session.updateMany({
      where: { id: { in: sessionIds } },
      data: { isRevoked: true },
    });
  }

  public async revokeOtherSessions(userId: string, currentSessionId: string) {
    return prisma.session.updateMany({
      where: { userId, isRevoked: false, id: { not: currentSessionId } },
      data: { isRevoked: true },
    });
  }

  // [OTP & VERIFICATION]
  public async findLatestOtp(email: string, type: OtpType) {
    return prisma.otp.findFirst({
      where: { email, type },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findValidOtp(email: string, code: string, type: OtpType) {
    return prisma.otp.findFirst({
      where: { email, code, type, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async createOtp(data: Prisma.OtpUncheckedCreateInput) {
    return prisma.otp.create({ data });
  }

  public async verifyAccountTransaction(otpId: string, email: string) {
    return prisma.$transaction([
      prisma.otp.update({ where: { id: otpId }, data: { isUsed: true } }),
      prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
      }),
    ]);
  }

  public async resetPasswordTransaction(otpId: string, userId: string, hashedPassword: string) {
    return prisma.$transaction([
      prisma.otp.update({ where: { id: otpId }, data: { isUsed: true } }),
      prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } }),
      prisma.session.updateMany({ where: { userId, isRevoked: false }, data: { isRevoked: true } }),
    ]);
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
