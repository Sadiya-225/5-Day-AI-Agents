import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User Not Found" }, { status: 404 });
    }

    const chat = await db.chat.findUnique({
      where: {
        id: chatId,
        userId: user.id,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat Not Found" }, { status: 404 });
    }

    await db.chat.delete({
      where: { id: chatId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`API /api/chat/${params.chatId} Error:`, err);
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 500 }
    );
  }
}
