"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FrameProcessingState } from "@/lib/schemas/video-triage";

interface UseFrameAnalysisOptions {
  videoElement: HTMLVideoElement | null;
  intervalMs?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  skipSimilarFrames?: boolean;
  similarityThreshold?: number;
  enabled?: boolean;
  onFrame?: (frameBase64: string, timestamp: number) => void;
  onError?: (error: string) => void;
}

interface UseFrameAnalysisReturn {
  state: FrameProcessingState;
  isCapturing: boolean;
  startCapture: () => void;
  stopCapture: () => void;
  captureFrame: () => string | null;
  lastFrameBase64: string | null;
}

export function useFrameAnalysis(
  options: UseFrameAnalysisOptions,
): UseFrameAnalysisReturn {
  const {
    videoElement,
    intervalMs = 4000, // Default 4 Seconds
    maxWidth = 640,
    maxHeight = 480,
    quality = 0.7, // JPEG Quality (0-1)
    skipSimilarFrames = true,
    similarityThreshold = 0.95,
    enabled = true,
    onFrame,
    onError,
  } = options;

  // State
  const [state, setState] = useState<FrameProcessingState>({
    isProcessing: false,
    lastProcessedAt: null,
    frameCount: 0,
    errorCount: 0,
    lastError: null,
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [lastFrameBase64, setLastFrameBase64] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameDataRef = useRef<ImageData | null>(null);
  const isPausedRef = useRef(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    videoElementRef.current = videoElement;
  }, [videoElement]);

  // Initialize canvas
  useEffect(() => {
    if (typeof window !== "undefined") {
      canvasRef.current = document.createElement("canvas");
    }
    return () => {
      canvasRef.current = null;
    };
  }, []);

  const calculateSimilarity = useCallback(
    (imageData1: ImageData, imageData2: ImageData): number => {
      if (
        imageData1.width !== imageData2.width ||
        imageData1.height !== imageData2.height
      ) {
        return 0;
      }

      const data1 = imageData1.data;
      const data2 = imageData2.data;
      let matchingPixels = 0;
      const totalPixels = data1.length / 4;

      for (let i = 0; i < data1.length; i += 40) {
        const diff =
          Math.abs(data1[i] - data2[i]) +
          Math.abs(data1[i + 1] - data2[i + 1]) +
          Math.abs(data1[i + 2] - data2[i + 2]);

        if (diff < 30) {
          matchingPixels++;
        }
      }

      return matchingPixels / (totalPixels / 10);
    },
    [],
  );

  const captureFrame = useCallback((): string | null => {
    const video = videoElementRef.current;
    const canvas = canvasRef.current;

    if (!video) {
      console.log("Frame Capture: No Video Element");
      return null;
    }

    if (!canvas) {
      console.log("Frame Capture: No Canvas");
      return null;
    }

    if (video.readyState < 2) {
      console.log(
        "Frame Capture: Video Not Ready, readyState:",
        video.readyState,
      );
      return null;
    }

    try {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      if (videoWidth === 0 || videoHeight === 0) {
        console.log("Frame Capture: Video Dimensions are 0");
        return null;
      }

      const aspectRatio = videoWidth / videoHeight;
      let targetWidth = Math.min(videoWidth, maxWidth);
      let targetHeight = targetWidth / aspectRatio;

      if (targetHeight > maxHeight) {
        targetHeight = maxHeight;
        targetWidth = targetHeight * aspectRatio;
      }

      canvas.width = Math.round(targetWidth);
      canvas.height = Math.round(targetHeight);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        return null;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const currentImageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      if (skipSimilarFrames && lastFrameDataRef.current) {
        const similarity = calculateSimilarity(
          currentImageData,
          lastFrameDataRef.current,
        );
        if (similarity > similarityThreshold) {
          console.log(
            "Frame Capture: Skipping Similar Frame, Similarity:",
            similarity,
          );
          return null;
        }
      }

      lastFrameDataRef.current = currentImageData;

      // Convert to base64 JPEG
      const base64 = canvas.toDataURL("image/jpeg", quality);
      const frameBase64 = base64.replace(/^data:image\/jpeg;base64,/, "");

      console.log("Frame Captured Successfully, Size:", frameBase64.length);

      setLastFrameBase64(frameBase64);
      setState((prev) => ({
        ...prev,
        frameCount: prev.frameCount + 1,
        lastProcessedAt: Date.now(),
      }));

      return frameBase64;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Frame capture failed";
      console.error("Frame Capture Error:", errorMessage);
      setState((prev) => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        lastError: errorMessage,
      }));
      onError?.(errorMessage);
      return null;
    }
  }, [
    maxWidth,
    maxHeight,
    quality,
    skipSimilarFrames,
    similarityThreshold,
    calculateSimilarity,
    onError,
  ]);

  const processFrame = useCallback(() => {
    if (isPausedRef.current) {
      return;
    }

    setState((prev) => ({ ...prev, isProcessing: true }));

    const frameBase64 = captureFrame();

    if (frameBase64) {
      onFrame?.(frameBase64, Date.now());
    }

    setState((prev) => ({ ...prev, isProcessing: false }));
  }, [captureFrame, onFrame]);

  const startCapture = useCallback(() => {
    if (intervalRef.current) {
      console.log("Frame Capture Already Running");
      return;
    }

    if (!videoElementRef.current) {
      console.error("Cannot Start Frame Capture, No Video Element");
      onError?.("No Video Element Available for Frame Capture");
      return;
    }

    if (!enabled) {
      console.warn("Frame Capture is Disabled. Check Video and Call Status.");
      onError?.("Frame Capture Disabled - Video or Call Not Active");
      return;
    }

    console.log("Starting Frame Capture with Interval:", intervalMs);
    setIsCapturing(true);
    isPausedRef.current = false;

    setTimeout(() => {
      console.log("Triggering First Frame Capture...");
      processFrame();
      intervalRef.current = setInterval(() => {
        processFrame();
      }, intervalMs);
    }, 1000);
  }, [processFrame, intervalMs, enabled, onError]);

  const stopCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsCapturing(false);
    isPausedRef.current = false;
    lastFrameDataRef.current = null;

    setState((prev) => ({
      ...prev,
      isProcessing: false,
    }));
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPausedRef.current = document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled && isCapturing) {
      stopCapture();
    }
  }, [enabled, isCapturing, stopCapture]);

  return {
    state,
    isCapturing,
    startCapture,
    stopCapture,
    captureFrame,
    lastFrameBase64,
  };
}

export default useFrameAnalysis;
