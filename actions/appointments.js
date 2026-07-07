"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { deductCreditsForAppointment } from "@/actions/credits";
import { Vonage } from "@vonage/server-sdk";
import { addDays, format, endOfDay } from "date-fns";
import { Auth } from "@vonage/auth";

// Initialize Vonage Video API Client
const credentials = new Auth({
  applicationId: process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID,
  privateKey: process.env.VONAGE_PRIVATE_KEY,
});
const options = {};
const vonage = new Vonage(credentials, options);

export async function bookAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const patient = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "PATIENT",
      },
    });

    if (!patient) {
      return { success: false, error: "Patient Not Found" };
    }

    const doctorId = formData.get("doctorId");
    const startTime = new Date(formData.get("startTime"));
    const endTime = new Date(formData.get("endTime"));
    const patientDescription = formData.get("description") || null;
    const notes = null;

    if (!doctorId || !startTime || !endTime) {
      return {
        success: false,
        error: "Doctor, Start Time, and End Time are Required",
      };
    }

    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      return { success: false, error: "Doctor Not Found or Not Verified" };
    }

    if (patient.credits < 500) {
      return {
        success: false,
        error: "Insufficient Credits to Book an Appointment",
      };
    }

    const overlappingAppointment = await db.appointment.findFirst({
      where: {
        doctorId: doctorId,
        status: "SCHEDULED",
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (overlappingAppointment) {
      return { success: false, error: "This Time Slot is Already Booked" };
    }

    const sessionId = await createVideoSession();

    const { success, error } = await deductCreditsForAppointment(
      patient.id,
      doctor.id
    );

    if (!success) {
      return { success: false, error: error || "Failed to Deduct Credits" };
    }

    const appointment = await db.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        startTime,
        endTime,
        patientDescription,
        notes,
        status: "SCHEDULED",
        videoSessionId: sessionId,
      },
    });

    revalidatePath("/appointments");
    return { success: true, appointment };
  } catch (error) {
    console.error("Failed to Book Appointment:", error);
    return {
      success: false,
      error: "Failed to Book Appointment: " + error.message,
    };
  }
}

/**
 * Generate a Vonage Video API Session
 */
async function createVideoSession() {
  try {
    const session = await vonage.video.createSession({ mediaMode: "routed" });
    return session.sessionId;
  } catch (error) {
    throw new Error("Failed to Create Video Session: " + error.message);
  }
}

export async function generateVideoToken(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User Not Found");
    }

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId) {
      throw new Error("Appointment ID is Required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) {
      throw new Error("Appointment Not Found");
    }

    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("You are Not Authorized to Join This Call");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error("This Appointment is Not Currently Scheduled");
    }

    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const timeDifference = (appointmentTime - now) / (1000 * 60);

    if (timeDifference > 0) {
      throw new Error("The Call Will be Available At the Scheduled Time");
    }

    const appointmentEndTime = new Date(appointment.endTime);
    const expirationTime =
      Math.floor(appointmentEndTime.getTime() / 1000) + 5 * 60;

    const connectionData = JSON.stringify({
      name: user.name,
      role: user.role,
      userId: user.id,
    });

    const token = vonage.video.generateClientToken(appointment.videoSessionId, {
      role: "publisher",
      expireTime: expirationTime,
      data: connectionData,
    });

    await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        videoSessionToken: token,
      },
    });

    return {
      success: true,
      videoSessionId: appointment.videoSessionId,
      token: token,
    };
  } catch (error) {
    console.error("Failed to Generate Video Token:", error);
    throw new Error("Failed to Generate Video Token:" + error.message);
  }
}

export async function getAppointmentParticipants(appointmentId) {
  try {
    const { userId } = await auth();

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment Not Found");
    }

    return {
      success: true,
      data: appointment,
      currentUserId: user.id ?? null,
    };
  } catch (error) {
    console.error("Failed to Fetch Appointment Participants:", error);
    return { success: false, error: error.message };
  }
}

export async function getDoctorById(doctorId) {
  try {
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    return { doctor };
  } catch (error) {
    console.error("Failed to Fetch Doctor:", error);
    throw new Error("Failed to Fetch Doctor Details");
  }
}

function roundToNearest5(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const remainder = 5 - (d.getMinutes() % 5);
  if (remainder !== 5) d.setMinutes(d.getMinutes() + remainder);
  return d;
}

export async function getAvailableTimeSlots(doctorId) {
  try {
    const doctor = await db.user.findUnique({
      where: { id: doctorId, role: "DOCTOR", verificationStatus: "VERIFIED" },
    });
    if (!doctor) throw new Error("Doctor Not Found or Not Verified");

    const availability = await db.availability.findFirst({
      where: { doctorId: doctor.id, status: "AVAILABLE" },
    });
    if (!availability) return { days: [] };

    const now = new Date();
    const days = [now, addDays(now, 1), addDays(now, 2), addDays(now, 3)];
    const lastDay = endOfDay(days[3]);

    const existingAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "SCHEDULED",
        startTime: { lte: lastDay },
      },
      orderBy: { startTime: "asc" },
    });

    const availableSlotsByDay = {};

    const baseStart = new Date(availability.startTime);
    const baseEnd = new Date(availability.endTime);

    const baseStartHours = baseStart.getHours();
    const baseStartMinutes = baseStart.getMinutes();
    const baseEndHours = baseEnd.getHours();
    const baseEndMinutes = baseEnd.getMinutes();

    for (const day of days) {
      const dayStr = format(day, "yyyy-MM-dd");
      availableSlotsByDay[dayStr] = [];

      const windowStart = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        baseStartHours,
        baseStartMinutes,
        0,
        0
      );
      let windowEnd = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        baseEndHours,
        baseEndMinutes,
        0,
        0
      );

      if (windowEnd <= windowStart) {
        windowEnd.setDate(windowEnd.getDate() + 1);
      }

      let current = new Date(windowStart);
      if (format(day, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")) {
        const roundedNow = roundToNearest5(now);
        if (roundedNow > current) {
          current = roundedNow;
        }
      }

      const dayAppointments = existingAppointments.filter((appt) => {
        const aStart = new Date(appt.startTime);
        const aEnd = new Date(appt.endTime);
        return aStart < windowEnd && aEnd > windowStart;
      });

      dayAppointments.sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime)
      );

      for (const appt of dayAppointments) {
        const aStart = new Date(appt.startTime);
        const aEnd = new Date(appt.endTime);

        if (aEnd <= current) {
          continue;
        }

        while (current < aStart && current < windowEnd) {
          const next = new Date(current.getTime() + 30 * 60000);
          if (next <= aStart && next <= windowEnd) {
            availableSlotsByDay[dayStr].push({
              startTime: current,
              endTime: next,

              formatted: `${format(current, "h:mm a")} - ${format(
                next,
                "h:mm a"
              )}`,
              day: format(current, "EEEE, MMMM d"),
            });
          }
          current = next;
          if (
            current.getTime() === next.getTime() &&
            next.getTime() - now.getTime() > 7 * 24 * 3600 * 1000
          )
            break;
        }

        if (current < aEnd) {
          current = roundToNearest5(aEnd);
        }
      }

      while (current < windowEnd) {
        const next = new Date(current.getTime() + 30 * 60000);
        if (next <= windowEnd) {
          availableSlotsByDay[dayStr].push({
            startTime: current.toISOString(),
            endTime: next.toISOString(),
            formatted: `${format(current, "h:mm a")} - ${format(
              next,
              "h:mm a"
            )}`,
            day: format(current, "EEEE, MMMM d"),
          });
        }
        current = next;
        if (availableSlotsByDay[dayStr].length > 200) break;
      }
    }

    const result = Object.entries(availableSlotsByDay).map(([date, slots]) => ({
      date,
      displayDate:
        slots.length > 0
          ? slots[0].day
          : format(new Date(date), "EEEE, MMMM d"),
      slots,
    }));

    return { days: result };
  } catch (error) {
    console.error("Failed to Fetch Available Slots:", error);
    throw new Error("Failed to Fetch Available Time Slots: " + error.message);
  }
}

export async function endAppointmentCall(sessionId) {
  try {
    const updated = await db.appointment.update({
      where: { videoSessionId: sessionId },
      data: { status: "COMPLETED" },
    });
    return updated;
  } catch (error) {
    console.error("Failed to End Appointment Call:", error);
    throw error;
  }
}
