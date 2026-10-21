-- DropIndex
DROP INDEX "Deployment_commitHash_key";

-- AlterTable
ALTER TABLE "Deployment" ALTER COLUMN "commitAuthorEmail" DROP NOT NULL,
ALTER COLUMN "commitAuthorName" DROP NOT NULL,
ALTER COLUMN "commitAuthorUsername" DROP NOT NULL,
ALTER COLUMN "commitMessage" DROP NOT NULL;
