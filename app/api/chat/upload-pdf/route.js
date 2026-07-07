import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const LLM_WHISPERER_URL = process.env.LLM_WHISPERER_URL;
const UNSTRACT_API_KEY = process.env.UNSTRACT_API_KEY;

export async function POST(req) {
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

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No File Uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF Files are Allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempFilePath = join(tmpdir(), `${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    try {
      const extractResponse = await fetch(`${LLM_WHISPERER_URL}/whisper`, {
        method: "POST",
        headers: {
          "unstract-key": UNSTRACT_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      });

      if (!extractResponse.ok) {
        throw new Error(
          `LLM Whisperer Extraction Failed: ${extractResponse.statusText}`
        );
      }

      const extractData = await extractResponse.json();
      const whisperHash = extractData.whisper_hash;

      if (!whisperHash) {
        throw new Error("No whisper_hash Returned from Extraction");
      }

      let status = "processing";
      let attempts = 0;
      const maxAttempts = 30;

      while (status === "processing" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await fetch(
          `${LLM_WHISPERER_URL}/whisper-status?whisper_hash=${whisperHash}`,
          {
            headers: {
              "unstract-key": UNSTRACT_API_KEY,
            },
          }
        );

        if (!statusResponse.ok) {
          throw new Error("Failed to Check Extraction Status");
        }

        const statusData = await statusResponse.json();
        status = statusData.status;
        attempts++;
      }

      if (status !== "processed") {
        throw new Error("PDF Extraction Timed out or Failed");
      }

      const retrieveResponse = await fetch(
        `${LLM_WHISPERER_URL}/whisper-retrieve?whisper_hash=${whisperHash}`,
        {
          headers: {
            "unstract-key": UNSTRACT_API_KEY,
          },
        }
      );

      if (!retrieveResponse.ok) {
        throw new Error("Failed to Retrieve Extracted Text");
      }

      const retrieveData = await retrieveResponse.json();
      const extractedText = retrieveData.result_text || "";

      if (!extractedText) {
        throw new Error("No Text Extracted from PDF");
      }

      const currentMedicalHistory = user.medical_history || "";
      const timestamp = new Date().toISOString();
      const newEntry = `\n\n--- Document Uploaded on ${timestamp} ---\n${extractedText}`;
      const updatedMedicalHistory = currentMedicalHistory + newEntry;

      await db.user.update({
        where: { id: user.id },
        data: {
          medical_history: updatedMedicalHistory,
        },
      });

      await unlink(tempFilePath);

      return NextResponse.json({
        success: true,
        message: "Medical Document Uploaded and Processed Successfully",
        extractedText: extractedText,
      });
    } catch (error) {
      try {
        await unlink(tempFilePath);
      } catch (unlinkError) {
        console.error("Error deleting temp file:", unlinkError);
      }
      throw error;
    }
  } catch (err) {
    console.error("API /api/chat/upload-pdf Error:", err);
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 500 }
    );
  }
}
