import { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { successResponse } from '@/common/utils/responses/api-response';
import { AppError } from '@/common/errors/app.error';
import { MESSAGES } from '@/constants/messages';
import { ERROR_CODES } from '@/constants/error-codes';
import {
  ChangePasswordDTO,
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
  SendVerifyEmailDTO,
  VerifyEmailDTO,
} from './auth.schema';

// Helper to ensure Cookie Options are consistent across Login/Logout/Refresh
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/', // Ensure cookie is valid across the whole domain
});

export class AuthController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as RegisterDTO;
    const user = await this.authService.register(payload);

    successResponse(res, {
      statusCode: 201,
      message: MESSAGES.AUTH.SUCCESS.REGISTER,
      data: user,
    });
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as LoginDTO;

    const clientMeta = {
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    const result = await this.authService.login(payload, clientMeta);

    const cookieOptions: any = getCookieOptions();

    if (result.rememberMe) {
      cookieOptions.maxAge = result.expiresAt.getTime() - Date.now();
    }

    res.cookie('refreshToken', result.refreshToken, cookieOptions);

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.AUTH.SUCCESS.LOGIN,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
      throw new AppError(
        401,
        MESSAGES.AUTH.ERROR.MISSING_COOKIE_TOKEN,
        ERROR_CODES.AUTH.MISSING_COOKIE_TOKEN
      );

    try {
      const result = await this.authService.refreshToken({ refreshToken });
      const cookieOptions: any = getCookieOptions();

      if (result.rememberMe) {
        cookieOptions.maxAge = result.expiresAt.getTime() - Date.now();
      }

      res.cookie('refreshToken', result.refreshToken, cookieOptions);

      successResponse(res, {
        statusCode: 200,
        message: MESSAGES.AUTH.SUCCESS.REFRESH_TOKEN,
        data: { accessToken: result.accessToken },
      });
    } catch (error) {
      res.clearCookie('refreshToken', getCookieOptions());
      next(error);
    }
  };

  public getSessions = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user!.id;
    const sessions = await this.authService.getActiveSessions(userId);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.AUTH.SUCCESS.GET_SESSIONS,
      data: sessions,
    });
  };

  public revokeSession = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user!.id;
    const sessionId = req.params.sessionId as string;

    await this.authService.revokeDeviceSession(userId, sessionId);
    successResponse(res, { statusCode: 200, message: MESSAGES.AUTH.SUCCESS.REVOKE_SESSION });
  };

  public revokeOtherSessions = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user!.id;
    const currentSessionId = (req as any).user!.sessionId;

    await this.authService.revokeOtherSessions(userId, currentSessionId);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.AUTH.SUCCESS.REVOKE_OTHER_SESSIONS,
    });
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    const sessionId = (req as any).user?.sessionId;

    if (!sessionId)
      throw new AppError(
        401,
        MESSAGES.AUTH.ERROR.INVALID_SESSION,
        ERROR_CODES.AUTH.INVALID_SESSION
      );

    await this.authService.logout(sessionId);

    res.clearCookie('refreshToken', getCookieOptions());

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.AUTH.SUCCESS.LOGOUT,
    });
  };

  public sendVerifyOTP = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as SendVerifyEmailDTO;
    await this.authService.sendVerifyOTP(payload);
    successResponse(res, { statusCode: 200, message: MESSAGES.AUTH.SUCCESS.OTP_SENT });
  };

  public verifyOTP = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as VerifyEmailDTO;
    await this.authService.verifyOTP(payload);
    successResponse(res, { statusCode: 200, message: MESSAGES.AUTH.SUCCESS.OTP_VERIFIED });
  };

  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as ForgotPasswordDTO;
    await this.authService.forgotPassword(payload);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.AUTH.SUCCESS.FORGOT_PASSWORD_SENT,
    });
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as ResetPasswordDTO;
    await this.authService.resetPassword(payload);

    res.clearCookie('refreshToken', getCookieOptions());

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.AUTH.SUCCESS.RESET_PASSWORD,
    });
  };

  public changePassword = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user!.id;
    const payload = req.body as ChangePasswordDTO;
    await this.authService.changePassword(userId, payload);

    successResponse(res, { statusCode: 200, message: MESSAGES.AUTH.SUCCESS.CHANGE_PASSWORD });
  };
}
