import { Prisma, Scene } from '@/generated';
import { prisma } from '@/common/configs/prisma';
import { BaseRepository } from '@/common/repositories/base.repository';

/**
 * @class SceneRepository
 * @description Handles all raw database interactions for Scenes and Annotations.
 */
export class SceneRepository extends BaseRepository<Scene> {
  constructor() {
    super('scene');
  }

  // --- SCENES ---

  /**
   * @method createScene
   * @description Create a new Scene record (Asset-agnostic)
   */
  public async createScene(data: Prisma.SceneUncheckedCreateInput) {
    return await prisma.scene.create({
      data,
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  /**
   * @method findAll
   * @description Fetch all scenes globally (or filter by specific criteria)
   */
  public async findAll() {
    return await prisma.scene.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  /**
   * @method findByAuthorId
   * @description NEW: Fetch scenes created by a specific user
   */
  public async findByAuthorId(authorId: string) {
    return await prisma.scene.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  public async findSceneById(sceneId: string) {
    return await prisma.scene.findUnique({
      where: { id: sceneId },
    });
  }

  public async deleteScene(sceneId: string) {
    return await prisma.scene.delete({ where: { id: sceneId } });
  }

  // --- ANNOTATIONS ---

  public async createAnnotation(data: Prisma.AnnotationUncheckedCreateInput) {
    return await prisma.annotation.create({
      data,
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  public async findSceneAnnotations(sceneId: string) {
    return await prisma.annotation.findMany({
      where: { sceneId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  public async deleteAnnotation(annotationId: string) {
    return await prisma.annotation.delete({ where: { id: annotationId } });
  }
}
