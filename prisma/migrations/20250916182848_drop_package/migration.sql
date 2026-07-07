/*
  Warnings:

  - You are about to drop the column `packageId` on the `CreditTransaction` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'APPOINTMENT_ADDITION';

-- AlterTable
ALTER TABLE "CreditTransaction" DROP COLUMN "packageId";
