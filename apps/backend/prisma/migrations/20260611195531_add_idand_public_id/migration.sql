/*
  Warnings:

  - The primary key for the `Deployment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Deployment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The required column `publicId` was added to the `Deployment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Deployment" DROP CONSTRAINT "Deployment_pkey",
ADD COLUMN     "publicId" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id");
