import { z } from "zod";

export const UrgencyLevel = z.enum(["low", "medium", "high"]);
export type UrgencyLevel = z.infer<typeof UrgencyLevel>;

export const VisualAnalysisSchema = z.object({
  distress: z
    .string()
    .describe(
      "Visible signs of patient distress level (e.g., 'mild discomfort', 'moderate distress', 'severe distress')",
    ),
  breathing: z
    .string()
    .describe(
      "Visible breathing pattern observations (e.g., 'normal breathing', 'labored breathing', 'rapid shallow breaths')",
    ),
  posture: z
    .string()
    .describe(
      "Patient posture and body position (e.g., 'relaxed posture', 'guarded position', 'slouched indicating fatigue')",
    ),
  fatigue: z
    .string()
    .describe(
      "Visible signs of fatigue or exhaustion (e.g., 'alert and responsive', 'appears tired', 'visible exhaustion')",
    ),
  visibleFinding: z
    .string()
    .describe(
      "Primary visible medical finding (e.g., 'visible rash on arms', 'facial asymmetry noted', 'tremor in hands')",
    ),
  urgency: UrgencyLevel.describe(
    "Overall urgency assessment based on visible observations",
  ),
  shortReply: z
    .string()
    .describe("Brief 1-2 sentence summary to speak aloud to the patient"),
});

export type VisualAnalysis = z.infer<typeof VisualAnalysisSchema>;

export const FrameProcessingStateSchema = z.object({
  isProcessing: z.boolean(),
  lastProcessedAt: z.number().nullable(),
  frameCount: z.number(),
  errorCount: z.number(),
  lastError: z.string().nullable(),
});

export type FrameProcessingState = z.infer<typeof FrameProcessingStateSchema>;

export const VideoSessionStateSchema = z.object({
  isConnected: z.boolean(),
  hasCamera: z.boolean(),
  hasPermission: z.boolean(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
});

export type VideoSessionState = z.infer<typeof VideoSessionStateSchema>;

export const TriageSessionSchema = z.object({
  sessionId: z.string(),
  startedAt: z.number(),
  analysisHistory: z.array(VisualAnalysisSchema),
  currentUrgency: UrgencyLevel,
  spokenMessages: z.array(z.string()),
  isActive: z.boolean(),
});

export type TriageSession = z.infer<typeof TriageSessionSchema>;

export const LiveKitTokenRequestSchema = z.object({
  roomName: z.string().min(1),
  participantName: z.string().min(1),
  participantId: z.string().optional(),
});

export type LiveKitTokenRequest = z.infer<typeof LiveKitTokenRequestSchema>;

export const LiveKitTokenResponseSchema = z.object({
  token: z.string(),
  roomName: z.string(),
});

export type LiveKitTokenResponse = z.infer<typeof LiveKitTokenResponseSchema>;

export const FrameAnalysisRequestSchema = z.object({
  frameBase64: z.string().describe("Base64 encoded JPEG image"),
  sessionId: z.string(),
  previousAnalysis: VisualAnalysisSchema.optional().nullable(),
  patientContext: z
    .object({
      name: z.string().optional().nullable(),
      age: z.coerce.number().optional().nullable(),
      symptoms: z.string().optional().nullable(),
      medicalHistory: z.record(z.unknown()).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type FrameAnalysisRequest = z.infer<typeof FrameAnalysisRequestSchema>;

export const VapiOrchestrationStateSchema = z.object({
  lastSpokenUrgency: UrgencyLevel.nullable(),
  lastSpokenAt: z.number().nullable(),
  pendingMessage: z.string().nullable(),
  speakDebounceMs: z.number().default(5000),
});

export type VapiOrchestrationState = z.infer<
  typeof VapiOrchestrationStateSchema
>;

export const SymptomCardSchema = z.object({
  id: z.string(),
  category: z.enum(["distress", "breathing", "posture", "fatigue", "finding"]),
  label: z.string(),
  value: z.string(),
  urgency: UrgencyLevel,
  timestamp: z.number(),
});

export type SymptomCard = z.infer<typeof SymptomCardSchema>;

export const VISUAL_TRIAGE_SYSTEM_PROMPT = `You are a medical AI assistant performing real-time visual triage analysis of a patient during a telemedicine consultation.
  IMPORTANT GUIDELINES:
  1. You are analyzing video frames from a webcam feed
  2. You can ONLY observe visible physical signs - you cannot diagnose conditions
  3. Always phrase observations carefully using words like "appears", "visible signs suggest", "patient seems to"
  4. Never make definitive medical diagnoses from visual observation alone
  5. Recommend professional consultation when concerning signs are visible
  6. Be concise - this is real-time analysis

  WHAT TO OBSERVE:
  - Breathing patterns (rapid, labored, shallow, normal)
  - Signs of distress (facial expressions, body language)
  - Posture and movement (guarded, hunched, tremors)
  - Visible fatigue or exhaustion
  - Skin changes (pallor, flushing, visible rashes)
  - Facial asymmetry that might indicate neurological concerns
  - Eye contact and alertness level
  - Any visible injuries or abnormalities

  URGENCY CLASSIFICATION:
  - "low": Patient appears comfortable, no immediate concerns
  - "medium": Visible discomfort or concerning signs that warrant attention
  - "high": Signs suggesting immediate medical attention may be needed (severe distress, breathing difficulty, facial drooping)

  OUTPUT FORMAT:
  Provide structured observations following the schema exactly. Keep shortReply to 1-2 sentences that could be spoken aloud to acknowledge the patient's visible state.`;
