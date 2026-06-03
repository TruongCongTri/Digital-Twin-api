import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { verifyToken } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { getIDSchema } from '@/common/schemas/reusable.schema';

export class NotificationRoute {
  public router: Router;
  private readonly notiController: NotificationController;

  constructor(controller?: NotificationController) {
    this.router = Router();
    this.notiController = controller || new NotificationController();

    this.initializeRoutes();
  }

  private initializeRoutes() {
    // 1. Mark ALL as read
    this.router.patch('/read-all', verifyToken, this.notiController.markAllAsRead);

    // 2. Mark ONE as read
    this.router.patch(
      '/:id/read',
      verifyToken,
      validate(getIDSchema),
      this.notiController.markAsRead
    );

    // 3. Get my notifications
    this.router.get('/', verifyToken, this.notiController.getMyNotifications);
  }
}

export default new NotificationRoute().router;
