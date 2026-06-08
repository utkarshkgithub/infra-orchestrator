/*
  Warnings:

  - Made the column `envVars` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "envVars" SET NOT NULL,
ALTER COLUMN "envVars" SET DEFAULT '{}';
