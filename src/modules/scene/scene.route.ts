import { Router } from 'express';
import { SceneController } from './scene.controller';
import { validate } from '@/middlewares/validate.middleware';
import { createAnnotationSchema, createSceneSchema } from './scene.schema';
import { getIDSchema } from '@/common/schemas/reusable.schema';
import { verifyToken } from '@/middlewares/auth.middleware';

/**
 * @class SceneRoute
 * @description Registers all RESTful endpoints, injects Zod validation middlewares,
 * and maintains strict path precedence to prevent routing conflicts.
 */
export class SceneRoute {
  public router: Router;
  private readonly sceneController: SceneController;

  /**
   * Init Route with Dependency Injection (DI)
   */
  constructor(controller?: SceneController) {
    this.router = Router();
    this.sceneController = controller || new SceneController();

    this.initializeRoutes();
  }

  private initializeRoutes() {
    // --- Scenes ---
    this.router.post(
      '/',
      verifyToken,
      validate(createSceneSchema),
      this.sceneController.createScene
    );

    // Removed query param dependency
    this.router.get('/', verifyToken, this.sceneController.getScenes);

    this.router.delete(
      '/:id',
      verifyToken,
      validate(getIDSchema),
      this.sceneController.deleteScene
    );

    // --- Annotations ---
    this.router.post(
      '/:id/annotations',
      verifyToken,
      validate(getIDSchema),
      validate(createAnnotationSchema),
      this.sceneController.createAnnotation
    );

    this.router.get(
      '/:id/annotations',
      verifyToken,
      validate(getIDSchema),
      this.sceneController.getAnnotations
    );
  }
}

// Export default instance of Route to be used in main route configuration
export default new SceneRoute().router;
