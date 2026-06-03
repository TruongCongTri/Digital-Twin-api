import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '@/common/configs/redis.config';
import { prisma } from '@/common/configs/prisma';
import { JobStatus } from '@/generated/client'; // Fix for the Enum Error
import { NotificationService } from '../notification/notification.service';

export const PUBLISH_QUEUE_NAME = 'AssetPublishingQueue';
const notificationService = new NotificationService();

export const publishQueue = new Queue(PUBLISH_QUEUE_NAME, {
  connection: redisConnection as any, // Fix for the IORedis Type Error
});

export const publishWorker = new Worker(
  PUBLISH_QUEUE_NAME,
  async (job: Job<{ assetId: string }>) => {
    const { assetId } = job.data;

    try {
      await prisma.publishJob.update({
        where: { assetId },
        data: { status: JobStatus.PROCESSING, progress: 10 },
      });

      // Simulate heavy processing
      for (let i = 20; i <= 90; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await prisma.publishJob.update({
          where: { assetId },
          data: { progress: i },
        });
        await job.updateProgress(i);
      }

      await prisma.publishJob.update({
        where: { assetId },
        data: {
          status: JobStatus.COMPLETED,
          progress: 100,
          errorLog: null,
        },
      });

      //  Trigger Real-Time WebSocket Notification!
      const asset = await prisma.asset.findUnique({ where: { id: assetId } });
      if (asset) {
        await notificationService.sendDirectNotification({
          userId: asset.ownerId, // Or get all members of the workspace
          title: 'Publishing Complete',
          message: `Your asset "${asset.name}" has been successfully published to ArcGIS.`,
          type: 'SUCCESS',
          relatedEntityId: asset.id,
        });
      }
      console.log(`✅ Job ${job.id}: Asset ${assetId} published successfully.`);
    } catch (error: any) {
      await prisma.publishJob.update({
        where: { assetId },
        data: {
          status: JobStatus.FAILED,
          errorLog: error.message || 'Unknown error occurred',
        },
      });
      throw error;
    }
  },
  { connection: redisConnection as any } // Fix for the IORedis Type Error
);
