import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption"; // your crypto functions

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Missing ChatId Parameter" },
        { status: 400 }
      );
    }

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
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat Not Found" }, { status: 404 });
    }

    let decryptedChat;
    try {
      decryptedChat = {
        ...chat,
        title: decrypt(chat.title),
        messages: chat.messages.map((msg) => ({
          ...msg,
          content: decrypt(msg.content),
        })),
      };
    } catch (err) {
      console.error("Decryption Error:", err);
      return NextResponse.json(
        { error: "Failed to decrypt chat messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: decryptedChat.messages });
  } catch (err) {
    console.error("API /api/chat/messages Error:", err);
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 500 }
    );
  }
}
