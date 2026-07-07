"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type {
  VisualAnalysis,
  TriageSession,
  UrgencyLevel,
  SymptomCard,
} from "@/lib/schemas/video-triage";

interface PatientContext {
  name?: string;
  age?: number;
  symptoms?: string;
  medicalHistory?: Record<string, unknown>;
}

interface UseTriageAnalysisOptions {
  sessionId?: string;
  patientContext?: PatientContext;
  onAnalysisComplete?: (analysis: VisualAnalysis) => void;
  onUrgencyChange?: (
    oldUrgency: UrgencyLevel | null,
    newUrgency: UrgencyLevel,
  ) => void;
  onSpeakableInsight?: (message: string, urgency: UrgencyLevel) => void;
  onError?: (error: string) => void;
}

interface UseTriageAnalysisReturn {
  session: TriageSession | null;
  isAnalyzing: boolean;
  currentAnalysis: VisualAnalysis | null;
  analysisHistory: VisualAnalysis[];
  symptomCards: SymptomCard[];

  // Actions
  analyzeFrame: (frameBase64: string) => Promise<VisualAnalysis | null>;
  startSession: () => void;
  endSession: () => void;
  clearHistory: () => void;

  // Status
  error: string | null;
  analysisCount: number;
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useTriageAnalysis(
  options: UseTriageAnalysisOptions = {},
): UseTriageAnalysisReturn {
  const {
    sessionId: providedSessionId,
    patientContext,
    onAnalysisComplete,
    onUrgencyChange,
    onSpeakableInsight,
    onError,
  } = options;

  // State
  const [session, setSession] = useState<TriageSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VisualAnalysis | null>(
    null,
  );
  const [analysisHistory, setAnalysisHistory] = useState<VisualAnalysis[]>([]);
  const [symptomCards, setSymptomCards] = useState<SymptomCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUrgencyRef = useRef<UrgencyLevel | null>(null);
  const analysisCountRef = useRef(0);

  const startSession = useCallback(() => {
    const newSession: TriageSession = {
      sessionId: providedSessionId || generateId(),
      startedAt: Date.now(),
      analysisHistory: [],
      currentUrgency: "low",
      spokenMessages: [],
      isActive: true,
    };

    setSession(newSession);
    setAnalysisHistory([]);
    setSymptomCards([]);
    setCurrentAnalysis(null);
    setError(null);
    lastUrgencyRef.current = null;
    analysisCountRef.current = 0;
  }, [providedSessionId]);

  const endSession = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setSession((prev) => (prev ? { ...prev, isActive: false } : null));
    setIsAnalyzing(false);
  }, []);

  const clearHistory = useCallback(() => {
    setAnalysisHistory([]);
    setSymptomCards([]);
    setCurrentAnalysis(null);
    analysisCountRef.current = 0;
    lastUrgencyRef.current = null;
  }, []);

  const createSymptomCards = useCallback(
    (analysis: VisualAnalysis): SymptomCard[] => {
      const timestamp = Date.now();
      const cards: SymptomCard[] = [];

      if (
        analysis.distress &&
        analysis.distress !== "normal" &&
        analysis.distress !== "not visible"
      ) {
        cards.push({
          id: generateId(),
          category: "distress",
          label: "Distress Level",
          value: analysis.distress,
          urgency: analysis.urgency,
          timestamp,
        });
      }

      if (
        analysis.breathing &&
        analysis.breathing !== "normal breathing" &&
        analysis.breathing !== "not visible"
      ) {
        cards.push({
          id: generateId(),
          category: "breathing",
          label: "Breathing Pattern",
          value: analysis.breathing,
          urgency: analysis.urgency,
          timestamp,
        });
      }

      if (
        analysis.posture &&
        analysis.posture !== "normal posture" &&
        analysis.posture !== "not visible"
      ) {
        cards.push({
          id: generateId(),
          category: "posture",
          label: "Posture",
          value: analysis.posture,
          urgency: analysis.urgency,
          timestamp,
        });
      }

      if (
        analysis.fatigue &&
        analysis.fatigue !== "alert and responsive" &&
        analysis.fatigue !== "not visible"
      ) {
        cards.push({
          id: generateId(),
          category: "fatigue",
          label: "Fatigue Signs",
          value: analysis.fatigue,
          urgency: analysis.urgency,
          timestamp,
        });
      }

      if (
        analysis.visibleFinding &&
        analysis.visibleFinding !== "none" &&
        analysis.visibleFinding !== "not visible"
      ) {
        cards.push({
          id: generateId(),
          category: "finding",
          label: "Visible Finding",
          value: analysis.visibleFinding,
          urgency: analysis.urgency,
          timestamp,
        });
      }

      return cards;
    },
    [],
  );

  const parseStreamedObject = (
    text: string,
  ): Partial<VisualAnalysis> | null => {
    try {
      const trimmed = text.trim();
      if (!trimmed) return null;

      try {
        return JSON.parse(trimmed);
      } catch {
        const match = trimmed.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch {
            return null;
          }
        }
        return null;
      }
    } catch {
      return null;
    }
  };

  const analyzeFrame = useCallback(
    async (frameBase64: string): Promise<VisualAnalysis | null> => {
      if (!session?.isActive) {
        console.warn("No Active Session. Call startSession() First.");
        return null;
      }

      if (isAnalyzing) {
        console.warn("Analysis Already in Progress, Skipping Frame");
        return null;
      }

      setIsAnalyzing(true);
      setError(null);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/triage/analyze-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frameBase64,
            sessionId: session.sessionId,
            previousAnalysis: currentAnalysis,
            patientContext,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Analysis Failed: ${response.status}`,
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No Response Body");
        }

        const decoder = new TextDecoder();
        let fullText = "";
        let finalAnalysis: VisualAnalysis | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          const partial = parseStreamedObject(fullText);
          if (partial && partial.shortReply) {
            setCurrentAnalysis((prev) => ({
              distress: partial.distress || prev?.distress || "",
              breathing: partial.breathing || prev?.breathing || "",
              posture: partial.posture || prev?.posture || "",
              fatigue: partial.fatigue || prev?.fatigue || "",
              visibleFinding:
                partial.visibleFinding || prev?.visibleFinding || "",
              urgency: partial.urgency || prev?.urgency || "low",
              shortReply: partial.shortReply || prev?.shortReply || "",
            }));
          }
        }

        finalAnalysis = parseStreamedObject(fullText) as VisualAnalysis;

        if (!finalAnalysis || !finalAnalysis.urgency) {
          throw new Error("Invalid Analysis Response");
        }

        setCurrentAnalysis(finalAnalysis);
        setAnalysisHistory((prev) => [...prev, finalAnalysis!]);

        const newCards = createSymptomCards(finalAnalysis);
        setSymptomCards((prev) => {
          const combined = [...newCards, ...prev];
          const unique = combined.filter(
            (card, index, self) =>
              index ===
              self.findIndex(
                (c) => c.category === card.category && c.value === card.value,
              ),
          );
          return unique.slice(0, 10);
        });

        setSession((prev) =>
          prev
            ? {
                ...prev,
                analysisHistory: [...prev.analysisHistory, finalAnalysis!],
                currentUrgency: finalAnalysis!.urgency,
              }
            : null,
        );

        analysisCountRef.current++;

        const urgencyChanged = lastUrgencyRef.current !== finalAnalysis.urgency;
        console.log("Urgency Check:", {
          previous: lastUrgencyRef.current,
          current: finalAnalysis.urgency,
          changed: urgencyChanged,
        });

        if (urgencyChanged) {
          onUrgencyChange?.(lastUrgencyRef.current, finalAnalysis.urgency);

          const shouldSpeak = shouldSpeakInsight(
            lastUrgencyRef.current,
            finalAnalysis.urgency,
            finalAnalysis,
          );

          if (shouldSpeak) {
            onSpeakableInsight?.(
              finalAnalysis.shortReply,
              finalAnalysis.urgency,
            );
          } else {
            console.log("Not Speaking - Conditions Not Met");
          }
          lastUrgencyRef.current = finalAnalysis.urgency;
        } else {
          console.log("Urgency Unchanged");
        }

        onAnalysisComplete?.(finalAnalysis);

        return finalAnalysis;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Analysis Failed";
        setError(errorMessage);
        onError?.(errorMessage);
        return null;
      } finally {
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
    },
    [
      session,
      isAnalyzing,
      currentAnalysis,
      patientContext,
      createSymptomCards,
      onAnalysisComplete,
      onUrgencyChange,
      onSpeakableInsight,
      onError,
    ],
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    session,
    isAnalyzing,
    currentAnalysis,
    analysisHistory,
    symptomCards,
    analyzeFrame,
    startSession,
    endSession,
    clearHistory,
    error,
    analysisCount: analysisCountRef.current,
  };
}

function shouldSpeakInsight(
  previousUrgency: UrgencyLevel | null,
  currentUrgency: UrgencyLevel,
  analysis: VisualAnalysis,
): boolean {
  if (previousUrgency === null) {
    return true;
  }

  if (previousUrgency) {
    const urgencyOrder: UrgencyLevel[] = ["low", "medium", "high"];
    const prevIndex = urgencyOrder.indexOf(previousUrgency);
    const currIndex = urgencyOrder.indexOf(currentUrgency);

    if (currIndex > prevIndex) {
      console.log("Urgency Escalated");
      return true; // Escalation
    }
  }

  if (currentUrgency === "high") {
    return true;
  }

  if (
    currentUrgency === "medium" &&
    analysis.visibleFinding &&
    analysis.visibleFinding !== "none" &&
    analysis.visibleFinding !== "not visible"
  ) {
    return true;
  }
  return false;
}

export default useTriageAnalysis;
