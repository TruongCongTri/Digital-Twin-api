/*
  Warnings:

  - You are about to drop the column `workspace_id` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `workspace_id` on the `scenes` table. All the data in the column will be lost.
  - You are about to drop the `workspace_invitations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workspace_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workspaces` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "scenes" DROP CONSTRAINT "scenes_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_invitations" DROP CONSTRAINT "workspace_invitations_inviter_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_invitations" DROP CONSTRAINT "workspace_invitations_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_members" DROP CONSTRAINT "workspace_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_members" DROP CONSTRAINT "workspace_members_workspace_id_fkey";

-- AlterTable
ALTER TABLE "assets" DROP COLUMN "workspace_id";

-- AlterTable
ALTER TABLE "scenes" DROP COLUMN "workspace_id";

-- DropTable
DROP TABLE "workspace_invitations";

-- DropTable
DROP TABLE "workspace_members";

-- DropTable
DROP TABLE "workspaces";

-- DropEnum
DROP TYPE "InviteStatus";

-- DropEnum
DROP TYPE "WorkspaceRole";
