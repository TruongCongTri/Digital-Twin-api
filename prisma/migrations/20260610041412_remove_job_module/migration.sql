/*
  Warnings:

  - You are about to drop the `publish_jobs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "publish_jobs" DROP CONSTRAINT "publish_jobs_asset_id_fkey";

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "sync_error" TEXT,
ADD COLUMN     "sync_progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sync_status" "SyncStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "publish_jobs";

-- DropEnum
DROP TYPE "JobStatus";
