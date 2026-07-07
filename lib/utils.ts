import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors, voices } from "@/constants";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import {
  getLocalizedGreeting,
  getVoiceForLanguage,
  getDeepgramLanguageCode,
  LANGUAGE_SYSTEM_PROMPTS,
} from "@/constants/multilingual";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Serialize Prisma data to plain objects that can be passed to Client Components.
 * Converts Decimal objects to numbers and Date objects to ISO strings.
 */
export function serializePrismaData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializePrismaData(item)) as T;
  }

  if (typeof data === "object") {
    // Check if it's a Decimal (has toNumber method)
    if ("toNumber" in data && typeof (data as any).toNumber === "function") {
      return (data as any).toNumber() as T;
    }

    // Check if it's a Date
    if (data instanceof Date) {
      return data.toISOString() as T;
    }

    // Handle regular objects
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializePrismaData(value);
    }
    return serialized as T;
  }

  return data;
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

export const configureAssistant = (
  name: string,
  subject: string,
  topic: string,
  voice: string,
  style: string,
  userDetails: Record<string, any>,
  languageCode: string = "en" // Default to English
) => {
  // Get language-specific settings
  const languagePrompts = LANGUAGE_SYSTEM_PROMPTS[languageCode as keyof typeof LANGUAGE_SYSTEM_PROMPTS] || LANGUAGE_SYSTEM_PROMPTS.en;

  // Use Azure voices for multilingual support, fallback to ElevenLabs for English
  const isMultilingual = languageCode !== "en";

  let voiceId: string;
  if (isMultilingual) {
    // Use Azure multilingual voices
    voiceId = getVoiceForLanguage(languageCode, style);
  } else {
    // Use existing ElevenLabs voices for English
    voiceId =
      voices[voice as keyof typeof voices][
        style as keyof (typeof voices)[keyof typeof voices]
      ] || "sarah";
  }

  const prompt = `
    You are a Smart and Compassionate AI Medical Doctor named ${
      name || "Dr. Care"
    }.
    Your medical specialization is ${subject || "General Medicine"}.

    IMPORTANT LANGUAGE INSTRUCTIONS:
    ${languagePrompts.languageInstruction}
    ${languagePrompts.conversationStyle}
    ${isMultilingual ? `You MUST respond ONLY in the selected language (${languageCode.toUpperCase()}). Do NOT switch to English unless the user explicitly requests it.` : ''}

    You are designed to help users understand their symptoms and guide them toward the next best steps in care.

    Before suggesting any possible causes, conditions, or remedies, you must:
    - Ask one clear and relevant question at a time to better understand the user's symptoms.
    - Wait for their response before asking the next question.
    - Maintain a conversational, natural tone just like a real doctor.

    Use only the provided context, user details, and conversation history to suggest possible causes, common medicines, and remedies.
    If you don't have enough information, politely let the user know you need more details and ask another clarifying question.

    Maintain a **${style.toUpperCase()}** communication tone:
    ${
      style === "empathetic"
        ? "- Speak warmly, gently, and reassure the user.\n- Show understanding and care in every response."
        : "- Speak clearly, confidently, and professionally.\n- Focus on accuracy and efficient guidance."
    }

    After asking a maximum of 10 symptom-related questions:
    - Stop asking further questions.
    - Analyze all the collected information.
    - Provide a final disease or condition estimate based on the user's symptoms and reports.
    - Present the likely conditions in simple terms and suggest next steps such as consulting a relevant specialist.
    - Keep responses concise, friendly, and easy to understand.

    Keep the conversation flowing smoothly while maintaining control.
    From time to time, make sure the user is following you and understands you.
    Keep your responses short, like in a real voice conversation.
    Do not include any special characters in your responses - this is a voice conversation.
    ---

    Patient Details:
    ${JSON.stringify(userDetails, null, 2)}

    Reported Symptoms: ${topic || "Not Provided"}
    Medical Specialization: ${subject || "General Medicine"}
    `;

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage: getLocalizedGreeting(languageCode, name || "Doctor", subject || "General Medicine"),
    transcriber: {
      provider: "deepgram",
      model: "nova-2", // Using nova-2 as recommended for multilingual
      language: getDeepgramLanguageCode(languageCode), // Use specific language code for accurate transcription
    },
    voice: isMultilingual
      ? {
          provider: "azure",
          voiceId: voiceId,
        }
      : {
          provider: "11labs",
          voiceId: voiceId,
          stability: 0.4,
          similarityBoost: 0.8,
          speed: 1,
          style: 0.5,
          useSpeakerBoost: true,
        },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: prompt.trim(),
        },
      ],
    },
    clientMessages: undefined,
    serverMessages: undefined,
  };
  return vapiAssistant;
};