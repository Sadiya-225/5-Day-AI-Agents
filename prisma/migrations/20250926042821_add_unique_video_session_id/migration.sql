/*
  Warnings:

  - A unique constraint covering the columns `[videoSessionId]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Appointment_videoSessionId_key" ON "Appointment"("videoSessionId");
