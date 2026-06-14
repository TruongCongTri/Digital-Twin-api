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

  // --- UPDATE 1: findAssets ---
  public async findAssets(query: GetAssetsQueryDTO, userId?: string, role?: string) {
    const where: Prisma.AssetWhereInput = {};

    // --- 1. BASE VISIBILITY RULES ---
    if (role === 'ADMIN') {
      // Admins see everything.
    } else if (role === 'USER' && userId) {
      where.OR = [{ ownerId: userId }, { status: 'APPROVED' }];
    } else {
      where.status = 'APPROVED';
    }

    // --- 2. APPLY FILTERS ---
    if (query.fileType) where.fileType = query.fileType;
    if (query.syncStatus) where.syncStatus = query.syncStatus;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    // --- 3. APPLY EXPLICIT STATUS, OWNERSHIP, & SPECIFIC USER FILTERS ---
    if (query.own === 'true' && userId) {
      where.ownerId = userId;
      delete where.OR;
      if (query.status) where.status = query.status;
    } else if (query.ownerId) {
      // NEW: Explicitly searching for a specific user's assets
      where.ownerId = query.ownerId;
      delete where.OR; // Remove the broad community OR condition

      // Privacy Check: Is the requester an Admin, OR are they searching for their own ID?
      if (role === 'ADMIN' || (userId && query.ownerId === userId)) {
        if (query.status) where.status = query.status;
      } else {
        // Standard users/guests viewing someone else's assets can ONLY see APPROVED assets
        where.status = 'APPROVED';
      }
    } else if (query.status) {
      // Legacy status filtering when not locked to a specific owner
      if (role === 'ADMIN') {
        where.status = query.status;
      } else if (role === 'USER' && userId) {
        if (query.status === 'APPROVED') {
          where.status = 'APPROVED';
          delete where.OR;
        } else {
          where.status = query.status;
          where.ownerId = userId;
          delete where.OR;
        }
      } else {
        where.status = 'APPROVED';
      }
    }

    return await this.executePagination<Asset>({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        owner: { select: { fullName: true, email: true } },
        parentShape: { select: { name: true } },
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
   * @description Fetch a single asset with essential relations
   */
  public async getAssetById(id: string) {
    return await prisma.asset.findUnique({
      where: { id },
      include: {
        owner: { select: { fullName: true, email: true } },
        parentShape: { select: { name: true } }, // Good for attribute files
      },
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

  /**
   * @method findMapAssets
   * @description Specialized query for the 3D Map Viewer (Max 1000 assets).
   * Case 1: Admin -> Sees Everything.
   * Case 2: User -> Sees their own assets (any status) + ALL APPROVED assets.
   * Case 3: Public -> Sees ONLY APPROVED assets.
   */
  public async findMapAssets(query: GetAssetsQueryDTO, userId?: string, role?: string) {
    const where: Prisma.AssetWhereInput = {};

    // --- 1. BASE VISIBILITY RULES ---
    if (role === 'ADMIN') {
      // Case 1: Admin sees everything.
    } else if (role === 'USER' && userId) {
      // Case 2: User sees their own assets OR anything that is approved
      where.OR = [{ ownerId: userId }, { status: 'APPROVED' }];
    } else {
      // Case 3: Guest sees ONLY approved
      where.status = 'APPROVED';
    }

    // --- 2. APPLY FILTERS ---
    if (query.fileType) where.fileType = query.fileType;
    if (query.syncStatus) where.syncStatus = query.syncStatus;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    // --- 3. APPLY EXPLICIT STATUS, OWNERSHIP, & SPECIFIC USER FILTERS ---
    if (query.own === 'true' && userId) {
      where.ownerId = userId;
      delete where.OR;
      if (query.status) where.status = query.status;
    } else if (query.ownerId) {
      // Searching for a specific user's assets
      where.ownerId = query.ownerId;
      delete where.OR;

      // Privacy Check: Is the requester an Admin, OR are they searching for their own ID?
      if (role === 'ADMIN' || (userId && query.ownerId === userId)) {
        if (query.status) where.status = query.status;
      } else {
        // Standard users/guests viewing someone else's map pins can ONLY see APPROVED assets
        where.status = 'APPROVED';
      }
    } else if (query.status) {
      // Standard status filtering
      if (role === 'ADMIN') {
        where.status = query.status;
      } else if (role === 'USER' && userId) {
        if (query.status === 'APPROVED') {
          where.status = 'APPROVED';
          delete where.OR;
        } else {
          where.status = query.status;
          where.ownerId = userId;
          delete where.OR;
        }
      } else {
        where.status = 'APPROVED';
      }
    }

    return await prisma.asset.findMany({
      where,
      take: 1000, // Hard limit for map performance
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { fullName: true, email: true } },
        parentShape: { select: { name: true } },
      },
    });
  }
}
