import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '@/common/configs/redis.config';
import { prisma } from '@/common/configs/prisma';
import { SyncStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { getIO } from '@/common/configs/socket.config';

export const ASSET_SYNC_QUEUE_NAME = 'AssetSyncQueue';
const notificationService = new NotificationService();

// Export the queue so asset.service can add jobs to it later
export const assetSyncQueue = new Queue(ASSET_SYNC_QUEUE_NAME, {
  connection: redisConnection as any,
});

export const assetSyncWorker = new Worker(
  ASSET_SYNC_QUEUE_NAME,
  async (job: Job<{ assetId: string; ownerId: string }>) => {
    const { assetId, ownerId } = job.data;
    const io = getIO();

    try {
      // 1. Mark as Processing
      await prisma.asset.update({
        where: { id: assetId },
        data: { syncStatus: SyncStatus.PROCESSING, syncProgress: 10 },
      });
      io.to(ownerId).emit('assetSyncProgress', { assetId, progress: 10, syncStatus: 'PROCESSING' });

      // 2. Simulate heavy ArcGIS processing (Validation, Upload, Publish)
      for (let i = 20; i <= 90; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        await prisma.asset.update({
          where: { id: assetId },
          data: { syncProgress: i },
        });

        await job.updateProgress(i);
        io.to(ownerId).emit('assetSyncProgress', {
          assetId,
          progress: i,
          syncStatus: 'PROCESSING',
        });
      }

      // 3. Generate Mock ArcGIS Item ID (In reality, this comes from the ArcGIS API response)
      const mockArcGisItemId = Math.random().toString(36).substring(2, 15);

      // 4. Mark as Completed & Save ArcGIS ID
      const asset = await prisma.asset.update({
        where: { id: assetId },
        data: {
          syncStatus: SyncStatus.COMPLETED,
          syncProgress: 100,
          syncError: null,
          arcgisItemId: mockArcGisItemId,
        },
      });

      // 5. Trigger Real-Time WebSocket & DB Notifications
      io.to(ownerId).emit('assetSyncCompleted', {
        assetId,
        progress: 100,
        syncStatus: 'COMPLETED',
        arcgisItemId: mockArcGisItemId,
      });

      await notificationService.sendDirectNotification({
        userId: asset.ownerId,
        title: 'ArcGIS Sync Complete',
        message: `Your asset "${asset.name}" has been successfully synced to ArcGIS.`,
        type: 'SUCCESS',
        relatedEntityId: asset.id,
      });

      console.log(`✅ AssetSyncWorker: Asset ${assetId} synced successfully.`);
    } catch (error: any) {
      // Handle Failure
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          syncStatus: SyncStatus.FAILED,
          syncError: error.message || 'Unknown error occurred during ArcGIS sync',
        },
      });

      io.to(ownerId).emit('assetSyncFailed', {
        assetId,
        progress: 0,
        syncStatus: 'FAILED',
        syncError: error.message,
      });

      throw error;
    }
  },
  { connection: redisConnection as any }
);
