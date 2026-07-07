"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  endAppointmentCall,
  getAppointmentParticipants,
} from "@/actions/appointments";

export default function VideoCall({ sessionId, token, appointmentId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [role, setRole] = useState(null);

  const [joined, setJoined] = useState({ doctor: false, patient: false });

  const sessionRef = useRef(null);
  const publisherRef = useRef(null);

  const router = useRouter();
  const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

  useEffect(() => {
    async function fetchParticipants() {
      const res = await getAppointmentParticipants(appointmentId);
      if (res.success) {
        const { data: fetchedParticipants, currentUserId } = res;
        if (currentUserId === fetchedParticipants.doctorId) {
          setRole("DOCTOR");
        } else if (currentUserId === fetchedParticipants.patientId) {
          setRole("PATIENT");
        } else {
          setRole(null);
        }
      } else {
        console.error("Error Fetching Participants:", res.error);
      }
    }

    if (appointmentId) fetchParticipants();
  }, [appointmentId]);

  useEffect(() => {
    if (!isConnected || !role) return;

    if (role === "DOCTOR") {
      setJoined((prev) => ({ ...prev, doctor: true }));
    } else if (role === "PATIENT") {
      setJoined((prev) => ({ ...prev, patient: true }));
    }
  }, [role, isConnected]);

  const handleScriptLoad = () => {
    setScriptLoaded(true);
    if (!window.OT) {
      toast.error("Failed to Load Vonage Video API");
      setIsLoading(false);
      return;
    }
    initializeSession();
  };

  const initializeSession = () => {
    if (!appId || !sessionId || !token) {
      toast.error("Missing Required Video Call Parameters");
      router.push("/appointments");
      return;
    }

    try {
      sessionRef.current = window.OT.initSession(appId, sessionId);

      sessionRef.current.on("streamCreated", (event) => {
        let connData = null;
        try {
          const raw = event.stream?.connection?.data;
          connData = raw ? JSON.parse(raw) : null;
        } catch (err) {
          console.warn("Failed to parse stream connection data:", err);
        }

        if (connData?.role) {
          setJoined((prev) => ({
            ...prev,
            doctor: prev.doctor || connData.role === "DOCTOR",
            patient: prev.patient || connData.role === "PATIENT",
          }));
        }

        sessionRef.current.subscribe(
          event.stream,
          "subscriber",
          {
            insertMode: "append",
            width: "100%",
            height: "100%",
          },
          (error) => {
            if (error) {
              toast.error("Error Connecting to Other Participant's Stream");
            }
          }
        );
      });

      sessionRef.current.on("streamDestroyed", (event) => {
        let connData = null;
        try {
          const raw = event.stream?.connection?.data;
          connData = raw ? JSON.parse(raw) : null;
        } catch (err) {
          console.warn(
            "Failed to parse stream connection data on destroy:",
            err
          );
        }

        if (connData?.role) {
          setJoined((prev) => ({
            ...prev,
            doctor: connData.role === "DOCTOR" ? false : prev.doctor,
            patient: connData.role === "PATIENT" ? false : prev.patient,
          }));
        }
      });

      sessionRef.current.on("sessionConnected", () => {
        setIsConnected(true);
        setIsLoading(false);

        publisherRef.current = window.OT.initPublisher(
          "publisher",
          {
            insertMode: "replace",
            width: "100%",
            height: "100%",
            publishAudio: isAudioEnabled,
            publishVideo: isVideoEnabled,
          },
          (error) => {
            if (error) {
              console.error("Publisher Error:", error);
              toast.error("Error Initializing Your Camera and Microphone");
            } else {
              sessionRef.current.publish(publisherRef.current, (pubErr) => {
                if (pubErr) {
                  console.error("Error Publishing Stream:", pubErr);
                  toast.error("Error Publishing Your Stream");
                } else {
                  if (role === "DOCTOR") {
                    setJoined((prev) => ({ ...prev, doctor: true }));
                  } else if (role === "PATIENT") {
                    setJoined((prev) => ({ ...prev, patient: true }));
                  }
                }
              });
            }
          }
        );
      });

      sessionRef.current.on("sessionDisconnected", () => {
        setIsConnected(false);
      });

      sessionRef.current.connect(token, (error) => {
        if (error) {
          toast.error("Error Connecting to Video Session");
          setIsLoading(false);
        }
      });
    } catch (error) {
      toast.error("Failed to Initialize Video Call");
      setIsLoading(false);
      console.error(error);
    }
  };

  const toggleVideo = () => {
    if (publisherRef.current) {
      publisherRef.current.publishVideo(!isVideoEnabled);
      setIsVideoEnabled((prev) => !prev);
    }
  };

  const toggleAudio = () => {
    if (publisherRef.current) {
      publisherRef.current.publishAudio(!isAudioEnabled);
      setIsAudioEnabled((prev) => !prev);
    }
  };

  const endCall = async () => {
    if (publisherRef.current) {
      try {
        publisherRef.current.destroy();
      } catch (e) {
        console.warn("Error Destroying Publisher:", e);
      }
      publisherRef.current = null;
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.disconnect();
      } catch (e) {
        console.warn("Error Disconnecting Session:", e);
      }
      sessionRef.current = null;
    }

    if (joined.doctor && joined.patient) {
      await endAppointmentCall(sessionId);
    }
    router.push("/appointments");
  };

  useEffect(() => {
    return () => {
      if (publisherRef.current) {
        try {
          publisherRef.current.destroy();
        } catch {}
      }
      if (sessionRef.current) {
        try {
          sessionRef.current.disconnect();
        } catch {}
      }
    };
  }, []);

  if (!sessionId || !token || !appId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Invalid Video Call
        </h1>
        <p className="text-muted-foreground mb-6">
          Missing Required Parameters for the Video Call.
        </p>
        <Button
          onClick={() => router.push("/appointments")}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Back to Appointments
        </Button>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://unpkg.com/@vonage/client-sdk-video@latest/dist/js/opentok.js"
        onLoad={handleScriptLoad}
        onError={() => {
          toast.error("Failed to Load Video Call Script");
          setIsLoading(false);
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Video Consultation
          </h1>

          {/* Presence UI */}
          <div className="mb-4 flex justify-center gap-6">
            <div className="text-md">
              <strong>Doctor :</strong>{" "}
              <span
                className={
                  joined.doctor ? "text-emerald-400" : "text-muted-foreground"
                }
              >
                {joined.doctor ? "Joined" : "Not Joined"}
              </span>
            </div>
            <div className="text-md">
              <strong>Patient :</strong>{" "}
              <span
                className={
                  joined.patient ? "text-emerald-400" : "text-muted-foreground"
                }
              >
                {joined.patient ? "Joined" : "Not Joined"}
              </span>
            </div>
          </div>

          <p className="text-muted-foreground">
            {isConnected
              ? "Connected"
              : isLoading
              ? "Connecting..."
              : "Connection Failed"}
          </p>
        </div>

        {isLoading && !scriptLoaded ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-emerald-400 animate-spin mb-4" />
            <p className="text-foreground text-lg">
              Loading Video Call Components...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Publisher (Your Video) */}
              <div className="border border-emerald-900/20 rounded-lg overflow-hidden">
                <div className="bg-emerald-900/10 px-3 py-2 text-emerald-400 text-sm font-medium">
                  You
                </div>
                <div className="w-full aspect-video">
                  <div
                    id="publisher"
                    className="w-full h-[300px] md:h-[400px] bg-muted/30"
                  >
                    {!scriptLoaded && (
                      <div className="flex items-center justify-center h-full">
                        <div className="bg-muted/20 rounded-full p-8">
                          <User className="h-12 w-12 text-emerald-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscriber (Other Person's Video) */}
              <div className="border border-emerald-900/20 rounded-lg overflow-hidden">
                <div className="bg-emerald-900/10 px-3 py-2 text-emerald-400 text-sm font-medium">
                  Other Participant
                </div>
                <div className="w-full aspect-video">
                  <div
                    id="subscriber"
                    className="w-full h-[200px] md:h-[400px] bg-muted/30"
                  >
                    {(!isConnected || !scriptLoaded) && (
                      <div className="flex items-center justify-center h-full">
                        <div className="bg-muted/20 rounded-full p-8">
                          <User className="h-12 w-12 text-emerald-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                size="lg"
                onClick={toggleVideo}
                className={`rounded-full p-4 h-14 w-14 ${
                  isVideoEnabled
                    ? "border-emerald-900/30"
                    : "bg-red-900/20 border-red-900/30 text-red-400"
                }`}
                disabled={!publisherRef.current}
              >
                {isVideoEnabled ? <Video /> : <VideoOff />}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={toggleAudio}
                className={`rounded-full p-4 h-14 w-14 ${
                  isAudioEnabled
                    ? "border-emerald-900/30"
                    : "bg-red-900/20 border-red-900/30 text-red-400"
                }`}
                disabled={!publisherRef.current}
              >
                {isAudioEnabled ? <Mic /> : <MicOff />}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="rounded-full p-4 h-14 w-14 bg-red-600 hover:bg-red-700"
              >
                <PhoneOff />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                {isVideoEnabled ? "Camera On" : "Camera Off"} •{" "}
                {isAudioEnabled ? " Microphone On" : " Microphone Off"}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                When You're Finished with Your Consultation, Click the Red
                Button to End the Call
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
