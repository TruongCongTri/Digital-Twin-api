import { Request, Response } from 'express';
import { UserService } from './user.service';
import { successResponse } from '@/common/utils/responses/api-response';
import { MESSAGES } from '@/constants/messages';
import { RESOURCES } from '@/constants/resources';
import {
  GetApplicantsQueryDTO,
  GetUsersQueryDTO,
  UpdateProfileDTO,
  UpdateUserRoleDTO,
  UpdateUserStatusDTO,
} from '@/modules/user/user.schema';

export class UserController {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // --- ADMIN CONTROLLERS ---

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

  public getAllUsers = async (req: Request, res: Response) => {
    const query = req.query as unknown as GetUsersQueryDTO;
    const { data, meta } = await this.userService.getAllUsers(query);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.USER),
      data,
      meta,
    });
  };

  public getUserById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.userService.getProfile(id);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.USER),
      data,
    });
  };

  public updateStatus = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.userService.updateStatus(id, req.body as UpdateUserStatusDTO);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.UPDATED(RESOURCES.USER),
      data,
    });
  };

  public updateRole = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.userService.updateRole(id, req.body as UpdateUserRoleDTO);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.UPDATED(RESOURCES.USER),
      data,
    });
  };

  public deleteUser = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.userService.deleteUser(id);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.DELETED(RESOURCES.USER),
    });
  };

  // --- USER CONTROLLERS ---

  public getMyProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const data = await this.userService.getProfile(userId);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.USER),
      data,
    });
  };

  public updateMyProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const data = await this.userService.updateProfile(userId, req.body as UpdateProfileDTO);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.UPDATED(RESOURCES.USER),
      data,
    });
  };
}
