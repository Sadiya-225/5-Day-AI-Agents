"use client";

import { cn } from "@/lib/utils";
import { UrgencyBadge } from "./UrgencyBadge";
import type { VisualAnalysis, UrgencyLevel } from "@/lib/schemas/video-triage";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Volume2,
  VolumeX,
} from "lucide-react";

interface AnalysisStatusProps {
  isActive: boolean;
  isAnalyzing: boolean;
  isSpeaking?: boolean;
  currentAnalysis: VisualAnalysis | null;
  frameCount: number;
  error?: string | null;
  className?: string;
}

export function AnalysisStatus({
  isActive,
  isAnalyzing,
  isSpeaking = false,
  currentAnalysis,
  frameCount,
  error,
  className,
}: AnalysisStatusProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800",
        "border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
          AI Visual Analysis
        </h3>
        {isActive && (
          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <Volume2 className="h-4 w-4 animate-pulse text-emerald-500" />
            ) : (
              <VolumeX className="h-4 w-4 text-gray-400" />
            )}
            {currentAnalysis && (
              <UrgencyBadge urgency={currentAnalysis.urgency} size="sm" />
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-3">
        {!isActive && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Analysis Inactive</span>
          </div>
        )}

        {isActive && isAnalyzing && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing Video Frame...</span>
          </div>
        )}

        {isActive && !isAnalyzing && !error && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">
              Monitoring ({frameCount} Frames Analyzed)
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Current Analysis Summary */}
      {isActive && currentAnalysis && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Latest Observation
          </p>
          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {currentAnalysis.shortReply}
          </p>
        </div>
      )}
    </div>
  );
}

// Compact inline status for header/toolbar
interface AnalysisStatusInlineProps {
  isActive: boolean;
  isAnalyzing: boolean;
  urgency?: UrgencyLevel;
  className?: string;
}

export function AnalysisStatusInline({
  isActive,
  isAnalyzing,
  urgency,
  className,
}: AnalysisStatusInlineProps) {
  if (!isActive) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400",
          className,
        )}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        <span>Analysis Off</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm",
        isAnalyzing
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        className,
      )}
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Analyzing</span>
        </>
      ) : (
        <>
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
          <span>Active</span>
        </>
      )}
      {urgency && (
        <UrgencyBadge urgency={urgency} size="sm" showLabel={false} />
      )}
    </div>
  );
}

export default AnalysisStatus;
