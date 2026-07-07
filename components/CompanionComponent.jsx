"use client";

import { useEffect, useRef, useState } from "react";
import { cn, configureAssistant } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import Image from "next/image";
import Lottie from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";
import { addToSessionHistory } from "@/actions/companion.actions";
import { Stethoscope } from "lucide-react";
import LanguageSelectorDialog from "@/components/language-selector-dialog";

const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
};

const CompanionComponent = ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  userDetails,
  style,
  voice,
}) => {
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState({ code: "en", name: "English", nativeName: "English" });

  const lottieRef = useRef(null);

  useEffect(() => {
    if (lottieRef) {
      if (isSpeaking) {
        lottieRef.current?.play();
      } else {
        lottieRef.current?.stop();
      }
    }
  }, [isSpeaking, lottieRef]);

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      addToSessionHistory(companionId);
    };

    const onMessage = (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [newMessage, ...prev]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error) => console.log("Error", error);

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
  }, []);

  const toggleMicrophone = () => {
    const isMutedNow = vapi.isMuted();
    vapi.setMuted(!isMutedNow);
    setIsMuted(!isMutedNow);
  };

  const handleCall = async () => {
    // Show language selection dialog before starting call
    setShowLanguageDialog(true);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    startCallWithLanguage(language.code);
  };

  const startCallWithLanguage = (languageCode) => {
    setCallStatus(CallStatus.CONNECTING);

    const assistantOverrides = {
      variableValues: { subject, topic, style },
      clientMessages: ["transcript"],
      serverMessages: [],
    };

    vapi.start(
      configureAssistant(name, subject, topic, voice, style, userDetails, languageCode),
      assistantOverrides
    );
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <section className="flex flex-col gap-6">
      {/* Language Selection Dialog */}
      <LanguageSelectorDialog
        open={showLanguageDialog}
        onClose={() => setShowLanguageDialog(false)}
        onSelect={handleLanguageSelect}
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                  "animate-pulse opacity-100"
              )}
            >
              <Stethoscope size={150} className="text-foreground" />
            </div>

            <div
              className={cn(
                "absolute transition-opacity duration-1000",
                callStatus === CallStatus.ACTIVE ? "opacity-100" : "opacity-0"
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

        {/* User Section */}
        <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            <Image
              src={userImage}
              alt={userName}
              width={130}
              height={130}
              className="rounded-full"
            />
            <p className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
              {userName}
            </p>
            {callStatus !== CallStatus.INACTIVE && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 border border-emerald-200 dark:border-emerald-800">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Language: {selectedLanguage.nativeName}
                </span>
              </div>
            )}
          </div>

          <button
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            onClick={toggleMicrophone}
            disabled={callStatus !== CallStatus.ACTIVE}
          >
            <Image
              src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
              alt="mic"
              width={24}
              height={24}
              className="h-6 w-6 dark:invert"
            />
            <span>
              {isMuted ? "Turn On Microphone" : "Turn Off Microphone"}
            </span>
          </button>

          <button
            className={cn(
              "w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90",
              callStatus === CallStatus.ACTIVE
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700",
              callStatus === CallStatus.CONNECTING && "animate-pulse"
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

      {/* Transcript Section */}
      <section className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Conversation Transcript
        </h2>
        <div className="no-scrollbar flex max-h-75 flex-col-reverse gap-3 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Start a Session to See the Conversation Transcript Here
            </p>
          ) : (
            messages.map((message, index) => {
              if (message.role === "assistant") {
                return (
                  <p
                    key={index}
                    className="text-sm text-gray-800 dark:text-gray-200"
                  >
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {name?.split(" ")[0]?.replace(/[.,]/g, "") || "Companion"}
                      :
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

export default CompanionComponent;
