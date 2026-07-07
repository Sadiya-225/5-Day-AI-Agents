"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatInTimeZone } from "date-fns-tz";
import { Loader2, Clock, ArrowLeft, Calendar, CreditCard } from "lucide-react";
import { bookAppointment } from "@/actions/appointments";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { Filter } from "bad-words";

const filter = new Filter();

export function AppointmentForm({ doctorId, slot, onBack, onComplete }) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const { loading, data, fn: submitBooking } = useFetch(bookAppointment);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("doctorId", doctorId);
    formData.append("startTime", slot.startTime);
    formData.append("endTime", slot.endTime);
    formData.append("description", description);

    await submitBooking(formData);
  };

  useEffect(() => {
    if (data) {
      if (data.success) {
        toast.success("Appointment booked successfully!");
        onComplete?.();
      } else if (data.error) {
        toast.error(data.error);
      }
    }
  }, [data, onComplete]);

  const handleChange = (e) => {
    const text = e.target.value;
    if (filter.isProfane(text)) {
      setError("⚠️ Please avoid inappropriate language!");
    } else {
      setError("");
    }
    setDescription(text);
  };

  const istDate = formatInTimeZone(
    new Date(slot.startTime),
    "Asia/Kolkata",
    "EEEE, MMMM d, yyyy"
  );
  const istTime = formatInTimeZone(
    new Date(slot.startTime),
    "Asia/Kolkata",
    "h:mm a"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Appointment Info Section */}
      <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-emerald-400 mr-2" />
          <span className="text-foreground font-medium">{istDate}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-emerald-400 mr-2" />
          <span className="text-foreground">{istTime}</span>
        </div>
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-emerald-400 mr-2" />
          <span className="text-muted-foreground">
            Cost: <span className="text-foreground font-medium">₹500</span>
          </span>
        </div>
      </div>

      {/* Medical Concern Textarea */}
      <div className="space-y-2">
        <Label htmlFor="description">Describe Your Medical Concern</Label>
        <Textarea
          id="description"
          placeholder="Please Provide any Details About Your Medical Concern or What You'd Like to Discuss..."
          value={description}
          onChange={handleChange}
          className={`bg-background border h-32 text-sm ${
            error ? "border-red-500" : "border-emerald-900/20"
          }`}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-sm text-muted-foreground">
          This Information will be Shared with the Doctor Before Your
          Appointment.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="border-emerald-900/30 w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change Time Slot
        </Button>

        <Button
          type="submit"
          disabled={loading || !!error || !description.trim()}
          className={`w-full sm:w-auto ${
            error
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Booking...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </form>
  );
}
