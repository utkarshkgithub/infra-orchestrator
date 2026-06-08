-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "envVars" JSONB,
ADD COLUMN     "framework" TEXT,
ADD COLUMN     "installCmd" TEXT NOT NULL DEFAULT 'npm install',
ALTER COLUMN "rootDir" SET DEFAULT '/',
ALTER COLUMN "buildCmd" SET DEFAULT 'npm run build';

-- CreateIndex
CREATE INDEX "Deployment_projectId_idx" ON "Deployment"("projectId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User"("id");
