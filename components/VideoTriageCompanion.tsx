"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn, configureAssistant } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import Image from "next/image";
import Lottie from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";
import { addToSessionHistory } from "@/actions/companion.actions";
import {
  Stethoscope,
  Video,
  VideoOff,
  Camera,
  ChevronDown,
  Loader2,
} from "lucide-react";
import LanguageSelectorDialog from "@/components/language-selector-dialog";

import { useVideoSession } from "@/hooks/use-video-session";
import { useFrameAnalysis } from "@/hooks/use-frame-analysis";
import { useTriageAnalysis } from "@/hooks/use-triage-analysis";
import { useVapiOrchestration } from "@/hooks/use-vapi-orchestration";
import {
  UrgencyBadge,
  SymptomCardsGrid,
  AnalysisStatus,
} from "@/components/triage";
import type { UrgencyLevel } from "@/lib/schemas/video-triage";

const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
};

interface VideoTriageCompanionProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  userDetails: Record<string, any>;
  style: string;
  voice: string;
  enableVideoTriage?: boolean;
}

const VideoTriageCompanion = ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  userDetails,
  style,
  voice,
  enableVideoTriage = true,
}: VideoTriageCompanionProps) => {
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState({
    code: "en",
    name: "English",
    nativeName: "English",
  });

  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [showCameraSelector, setShowCameraSelector] = useState(false);

  const lottieRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const triageSessionRef = useRef<any>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );

  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      localVideoRef.current = node;
      setVideoElement(node);
    }
  }, []);

  // Video Session Hook
  const {
    state: videoState,
    videoRef,
    localStream,
    cameras,
    selectedCamera,
    startCamera,
    stopCamera,
    switchCamera,
  } = useVideoSession({
    onError: (error) => console.error("Video error:", error),
  });

  // Vapi Orchestration Hook
  const {
    isSpeaking: isVapiSpeaking,
    messages,
    speakVisualInsight,
    addTranscriptMessage,
  } = useVapiOrchestration({
    onError: (error) => console.error("Voice orchestration error:", error),
  });

  const handleUrgencyChange = useCallback(
    (oldUrgency: UrgencyLevel | null, newUrgency: UrgencyLevel) => {
      console.log(`Urgency changed: ${oldUrgency} → ${newUrgency}`);

      if (newUrgency === "high" && oldUrgency !== "high") {
        const message = {
          role: "assistant" as const,
          content: `⚠️ [ALERT] Visual analysis indicates elevated urgency. Immediate attention may be recommended.`,
          source: "visual-triage" as const,
          timestamp: Date.now(),
        };
        addTranscriptMessage(message);
      }
    },
    [addTranscriptMessage],
  );

  const handleSpeakableInsight = useCallback(
    (message: string, urgency: UrgencyLevel) => {
      if (callStatus === CallStatus.ACTIVE) {
        speakVisualInsight(message, urgency);
      }
    },
    [callStatus, speakVisualInsight],
  );

  // Triage Analysis Hook
  const {
    session: triageSession,
    isAnalyzing,
    currentAnalysis,
    symptomCards,
    analyzeFrame,
    startSession: startTriageSession,
    endSession: endTriageSession,
  } = useTriageAnalysis({
    patientContext: {
      name: userName,
      symptoms: topic,
      medicalHistory: userDetails,
    },
    onUrgencyChange: handleUrgencyChange,
    onSpeakableInsight: handleSpeakableInsight,
    onError: (error) => console.error("Analysis Error:", error),
  });

  useEffect(() => {
    triageSessionRef.current = triageSession;
  }, [triageSession]);

  const handleFrameCapture = useCallback(
    (frameBase64: string, timestamp: number) => {
      console.log(
        "Frame Captured At",
        new Date(timestamp).toISOString(),
        "Size:",
        frameBase64.length,
        "Bytes",
      );
      console.log(
        "  Triage Session Active:",
        triageSessionRef.current?.isActive,
        "| Already Analyzing:",
        isAnalyzing,
      );

      if (!isAnalyzing) {
        analyzeFrame(frameBase64);
      } else {
        console.log("Analysis Already in Progress, Skipping this Frame");
      }
    },
    [isAnalyzing, analyzeFrame],
  );

  // Frame Analysis Hook
  const {
    state: frameState,
    isCapturing,
    startCapture,
    stopCapture,
  } = useFrameAnalysis({
    videoElement: videoElement,
    intervalMs: 4000,
    enabled: isVideoEnabled && callStatus === CallStatus.ACTIVE,
    onFrame: handleFrameCapture,
    onError: (error) => console.error("Frame Capture Error:", error),
  });

  useEffect(() => {
    if (!videoElement || !localStream) return;

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.warn("No Video Tracks in Stream");
      return;
    }

    videoElement.srcObject = null;
    videoElement.srcObject = localStream;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = true;

    const handleLoadedMetadata = () => {
      videoElement.play().catch((err) => {
        console.warn("Play Failed:", err);
      });
    };

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (videoElement.readyState >= 1) {
      videoElement.play().catch(console.warn);
    }

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [localStream, videoElement]);

  useEffect(() => {
    const shouldCapture =
      isVideoEnabled &&
      callStatus === CallStatus.ACTIVE &&
      videoElement !== null &&
      !isCapturing;

    console.log("Capture Conditions Check:", {
      isVideoEnabled,
      callStatus,
      triageSessionActive: triageSession?.isActive,
      hasVideoElement: videoElement !== null,
      isCapturing,
      shouldCapture,
    });

    if (shouldCapture) {
      startCapture();
    }
  }, [isVideoEnabled, callStatus, videoElement, isCapturing, startCapture]);

  useEffect(() => {
    if (
      enableVideoTriage &&
      isVideoEnabled &&
      callStatus === CallStatus.ACTIVE &&
      !triageSession?.isActive
    ) {
      console.log("Auto-Starting Triage Session");
      startTriageSession();
    }
  }, [
    enableVideoTriage,
    isVideoEnabled,
    callStatus,
    triageSession?.isActive,
    startTriageSession,
  ]);

  useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking || isVapiSpeaking) {
        lottieRef.current?.play();
      } else {
        lottieRef.current?.stop();
      }
    }
  }, [isSpeaking, isVapiSpeaking]);

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      addToSessionHistory(companionId);
      if (isVideoEnabled) {
        endTriageSession();
        stopCapture();
      }
    };

    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = {
          role: message.role,
          content: message.transcript,
          source: "vapi" as const,
          timestamp: Date.now(),
        };
        addTranscriptMessage(newMessage);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: any) => console.log("Vapi Error", error);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
    };
  }, [
    companionId,
    isVideoEnabled,
    endTriageSession,
    stopCapture,
    addTranscriptMessage,
  ]);
  const toggleMicrophone = () => {
    const isMutedNow = vapi.isMuted();
    vapi.setMuted(!isMutedNow);
    setIsMuted(!isMutedNow);
  };
  const handleCall = async () => {
    setShowLanguageDialog(true);
  };
  const handleLanguageSelect = (language: any) => {
    setSelectedLanguage(language);
    startCallWithLanguage(language.code);
  };
  const startCallWithLanguage = async (languageCode: string) => {
    console.log(
      "Starting Call with Language:",
      languageCode,
      "Video Enabled:",
      isVideoEnabled,
    );
    setCallStatus(CallStatus.CONNECTING);

    if (enableVideoTriage && isVideoEnabled) {
      console.log("Starting triage session and frame capture...");
      startTriageSession();
      startCapture();
    } else {
      console.log(
        "Video Triage Not Enabled or Video off, Skipping Triage Setup",
      );
    }

    const assistantOverrides = {
      variableValues: { subject, topic, style },
      clientMessages: ["transcript" as const],
      serverMessages: [] as const,
    };

    vapi.start(
      configureAssistant(
        name,
        subject,
        topic,
        voice,
        style,
        userDetails,
        languageCode,
      ),
      assistantOverrides as any,
    );
  };
  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();

    if (isVideoEnabled) {
      endTriageSession();
      stopCapture();
    }
  };

  const toggleVideo = useCallback(async () => {
    console.log(
      "Toggling Video, Current State:",
      isVideoEnabled,
      "Call status:",
      callStatus,
    );

    if (isVideoEnabled) {
      console.log("Turning Off Video...");
      stopCamera();
      stopCapture();
      setIsVideoEnabled(false);
    } else {
      console.log("Turning On Video...");
      await startCamera();
      setIsVideoEnabled(true);

      if (callStatus === CallStatus.ACTIVE) {
        console.log("Call is Active, Starting Triage Session and Capture...");
        startTriageSession();
      } else {
        console.log("Call Not Active Yet, Triage will Start When Call Begins");
      }
    }
  }, [
    isVideoEnabled,
    stopCamera,
    stopCapture,
    startCamera,
    callStatus,
    startTriageSession,
    startCapture,
  ]);

  // Handle camera selection
  const handleCameraSelect = async (deviceId: string) => {
    await switchCamera(deviceId);
    setShowCameraSelector(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopCapture();
      endTriageSession();
    };
  }, [stopCamera, stopCapture, endTriageSession]);

  // Get current camera label
  const currentCameraLabel =
    cameras.find((c) => c.deviceId === selectedCamera)?.label ||
    "Select Camera";

  return (
    <section className="flex flex-col gap-6">
      {/* Language Selection Dialog */}
      <LanguageSelectorDialog
        open={showLanguageDialog}
        onClose={() => setShowLanguageDialog(false)}
        onSelect={handleLanguageSelect}
      />

      {/* Main Grid - Doctor Panel and User Panel */}
      <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Doctor/AI Panel - ORIGINAL LAYOUT */}
        <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="relative flex h-65 w-65 items-center justify-center rounded-lg bg-emerald-600">
            <div
              className={cn(
                "absolute transition-opacity duration-1000",
                callStatus === CallStatus.FINISHED ||
                  callStatus === CallStatus.INACTIVE
                  ? "opacity-100"
                  : "opacity-0",
                callStatus === CallStatus.CONNECTING &&
                  "animate-pulse opacity-100",
              )}
            >
              <Stethoscope size={150} className="text-foreground" />
            </div>

            <div
              className={cn(
                "absolute transition-opacity duration-1000",
                callStatus === CallStatus.ACTIVE ? "opacity-100" : "opacity-0",
              )}
            >
              <Lottie
                lottieRef={lottieRef}
                animationData={soundwaves}
                autoplay={false}
                className="h-48 w-48"
              />
            </div>
          </div>
          <p className="text-center text-xl font-bold text-gray-900 dark:text-gray-100">
            {name}
          </p>
        </div>

        {/* User Section - WITH VIDEO PREVIEW */}
        <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            {/* Video Preview OR User Image */}
            {isVideoEnabled && videoState.isConnected ? (
              <div className="relative w-full max-w-65 aspect-video rounded-lg overflow-hidden bg-gray-900">
                <video
                  ref={videoCallbackRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                {/* Live indicator */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-white">LIVE</span>
                </div>
                {/* Analyzing indicator */}
                {isAnalyzing && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-emerald-600/80 px-2 py-0.5 backdrop-blur-sm">
                    <Loader2 className="h-3 w-3 animate-spin text-white" />
                    <span className="text-xs text-white">Analyzing</span>
                  </div>
                )}
                {/* Urgency badge */}
                {currentAnalysis && callStatus === CallStatus.ACTIVE && (
                  <div className="absolute bottom-2 left-2">
                    <UrgencyBadge
                      urgency={currentAnalysis.urgency}
                      size="sm"
                      pulse={currentAnalysis.urgency === "high"}
                    />
                  </div>
                )}
              </div>
            ) : isVideoEnabled && videoState.isLoading ? (
              <div className="flex w-full max-w-65 aspect-video items-center justify-center rounded-lg bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <Image
                src={userImage}
                alt={userName}
                width={130}
                height={130}
                className="rounded-full"
              />
            )}

            <p className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
              {userName}
            </p>

            {callStatus !== CallStatus.INACTIVE && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-800 dark:bg-emerald-950/30">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Language: {selectedLanguage.nativeName}
                </span>
              </div>
            )}
          </div>

          {/* Camera Selector Dropdown */}
          {enableVideoTriage && isVideoEnabled && cameras.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowCameraSelector(!showCameraSelector)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="truncate">{currentCameraLabel}</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showCameraSelector && "rotate-180",
                  )}
                />
              </button>

              {showCameraSelector && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {cameras.map((camera) => (
                    <button
                      key={camera.deviceId}
                      onClick={() => handleCameraSelect(camera.deviceId)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700",
                        camera.deviceId === selectedCamera &&
                          "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                      )}
                    >
                      <Camera className="h-4 w-4" />
                      <span className="truncate">{camera.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual Analysis Trigger - For Debugging */}
          {enableVideoTriage &&
            isVideoEnabled &&
            callStatus === CallStatus.ACTIVE && (
              <button
                onClick={() => {
                  console.log("Start Analysis Button Clicked", {
                    triageSessionActive: triageSession?.isActive,
                    isCapturing,
                    videoElementSet: videoElement !== null,
                    callStatus,
                    isVideoEnabled,
                  });

                  if (!videoElement) {
                    console.error(
                      "Video element not ready. Please wait a moment and try again.",
                    );
                    return;
                  }

                  if (!triageSession?.isActive) {
                    console.log("Starting new triage session...");
                    startTriageSession();
                    setTimeout(() => {
                      console.log("Now starting frame capture...");
                      startCapture();
                    }, 500);
                  } else if (!isCapturing) {
                    console.log("Triage session active, starting frame capture...");
                    startCapture();
                  } else {
                    console.log(
                      "Already Capturing, Frame Count:",
                      frameState.frameCount,
                    );
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              >
                <Loader2
                  className={cn("h-4 w-4", isCapturing && "animate-spin")}
                />
                <span>
                  {isCapturing
                    ? `Analyzing (${frameState.frameCount})`
                    : "Start Analysis"}
                </span>
              </button>
            )}

          {/* Audio & Video Buttons Side by Side */}
          <div className="flex gap-2">
            {/* Microphone Button */}
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              onClick={toggleMicrophone}
              disabled={callStatus !== CallStatus.ACTIVE}
            >
              <Image
                src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
                alt="mic"
                width={20}
                height={20}
                className="h-5 w-5 dark:invert"
              />
              <span className="hidden sm:inline">
                {isMuted ? "Unmute" : "Mute"}
              </span>
            </button>

            {/* Video Toggle Button */}
            {enableVideoTriage && (
              <button
                onClick={toggleVideo}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition-colors",
                  isVideoEnabled
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                )}
              >
                {isVideoEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
                <span className="hidden sm:inline">
                  {isVideoEnabled ? "Video On" : "Video Off"}
                </span>
              </button>
            )}
          </div>

          {/* Start/End Session Button */}
          <button
            className={cn(
              "w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90",
              callStatus === CallStatus.ACTIVE
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700",
              callStatus === CallStatus.CONNECTING && "animate-pulse",
            )}
            onClick={
              callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall
            }
          >
            {callStatus === CallStatus.ACTIVE
              ? "End Session"
              : callStatus === CallStatus.CONNECTING
                ? "Connecting..."
                : "Start Session"}
          </button>
        </div>
      </section>

      {/* Visual Analysis Section */}
      {enableVideoTriage &&
        isVideoEnabled &&
        callStatus === CallStatus.ACTIVE && (
          <>
            <section className="grid gap-6 md:grid-cols-2">
              {/* Analysis Status */}
              <AnalysisStatus
                isActive={triageSession?.isActive || false}
                isAnalyzing={isAnalyzing}
                isSpeaking={isVapiSpeaking}
                currentAnalysis={currentAnalysis}
                frameCount={frameState.frameCount}
                error={triageSession ? null : "Session Not Started"}
              />

              {/* Symptom Cards */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-3 text-md font-semibold text-gray-900 dark:text-gray-100">
                  Visual Observations
                </h3>
                <SymptomCardsGrid cards={symptomCards} maxCards={3} />
              </div>
            </section>
          </>
        )}

      {/* Transcript Section */}
      <section className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Conversation Transcript
          </h2>
          {isVideoEnabled && callStatus === CallStatus.ACTIVE && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Camera className="h-5 w-5" />
              <span>Video Triage Active</span>
            </div>
          )}
        </div>
        <div className="no-scrollbar flex max-h-75 flex-col-reverse gap-3 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Start a Session to See the Conversation Transcript Here
            </p>
          ) : (
            messages.map((message, index) => {
              const isVisualTriage = message.source === "visual-triage";

              if (message.role === "assistant") {
                return (
                  <p
                    key={index}
                    className={cn(
                      "text-sm",
                      isVisualTriage
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-800 dark:text-gray-200",
                    )}
                  >
                    <span
                      className={cn(
                        "font-semibold",
                        isVisualTriage
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {isVisualTriage
                        ? "Visual AI:"
                        : `${name?.split(" ")[0]?.replace(/[.,]/g, "") || "Companion"}:`}
                    </span>{" "}
                    {message.content}
                  </p>
                );
              } else {
                return (
                  <p
                    key={index}
                    className="text-sm text-gray-800 dark:text-gray-200"
                  >
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {userName}:
                    </span>{" "}
                    {message.content}
                  </p>
                );
              }
            })
          )}
        </div>
        {messages.length >= 4 && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white to-transparent dark:from-gray-900" />
        )}
      </section>
    </section>
  );
};

export default VideoTriageCompanion;
