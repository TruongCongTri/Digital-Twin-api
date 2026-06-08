import { getIO } from '@/common/configs/socket.config';
import { SceneRepository } from './scene.repository';
import { CreateAnnotationDTO, CreateSceneDTO } from './scene.schema';
import { AppError } from '@/common/errors/app.error';
import { Prisma } from '@/generated/client';

export class SceneService {
  private readonly repo: SceneRepository;

  constructor() {
    this.repo = new SceneRepository();
  }

  // ==========================================
  // SCENE LOGIC
  // ==========================================

  public async createScene(userId: string, data: CreateSceneDTO) {
    const scene = await this.repo.createScene({
      authorId: userId,
      name: data.name,
      description: data.description ?? null,
      cameraState: data.cameraState as Prisma.InputJsonValue,
      layerVisibility: data.layerVisibility
        ? (data.layerVisibility as Prisma.InputJsonValue)
        : Prisma.DbNull,
    });

    // 📡 BROADCAST: Notify all active clients that a new scene is available
    getIO().emit('sceneCreated', scene);

    return scene;
  }

  public async getAllScenes() {
    return await this.repo.findAll();
  }

  public async deleteScene(sceneId: string, userId: string) {
    const scene = await this.repo.findSceneById(sceneId);
    if (!scene) throw new AppError(404, 'Scene not found');

    // RBAC: Only Author can delete their saved scene configuration
    if (scene.authorId !== userId) {
      throw new AppError(403, 'Only the author can delete this scene.');
    }

    await this.repo.deleteScene(sceneId);

    // 📡 BROADCAST: Instantly remove it from everyone's UI
    getIO().emit('sceneDeleted', { sceneId });
  }

  // ==========================================
  // ANNOTATION LOGIC
  // ==========================================

  public async createAnnotation(sceneId: string, userId: string, data: CreateAnnotationDTO) {
    const scene = await this.repo.findSceneById(sceneId);
    if (!scene) throw new AppError(404, 'Scene not found');

    const annotation = await this.repo.createAnnotation({
      sceneId,
      authorId: userId,
      text: data.text,
      position: data.position as Prisma.InputJsonObject,
    });

    // 📡 BROADCAST: Scoped directly to the specific 3D scene being viewed
    getIO().to(`scene_${sceneId}`).emit('annotationCreated', annotation);

    return annotation;
  }

  public async getSceneAnnotations(sceneId: string) {
    const scene = await this.repo.findSceneById(sceneId);
    if (!scene) throw new AppError(404, 'Scene not found');

    return await this.repo.findSceneAnnotations(sceneId);
  }
}
