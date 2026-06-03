import { prisma } from '@/common/configs/prisma';
import { Prisma } from '@/generated/client';

export class JobRepository {
  /**
   * @description Upserts a job to ensure only one active job per asset
   */
  public async upsertJob(data: Prisma.PublishJobUncheckedCreateInput) {
    return await prisma.publishJob.upsert({
      where: { assetId: data.assetId },
      update: { status: 'PENDING', progress: 0, errorLog: null },
      create: data,
    });
  }

  /**
   * @description Fetches a job specifically by its related Asset ID
   */
  public async findByAssetId(assetId: string) {
    return await prisma.publishJob.findUnique({
      where: { assetId },
    });
  }
}
