/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `Deployment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Deployment_publicId_key" ON "Deployment"("publicId");
