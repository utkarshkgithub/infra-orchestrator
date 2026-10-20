/*
  Warnings:

  - A unique constraint covering the columns `[commitHash]` on the table `Deployment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `commitAuthorEmail` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commitAuthorName` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commitAuthorUsername` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commitMessage` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Made the column `commitHash` on table `Deployment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `githubRepoId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "commitAuthorEmail" TEXT NOT NULL,
ADD COLUMN     "commitAuthorName" TEXT NOT NULL,
ADD COLUMN     "commitAuthorUsername" TEXT NOT NULL,
ADD COLUMN     "commitMessage" TEXT NOT NULL,
ALTER COLUMN "commitHash" SET NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "githubRepoId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_commitHash_key" ON "Deployment"("commitHash");
