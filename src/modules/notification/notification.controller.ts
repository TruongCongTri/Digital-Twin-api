import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { successResponse } from '@/common/utils/responses/api-response';

export class NotificationController {
  private readonly notiService = new NotificationService();

  constructor() {
    this.notiService = new NotificationService();
  }

  public getMyNotifications = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const data = await this.notiService.getUserNotifications(userId);
    successResponse(res, { statusCode: 200, message: 'Notifications fetched', data });
  };

  public markAsRead = async (req: Request, res: Response) => {
    const notificationId = req.params.id as string;
    const userId = (req as any).user.id;

    await this.notiService.markAsRead(notificationId, userId);
    successResponse(res, { statusCode: 200, message: 'Notification marked as read' });
  };

  public markAllAsRead = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    await this.notiService.markAllAsRead(userId);
    successResponse(res, { statusCode: 200, message: 'All notifications marked as read' });
  };
}
