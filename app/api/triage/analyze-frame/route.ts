import { streamObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  VisualAnalysisSchema,
  FrameAnalysisRequestSchema,
  VISUAL_TRIAGE_SYSTEM_PROMPT,
} from "@/lib/schemas/video-triage";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("[API] Unauthorized - No userId");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[API] User Authenticated:", userId);

    if (!GEMINI_API_KEY) {
      console.error("[API] GEMINI_API_KEY Not Configured");
      return new Response(
        JSON.stringify({ error: "AI Service Not Configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json();
    console.log("[API] Request Body:", {
      sessionId: body.sessionId,
      frameSize: body.frameBase64?.length,
      hasPatientContext: !!body.patientContext,
      hasPreviousAnalysis: !!body.previousAnalysis,
    });

    const validationResult = FrameAnalysisRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error(
        "[API] Validation Failed:",
        JSON.stringify(validationResult.error.flatten(), null, 2),
      );
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: validationResult.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { frameBase64, sessionId, previousAnalysis, patientContext } =
      validationResult.data;

    let contextPrompt = VISUAL_TRIAGE_SYSTEM_PROMPT;

    if (patientContext) {
      contextPrompt += `\n\nPATIENT CONTEXT:`;
      if (patientContext.name) {
        contextPrompt += `\n- Name: ${patientContext.name}`;
      }
      if (patientContext.age) {
        contextPrompt += `\n- Age: ${patientContext.age}`;
      }
      if (patientContext.symptoms) {
        contextPrompt += `\n- Reported Symptoms: ${patientContext.symptoms}`;
      }
      if (patientContext.medicalHistory) {
        contextPrompt += `\n- Medical History: ${JSON.stringify(patientContext.medicalHistory)}`;
      }
    }

    if (previousAnalysis) {
      contextPrompt += `\n\nPREVIOUS OBSERVATION (For Continuity):
      - Distress: ${previousAnalysis.distress}
      - Breathing: ${previousAnalysis.breathing}
      - Urgency: ${previousAnalysis.urgency}
      Note: Focus on Any Changes from the Previous Observation.`;
    }

    const model = google("gemini-2.5-flash-lite");
    const imageData = new Uint8Array(Buffer.from(frameBase64, "base64"));

    const result = streamObject({
      model,
      schema: VisualAnalysisSchema,
      system: contextPrompt,
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: `Analyze this patient video frame for visual medical triage. Session ID: ${sessionId}. Provide structured observations following the schema.`,
            },
            {
              type: "image" as const,
              image: imageData,
            },
          ],
        },
      ],
      temperature: 0.3,
    });
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Frame Analysis Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return new Response(
          JSON.stringify({ error: "AI Service Authentication Failed" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      if (error.message.includes("rate limit")) {
        return new Response(
          JSON.stringify({ error: "Too Many Requests. Please Wait a Moment." }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(JSON.stringify({ error: "Failed to Analyze Frame" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "video-triage-analysis",
      configured: !!GEMINI_API_KEY,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
