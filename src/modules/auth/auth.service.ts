import { AuthRepository } from './auth.repository';
import { RegisterDTO, LoginDTO } from './auth.schema';
import { AppError } from '@/common/errors/app.error';
import { MESSAGES } from '@/constants/messages';
import { ERROR_CODES } from '@/constants/error-codes';
import { PasswordUtil } from '@/common/utils/auth/password.util';
import { JwtUtil } from '@/common/utils/auth/jwt.util';
import { RESOURCES } from '@/constants/resources';

export class AuthService {
  private readonly authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  public async register(data: RegisterDTO) {
    // 1. Check if email already exists
    const existingUser = await this.authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(
        409,
        MESSAGES.COMMON.ERROR.ALREADY_EXISTS(RESOURCES.EMAIL),
        ERROR_CODES.AUTH.EMAIL_EXISTS
      );
    }

    // 2. Hash Password
    const hashedPassword = await PasswordUtil.hashIfNeeded(data.password);

    // 3. Create user with PENDING status
    const newUser = await this.authRepository.createPendingUser(data, hashedPassword);

    // Exclude password from the return object
    const { password: _password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  public async login(data: LoginDTO) {
    // 1. Find User
    const user = await this.authRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(
        401,
        MESSAGES.AUTH.ERROR.INVALID_CREDENTIALS,
        ERROR_CODES.AUTH.INVALID_CREDENTIALS
      );
    }

    // 2. Verify Password
    const isPasswordValid = await PasswordUtil.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        401,
        MESSAGES.AUTH.ERROR.INVALID_CREDENTIALS,
        ERROR_CODES.AUTH.INVALID_CREDENTIALS
      );
    }

    // 3. QA/QC Flow: Ensure Account is Approved
    if (user.accountStatus === 'PENDING') {
      throw new AppError(403, MESSAGES.AUTH.ERROR.ACCOUNT_PENDING, ERROR_CODES.COMMON.FORBIDDEN);
    }
    if (user.accountStatus === 'REJECTED') {
      throw new AppError(403, MESSAGES.AUTH.ERROR.ACCOUNT_REJECTED, ERROR_CODES.COMMON.FORBIDDEN);
    }

    // 4. Generate Tokens
    const payload = { id: user.id, role: user.role };
    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken({ id: user.id });

    const { password: _password, ...userProfile } = user;

    return {
      user: userProfile,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }
}
