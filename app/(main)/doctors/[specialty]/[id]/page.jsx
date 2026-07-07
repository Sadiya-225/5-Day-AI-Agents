import { getDoctorById, getAvailableTimeSlots } from "@/actions/appointments";
import { DoctorProfile } from "./_components/doctor-profile";
import { redirect } from "next/navigation";
import { serializePrismaData } from "@/lib/utils";

export default async function DoctorProfilePage({ params }) {
  const { id } = await params;

  try {
    const [doctorData, slotsData] = await Promise.all([
      getDoctorById(id),
      getAvailableTimeSlots(id),
    ]);

    // Serialize to handle Prisma Decimal types
    const serializedDoctor = serializePrismaData(doctorData.doctor);
    const serializedDays = serializePrismaData(slotsData.days || []);

    return (
      <DoctorProfile
        doctor={serializedDoctor}
        availableDays={serializedDays}
      />
    );
  } catch (error) {
    console.error("Error Loading Doctor Profile:", error);
    redirect("/doctors");
  }
}
