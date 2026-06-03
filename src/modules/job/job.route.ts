import { Router } from 'express';
import { JobController } from './job.controller';
import { validate } from '@/middlewares/validate.middleware';
import { verifyToken, requireRole } from '@/middlewares/auth.middleware';
import { getIDSchema } from '@/common/schemas/reusable.schema';

/**
 * @class JobRoute
 * @description Registers endpoints for background processing tasks.
 */
export class JobRoute {
  public router: Router;
  private readonly jobController: JobController;

  constructor(controller?: JobController) {
    this.router = Router();
    this.jobController = controller || new JobController();

    this.initializeRoutes();
  }

  private initializeRoutes() {
    // [POST] TRIGGER PUBLISH JOB (Only Admins can publish to ArcGIS)
    this.router.post(
      '/publish/:id', // Using :id to reuse getIDSchema validation
      verifyToken,
      requireRole(['ADMIN']),
      validate(getIDSchema),
      this.jobController.triggerPublish
    );

    // [GET] POLL JOB STATUS (Both users and admins can check progress)
    this.router.get(
      '/publish/:id',
      verifyToken,
      validate(getIDSchema),
      this.jobController.getStatus
    );
  }
}

export default new JobRoute().router;
