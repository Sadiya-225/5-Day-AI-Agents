/*
  Warnings:

  - You are about to drop the column `dietType` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "toolResult" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "dietType";

-- DropEnum
DROP TYPE "DietType";
