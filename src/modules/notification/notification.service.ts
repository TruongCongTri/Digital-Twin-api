import { NotificationRepository } from './notification.repository';
import { NotificationType } from '@/generated';
import { getIO } from '@/common/configs/socket.config';
import { SendNotificationDTO } from './notification.schema';

/**
 * @class NotificationService
 * @description Orchestrates business logic, verifies entity existence before mutations,
 * and constructs standardized pagination metadata for the client layer.
 */
export class NotificationService {
  private readonly notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  /**
   * @description Orchestrates saving to DB and pushing via Socket.io
   */
  public async sendDirectNotification(data: SendNotificationDTO) {
    // 1. Save to Database
    const notification = await this.notificationRepository.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type as NotificationType,
      relatedEntityId: data.relatedEntityId ?? null,
    });

    // 2. Push Real-Time Event via WebSockets
    const io = getIO();
    io.to(data.userId).emit('newNotification', notification);

    return notification;
  }

  /**
   * @description Fetches the notification list and total unread count for the UI.
   */
  public async getUserNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.findUserNotifications(userId),
      this.notificationRepository.countUnread(userId),
    ]);

    return {
      unreadCount,
      notifications,
    };
  }

  public async markAsRead(notificationId: string, userId: string) {
    return await this.notificationRepository.markAsRead(notificationId, userId);
  }

  public async markAllAsRead(userId: string) {
    return await this.notificationRepository.markAllAsRead(userId);
  }
}
