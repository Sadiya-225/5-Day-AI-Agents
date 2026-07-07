"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateDoctorProfile(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    const specialty = formData.get("specialty");
    const experience = parseInt(formData.get("experience"), 10);
    const description = formData.get("description");

    // Note: credentialUrl is NOT updated - doctors cannot change their credential document
    // This is a security measure to ensure credential integrity

    if (!specialty || !experience || !description) {
      throw new Error("All Fields are Required");
    }

    await db.user.update({
      where: {
        clerkUserId: userId,
      },
      data: {
        specialty,
        experience,
        description,
        // Only reset verification if specialty or experience changed
        ...(doctor.specialty !== specialty || doctor.experience !== experience
          ? { verificationStatus: "PENDING" }
          : {}),
      },
    });

    revalidatePath("/doctor");
    return { success: true };
  } catch (error) {
    console.error("Failed to Update Doctor Profile:", error);
    throw new Error(`Failed to Update Doctor Profile: ${error.message}`);
  }
}

export async function setAvailabilitySlots(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Get the doctor
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    if (!startTime || !endTime) {
      throw new Error("Start Time and End Time are Required");
    }

    const existingSlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
    });

    if (existingSlots.length > 0) {
      const slotsWithNoAppointments = existingSlots.filter(
        (slot) => !slot.appointment
      );

      if (slotsWithNoAppointments.length > 0) {
        await db.availability.deleteMany({
          where: {
            id: {
              in: slotsWithNoAppointments.map((slot) => slot.id),
            },
          },
        });
      }
    }

    const newSlot = await db.availability.create({
      data: {
        doctorId: doctor.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "AVAILABLE",
      },
    });

    revalidatePath("/doctor");
    return { success: true, slot: newSlot };
  } catch (error) {
    console.error("Failed to Set Availability Slots:", error);
    throw new Error("Failed to Set Availability: " + error.message);
  }
}

export async function getDoctorAvailability() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    const availabilitySlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { slots: availabilitySlots };
  } catch (error) {
    throw new Error("Failed to Fetch Availability Slots " + error.message);
  }
}

export async function getDoctorAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId, role: "DOCTOR" },
    });

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    const appointments = await db.appointment.findMany({
      where: { doctorId: doctor.id, status: { in: ["SCHEDULED"] } },
      include: { patient: true },
      orderBy: { startTime: "asc" },
    });

    const appointmentsPlain = appointments.map((appt) => ({
      ...appt,
      patient: appt.patient
        ? {
            ...appt.patient,
            sugar_fasting: appt.patient.sugar_fasting
              ? appt.patient.sugar_fasting.toNumber()
              : null,
            sugar_pp: appt.patient.sugar_pp
              ? appt.patient.sugar_pp.toNumber()
              : null,
          }
        : null,
    }));

    return { appointments: appointmentsPlain };
  } catch (error) {
    throw new Error("Failed to Fetch Appointments: " + error.message);
  }
}

export async function cancelAppointment(formData) {
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
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment Not Found");
    }

    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("You Are Not Authorized to Cancel this Appointment");
    }

    await db.$transaction(async (tx) => {
      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "CANCELLED",
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: appointment.patientId,
          amount: 500,
          type: "APPOINTMENT_ADDITION",
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: appointment.doctorId,
          amount: -500,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      await tx.user.update({
        where: {
          id: appointment.patientId,
        },
        data: {
          credits: {
            increment: 500,
          },
        },
      });

      await tx.user.update({
        where: {
          id: appointment.doctorId,
        },
        data: {
          credits: {
            decrement: 500,
          },
        },
      });
    });

    if (user.role === "DOCTOR") {
      revalidatePath("/doctor");
    } else if (user.role === "PATIENT") {
      revalidatePath("/appointments");
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to Cancel Appointment:", error);
    throw new Error("Failed to Cancel Appointment: " + error.message);
  }
}

export async function addAppointmentNotes(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor Not Found");
    }

    const appointmentId = formData.get("appointmentId");
    const notes = formData.get("notes");

    if (!appointmentId || !notes) {
      throw new Error("Appointment ID and Notes are Required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    });

    if (!appointment) {
      throw new Error("Appointment Not Found");
    }

    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        notes,
      },
    });

    revalidatePath("/doctor");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error("Failed to Add Appointment Notes:", error);
    throw new Error("Failed to Update Notes: " + error.message);
  }
}
