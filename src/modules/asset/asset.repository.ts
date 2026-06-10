import { Asset, AssetStatus, Prisma } from '@/generated';
import { prisma } from '@/common/configs/prisma';
import { BaseRepository } from '@/common/repositories/base.repository';
import { GetAssetsQueryDTO } from './asset.schema';

/**
 * @class AssetRepository
 * @description Handles all raw database interactions, atomic transactions, and CQRS routing
 * for the Asset domain.
 */
export class AssetRepository extends BaseRepository<Asset> {
  constructor() {
    // inject Prisma client delegate for Asset model
    super('asset');
  }

  public async findAssets(query: GetAssetsQueryDTO, userId?: string, role?: string) {
    const where: Prisma.AssetWhereInput = {};

    // Standard Users can only see their own assets. Admins see all.
    if (role !== 'ADMIN' && userId) {
      where.ownerId = userId;
    }

    if (query.status) where.status = query.status;
    if (query.syncStatus) where.syncStatus = query.syncStatus;
    if (query.fileType) where.fileType = query.fileType;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return await this.executePagination<Asset>({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        owner: { select: { fullName: true, email: true } },
        parentShape: { select: { name: true } }, // Show linked shape if it's attribute data
      },
    });
  }

  /**
   * @method create
   * @description Create a new Asset record
   *
   * @param data - The validated Asset payload
   * @returns The created Asset record
   */
  public async createAsset(data: Prisma.AssetUncheckedCreateInput) {
    return await prisma.asset.create({ data });
  }

  /**
   * @method updateById
   * @description Update a Asset record by ID
   *
   * @param id - The strictly validated UUID of the Asset record
   * @param data - The partial data payload to update
   * @returns The updated Asset record
   */
  public async updateStatus(id: string, status: AssetStatus) {
    return await prisma.asset.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * @method getAssetById
   * @description Fetch a single asset
   */
  public async getAssetById(id: string) {
    return await prisma.asset.findUnique({
      where: { id },
      include: { owner: { select: { fullName: true, email: true } } },
    });
  }

  /**
   * @method deleteAsset
   * @description Delete an asset record entirely
   */
  public async deleteAsset(id: string) {
    return await prisma.asset.delete({
      where: { id },
    });
  }
}
