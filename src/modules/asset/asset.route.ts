import { Router } from 'express';
import { AssetController } from './asset.controller';
import { validate } from '@/middlewares/validate.middleware';
import { verifyToken, requireRole, optionalVerifyToken } from '@/middlewares/auth.middleware';
import { uploadAssetMiddleware } from '@/common/configs/multer.config';
import { getIDSchema } from '@/common/schemas/reusable.schema';
import {
  createAssetSchema,
  getAssetsQuerySchema,
  updateAssetSchema,
  updateAssetStatusSchema,
} from './asset.schema';
import { ENDPOINTS } from '@/constants/endpoints';

/**
 * @class AssetRoute
 * @description Registers all RESTful endpoints, injects Zod validation middlewares,
 * and maintains strict path precedence to prevent routing conflicts.
 */
export class AssetRoute {
  public router: Router;
  private readonly assetController: AssetController;

  constructor(controller?: AssetController) {
    this.router = Router();
    this.assetController = controller || new AssetController();

    this.initializeRoutes();
  }

  private initializeRoutes() {
    // 1. Upload new Asset (Requires valid token)
    this.router.post(
      ENDPOINTS.BASE.BASE, // POST /assets
      verifyToken,
      uploadAssetMiddleware.single('file'), // Form-data key must be 'file'
      validate(createAssetSchema),
      this.assetController.uploadAsset
    );

    this.router.get(
      '/map',
      optionalVerifyToken,
      validate(getAssetsQuerySchema),
      this.assetController.getMapAssets
    );

    // 2. EXTRA: Get all APPROVED assets (PUBLIC PATH)
    // MUST be declared before GET /:id so "public" isn't treated as an ID!
    // this.router.get(
    //   '/public',
    //   validate(getAssetsQuerySchema),
    //   this.assetController.getPublicAssets
    // );

    // 3. Get all Assets (Users see their own, Admins see all)
    this.router.get(
      ENDPOINTS.BASE.BASE,
      optionalVerifyToken,
      validate(getAssetsQuerySchema),
      this.assetController.getAssets
    );

    // 4. Get Asset Detail
    this.router.get(
      ENDPOINTS.ASSET.GET_BY_ID,
      optionalVerifyToken,
      validate(getIDSchema),
      this.assetController.getAssetDetail
    );

    // 5. Admin QA/QC: Approve or Reject
    this.router.patch(
      ENDPOINTS.ASSET.UPDATE_STATUS,
      verifyToken,
      requireRole(['ADMIN']),
      validate(getIDSchema),
      validate(updateAssetStatusSchema),
      this.assetController.updateStatus
    );

    // 6. Update Asset metadata
    this.router.patch(
      ENDPOINTS.ASSET.GET_BY_ID,
      verifyToken,
      validate(getIDSchema),
      validate(updateAssetSchema),
      this.assetController.updateAsset
    );

    // 7. Delete Asset (Owner or Admin)
    this.router.delete(
      ENDPOINTS.ASSET.GET_BY_ID,
      verifyToken,
      validate(getIDSchema),
      this.assetController.deleteAsset
    );
  }
}

export default new AssetRoute().router;
