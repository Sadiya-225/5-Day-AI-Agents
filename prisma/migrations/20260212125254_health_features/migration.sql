/*
  Warnings:

  - The values [APPLE_WATCH] on the enum `VitalSource` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VitalSource_new" AS ENUM ('MANUAL', 'HEALTH_CONNECT', 'APPLE_HEALTH', 'DEVICE');
ALTER TABLE "VitalSign" ALTER COLUMN "source" TYPE "VitalSource_new" USING ("source"::text::"VitalSource_new");
ALTER TYPE "VitalSource" RENAME TO "VitalSource_old";
ALTER TYPE "VitalSource_new" RENAME TO "VitalSource";
DROP TYPE "public"."VitalSource_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeCalories" DECIMAL(8,2),
ADD COLUMN     "basalMetabolicRate" INTEGER,
ADD COLUMN     "bodyFat" DECIMAL(4,1),
ADD COLUMN     "bodyWaterMass" DECIMAL(5,2),
ADD COLUMN     "boneMass" DECIMAL(5,2),
ADD COLUMN     "cycleLength" INTEGER,
ADD COLUMN     "elevationGained" DECIMAL(8,2),
ADD COLUMN     "exerciseSessions" INTEGER,
ADD COLUMN     "floorsClimbed" INTEGER,
ADD COLUMN     "hydrationMl" INTEGER,
ADD COLUMN     "lastHealthConnectSync" TIMESTAMP(3),
ADD COLUMN     "lastPeriodDate" TIMESTAMP(3),
ADD COLUMN     "lastSleepEnd" TIMESTAMP(3),
ADD COLUMN     "lastSleepStart" TIMESTAMP(3),
ADD COLUMN     "leanBodyMass" DECIMAL(5,2),
ADD COLUMN     "menstruationFlow" TEXT,
ADD COLUMN     "nutritionData" JSONB,
ADD COLUMN     "restingHeartRate" INTEGER,
ADD COLUMN     "skinTemperature" DECIMAL(4,1),
ADD COLUMN     "sleepStages" JSONB,
ADD COLUMN     "todayCalories" DECIMAL(8,2),
ADD COLUMN     "todayDistance" DECIMAL(10,2),
ADD COLUMN     "todaySteps" INTEGER,
ADD COLUMN     "vo2Max" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "VitalSign" ADD COLUMN     "bloodGlucose" DECIMAL(5,2),
ADD COLUMN     "bodyFat" DECIMAL(4,1),
ADD COLUMN     "bpDiastolic" INTEGER,
ADD COLUMN     "bpSystolic" INTEGER,
ADD COLUMN     "calories" DECIMAL(8,2),
ADD COLUMN     "distance" DECIMAL(10,2),
ADD COLUMN     "floorsClimbed" INTEGER,
ADD COLUMN     "restingHeartRate" INTEGER,
ADD COLUMN     "skinTemperature" DECIMAL(4,1),
ADD COLUMN     "sleepHours" DECIMAL(3,1),
ADD COLUMN     "sleepStages" JSONB,
ADD COLUMN     "steps" INTEGER,
ADD COLUMN     "vo2Max" DECIMAL(5,2);
