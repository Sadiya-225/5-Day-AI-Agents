"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const CREDIT_VALUE = 1;
const PLATFORM_FEE_PER_CREDIT = 0.1;
const DOCTOR_EARNINGS_PER_CREDIT = 0.9;

export async function requestPayout(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    const paypalEmail = formData.get("paypalEmail");

    if (!paypalEmail) {
      throw new Error("PayPal Email is Required");
    }

    const existingPendingPayout = await db.payout.findFirst({
      where: {
        doctorId: doctor.id,
        status: "PROCESSING",
      },
    });

    if (existingPendingPayout) {
      throw new Error(
        "You Already Have a Pending Payout Request. Please Wait for It to be Processed."
      );
    }

    const creditCount = doctor.credits;

    if (creditCount === 0) {
      throw new Error("No Credits Available for Payout");
    }

    if (creditCount < 1) {
      throw new Error("Minimum 1 Credit Required for Payout");
    }

    const totalAmount = creditCount * CREDIT_VALUE;
    const platformFee = creditCount * PLATFORM_FEE_PER_CREDIT;
    const netAmount = creditCount * DOCTOR_EARNINGS_PER_CREDIT;

    const payout = await db.payout.create({
      data: {
        doctorId: doctor.id,
        amount: totalAmount,
        credits: creditCount,
        platformFee,
        netAmount,
        paypalEmail,
        status: "PROCESSING",
      },
    });

    revalidatePath("/doctor");
    return { success: true, payout };
  } catch (error) {
    console.error("Failed to Request Payout:", error);
    throw new Error("Failed to Request Payout: " + error.message);
  }
}

export async function getDoctorPayouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    const payouts = await db.payout.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { payouts };
  } catch (error) {
    throw new Error("Failed to Fetch Payouts: " + error.message);
  }
}

export async function getDoctorEarnings() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    const completedAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "COMPLETED",
      },
    });

    const completedPayout = await db.payout.aggregate({
      where: {
        doctorId: doctor.id,
        status: "PROCESSED",
      },
      _sum: {
        netAmount: true,
      },
    });

    const totalProcessedPayout = completedPayout._sum.netAmount || 0;

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments.filter(
      (appointment) => new Date(appointment.createdAt) >= currentMonth
    );

    const totalEarnings = doctor.credits * DOCTOR_EARNINGS_PER_CREDIT;

    const thisMonthEarnings =
      thisMonthAppointments.length * 500 * DOCTOR_EARNINGS_PER_CREDIT;

    const averageEarningsPerMonth =
      totalEarnings + totalProcessedPayout > 0
        ? (totalEarnings + totalProcessedPayout) /
          Math.max(1, new Date().getMonth() + 1)
        : 0;

    const availableCredits = doctor.credits;
    const availablePayout = availableCredits * DOCTOR_EARNINGS_PER_CREDIT;

    return {
      earnings: {
        totalEarnings,
        thisMonthEarnings,
        completedAppointments: completedAppointments.length,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
      },
    };
  } catch (error) {
    throw new Error("Failed to Fetch Doctor Earnings: " + error.message);
  }
}
