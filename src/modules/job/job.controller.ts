import { Request, Response } from 'express';
import { JobService } from './job.service';
import { successResponse } from '@/common/utils/responses/api-response';
import { MESSAGES } from '@/constants/messages';
import { RESOURCES } from '@/constants/resources';

/**
 * @class JobController
 * @description Bridges the Express HTTP layer and the Job Service logic.
 */
export class JobController {
  private readonly jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  /**
   * @description [POST] Initiates the background publishing job
   */
  public triggerPublish = async (req: Request, res: Response) => {
    const assetId = req.params.id as string;

    const data = await this.jobService.triggerPublish(assetId);

    successResponse(res, {
      statusCode: 202, // 202 Accepted is standard for queued background jobs
      message: 'Publishing job successfully queued.',
      data,
    });
  };

  /**
   * @description [GET] Fetches the progress of an active job
   */
  public getStatus = async (req: Request, res: Response) => {
    const assetId = req.params.id as string;

    const data = await this.jobService.getStatus(assetId);

    successResponse(res, {
      statusCode: 200,
      message: MESSAGES.COMMON.SUCCESS.FETCHED(RESOURCES.JOB),
      data,
    });
  };
}
