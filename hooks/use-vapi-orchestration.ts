"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { vapi } from "@/lib/vapi.sdk";
import type {
  UrgencyLevel,
  VapiOrchestrationState,
} from "@/lib/schemas/video-triage";

interface Message {
  role: "assistant" | "user";
  content: string;
  source?: "vapi" | "visual-triage";
  timestamp?: number;
}

interface UseVapiOrchestrationOptions {
  debounceMs?: number;
  minSpeakInterval?: number;
  maxQueueSize?: number;
  onMessageSpoken?: (message: string) => void;
  onError?: (error: string) => void;
}

interface UseVapiOrchestrationReturn {
  // State
  state: VapiOrchestrationState;
  isSpeaking: boolean;
  messages: Message[];

  // Actions
  queueMessage: (message: string, urgency: UrgencyLevel) => void;
  speakImmediate: (message: string) => void;
  clearQueue: () => void;
  addTranscriptMessage: (message: Message) => void;

  speakVisualInsight: (insight: string, urgency: UrgencyLevel) => void;
}

export function useVapiOrchestration(
  options: UseVapiOrchestrationOptions = {},
): UseVapiOrchestrationReturn {
  const {
    debounceMs = 5000, // 5 Second Debounce
    minSpeakInterval = 8000,
    maxQueueSize = 5,
    onMessageSpoken,
    onError,
  } = options;

  // State
  const [state, setState] = useState<VapiOrchestrationState>({
    lastSpokenUrgency: null,
    lastSpokenAt: null,
    pendingMessage: null,
    speakDebounceMs: debounceMs,
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Refs
  const messageQueueRef = useRef<
    Array<{ message: string; urgency: UrgencyLevel }>
  >([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenMessagesRef = useRef<Set<string>>(new Set());
  const lastSpeakTimeRef = useRef<number>(0);

  useEffect(() => {
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage: Message = {
          role: message.role,
          content: message.transcript,
          source: "vapi",
          timestamp: Date.now(),
        };
        setMessages((prev) => [newMessage, ...prev]);
      }
    };

    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);

    return () => {
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("message", onMessage);
    };
  }, []);

  const isDuplicateMessage = useCallback((message: string): boolean => {
    const normalized = message.toLowerCase().trim();

    if (lastSpokenMessagesRef.current.has(normalized)) {
      return true;
    }

    const words = new Set(normalized.split(/\s+/).filter((w) => w.length > 3));
    for (const prevMessage of lastSpokenMessagesRef.current) {
      const prevWords = new Set(
        prevMessage.split(/\s+/).filter((w) => w.length > 3),
      );
      const overlap = [...words].filter((w) => prevWords.has(w)).length;
      const similarity = overlap / Math.max(words.size, prevWords.size);

      if (similarity > 0.7) {
        return true;
      }
    }

    return false;
  }, []);

  const recordSpokenMessage = useCallback((message: string) => {
    const normalized = message.toLowerCase().trim();
    lastSpokenMessagesRef.current.add(normalized);

    if (lastSpokenMessagesRef.current.size > 10) {
      const oldest = lastSpokenMessagesRef.current.values().next().value;
      lastSpokenMessagesRef.current.delete(oldest);
    }
  }, []);

  const processQueue = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSpeak = now - lastSpeakTimeRef.current;

    if (timeSinceLastSpeak < minSpeakInterval && lastSpeakTimeRef.current > 0) {
      const delay = minSpeakInterval - timeSinceLastSpeak + 100;
      debounceTimerRef.current = setTimeout(processQueue, delay);
      return;
    }

    const nextItem = messageQueueRef.current.shift();
    if (!nextItem) {
      return;
    }

    if (isDuplicateMessage(nextItem.message)) {
      processQueue();
      return;
    }

    try {
      console.log(
        "Attempting to Send Visual Insight to Vapi:",
        nextItem.message,
      );

      // Send to Vapi
      vapi.send({
        type: "add-message",
        message: {
          role: "system",
          content: `VISUAL OBSERVATION: ${nextItem.message}. Acknowledge this Observation in Your Response to the Patient.`,
        },
      });

      recordSpokenMessage(nextItem.message);
      lastSpeakTimeRef.current = now;

      setState((prev) => ({
        ...prev,
        lastSpokenAt: now,
        lastSpokenUrgency: nextItem.urgency,
        pendingMessage: null,
      }));

      const transcriptMessage: Message = {
        role: "assistant",
        content: `[Visual Analysis] ${nextItem.message}`,
        source: "visual-triage",
        timestamp: now,
      };
      setMessages((prev) => [transcriptMessage, ...prev]);

      onMessageSpoken?.(nextItem.message);

      if (messageQueueRef.current.length > 0) {
        debounceTimerRef.current = setTimeout(processQueue, minSpeakInterval);
      }
    } catch (error) {
      console.error("Failed to Send Visual Insight to Vapi:", error);
      onError?.(
        error instanceof Error ? error.message : "Failed to Speak Message",
      );
    }
  }, [
    minSpeakInterval,
    isDuplicateMessage,
    recordSpokenMessage,
    onMessageSpoken,
    onError,
  ]);

  const queueMessage = useCallback(
    (message: string, urgency: UrgencyLevel) => {
      if (urgency === "low" && messageQueueRef.current.length >= maxQueueSize) {
        return;
      }

      if (urgency === "high") {
        messageQueueRef.current.unshift({ message, urgency });
      } else {
        messageQueueRef.current.push({ message, urgency });
      }

      while (messageQueueRef.current.length > maxQueueSize) {
        messageQueueRef.current.pop();
      }

      setState((prev) => ({
        ...prev,
        pendingMessage: message,
      }));

      if (!debounceTimerRef.current) {
        processQueue();
      }
    },
    [maxQueueSize, processQueue],
  );

  const speakImmediate = useCallback(
    (message: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      messageQueueRef.current.unshift({ message, urgency: "high" });

      lastSpeakTimeRef.current = 0;

      processQueue();
    },
    [processQueue],
  );

  const clearQueue = useCallback(() => {
    messageQueueRef.current = [];

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      pendingMessage: null,
    }));
  }, []);

  const addTranscriptMessage = useCallback((message: Message) => {
    setMessages((prev) => [message, ...prev]);
  }, []);

  const speakVisualInsight = useCallback(
    (insight: string, urgency: UrgencyLevel) => {
      const formattedInsight = formatForSpeech(insight);

      if (urgency === "high") {
        speakImmediate(formattedInsight);
      } else if (urgency === "medium") {
        queueMessage(formattedInsight, urgency);
      } else {
        if (messageQueueRef.current.length === 0) {
          queueMessage(formattedInsight, urgency);
        }
      }
    },
    [speakImmediate, queueMessage],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    state,
    isSpeaking,
    messages,
    queueMessage,
    speakImmediate,
    clearQueue,
    addTranscriptMessage,
    speakVisualInsight,
  };
}

function formatForSpeech(text: string): string {
  let formatted = text;

  formatted = formatted.replace(
    /^(visible signs suggest|the patient appears)/i,
    "I Notice",
  );

  formatted = formatted.replace(/[{}\[\]"]/g, "");

  formatted = formatted.replace(/\s+/g, " ").trim();

  if (!/[.!?]$/.test(formatted)) {
    formatted += ".";
  }

  return formatted;
}

export default useVapiOrchestration;
