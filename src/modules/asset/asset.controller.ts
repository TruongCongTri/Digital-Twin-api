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
 * Note: Background ArcGIS syncing is now triggered automatically during upload.
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

    // This creates the record and auto-triggers the ArcGIS Sync Background Job
    const data = await this.assetService.uploadAsset(userId, file, payload);

    successResponse(res, {
      statusCode: 201,
      message: MESSAGES.ASSET.SUCCESS.UPLOADED,
      data,
    });
  };

  public getAssets = async (req: Request, res: Response) => {
    const query = req.query as unknown as GetAssetsQueryDTO;
    // Safely extract user info (will be undefined for Guests)
    const user = (req as any).user;

    // Pass undefined userId/role if it's a guest
    const { data, meta } = await this.assetService.getAssets(query, user?.id, user?.role);

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.ASSET),
      data,
      meta,
    });
  };

  // public getPublicAssets = async (req: Request, res: Response) => {
  //   const query = req.query as unknown as GetAssetsQueryDTO;

  //   const { data, meta } = await this.assetService.getPublicAssets(query);

  //   successResponse(res, {
  //     statusCode: 200,
  //     message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.ASSET),
  //     data,
  //     meta,
  //   });
  // };

  public getAssetDetail = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    // Safely extract user info (might be undefined if called via a public route without a token)
    const user = (req as any).user;

    // Pass the user ID and role down to the service for privacy checks
    const data = await this.assetService.getAssetDetail(id, user?.id, user?.role);

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

    // Extract the admin's details from the token payload
    const { id: adminId, role } = (req as any).user;
    const payload = req.body as UpdateAssetStatusDTO;

    // Pass everything down to the service
    const data = await this.assetService.updateStatus(id, adminId, role, payload);

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

  // Add this inside AssetController
  public getMapAssets = async (req: Request, res: Response) => {
    // Extract query and user
    const query = req.query as unknown as GetAssetsQueryDTO;
    const user = (req as any).user;

    // Pass query down!
    const data = await this.assetService.getMapAssets(query, user?.id, user?.role);

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.ASSET),
      data,
    });
  };
}
