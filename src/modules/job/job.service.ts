import { JobRepository } from './job.repository';
import { AppError } from '@/common/errors/app.error';
import { MESSAGES } from '@/constants/messages';
import { RESOURCES } from '@/constants/resources';
import { publishQueue } from './job.worker';
import { prisma } from '@/common/configs/prisma';

/**
 * @class JobService
 * @description Orchestrates business logic for background publishing jobs.
 */
export class JobService {
  private readonly jobRepository: JobRepository;

  constructor() {
    this.jobRepository = new JobRepository();
  }

  /**
   * @description Trigger a new ArcGIS publish job for an Approved asset
   */
  public async triggerPublish(assetId: string) {
    // 1. Verify Asset exists and is eligible
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new AppError(404, MESSAGES.COMMON.ERROR.NOT_FOUND(RESOURCES.ASSET));
    if (asset.status !== 'APPROVED') {
      throw new AppError(400, 'Only APPROVED assets can be published');
    }

    // Prevent Race Conditions & Duplicate Queues
    const existingJob = await this.jobRepository.findByAssetId(assetId);
    if (existingJob && (existingJob.status === 'PENDING' || existingJob.status === 'PROCESSING')) {
      throw new AppError(409, 'This asset is already queued or processing.');
    }

    // 2. Upsert Job in DB
    const job = await this.jobRepository.upsertJob({
      assetId: assetId,
      status: 'PENDING',
      progress: 0,
    });

    // 3. Dispatch to Redis BullMQ
    await publishQueue.add(`publish-${assetId}`, { assetId });

    return job;
  }

  /**
   * @description Get the current status/progress of a job for polling
   */
  public async getStatus(assetId: string) {
    const result = await this.jobRepository.findByAssetId(assetId);

    if (!result) {
      throw new AppError(404, MESSAGES.COMMON.ERROR.NOT_FOUND(RESOURCES.JOB));
    }

    return result;
  }
}
