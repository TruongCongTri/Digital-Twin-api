import { Request, Response } from 'express';
import { AssetService } from './asset.service';
import { successResponse } from '@/common/utils/responses/api-response';
import { MESSAGES } from '@/constants/messages';
import { RESOURCES } from '@/constants/resources';
import {
  CreateAssetDTO,
  GetAssetsQueryDTO,
  UpdateAssetDTO,
  UpdateAssetStatusDTO,
} from './asset.schema';
import { ERROR_CODES } from '@/constants/error-codes';
import { AppError } from '@/common/errors/app.error';

/**
 * @class AssetController
 * @description Bridges the Express HTTP layer and the underlying Service logic.
 * Assumes a global async-error handler wrapper is active in the Express app.
 */
export class AssetController {
  private readonly assetService: AssetService;

  constructor() {
    this.assetService = new AssetService();
  }

  public uploadAsset = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const file = req.file;

    if (!file)
      throw new AppError(
        400,
        MESSAGES.COMMON.ERROR.NO_FILE_UPLOADED,
        ERROR_CODES.COMMON.INVALID_INPUT
      );

    const payload = req.body as CreateAssetDTO;

    const data = await this.assetService.uploadAsset(userId, file, payload);

    successResponse(res, {
      statusCode: 201,
      message: MESSAGES.ASSET.SUCCESS.UPLOADED,
      data,
    });
  };

  public getAssets = async (req: Request, res: Response) => {
    const query = req.query as unknown as GetAssetsQueryDTO;
    const { id: userId, role } = (req as any).user;

    const { data, meta } = await this.assetService.getAssets(query, userId, role);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.ASSET),
      data,
      meta,
    });
  };

  public getAssetDetail = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.assetService.getAssetDetail(id);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.ASSET),
      data,
    });
  };

  public updateAsset = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { id: userId, role } = (req as any).user;
    const payload = req.body as UpdateAssetDTO;

    const data = await this.assetService.updateAsset(id, userId, role, payload);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.UPDATED(RESOURCES.ASSET),
      data,
    });
  };

  public updateStatus = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const payload = req.body as UpdateAssetStatusDTO;
    const data = await this.assetService.updateStatus(id, payload);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.UPDATED(RESOURCES.ASSET),
      data,
    });
  };

  public deleteAsset = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { id: userId, role } = (req as any).user;

    await this.assetService.deleteAsset(id, userId, role);
    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.DELETED(RESOURCES.ASSET),
    });
  };
}
