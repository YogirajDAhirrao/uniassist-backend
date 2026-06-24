/*
  Warnings:

  - A unique constraint covering the columns `[campaignId,userId]` on the table `EmailRecipient` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmailRecipient_campaignId_userId_key" ON "EmailRecipient"("campaignId", "userId");
