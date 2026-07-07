-- CreateEnum
CREATE TYPE "FoodHabit" AS ENUM ('VEG', 'NON_VEG', 'BOTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accident" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "bp_dia" INTEGER,
ADD COLUMN     "bp_sys" INTEGER,
ADD COLUMN     "food_habit" "FoodHabit",
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "medical_history" TEXT,
ADD COLUMN     "sugar_fasting" DECIMAL(5,2),
ADD COLUMN     "sugar_pp" DECIMAL(5,2),
ADD COLUMN     "surgery" TEXT,
ADD COLUMN     "transfusion" TEXT;
