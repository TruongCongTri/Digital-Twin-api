import { AssetRepository } from './asset.repository';
import {
  CreateAssetDTO,
  GetAssetsQueryDTO,
  UpdateAssetDTO,
  UpdateAssetStatusDTO,
} from './asset.schema';
import { AppError } from '@/common/errors/app.error';
import { ERROR_CODES } from '@/constants/error-codes';
import { MESSAGES } from '@/constants/messages';
import { RESOURCES } from '@/constants/resources';
import { PaginationMetaDto } from '@/data/dtos/pagination.dto';
import fs from 'fs';
import path from 'path';

/**
 * @class AssetService
 * @description Orchestrates business logic, verifies entity existence before mutations,
 * and constructs standardized pagination metadata for the client layer.
 */
export class AssetService {
  private readonly assetRepository: AssetRepository;

  constructor() {
    this.assetRepository = new AssetRepository();
  }

  public async uploadAsset(userId: string, file: Express.Multer.File, dto: CreateAssetDTO) {
    // 1. Validate File Existence
    if (!file) {
      throw new AppError(
        400,
        MESSAGES.COMMON.ERROR.NO_FILE_UPLOADED,
        ERROR_CODES.COMMON.INVALID_INPUT
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const isShapeExt = ['.rvt', '.ifc', '.zip'].includes(ext);
    const isDataExt = ['.xlsx', '.csv'].includes(ext);

    // Cross-validate file extension with intended fileType
    if (dto.fileType === 'SHAPE' && !isShapeExt) {
      this.removeFileFromDisk(file.filename);
      throw new AppError(
        400,
        MESSAGES.ASSET.ERROR.INVALID_SHAPE_EXT,
        ERROR_CODES.COMMON.INVALID_INPUT
      );
    }
    if ((dto.fileType === 'ATTRIBUTE' || dto.fileType === 'POINT') && !isDataExt) {
      this.removeFileFromDisk(file.filename);
      throw new AppError(
        400,
        MESSAGES.ASSET.ERROR.INVALID_DATA_EXT,
        ERROR_CODES.COMMON.INVALID_INPUT
      );
    }

    // 2. Validate Binding Rules
    if (dto.fileType === 'ATTRIBUTE') {
      if (!dto.bindToShapeId) {
        // If it's an attribute file, we must delete the orphaned file from disk before throwing
        this.removeFileFromDisk(file.filename);
        throw new AppError(
          400,
          MESSAGES.ASSET.ERROR.MISSING_BIND_ID,
          ERROR_CODES.COMMON.INVALID_INPUT
        );
      }

      const parentShape = await this.assetRepository.findById(dto.bindToShapeId);
      if (!parentShape || parentShape.fileType !== 'SHAPE') {
        this.removeFileFromDisk(file.filename);
        throw new AppError(
          400,
          MESSAGES.ASSET.ERROR.INVALID_BIND_TARGET,
          ERROR_CODES.COMMON.INVALID_INPUT
        );
      }
    }

    // 3. Parse Metadata (Point Data Configs)
    let parsedMetadata = null;
    if (dto.metadata) {
      parsedMetadata = JSON.parse(dto.metadata);
    }

    // 4. Save to Database
    const newAsset = await this.assetRepository.createAsset({
      ownerId: userId,
      name: dto.name,
      description: dto.description ?? null,
      fileType: dto.fileType,
      fileUrl: `/uploads/${file.filename}`, // Mock S3 path for now
      metadata: parsedMetadata ?? null,
      bindToShapeId: dto.bindToShapeId ?? null,
      status: 'PENDING', // Awaiting Admin QA/QC
    });

    return newAsset;
  }

  public async getAssets(query: GetAssetsQueryDTO, userId: string, role: string) {
    const { total, data } = await this.assetRepository.findAssets(query, userId, role);
    const meta = PaginationMetaDto.create(query.page, query.limit, total);
    return { data, meta };
  }

  public async getAssetDetail(id: string) {
    const asset = await this.assetRepository.findById(id);
    if (!asset)
      throw new AppError(
        404,
        MESSAGES.COMMON.ERROR.NOT_FOUND(RESOURCES.ASSET),
        ERROR_CODES.COMMON.RECORD_NOT_FOUND
      );
    return asset;
  }

  public async updateStatus(id: string, payload: UpdateAssetStatusDTO) {
    await this.getAssetDetail(id);
    return await this.assetRepository.updateStatus(id, payload.status as any);
  }

  public async updateAsset(id: string, userId: string, role: string, payload: UpdateAssetDTO) {
    const asset = await this.getAssetDetail(id);

    // Ownership check
    if (role !== 'ADMIN' && asset.ownerId !== userId) {
      throw new AppError(
        403,
        MESSAGES.MIDDLEWARE.FORBIDDEN_OWNERSHIP,
        ERROR_CODES.COMMON.FORBIDDEN_OWNERSHIP
      );
    }

    return await this.assetRepository.update(id, payload); // Uses base repository update
  }

  public async deleteAsset(id: string, userId: string, role: string) {
    const asset = await this.getAssetDetail(id);

    // Ownership check
    if (role !== 'ADMIN' && asset.ownerId !== userId) {
      throw new AppError(
        403,
        MESSAGES.MIDDLEWARE.FORBIDDEN_OWNERSHIP,
        ERROR_CODES.COMMON.FORBIDDEN_OWNERSHIP
      );
    }

    // 1. Remove from local disk (or S3)
    const filename = asset.fileUrl.split('/').pop();
    if (filename) this.removeFileFromDisk(filename);

    // 2. Remove from DB
    await this.assetRepository.delete(id);
    return true;
  }

  // --- Helper ---
  private removeFileFromDisk(filename: string) {
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
