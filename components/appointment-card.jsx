"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  Video,
  Stethoscope,
  X,
  Edit,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cancelAppointment, addAppointmentNotes } from "@/actions/doctor";
import { generateVideoToken } from "@/actions/appointments";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AppointmentCard({
  appointment,
  userRole,
  refetchAppointments,
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const router = useRouter();

  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);
  const {
    loading: notesLoading,
    fn: submitNotes,
    data: notesData,
  } = useFetch(addAppointmentNotes);
  const {
    loading: tokenLoading,
    fn: submitTokenRequest,
    data: tokenData,
  } = useFetch(generateVideoToken);

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "Invalid Date";
    }
  };

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (e) {
      return "Invalid Time";
    }
  };

  const handleCancelAppointment = () => {
    if (cancelLoading) return;
    setShowCancelAlert(true);
  };

  const confirmCancelAppointment = async () => {
    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    await submitCancel(formData);
    setShowCancelAlert(false);
  };

  const handleSaveNotes = async () => {
    if (notesLoading || userRole !== "DOCTOR") return;

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    formData.append("notes", notes);
    await submitNotes(formData);
  };

  const handleJoinVideoCall = async () => {
    if (tokenLoading) return;

    setAction("video");

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    await submitTokenRequest(formData);
  };

  useEffect(() => {
    if (cancelData?.success) {
      toast.success("Appointment Cancelled Successfully");
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [cancelData, refetchAppointments, router]);

  useEffect(() => {
    if (notesData?.success) {
      toast.success("Notes Saved Successfully");
      setAction(null);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [notesData, refetchAppointments, router]);

  useEffect(() => {
    if (tokenData?.success) {
      router.push(
        `/video-call?sessionId=${tokenData.videoSessionId}&token=${tokenData.token}&appointmentId=${appointment.id}`
      );
    } else if (tokenData?.error) {
      setAction(null);
    }
  }, [tokenData, appointment.id, router]);

  const isAppointmentActive = () => {
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const appointmentEndTime = new Date(appointment.endTime);

    return (
      appointmentTime.getTime() - now.getTime() === 0 ||
      (now >= appointmentTime && now <= appointmentEndTime)
    );
  };

  const otherParty =
    userRole === "DOCTOR" ? appointment.patient : appointment.doctor;

  const otherPartyLabel = userRole === "DOCTOR" ? "Patient" : "Doctor";
  const otherPartyIcon = userRole === "DOCTOR" ? <User /> : <Stethoscope />;

  return (
    <>
      <Card className="border-emerald-900/20 hover:border-emerald-500/30 transition-all">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-muted/20 rounded-full p-2 mt-1">
                {otherPartyIcon}
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  {userRole === "DOCTOR"
                    ? otherParty.name
                    : `Dr. ${otherParty.name}`}
                </h3>
                {userRole === "DOCTOR" && (
                  <p className="text-sm text-muted-foreground break-all">
                    {otherParty.email}
                  </p>
                )}
                {userRole === "PATIENT" && (
                  <p className="text-sm text-muted-foreground">
                    {otherParty.specialty}
                  </p>
                )}
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 min-w-4 mr-1" />
                  <span className="wrap-break-word">
                    {formatDateTime(appointment.startTime)}
                  </span>
                </div>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 min-w-4 mr-1" />
                  <span>
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 self-end md:self-start">
              <Badge
                variant="outline"
                className={
                  appointment.status === "COMPLETED"
                    ? "bg-emerald-500/10 dark:bg-emerald-900/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : appointment.status === "CANCELLED"
                    ? "bg-red-500/10 dark:bg-red-900/20 border-red-500/30 text-red-600 dark:text-red-400"
                    : "bg-amber-500/10 dark:bg-amber-900/20 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }
              >
                {appointment.status}
              </Badge>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-900/30"
                  onClick={() => setOpen(true)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] flex flex-col rounded-xl p-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
              Appointment Details
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground">
              {appointment.status === "SCHEDULED"
                ? "Manage Your Upcoming Appointment"
                : "View Appointment Information"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Other Party Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {otherPartyLabel}
              </h4>
              <div className="flex items-center">
                <div className="h-5 w-5 text-emerald-400 mr-2">
                  {otherPartyIcon}
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    {userRole === "DOCTOR"
                      ? otherParty.name
                      : `Dr. ${otherParty.name}`}
                  </p>
                  {userRole === "DOCTOR" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.email}
                    </p>
                  )}
                  {userRole === "PATIENT" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.specialty}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Time */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Scheduled Time
              </h4>
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-emerald-400 mr-2" />
                  <p className="text-foreground text-sm sm:text-base wrap-break-word">
                    {formatDateTime(appointment.startTime)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-emerald-400 mr-2" />
                  <p className="text-foreground text-sm sm:text-base">
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Status
              </h4>
              <Badge
                variant="outline"
                className={
                  appointment.status === "COMPLETED"
                    ? "bg-emerald-500/10 dark:bg-emerald-900/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : appointment.status === "CANCELLED"
                    ? "bg-red-500/10 dark:bg-red-900/20 border-red-500/30 text-red-600 dark:text-red-400"
                    : "bg-amber-500/10 dark:bg-amber-900/20 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }
              >
                {appointment.status}
              </Badge>
            </div>

            {/* Patient Description */}
            {appointment.patientDescription && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {userRole === "DOCTOR"
                    ? "Patient Description"
                    : "Your Description"}
                </h4>
                <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20">
                  <p className="text-foreground wrap-break-word whitespace-pre-wrap text-sm">
                    {appointment.patientDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Join Video Call */}
            {appointment.status === "SCHEDULED" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Video Consultation
                </h4>
                <Button
                  className="w-[95%] bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base whitespace-normal wrap-break-word text-center"
                  disabled={
                    !isAppointmentActive() || action === "video" || tokenLoading
                  }
                  onClick={handleJoinVideoCall}
                >
                  {tokenLoading || action === "video" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="whitespace-normal wrap-break-word text-center">
                        Preparing Video Call...
                      </span>
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-1 shrink-0" />
                      <span className="whitespace-normal wrap-break-word text-center">
                        {appointment.callStatus === "COMPLETED" ? (
                          <span className="text-red-400 font-medium">
                            Call Ended
                          </span>
                        ) : (
                          <span>
                            {isAppointmentActive()
                              ? "Join Video Call"
                              : "Video Call Will be Available At The Appointment Time"}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Doctor Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Doctor Notes
                </h4>
                {userRole === "DOCTOR" &&
                  action !== "notes" &&
                  appointment.status !== "CANCELLED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAction("notes")}
                      className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 dark:bg-emerald-900/20"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      {appointment.notes ? "Edit" : "Add"}
                    </Button>
                  )}
              </div>

              {userRole === "DOCTOR" && action === "notes" ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter your Clinical Notes Here..."
                    className="bg-background border-emerald-900/20 min-h-25 text-sm w-[95%] mx-0.5"
                    disabled={notesLoading}
                  />
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAction(null);
                        setNotes(appointment.notes || "");
                      }}
                      disabled={notesLoading}
                      className="border-emerald-900/30 w-[95%] sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={notesLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 w-[95%] sm:w-auto"
                    >
                      {notesLoading ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Notes"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20 min-h-20 w-[95%]">
                  {appointment.notes ? (
                    <p className="text-foreground whitespace-pre-line wrap-break-word text-sm">
                      {appointment.notes}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">
                      No Notes Added Yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:space-x-2 sm:gap-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              {appointment.status === "SCHEDULED" && (
                <Button
                  variant="outline"
                  onClick={handleCancelAppointment}
                  disabled={cancelLoading}
                  className="border-red-900/30 text-red-400 hover:bg-red-900/10 w-full sm:w-auto"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel Appointment
                    </>
                  )}
                </Button>
              )}
            </div>

            <Button
              onClick={() => setOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Alert Dialog */}
      <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Cancel Appointment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are You Sure You Want to Cancel This Appointment? This Action
              Cannot be Undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowCancelAlert(false)}
              className="border-emerald-900/30"
            >
              No, Keep Appointment
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelAppointment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
