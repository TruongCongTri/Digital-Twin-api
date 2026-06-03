/*
  Warnings:

  - You are about to drop the column `error_message` on the `publish_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `publish_jobs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[asset_id]` on the table `publish_jobs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "publish_jobs" DROP CONSTRAINT "publish_jobs_user_id_fkey";

-- AlterTable
ALTER TABLE "publish_jobs" DROP COLUMN "error_message",
DROP COLUMN "user_id",
ADD COLUMN     "error_log" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "publish_jobs_asset_id_key" ON "publish_jobs"("asset_id");
