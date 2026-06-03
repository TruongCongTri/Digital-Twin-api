import { Router } from 'express';
import { AssetController } from './asset.controller';
import { validate } from '@/middlewares/validate.middleware';
import { verifyToken, requireRole } from '@/middlewares/auth.middleware';
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

  /**
   * Init Route with Dependency Injection (DI)
   */
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

    // 2. Get all Assets (Users see their own, Admins see all)
    this.router.get(
      ENDPOINTS.BASE.BASE,
      verifyToken,
      validate(getAssetsQuerySchema),
      this.assetController.getAssets
    );

    // 3. Get Asset Detail
    this.router.get(
      ENDPOINTS.ASSET.GET_BY_ID,
      verifyToken,
      validate(getIDSchema),
      this.assetController.getAssetDetail
    );

    // 4. Admin QA/QC: Approve or Reject
    this.router.patch(
      ENDPOINTS.ASSET.UPDATE_STATUS,
      verifyToken,
      requireRole(['ADMIN']),
      validate(getIDSchema),
      validate(updateAssetStatusSchema),
      this.assetController.updateStatus
    );

    this.router.patch(
      ENDPOINTS.ASSET.GET_BY_ID,
      verifyToken,
      validate(getIDSchema),
      validate(updateAssetSchema),
      this.assetController.updateAsset
    );

    // 5. Delete Asset (Owner or Admin)
    this.router.delete(
      ENDPOINTS.ASSET.GET_BY_ID,
      verifyToken,
      // requireOwnership(), // Assumes req.params.id is the asset ID. (See note below)
      validate(getIDSchema),
      this.assetController.deleteAsset
    );
  }
}

// Export default instance of Route to be used in main route configuration
export default new AssetRoute().router;
