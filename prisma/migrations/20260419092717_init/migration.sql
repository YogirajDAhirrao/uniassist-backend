/*
  Warnings:

  - Added the required column `publicId` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "publicId" TEXT NOT NULL;
