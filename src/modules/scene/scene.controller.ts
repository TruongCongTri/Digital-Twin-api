import { Request, Response } from 'express';
import { SceneService } from './scene.service';
import { successResponse } from '@/common/utils/responses/api-response';

/**
 * @class SceneController
 * @description Bridges the Express HTTP layer and the underlying Service logic.
 * Assumes a global async-error handler wrapper is active in the Express app.
 */
export class SceneController {
  private readonly sceneService: SceneService;

  constructor() {
    this.sceneService = new SceneService();
  }

  public createScene = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const data = await this.sceneService.createScene(userId, req.body);
    successResponse(res, { statusCode: 201, message: 'Scene saved successfully', data });
  };

  public getScenes = async (_req: Request, res: Response) => {
    const data = await this.sceneService.getAllScenes();
    successResponse(res, { statusCode: 200, message: 'Scenes fetched', data });
  };

  public deleteScene = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    await this.sceneService.deleteScene(id, userId);
    successResponse(res, { statusCode: 200, message: 'Scene deleted' });
  };

  public createAnnotation = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const data = await this.sceneService.createAnnotation(id, userId, req.body);
    successResponse(res, { statusCode: 201, message: 'Annotation dropped', data });
  };

  public getAnnotations = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.sceneService.getSceneAnnotations(id);
    successResponse(res, { statusCode: 200, message: 'Annotations fetched', data });
  };
}
