import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User Not Found" }, { status: 404 });
    }

    const chats = await db.chat.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    const decryptedChats = chats.map((chat) => {
      const decryptedTitle = decrypt(chat.title);
      return {
        ...chat,
        title: decryptedTitle || "Untitled Chat",
      };
    });

    return NextResponse.json({ chats: decryptedChats });
  } catch (err) {
    console.error("API /api/chat/history Error:", err);
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 500 }
    );
  }
}
