import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { successResponse } from '@/common/utils/responses/api-response';
import { MESSAGES } from '@/constants/messages';
import { RegisterDTO, LoginDTO } from './auth.schema';

export class AuthController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (req: Request, res: Response) => {
    const payload = req.body as RegisterDTO;

    const data = await this.authService.register(payload);

    successResponse(res, {
      statusCode: 201,
      message: MESSAGES.AUTH.SUCCESS.REGISTER,
      data,
    });
  };

  public login = async (req: Request, res: Response) => {
    const payload = req.body as LoginDTO;

    const data = await this.authService.login(payload);

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.AUTH.SUCCESS.LOGIN,
      data,
    });
  };
}
