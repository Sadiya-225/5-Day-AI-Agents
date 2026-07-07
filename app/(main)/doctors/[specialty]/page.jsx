import { redirect } from "next/navigation";
import { getDoctorsBySpecialty } from "@/actions/doctors-listing";
import { DoctorCard } from "../components/doctor-card";
import { PageHeader } from "@/components/page-header";
import { serializePrismaData } from "@/lib/utils";

export default async function DoctorSpecialtyPage({ params }) {
  const { specialty } = await params;

  // Redirect to main doctors page if no specialty is provided
  if (!specialty) {
    redirect("/doctors");
  }

  // Fetch doctors by specialty
  const { doctors: rawDoctors, error } = await getDoctorsBySpecialty(specialty);

  // Serialize to handle Prisma Decimal types
  const doctors = serializePrismaData(rawDoctors);

  if (error) {
    console.error("Error fetching doctors:", error);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={specialty.split("%20").join(" ")}
        backLink="/doctors"
        backLabel="All Specialties"
      />

      {doctors && doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-foreground mb-2">
            No Doctors Available
          </h3>
          <p className="text-muted-foreground">
            There are Currently No Verified Doctors in this Specialty. Please
            Check Back Later or Choose Another Specialty.
          </p>
        </div>
      )}
    </div>
  );
}
