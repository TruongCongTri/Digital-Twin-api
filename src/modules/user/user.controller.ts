import { Request, Response } from 'express';
import { UserService } from './user.service';
import { successResponse } from '@/common/utils/responses/api-response';
import { MESSAGES } from '@/constants/messages';
import { RESOURCES } from '@/constants/resources';
import { GetApplicantsQueryDTO, UpdateUserStatusDTO } from './user.schema';

export class UserController {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public getApplicants = async (req: Request, res: Response) => {
    const query = req.query as unknown as GetApplicantsQueryDTO;

    const { data, meta } = await this.userService.getApplicants(query);

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.USER),
      data,
      meta,
    });
  };

  public getProfile = async (req: Request, res: Response) => {
    // Assuming the authenticated user ID is attached to req.user via Auth Middleware
    // For this demo, we can also just use a route param
    const id = req.params.id || (req as any).user?.id;

    const data = await this.userService.getProfile(id);

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.USER),
      data,
    });
  };

  public updateStatus = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const payload = req.body as UpdateUserStatusDTO;

    const data = await this.userService.updateStatus(id, payload);

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.UPDATED(RESOURCES.USER),
      data,
    });
  };
}
