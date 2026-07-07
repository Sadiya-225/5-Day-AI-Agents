import { db } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = (await headers()).get("Stripe-Signature");
    let event;

    if (!signature) {
      console.error("Webhook Error: Missing Stripe Signature");
      return NextResponse.json({ error: "Missing Signature" }, { status: 400 });
    }

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error(`Webhook Error: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const session = event.data.object;
    console.log(`Webhook Event Type: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      try {
        const credits = Number(session.metadata?.["credits"]);
        const userId = session.client_reference_id;

        console.log(`Credits: ${credits}, ClerkUserId: ${userId}`);

        if (!userId || !credits) {
          return NextResponse.json(
            { error: "Missing User ID or Credits" },
            { status: 400 }
          );
        }

        try {
          const user = await db.user.findUnique({
            where: {
              clerkUserId: userId,
            },
          });

          if (!user) {
            return NextResponse.json(
              { error: "User Not Found in Database" },
              { status: 404 }
            );
          }

          const result = await db.$transaction(async (tx) => {
            const transaction = await tx.creditTransaction.create({
              data: {
                userId: user.id,
                amount: credits,
                type: "CREDIT_PURCHASE",
              },
            });
            console.log(`Created Credit Transaction: ${transaction.id}`);

            const updatedUser = await tx.user.update({
              where: {
                id: user.id,
              },
              data: {
                credits: {
                  increment: credits,
                },
              },
              select: {
                id: true,
                credits: true,
              },
            });
            return { transaction, updatedUser };
          });

          return NextResponse.json(
            { message: "Credits Added Successfully", data: result },
            { status: 200 }
          );
        } catch (dbError) {
          return NextResponse.json(
            { error: `Database Error: ${dbError.message}` },
            { status: 500 }
          );
        }
      } catch (processingError) {
        return NextResponse.json(
          { error: `Processing Error: ${processingError.message}` },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
