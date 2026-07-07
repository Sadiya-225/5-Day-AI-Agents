"use server";

import { db } from "@/lib/prisma";

const APPOINTMENT_CREDIT_COST = 500;

export async function deductCreditsForAppointment(userId, doctorId) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    const doctor = await db.user.findUnique({
      where: { id: doctorId },
    });

    if (user.credits < APPOINTMENT_CREDIT_COST) {
      throw new Error("Insufficient Credits to Book an Appointment");
    }

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    const result = await db.$transaction(async (tx) => {
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: doctor.id,
          amount: APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_ADDITION",
        },
      });

      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          credits: {
            decrement: APPOINTMENT_CREDIT_COST,
          },
        },
      });

      await tx.user.update({
        where: {
          id: doctor.id,
        },
        data: {
          credits: {
            increment: APPOINTMENT_CREDIT_COST,
          },
        },
      });

      return updatedUser;
    });

    return { success: true, user: result };
  } catch (error) {
    console.error("Failed to Deduct Credits:", error);
    return { success: false, error: error.message };
  }
}
