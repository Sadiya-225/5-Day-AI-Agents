"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Room, RoomEvent, Track, ConnectionState } from "livekit-client";
import type { VideoSessionState, LiveKitTokenResponse } from "@/lib/schemas/video-triage";

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface UseVideoSessionOptions {
  roomName?: string;
  participantName?: string;
  enableLiveKit?: boolean;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

interface UseVideoSessionReturn {
  // State
  state: VideoSessionState;
  // Refs
  videoRef: React.RefObject<HTMLVideoElement | null>;
  localStream: MediaStream | null;
  // Camera devices
  cameras: CameraDevice[];
  selectedCamera: string | null;
  // Actions
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  refreshCameras: () => Promise<CameraDevice[]>;
  connectToRoom: () => Promise<void>;
  disconnectFromRoom: () => void;
  // LiveKit
  room: Room | null;
  isLiveKitConnected: boolean;
}

export function useVideoSession(options: UseVideoSessionOptions = {}): UseVideoSessionReturn {
  const {
    roomName,
    participantName = "Patient",
    enableLiveKit = false,
    onConnectionChange,
    onError,
  } = options;

  // State
  const [state, setState] = useState<VideoSessionState>({
    isConnected: false,
    hasCamera: false,
    hasPermission: false,
    isLoading: false,
    error: null,
  });

  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Refresh available cameras
  const refreshCameras = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));

      setCameras(videoDevices);
      setState(prev => ({ ...prev, hasCamera: videoDevices.length > 0 }));

      return videoDevices;
    } catch (error) {
      console.error("Error enumerating cameras:", error);
      return [];
    }
  }, []);

  // Check camera availability on mount
  useEffect(() => {
    refreshCameras();

    // Listen for device changes
    const handleDeviceChange = () => {
      refreshCameras();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [refreshCameras]);

  // Start local camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Build video constraints
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 30, max: 30 },
      };

      // Use specific device if provided
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
      } else {
        videoConstraints.facingMode = "user";
      }

      // Request camera permission with constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false, // Audio handled separately by Vapi
      });

      streamRef.current = stream;
      setLocalStream(stream);

      // Get the actual device being used
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      if (settings.deviceId) {
        setSelectedCamera(settings.deviceId);
      }

      // Refresh camera list to get labels (now that we have permission)
      await refreshCameras();

      // Attach stream to video element - FIXED: proper video element setup
      if (videoRef.current) {
        // Reset the video element first
        videoRef.current.pause();
        videoRef.current.srcObject = null;

        // Set the new stream
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;

        // Force play after a small delay to ensure stream is ready
        setTimeout(() => {
          if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.play().catch((err) => {
              console.warn("Video autoplay issue:", err);
            });
          }
        }, 100);
      }

      setState(prev => ({
        ...prev,
        isConnected: true,
        hasPermission: true,
        isLoading: false,
        error: null,
      }));

      onConnectionChange?.(true);
    } catch (error) {
      const errorMessage = getMediaErrorMessage(error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        hasPermission: false,
        isLoading: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  }, [onConnectionChange, onError, refreshCameras]);

  // Switch to a different camera
  const switchCamera = useCallback(async (deviceId: string) => {
    if (deviceId === selectedCamera) return;
    await startCamera(deviceId);
  }, [selectedCamera, startCamera]);

  // Stop local camera stream
  const stopCamera = useCallback(() => {
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      setLocalStream(null);
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      error: null,
    }));

    onConnectionChange?.(false);
  }, [onConnectionChange]);

  // Connect to LiveKit room (optional, for multi-party calls)
  const connectToRoom = useCallback(async () => {
    if (!enableLiveKit || !roomName) {
      console.warn("LiveKit not enabled or room name not provided");
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch token from API
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName,
          participantName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get room token");
      }

      const { token }: LiveKitTokenResponse = await response.json();

      // Create room instance
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 640, height: 480 },
        },
      });

      // Set up room event handlers
      room.on(RoomEvent.Connected, () => {
        setIsLiveKitConnected(true);
        setState(prev => ({ ...prev, isLoading: false }));
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsLiveKitConnected(false);
      });

      room.on(RoomEvent.ConnectionStateChanged, (connectionState: ConnectionState) => {
        if (connectionState === ConnectionState.Disconnected) {
          setIsLiveKitConnected(false);
        }
      });

      // Connect to room
      const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!livekitUrl) {
        throw new Error("LiveKit URL not configured");
      }

      await room.connect(livekitUrl, token);
      roomRef.current = room;

      // Publish local video track if we have a stream
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          await room.localParticipant.publishTrack(videoTrack, {
            name: "patient-camera",
            source: Track.Source.Camera,
          });
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to room";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  }, [enableLiveKit, roomName, participantName, onError]);

  // Disconnect from LiveKit room
  const disconnectFromRoom = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsLiveKitConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  // Handle tab visibility change - pause camera when hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => {
          track.enabled = false;
        });
      } else if (!document.hidden && streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => {
          track.enabled = true;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    state,
    videoRef,
    localStream,
    cameras,
    selectedCamera,
    startCamera,
    stopCamera,
    switchCamera,
    refreshCameras,
    connectToRoom,
    disconnectFromRoom,
    room: roomRef.current,
    isLiveKitConnected,
  };
}

// Helper function to get user-friendly error messages
function getMediaErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Camera permission denied. Please allow camera access in your browser settings.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No camera found. Please connect a camera and try again.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "Camera is in use by another application. Please close other apps using the camera.";
    }
    if (error.name === "OverconstrainedError") {
      return "Camera does not meet the required specifications.";
    }
    if (error.name === "TypeError") {
      return "Invalid camera configuration.";
    }
    return error.message;
  }
  return "An unexpected error occurred while accessing the camera.";
}

export default useVideoSession;
