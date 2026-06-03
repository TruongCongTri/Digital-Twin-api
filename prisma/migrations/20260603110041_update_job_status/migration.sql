/*
  Warnings:

  - The values [HANDLING,SUCCESS] on the enum `JobStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
ALTER TABLE "public"."publish_jobs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "publish_jobs" ALTER COLUMN "status" TYPE "JobStatus_new" USING ("status"::text::"JobStatus_new");
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "public"."JobStatus_old";
ALTER TABLE "publish_jobs" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
