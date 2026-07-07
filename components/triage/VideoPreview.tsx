"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Camera, CameraOff, Video, VideoOff, Loader2 } from "lucide-react";

interface VideoPreviewProps {
  isConnected: boolean;
  isLoading?: boolean;
  isAnalyzing?: boolean;
  hasPermission?: boolean;
  error?: string | null;
  onRequestCamera?: () => void;
  className?: string;
  showOverlay?: boolean;
  showAnalyzingIndicator?: boolean;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  (
    {
      isConnected,
      isLoading = false,
      isAnalyzing = false,
      hasPermission = false,
      error,
      onRequestCamera,
      className,
      showOverlay = true,
      showAnalyzingIndicator = true,
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-gray-900",
          "aspect-video w-full",
          className
        )}
      >
        {/* Video Element */}
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className={cn(
            "h-full w-full object-cover",
            !isConnected && "hidden"
          )}
        />

        {/* Placeholder when no camera */}
        {!isConnected && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-800 to-gray-900">
            {error ? (
              <>
                <CameraOff className="h-16 w-16 text-red-400" />
                <p className="max-w-xs text-center text-sm text-red-300">
                  {error}
                </p>
                {onRequestCamera && (
                  <button
                    onClick={onRequestCamera}
                    className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    Try Again
                  </button>
                )}
              </>
            ) : (
              <>
                <Camera className="h-16 w-16 text-gray-500" />
                <p className="text-center text-sm text-gray-400">
                  Camera not connected
                </p>
                {onRequestCamera && (
                  <button
                    onClick={onRequestCamera}
                    className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    Enable Camera
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/90">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-300">Connecting camera...</p>
          </div>
        )}

        {/* Overlay when connected */}
        {isConnected && showOverlay && (
          <>
            {/* Camera Active Indicator */}
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs font-medium text-white">LIVE</span>
              </div>
            </div>

            {/* Analyzing Indicator */}
            {showAnalyzingIndicator && isAnalyzing && (
              <div className="absolute right-3 top-3">
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-600/80 px-2.5 py-1 backdrop-blur-sm">
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                  <span className="text-xs font-medium text-white">
                    Analyzing
                  </span>
                </div>
              </div>
            )}

            {/* Frame border for visual feedback during analysis */}
            {isAnalyzing && (
              <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-emerald-500/50 transition-all duration-300" />
            )}
          </>
        )}
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;
