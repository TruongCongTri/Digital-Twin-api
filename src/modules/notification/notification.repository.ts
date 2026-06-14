import { Notification, Prisma } from '@prisma/client';
// import { prisma } from '@/common/configs/prisma';
import { BaseRepository } from '@/common/repositories/base.repository';
import { prisma } from '@/common/configs/prisma';

/**
 * @class NotificationRepository
 * @description Handles all raw database interactions, atomic transactions, and CQRS routing
 * for the ScoreEvent and PlayerScore domains.
 */
export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    // inject Prisma client delegate for Notification model
    super('notification');
  }

  /**
   * @description Creates a single notification in the database.
   */
  public async create(data: Prisma.NotificationUncheckedCreateInput) {
    return await prisma.notification.create({ data });
  }

  /**
   * @description Bulk creates notifications (Useful for broadcasting to a whole workspace).
   */
  public async createMany(data: Prisma.NotificationUncheckedCreateInput[]) {
    return await prisma.notification.createMany({ data });
  }

  /**
   * @description Fetches a user's latest 50 notifications.
   */
  public async findUserNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * @description Fetches the count of unread notifications for a badge in the UI.
   */
  public async countUnread(userId: string) {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * @description Marks a specific notification as read. Ensures the user owns it.
   */
  public async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * @description Marks all of a user's notifications as read.
   */
  public async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
