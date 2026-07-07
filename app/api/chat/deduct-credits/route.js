import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount) {
      return NextResponse.json(
        { error: "Invalid Credit Amount" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User Not Found" }, { status: 404 });
    }

    if (user.credits < amount) {
      return NextResponse.json(
        { error: "Insufficient Credits", success: false },
        { status: 400 }
      );
    }

    const result = await db.$transaction(
      async (tx) => {
        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: -amount,
            type: "APPOINTMENT_DEDUCTION",
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            credits: {
              decrement: amount,
            },
          },
          select: {
            id: true,
            credits: true,
          },
        });

        return updatedUser;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    return NextResponse.json({
      success: true,
      remainingCredits: result.credits,
    });
  } catch (error) {
    console.error("Error Deducting Credits:", error);
    return NextResponse.json(
      { error: "Failed to Deduct Credits", success: false },
      { status: 500 }
    );
  }
}
