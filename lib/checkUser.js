"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { serializePrismaData } from "@/lib/utils";

export const checkUser = async () => {
  try {
    const user = await currentUser();
    if (!user) return null;

    let loggedInUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
      include: {
        transactions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!loggedInUser) {
      const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`;

      loggedInUser = await db.user.create({
        data: {
          clerkUserId: user.id,
          name,
          imageUrl: user.imageUrl,
          email: user.emailAddresses[0].emailAddress,
          role: "UNASSIGNED",
        },
      });
    }
    return serializePrismaData(loggedInUser);
  } catch (error) {
    console.error("Error in Authentication Flow:", error);
    return null;
  }
};
