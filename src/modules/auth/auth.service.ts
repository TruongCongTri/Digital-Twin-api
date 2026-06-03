import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '@/common/configs/env';
import { JwtUtil } from '@/common/utils/auth/jwt.util';
import { AuthRepository } from './auth.repository';
import { AppError } from '@/common/errors/app.error';
// import { notificationService } from '@/common/services/notification.service';

import {
  RegisterDTO,
  LoginDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  RefreshTokenDTO,
  ChangePasswordDTO,
} from './auth.schema';
import { ERROR_CODES } from '@/constants/error-codes';
import { MESSAGES } from '@/constants/messages';
import { RESOURCES } from '@/constants/resources';
import { APP_CONFIG, OtpChannel } from '@/constants/app.constant';

export class AuthService {
  private readonly authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async register(data: RegisterDTO) {
    const { email, password, fullName } = data;

    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser)
      throw new AppError(
        409,
        MESSAGES.COMMON.ERROR.ALREADY_EXISTS(RESOURCES.EMAIL),
        ERROR_CODES.AUTH.EMAIL_EXISTS
      );

    const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    return await this.authRepository.createUser({
      email,
      password: hashedPassword,
      fullName,
      role: 'USER',
      accountStatus: 'PENDING', // Forces Admin QA/QC Flow
      isEmailVerified: false,
    });
  }

  async login(data: LoginDTO, clientMeta: { ipAddress: string; userAgent: string }) {
    const { email, password, deviceId, rememberMe } = data;

    const user = await this.authRepository.findByEmail(email);

    if (!user || !user.password)
      throw new AppError(
        401,
        MESSAGES.AUTH.ERROR.INVALID_CREDENTIALS,
        ERROR_CODES.AUTH.INVALID_CREDENTIALS
      );

    // 1. Check QA/QC Approval Status
    if (user.accountStatus === 'PENDING') {
      throw new AppError(
        403,
        'Your account is pending admin approval.',
        ERROR_CODES.COMMON.FORBIDDEN
      );
    }
    if (user.accountStatus === 'REJECTED') {
      throw new AppError(
        403,
        'Your account application was rejected.',
        ERROR_CODES.COMMON.FORBIDDEN
      );
    }

    // 2. Check Lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        403,
        MESSAGES.AUTH.ERROR.ACCOUNT_LOCKED(lockMinutes),
        ERROR_CODES.AUTH.ACCOUNT_LOCKED
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const maxAttempts = APP_CONFIG.AUTH.MAX_FAILED_LOGIN_ATTEMPTS;
      const lockedUntil =
        attempts >= maxAttempts
          ? new Date(Date.now() + APP_CONFIG.AUTH.LOCKOUT_DURATION_MINUTES * 60000)
          : null;

      await this.authRepository.updateUserLoginAttempts(user.id, attempts, lockedUntil);
      throw new AppError(
        401,
        MESSAGES.AUTH.ERROR.WRONG_PASSWORD(maxAttempts - attempts),
        ERROR_CODES.AUTH.INVALID_CREDENTIALS
      );
    }

    if (user.failedLoginAttempts > 0) {
      await this.authRepository.updateUserLoginAttempts(user.id, 0, null);
    }

    // 3. Soft Limit Device Control
    const activeSessions = await this.authRepository.findActiveSessionsForLogin(user.id);
    if (activeSessions.length >= APP_CONFIG.AUTH.MAX_DEVICES_PER_USER) {
      const numToRevoke = activeSessions.length - APP_CONFIG.AUTH.MAX_DEVICES_PER_USER + 1;
      const sessionIdsToRevoke = activeSessions.slice(0, numToRevoke).map((s) => s.id);
      await this.authRepository.revokeSessions(sessionIdsToRevoke);
    }

    // 4. Issue Tokens
    const refreshToken = JwtUtil.generateRefreshToken({
      id: user.id,
      jti: crypto.randomUUID(),
    });
    const expiresInDays = rememberMe
      ? APP_CONFIG.AUTH.REMEMBER_ME_EXPIRES_IN_DAYS
      : APP_CONFIG.AUTH.SESSION_EXPIRES_IN_DAYS;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const session = await this.authRepository.createSession({
      userId: user.id,
      refreshToken,
      expiresAt,
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
      deviceId: deviceId || 'unknown',
    });

    const accessToken = JwtUtil.generateAccessToken({
      id: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      accessToken,
      refreshToken,
      rememberMe,
      expiresAt,
    };
  }

  async refreshToken(dto: RefreshTokenDTO) {
    const session = await this.authRepository.findSessionByRefreshToken(dto.refreshToken);

    if (!session || session.isRevoked || new Date() > session.expiresAt)
      throw new AppError(
        401,
        MESSAGES.AUTH.ERROR.INVALID_SESSION,
        ERROR_CODES.AUTH.INVALID_SESSION
      );

    if (session.user.accountStatus !== 'APPROVED')
      throw new AppError(403, 'Account no longer approved.', ERROR_CODES.COMMON.FORBIDDEN);

    const lifespanInDays = Math.round(
      (session.expiresAt.getTime() - session.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isRememberMe = lifespanInDays > APP_CONFIG.AUTH.SESSION_EXPIRES_IN_DAYS;
    const newExpiresInDays = isRememberMe
      ? APP_CONFIG.AUTH.REMEMBER_ME_EXPIRES_IN_DAYS
      : APP_CONFIG.AUTH.SESSION_EXPIRES_IN_DAYS;
    const newExpiresAt = new Date(Date.now() + newExpiresInDays * 24 * 60 * 60 * 1000);

    const newRefreshToken = JwtUtil.generateRefreshToken({
      id: session.user.id,
      jti: crypto.randomUUID(),
    });
    const newAccessToken = JwtUtil.generateAccessToken({
      id: session.user.id,
      role: session.user.role,
      sessionId: session.id,
    });

    await this.authRepository.updateSession(session.id, {
      refreshToken: newRefreshToken,
      lastActive: new Date(),
      expiresAt: newExpiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      rememberMe: isRememberMe,
      expiresAt: newExpiresAt,
    };
  }

  async getActiveSessions(userId: string) {
    return await this.authRepository.findDeviceSessions(userId);
  }

  async revokeDeviceSession(userId: string, sessionId: string) {
    const session = await this.authRepository.findSessionById(sessionId);
    if (!session || session.userId !== userId)
      throw new AppError(
        404,
        MESSAGES.COMMON.ERROR.NOT_FOUND(RESOURCES.SESSION),
        ERROR_CODES.AUTH.SESSION_NOT_FOUND
      );
    return await this.authRepository.revokeSessions([sessionId]);
  }

  async revokeOtherSessions(userId: string, currentSessionId: string) {
    return await this.authRepository.revokeOtherSessions(userId, currentSessionId);
  }

  async logout(sessionId: string) {
    return await this.authRepository.revokeSessions([sessionId]);
  }

  // [OTP METHODS]
  async sendVerifyOTP(data: { identifier: string; channel: OtpChannel }) {
    const { identifier } = data;
    const user = await this.authRepository.findByEmail(identifier);
    if (!user)
      throw new AppError(
        404,
        MESSAGES.COMMON.ERROR.NOT_FOUND(RESOURCES.USER),
        ERROR_CODES.AUTH.USER_NOT_FOUND
      );
    if (user.isEmailVerified)
      throw new AppError(
        400,
        MESSAGES.AUTH.ERROR.EMAIL_ALREADY_VERIFIED,
        ERROR_CODES.AUTH.EMAIL_ALREADY_VERIFIED
      );

    const lastOtp = await this.authRepository.findLatestOtp(identifier, 'VERIFY_ACCOUNT');
    if (
      lastOtp &&
      Date.now() - lastOtp.createdAt.getTime() < APP_CONFIG.AUTH.OTP_COOLDOWN_SECONDS * 1000
    ) {
      throw new AppError(
        429,
        MESSAGES.AUTH.ERROR.OTP_COOLDOWN(APP_CONFIG.AUTH.OTP_COOLDOWN_SECONDS),
        ERROR_CODES.AUTH.OTP_COOLDOWN
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.authRepository.createOtp({
      email: identifier,
      code: otpCode,
      type: 'VERIFY_ACCOUNT',
      expiresAt: new Date(Date.now() + APP_CONFIG.AUTH.OTP_VERIFY_EXPIRATION_MINUTES * 60 * 1000),
    });

    console.log(`[MOCK EMAIL] OTP for ${identifier} is: ${otpCode}`);
    // await notificationService.sendEmailOTP(identifier, otpCode);
    return true;
  }

  async verifyOTP(data: { identifier: string; code: string; channel: OtpChannel }) {
    const otpRecord = await this.authRepository.findValidOtp(
      data.identifier,
      data.code,
      'VERIFY_ACCOUNT'
    );
    if (!otpRecord)
      throw new AppError(400, MESSAGES.AUTH.ERROR.INVALID_OTP, ERROR_CODES.AUTH.INVALID_OTP);
    if (new Date() > otpRecord.expiresAt)
      throw new AppError(400, MESSAGES.AUTH.ERROR.EXPIRED_OTP, ERROR_CODES.AUTH.EXPIRED_OTP);

    return await this.authRepository.verifyAccountTransaction(otpRecord.id, data.identifier);
  }

  // [PASSWORD RECOVERY]
  async forgotPassword(dto: ForgotPasswordDTO) {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) return true; // Security best practice: Don't reveal if email exists

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.authRepository.createOtp({
      email: dto.email,
      code: otpCode,
      type: 'FORGOT_PASSWORD',
      expiresAt: new Date(Date.now() + APP_CONFIG.AUTH.OTP_FORGOT_EXPIRATION_MINUTES * 60 * 1000),
    });

    console.log(`[MOCK EMAIL] Password Reset OTP for ${dto.email} is: ${otpCode}`);
    return true;
  }

  async resetPassword(dto: ResetPasswordDTO) {
    const otpRecord = await this.authRepository.findValidOtp(
      dto.email,
      dto.code,
      'FORGOT_PASSWORD'
    );
    if (!otpRecord)
      throw new AppError(400, MESSAGES.AUTH.ERROR.INVALID_OTP, ERROR_CODES.AUTH.INVALID_OTP);
    if (new Date() > otpRecord.expiresAt)
      throw new AppError(400, MESSAGES.AUTH.ERROR.EXPIRED_OTP, ERROR_CODES.AUTH.EXPIRED_OTP);

    const user = await this.authRepository.findByEmail(dto.email);
    if (!user)
      throw new AppError(
        404,
        MESSAGES.COMMON.ERROR.NOT_FOUND(RESOURCES.USER),
        ERROR_CODES.AUTH.USER_NOT_FOUND
      );

    const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    return await this.authRepository.resetPasswordTransaction(
      otpRecord.id,
      user.id,
      hashedPassword
    );
  }

  async changePassword(userId: string, dto: ChangePasswordDTO) {
    const user = await this.authRepository.findById(userId);
    if (!user)
      throw new AppError(
        404,
        MESSAGES.COMMON.ERROR.NOT_FOUND(RESOURCES.USER),
        ERROR_CODES.AUTH.USER_NOT_FOUND
      );

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password!);
    if (!isMatch)
      throw new AppError(
        400,
        MESSAGES.AUTH.ERROR.WRONG_CURRENT_PASSWORD,
        ERROR_CODES.AUTH.WRONG_CURRENT_PASSWORD
      );

    const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    return await this.authRepository.updatePassword(userId, hashedPassword);
  }
}
